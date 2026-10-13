import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import {
  DEFAULT_WEB_DESIGN_AI_MODEL,
  WEB_DESIGN_AI_PROMPT_VERSION,
  WEB_DESIGN_AI_SCHEMA,
  buildSafeInterviewInput,
  buildWebDesignAiInstructions,
  buildWebDesignAiPrompt,
  extractStructuredOutput,
  extractWebSearchSources,
  formatWebDesignAiTxt,
  getWebsiteSearchDomains,
  normalizePublicWebsiteUrl,
  normalizeFollowUpAnswers,
} from '@/lib/webdesign-interview-ai';
import WebDesignInterview from '@/models/WebDesignInterview';
import { connectToDB } from '@/utils/database';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const canAccessInterview = (session, interview) => {
  const role = session?.user?.role;
  const isStaff = role === 'amministratore' || role === 'segretaria';
  return isStaff || session?.user?.id === interview?.webDesigner?.toString();
};

const getFriendlyOpenAiError = (status) => {
  if (status === 401) return 'Chiave OpenAI non valida. Controlla OPENAI_API_KEY.';
  if (status === 429) return 'Limite OpenAI raggiunto. Controlla credito e limiti del progetto API.';
  return 'OpenAI non ha completato l’analisi. Riprova tra poco.';
};

export async function POST(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
    }

    const { interviewId } = await params;
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return NextResponse.json({ message: 'Intervista non valida' }, { status: 400 });
    }

    await connectToDB();
    const savedInterview = await WebDesignInterview.findById(interviewId);
    if (!savedInterview) {
      return NextResponse.json({ message: 'Intervista non trovata' }, { status: 404 });
    }

    if (!canAccessInterview(session, savedInterview)) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { message: 'OPENAI_API_KEY non configurata sul server.' },
        { status: 503 }
      );
    }

    const requestBody = await req.json().catch(() => ({}));
    const requestedStage = requestBody.stage;
    const normalizedAnswers = normalizeFollowUpAnswers(requestBody.followUpAnswers);
    const stage =
      requestedStage === 'final' || requestedStage === 'initial'
        ? requestedStage
        : normalizedAnswers.some((item) => item.risposta)
          ? 'final'
          : 'initial';
    const followUpAnswers = stage === 'final' ? normalizedAnswers : [];
    const model = process.env.OPENAI_INTERVIEW_MODEL || DEFAULT_WEB_DESIGN_AI_MODEL;
    const initialAnalysis = savedInterview.aiInitialAnalysis || savedInterview.aiAnalysis;
    const savedQuestions = Array.isArray(initialAnalysis?.domandeApprofondimento)
      ? initialAnalysis.domandeApprofondimento.slice(0, 5).map((item) => ({
          domanda: item.domanda || '',
          motivo: item.motivo || '',
        }))
      : [];
    const previousQuestions = stage === 'final' ? savedQuestions : [];

    if (stage === 'final' && previousQuestions.length !== 5) {
      return NextResponse.json(
        { message: 'Genera prima la prima analisi con le cinque domande.' },
        { status: 409 }
      );
    }
    if (stage === 'final' && savedInterview.aiInputStale) {
      return NextResponse.json(
        { message: 'L’intervista è cambiata: aggiorna prima la prima analisi e le cinque domande.' },
        { status: 409 }
      );
    }
    if (
      stage === 'final' &&
      (followUpAnswers.length !== 5 || followUpAnswers.some((item) => !item.risposta))
    ) {
      return NextResponse.json(
        { message: 'Completa tutte e cinque le risposte prima del risultato finale.' },
        { status: 400 }
      );
    }
    const interviewInput = buildSafeInterviewInput(savedInterview.interview);
    const rawOldWebsiteUrl = savedInterview.interview?.sitoVecchioUrl || '';
    const normalizedOldWebsiteUrl = normalizePublicWebsiteUrl(rawOldWebsiteUrl);
    if (rawOldWebsiteUrl?.trim() && !normalizedOldWebsiteUrl) {
      return NextResponse.json(
        { message: 'Il link del sito precedente non è valido o non è un indirizzo pubblico.' },
        { status: 400 }
      );
    }

    interviewInput.sitoVecchioUrl = normalizedOldWebsiteUrl;
    const savedSiteAnalysis = initialAnalysis?.analisiSitoEsistente || null;
    const canReuseSiteAnalysis = Boolean(
      normalizedOldWebsiteUrl &&
        savedSiteAnalysis?.urlAnalizzato === normalizedOldWebsiteUrl &&
        ['analizzato', 'non_disponibile'].includes(savedSiteAnalysis?.stato)
    );
    const previousSiteAnalysis = canReuseSiteAnalysis ? savedSiteAnalysis : null;
    const shouldSearchOldWebsite = Boolean(normalizedOldWebsiteUrl && !previousSiteAnalysis);
    const inputHash = createHash('sha256')
      .update(
        JSON.stringify({
          stage,
          promptVersion: WEB_DESIGN_AI_PROMPT_VERSION,
          model,
          interview: interviewInput,
          previousQuestions,
          followUpAnswers,
        })
      )
      .digest('hex');

    const cachedAnalysis =
      stage === 'final' ? savedInterview.aiFinalAnalysis : savedInterview.aiInitialAnalysis;
    const cachedText =
      stage === 'final'
        ? savedInterview.aiFinalRisultatoTxt
        : savedInterview.aiInitialRisultatoTxt;
    const cachedHash =
      stage === 'final' ? savedInterview.aiFinalInputHash : savedInterview.aiInitialInputHash;

    if (cachedHash === inputHash && cachedAnalysis && cachedText && !savedInterview.aiInputStale) {
      savedInterview.aiAnalysis = cachedAnalysis;
      savedInterview.aiRisultatoTxt = cachedText;
      savedInterview.aiStage = stage === 'final' ? 'finale' : 'prima_analisi';
      if (stage === 'final') savedInterview.aiFinalStale = false;
      await savedInterview.save();
      return NextResponse.json({
        message: 'Analisi già aggiornata',
        cached: true,
        intervista: savedInterview,
      });
    }

    const openAiRequest = {
      model,
      store: false,
      instructions: buildWebDesignAiInstructions(),
      input: buildWebDesignAiPrompt({
        interview: interviewInput,
        previousQuestions,
        followUpAnswers,
        previousSiteAnalysis,
      }),
      text: {
        format: {
          type: 'json_schema',
          name: 'web_design_strategic_brief',
          description: 'Documento strategico strutturato derivato da un’intervista web design.',
          strict: true,
          schema: WEB_DESIGN_AI_SCHEMA,
        },
      },
      max_output_tokens: 24000,
    };

    if (shouldSearchOldWebsite) {
      openAiRequest.tools = [
        {
          type: 'web_search',
          external_web_access: true,
          search_context_size: 'low',
          filters: {
            allowed_domains: getWebsiteSearchDomains(normalizedOldWebsiteUrl),
          },
        },
      ];
      openAiRequest.tool_choice = 'required';
      openAiRequest.include = ['web_search_call.action.sources'];
    }

    const openAiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openAiRequest),
      signal: AbortSignal.timeout(115000),
    });

    const openAiPayload = await openAiResponse.json().catch(() => ({}));
    if (!openAiResponse.ok) {
      console.error('Errore OpenAI analisi intervista:', {
        status: openAiResponse.status,
        code: openAiPayload?.error?.code,
        type: openAiPayload?.error?.type,
        message: openAiPayload?.error?.message,
      });
      return NextResponse.json(
        { message: getFriendlyOpenAiError(openAiResponse.status) },
        { status: openAiResponse.status === 429 ? 429 : 502 }
      );
    }

    if (openAiPayload.status && openAiPayload.status !== 'completed') {
      console.error('Risposta OpenAI incompleta:', openAiPayload.incomplete_details || openAiPayload.status);
      return NextResponse.json(
        { message: 'L’analisi AI è rimasta incompleta. Riprova.' },
        { status: 502 }
      );
    }

    const outputText = extractStructuredOutput(openAiPayload);
    if (!outputText) {
      return NextResponse.json(
        { message: 'OpenAI non ha restituito un risultato utilizzabile.' },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(outputText);

    if (previousSiteAnalysis) {
      analysis.analisiSitoEsistente = previousSiteAnalysis;
    } else if (shouldSearchOldWebsite) {
      const sources = extractWebSearchSources(openAiPayload);
      analysis.analisiSitoEsistente = {
        ...analysis.analisiSitoEsistente,
        urlAnalizzato: normalizedOldWebsiteUrl,
        fontiConsultate: sources.length
          ? sources
          : analysis.analisiSitoEsistente?.fontiConsultate || [],
      };
    }

    if (previousQuestions.length === 5) {
      analysis.domandeApprofondimento = previousQuestions.map((item, index) => ({
        domanda: item.domanda,
        motivo: item.motivo,
        rispostaRicevuta: followUpAnswers[index]?.risposta || '',
      }));
    }

    const generatedAt = new Date();
    const aiRisultatoTxt = formatWebDesignAiTxt({
      analysis,
      azienda: savedInterview.azienda || savedInterview.interview?.azienda,
      generatedAt,
      model,
    });

    savedInterview.aiAnalysis = analysis;
    savedInterview.aiRisultatoTxt = aiRisultatoTxt;
    savedInterview.aiFollowUpAnswers = followUpAnswers;
    savedInterview.aiInputHash = inputHash;
    savedInterview.aiPromptVersion = WEB_DESIGN_AI_PROMPT_VERSION;
    savedInterview.aiModel = model;
    savedInterview.aiGeneratedAt = generatedAt;
    savedInterview.aiInputStale = false;
    savedInterview.aiFinalStale = false;

    if (stage === 'initial') {
      savedInterview.aiInitialAnalysis = analysis;
      savedInterview.aiInitialRisultatoTxt = aiRisultatoTxt;
      savedInterview.aiInitialInputHash = inputHash;
      savedInterview.aiInitialGeneratedAt = generatedAt;
      savedInterview.aiFinalAnalysis = null;
      savedInterview.aiFinalRisultatoTxt = '';
      savedInterview.aiFinalInputHash = '';
      savedInterview.aiFinalGeneratedAt = null;
      savedInterview.aiStage = 'prima_analisi';
    } else {
      savedInterview.aiFinalAnalysis = analysis;
      savedInterview.aiFinalRisultatoTxt = aiRisultatoTxt;
      savedInterview.aiFinalInputHash = inputHash;
      savedInterview.aiFinalGeneratedAt = generatedAt;
      savedInterview.aiStage = 'finale';
    }
    await savedInterview.save();

    return NextResponse.json({
      message:
        stage === 'final'
          ? 'Risultato finale generato e salvato'
          : 'Prima analisi generata: completa ora le cinque domande',
      cached: false,
      intervista: savedInterview,
    });
  } catch (error) {
    console.error('Errore generazione analisi AI intervista:', error);
    const isTimeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return NextResponse.json(
      {
        message: isTimeout
          ? 'OpenAI ha impiegato troppo tempo. Riprova.'
          : 'Errore durante la generazione dell’analisi AI.',
      },
      { status: 500 }
    );
  }
}
