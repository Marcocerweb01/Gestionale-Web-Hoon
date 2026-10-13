'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SiteStructureDiagram from '@/Components/SiteStructureDiagram';
import {
  ExistingWebsiteAnalysis,
  WebsiteCopyPreview,
} from '@/Components/WebDesignAiContent';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Download,
  FileJson,
  FileText,
  History,
  Loader2,
  Save,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { title: 'Business', subtitle: 'Chi e cosa vende' },
  { title: 'Obiettivi', subtitle: 'Cosa deve ottenere il sito' },
  { title: 'Chi siamo', subtitle: 'Storia, valori e identità' },
  { title: 'Struttura', subtitle: 'Pagine, stile e materiali' },
  { title: 'Analisi AI', subtitle: 'Documento operativo pronto' },
];

const OPTIONS = {
  obiettivi: [
    'Ricevere contatti',
    'Vendere',
    'Prenotazioni',
    'Mostrare portfolio',
    'Farsi trovare su Google',
  ],
  tipoSito: ['One Page', 'Sito vetrina', 'Landing page', 'E-commerce', 'Blog'],
  sezioni: ['Home', 'Chi siamo', 'Servizi', 'Gallery', 'Portfolio', 'Recensioni', 'FAQ', 'Contatti'],
  stile: ['Minimal', 'Moderno', 'Creativo', 'Elegante', 'Professionale', 'Ricco di animazioni'],
  animazioni: ['Pulito e statico', 'Micro animazioni', 'Ricco di animazioni'],
  brandAssets: ['Logo PNG', 'Logo vettoriale AI/SVG/PDF', 'Palette colori', 'Font/linee guida'],
  mediaAssets: ['Foto HQ', 'Video', 'Foto team', 'Foto sede/prodotti'],
  textAssets: ['Descrizione azienda', 'Servizi', 'Recensioni', 'FAQ', 'Testi pagine'],
};

const DEFAULT_INTERVIEW = {
  azienda: '',
  sitoVecchioUrl: '',
  descrizioneAzienda: '',
  servizioPrincipale: '',
  servizioFocus: '',
  clienteIdeale: '',
  provenienzaClienti: '',
  obiettivi: [],
  azioneUtente: '',
  ctaPrincipale: '',
  tipoSito: '',
  chiSiamoNascita: '',
  chiSiamoAttivita: '',
  chiSiamoTarget: '',
  chiSiamoDifferenziazione: '',
  chiSiamoValori: '',
  chiSiamoMetodo: '',
  chiSiamoPercorso: '',
  chiSiamoVisione: '',
  chiSiamoContatti: '',
  sezioni: [],
  sezioniAltro: '',
  stile: [],
  stileAltro: '',
  animazioni: '',
  animazioniAltro: '',
  videoHomepage: 'No',
  lineeGuidaBrand: 'No',
  colori: '',
  font: '',
  dominioEsistente: 'No',
  dominio: '',
  providerDominio: '',
  emailCollegate: '',
  scadenzaDominio: '',
  accessiDominio: '',
  brandAssets: [],
  mediaAssets: [],
  textAssets: [],
  noteFinali: '',
};

const joinValue = (value) => {
  if (!value) return '-';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-';
  return String(value).trim() || '-';
};

const withOther = (values, other) => {
  const list = Array.isArray(values) ? [...values] : [];
  if (other?.trim()) list.push(`Altro: ${other.trim()}`);
  return list;
};

const sanitizeFilenamePart = (value) =>
  (value || 'Senza nome')
    .toString()
    .trim()
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Senza nome';

const getFilenameBase = (azienda) => `Intervista ${sanitizeFilenamePart(azienda)}`;

const formatHistoryDate = (value) => {
  if (!value) return '-';
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const buildInterviewText = (interview) => {
  const sezioni = withOther(interview.sezioni, interview.sezioniAltro);
  const stile = withOther(interview.stile, interview.stileAltro);
  const animazioni = interview.animazioniAltro?.trim()
    ? `${joinValue(interview.animazioni)}; Altro: ${interview.animazioniAltro.trim()}`
    : joinValue(interview.animazioni);

  return `INTERVISTA WEB DESIGN

1. BUSINESS
- Azienda: ${joinValue(interview.azienda)}
- Sito precedente da analizzare: ${joinValue(interview.sitoVecchioUrl)}
- Cosa fa/vende: ${joinValue(interview.descrizioneAzienda)}
- Servizio o prodotto principale: ${joinValue(interview.servizioPrincipale)}
- Servizio/prodotto da spingere: ${joinValue(interview.servizioFocus)}
- Cliente ideale: ${joinValue(interview.clienteIdeale)}
- Da dove arrivano oggi i clienti: ${joinValue(interview.provenienzaClienti)}

2. OBIETTIVI DEL SITO
- Obiettivi: ${joinValue(interview.obiettivi)}
- Cosa deve fare l'utente appena entra: ${joinValue(interview.azioneUtente)}
- CTA principale: ${joinValue(interview.ctaPrincipale)}

3. CHI SIAMO GENERICO
- Come nasce l'azienda e da dove siete partiti: ${joinValue(interview.chiSiamoNascita)}
- Di cosa vi occupate oggi e quali sono i vostri servizi/prodotti principali: ${joinValue(interview.chiSiamoAttivita)}
- A chi vi rivolgete principalmente: ${joinValue(interview.chiSiamoTarget)}
- Cosa vi distingue dalle altre aziende del vostro settore: ${joinValue(interview.chiSiamoDifferenziazione)}
- Valori dell'azienda e applicazione concreta nel lavoro: ${joinValue(interview.chiSiamoValori)}
- Modo di lavorare con un cliente: ${joinValue(interview.chiSiamoMetodo)}
- Percorso dell'azienda fino ad oggi: ${joinValue(interview.chiSiamoPercorso)}
- Dove volete arrivare nei prossimi anni: ${joinValue(interview.chiSiamoVisione)}
- Contatti: ${joinValue(interview.chiSiamoContatti)}

4. STRUTTURA E STILE
- Tipologia sito: ${joinValue(interview.tipoSito)}
- Sezioni richieste: ${joinValue(sezioni)}
- Stile desiderato: ${joinValue(stile)}
- Animazioni: ${animazioni}
- Video in homepage: ${joinValue(interview.videoHomepage)}
- Linee guida brand: ${joinValue(interview.lineeGuidaBrand)}
- Colori preferiti/da evitare: ${joinValue(interview.colori)}
- Font o riferimenti tipografici: ${joinValue(interview.font)}

5. DOMINIO E ACCESSI
- Dominio esistente: ${joinValue(interview.dominioEsistente)}
- Dominio/URL: ${joinValue(interview.dominio)}
- Provider dominio/hosting: ${joinValue(interview.providerDominio)}
- Email collegate: ${joinValue(interview.emailCollegate)}
- Scadenza dominio: ${joinValue(interview.scadenzaDominio)}
- Accessi dominio/hosting: ${joinValue(interview.accessiDominio)}

6. MATERIALI DISPONIBILI
- Brand: ${joinValue(interview.brandAssets)}
- Media: ${joinValue(interview.mediaAssets)}
- Testi: ${joinValue(interview.textAssets)}
- Note finali: ${joinValue(interview.noteFinali)}`;
};

const Field = ({ label, value, onChange, placeholder = '', type = 'text' }) => (
  <label className="block">
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      placeholder={placeholder}
    />
  </label>
);

const TextArea = ({ label, value, onChange, placeholder = '', rows = 4 }) => (
  <label className="block">
    <span className="text-sm font-semibold text-gray-800">{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      className="mt-2 w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
      placeholder={placeholder}
    />
  </label>
);

const OptionGrid = ({ label, options, value, onChange, multiple = false }) => {
  const selected = multiple && Array.isArray(value) ? value : [];

  const toggleValue = (option) => {
    if (!multiple) {
      onChange(option);
      return;
    }

    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const active = multiple ? selected.includes(option) : value === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              className={`flex min-h-11 items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                active
                  ? 'border-orange-500 bg-orange-50 text-orange-800'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-orange-300'
              }`}
            >
              <span>{option}</span>
              {active && <Check className="h-4 w-4 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const MaterialGroup = ({ label, description, options, value, onChange }) => {
  const selected = Array.isArray(value) ? value : [];

  const toggleValue = (option) => {
    onChange(
      selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option]
    );
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-950">{label}</h3>
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
          {selected.length}/{options.length}
        </span>
      </div>
      <div className="grid gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleValue(option)}
              className={`group flex min-h-12 items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
                active
                  ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm'
                  : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-orange-300 hover:bg-white'
              }`}
            >
              <span className="leading-snug">{option}</span>
              <span
                className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition ${
                  active
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-gray-300 bg-white text-transparent group-hover:border-orange-300'
                }`}
              >
                <Check className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const { id, collabId } = useParams();
  const [interview, setInterview] = useState(DEFAULT_INTERVIEW);
  const [collaboration, setCollaboration] = useState(null);
  const [contextLoading, setContextLoading] = useState(Boolean(collabId));
  const [contextError, setContextError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [message, setMessage] = useState('');
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [savedSignature, setSavedSignature] = useState('');
  const [savedInterviewId, setSavedInterviewId] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiResultText, setAiResultText] = useState('');
  const [aiAnswers, setAiAnswers] = useState({});
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiStale, setAiStale] = useState(false);
  const [aiAnswersDirty, setAiAnswersDirty] = useState(false);
  const [aiStage, setAiStage] = useState('non_generata');
  const [aiFinalStale, setAiFinalStale] = useState(false);
  const stepContentRef = useRef(null);

  const goToStep = (step) => {
    const nextStep = Math.max(0, Math.min(step, STEPS.length - 1));
    setCurrentStep(nextStep);
    window.requestAnimationFrame(() => {
      stepContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const updateField = (field, value) => {
    setInterview((prev) => ({ ...prev, [field]: value }));
    setMessage('');
    setAiError('');
    if (aiResultText) setAiStale(true);
  };

  const resultText = useMemo(() => buildInterviewText(interview), [interview]);
  const filenameBase = useMemo(() => getFilenameBase(interview.azienda), [interview.azienda]);
  const resultJson = useMemo(
    () => ({
      tipo: 'intervista-web-design',
      generatoIl: new Date().toISOString(),
      webDesignerId: id,
      collaborationId: collabId || null,
      risultatoTxt: resultText,
      intervista: {
        ...interview,
        sezioniComplete: withOther(interview.sezioni, interview.sezioniAltro),
        stileCompleto: withOther(interview.stile, interview.stileAltro),
      },
    }),
    [collabId, id, interview, resultText]
  );
  const currentSignature = useMemo(
    () =>
      JSON.stringify({
        collaborationId: collabId || null,
        webDesignerId: id,
        risultatoTxt: resultText,
        intervista: resultJson.intervista,
        risposte: aiAnswers,
      }),
    [aiAnswers, collabId, id, resultJson.intervista, resultText]
  );

  useEffect(() => {
    if (!id) return;

    const loadInterviewContext = async () => {
      try {
        if (collabId) setContextLoading(true);
        else setHistoryLoading(true);
        const endpoint = collabId
          ? `/api/webdesign-interviste?collaborationId=${collabId}`
          : `/api/webdesign-interviste?webDesignerId=${id}`;
        const response = await fetch(endpoint);
        const data = await response.json();
        if (!response.ok) throw new Error(data?.message || 'Errore caricamento intervista');

        if (!collabId) {
          setHistoryItems(Array.isArray(data) ? data : []);
          return;
        }

        const saved = data.intervista;
        const collaborationData = data.collaborazione;
        const companyName =
          collaborationData?.cliente?.etichetta ||
          collaborationData?.cliente?.ragioneSociale ||
          collaborationData?.cliente?.nome ||
          collaborationData?.aziendaRagioneSociale ||
          '';
        const mergedInterview = {
          ...DEFAULT_INTERVIEW,
          azienda: companyName,
          tipoSito:
            collaborationData?.tipoProgetto === 'e-commerce' ? 'E-commerce' : 'Sito vetrina',
          ...(saved?.interview || {}),
        };
        const displayAnalysis =
          saved?.aiFinalAnalysis || saved?.aiInitialAnalysis || saved?.aiAnalysis || null;
        const displayText =
          saved?.aiFinalRisultatoTxt ||
          saved?.aiInitialRisultatoTxt ||
          saved?.aiRisultatoTxt ||
          '';
        const questions =
          saved?.aiInitialAnalysis?.domandeApprofondimento ||
          displayAnalysis?.domandeApprofondimento ||
          [];
        const savedAnswers = Array.isArray(saved?.aiFollowUpAnswers)
          ? saved.aiFollowUpAnswers
          : [];

        setCollaboration(collaborationData);
        setInterview(mergedInterview);
        setSavedInterviewId(saved?._id || '');
        setAiAnalysis(displayAnalysis);
        setAiResultText(displayText);
        setAiStage(
          saved?.aiStage ||
            (saved?.aiFinalGeneratedAt
              ? 'finale'
              : saved?.aiInitialGeneratedAt || saved?.aiGeneratedAt
                ? 'prima_analisi'
                : 'non_generata')
        );
        setAiStale(Boolean(saved?.aiInputStale));
        setAiFinalStale(Boolean(saved?.aiFinalStale));
        setAiAnswers(
          Object.fromEntries(
            questions.slice(0, 5).map((item, index) => [
              index,
              savedAnswers[index]?.risposta || item.rispostaRicevuta || '',
            ])
          )
        );
        setHistoryItems(saved ? [saved] : []);
        if (displayAnalysis) setCurrentStep(STEPS.length - 1);
      } catch (error) {
        console.error('Errore caricamento storico interviste:', error);
        if (collabId) setContextError(error.message || 'Impossibile caricare la collaborazione');
      } finally {
        setContextLoading(false);
        setHistoryLoading(false);
      }
    };

    loadInterviewContext();
  }, [collabId, id]);

  const downloadFile = (content, filename, type, successMessage) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    setMessage(successMessage || `Scaricato ${filename}`);
  };

  const trackInterview = async ({ force = false, showSuccess = false } = {}) => {
    if (!force && savedSignature === currentSignature && savedInterviewId) {
      return { interviewId: savedInterviewId, saved: true };
    }

    try {
      setTracking(true);
      const response = await fetch('/api/webdesign-interviste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaborationId: collabId || undefined,
          webDesignerId: id,
          azienda: interview.azienda,
          interview: resultJson.intervista,
          risultatoTxt: resultText,
          followUpAnswers: (aiAnalysis?.domandeApprofondimento || []).slice(0, 5).map(
            (item, index) => ({
              domanda: item.domanda,
              risposta: aiAnswers[index] || '',
            })
          ),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Errore salvataggio');

      setSavedSignature(currentSignature);
      setSavedInterviewId(data.intervista?._id || '');
      setAiFinalStale(Boolean(data.intervista?.aiFinalStale));
      if (showSuccess) {
        setAiAnswersDirty(false);
        setMessage('Intervista e risposte salvate. Il risultato finale può essere generato anche dopo.');
      }
      setHistoryItems((items) =>
        data.intervista?._id
          ? items.some((item) => item._id === data.intervista._id)
            ? items.map((item) =>
                item._id === data.intervista._id ? data.intervista : item
              )
            : [data.intervista, ...items]
          : items
      );
      return { interviewId: data.intervista?._id, saved: true };
    } catch (error) {
      console.error('Errore salvataggio automatico intervista:', error);
      return null;
    } finally {
      setTracking(false);
    }
  };

  const downloadTxt = async () => {
    const tracked = Boolean((await trackInterview())?.saved);
    const filename = `${filenameBase}.txt`;
    downloadFile(
      resultText,
      filename,
      'text/plain;charset=utf-8',
      tracked ? `Scaricato ${filename} e salvato` : `Scaricato ${filename}, storico non salvato`
    );
  };
  const downloadJson = async () => {
    const tracked = Boolean((await trackInterview())?.saved);
    const filename = `${filenameBase}.json`;
    downloadFile(
      JSON.stringify(resultJson, null, 2),
      filename,
      'application/json;charset=utf-8',
      tracked ? `Scaricato ${filename} e salvato` : `Scaricato ${filename}, storico non salvato`
    );
  };

  const copyResultText = async () => {
    const tracked = Boolean((await trackInterview())?.saved);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resultText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = resultText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setMessage(tracked ? 'Testo copiato e salvato' : 'Testo copiato, storico non salvato');
    } catch (error) {
      console.error('Errore copia intervista:', error);
      setMessage('Copia non riuscita');
    }
  };

  const downloadHistoryTxt = (item) => {
    downloadFile(
      item.risultatoTxt || '',
      `${getFilenameBase(item.azienda)}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  const downloadHistoryAiTxt = (item) => {
    downloadFile(
      item.aiRisultatoTxt || '',
      `${getFilenameBase(item.azienda)} - Documento AI.txt`,
      'text/plain;charset=utf-8'
    );
  };

  const generateAiAnalysis = async (stage = 'initial') => {
    if (!interview.azienda.trim() || !interview.descrizioneAzienda.trim()) {
      setAiError('Completa almeno il nome azienda e la descrizione dell’attività prima di generare.');
      return;
    }

    const questions = Array.isArray(aiAnalysis?.domandeApprofondimento)
      ? aiAnalysis.domandeApprofondimento.slice(0, 5)
      : [];
    const followUpAnswers = questions.map((item, index) => ({
      domanda: item.domanda,
      risposta: aiAnswers[index] || '',
    }));

    if (
      stage === 'final' &&
      (questions.length !== 5 || followUpAnswers.some((item) => !item.risposta.trim()))
    ) {
      setAiError('Completa tutte e cinque le risposte prima di generare il risultato finale.');
      return;
    }

    setAiGenerating(true);
    setAiError('');
    setMessage('');

    try {
      const trackedInterview = await trackInterview({ force: true });
      if (!trackedInterview?.interviewId) {
        throw new Error('Non è stato possibile salvare l’intervista prima dell’analisi.');
      }

      const response = await fetch(
        `/api/webdesign-interviste/${trackedInterview.interviewId}/analisi-ai`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage,
            followUpAnswers: stage === 'final' ? followUpAnswers : [],
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || 'Errore durante l’analisi AI');

      const saved = data.intervista;
      setAiAnalysis(saved.aiAnalysis || null);
      setAiResultText(saved.aiRisultatoTxt || '');
      setAiStage(saved.aiStage || (stage === 'final' ? 'finale' : 'prima_analisi'));
      setSavedInterviewId(saved._id || trackedInterview.interviewId);
      setAiStale(false);
      setAiFinalStale(false);
      setAiAnswersDirty(false);
      setAiAnswers(
        Object.fromEntries(
          (saved.aiAnalysis?.domandeApprofondimento || []).map((item, index) => [
            index,
            item.rispostaRicevuta || '',
          ])
        )
      );
      setHistoryItems((items) => {
        const exists = items.some((item) => item._id === saved._id);
        return exists
          ? items.map((item) => (item._id === saved._id ? saved : item))
          : [saved, ...items];
      });
      setMessage(data.cached ? 'Documento già aggiornato e salvato' : data.message);
    } catch (error) {
      console.error('Errore analisi AI intervista:', error);
      setAiError(error.message || 'Non è stato possibile generare il documento AI.');
    } finally {
      setAiGenerating(false);
    }
  };

  const saveAnswersForLater = async () => {
    setAiError('');
    const saved = await trackInterview({ force: true, showSuccess: true });
    if (!saved) setAiError('Non è stato possibile salvare le risposte. Riprova.');
  };

  const copyAiResult = async () => {
    if (!aiResultText) return;
    try {
      await navigator.clipboard.writeText(aiResultText);
      setMessage('Documento AI copiato');
    } catch (error) {
      console.error('Errore copia documento AI:', error);
      setMessage('Copia non riuscita');
    }
  };

  const downloadAiResult = () => {
    if (!aiResultText) return;
    downloadFile(
      aiResultText,
      `${filenameBase} - Documento AI.txt`,
      'text/plain;charset=utf-8',
      'Documento AI scaricato'
    );
  };

  const goBack = () => goToStep(currentStep - 1);
  const goNext = async () => {
    const saved = await trackInterview();
    if (collabId && !saved) {
      setMessage('Salvataggio non riuscito: riprova prima di proseguire.');
      return;
    }
    goToStep(currentStep + 1);
  };

  if (contextLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-600">
        <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        Caricamento collaborazione e intervista...
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
          {contextError}
        </div>
        <Link
          href={`/Lista_clienti_webdesigner/${id}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai progetti
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-orange-700">Web Design</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">
            {savedInterviewId ? 'Intervista e risultati' : 'Nuova intervista cliente'}
          </h1>
          {collaboration && (
            <p className="mt-2 text-sm text-gray-600">
              {interview.azienda} · {collaboration.tipoProgetto === 'e-commerce' ? 'E-commerce' : 'Sito vetrina'} · assegnata a{' '}
              {[collaboration.webDesigner?.nome, collaboration.webDesigner?.cognome]
                .filter(Boolean)
                .join(' ') || 'Web designer'}
            </p>
          )}
        </div>
        <Link
          href={`/Lista_clienti_webdesigner/${id}`}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai clienti
        </Link>
      </div>

      <div className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {STEPS.map((step, index) => (
          <button
            key={step.title}
            type="button"
            onClick={() => goToStep(index)}
            className={`rounded-lg border p-3 text-left transition ${
              currentStep === index
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-200 bg-white hover:border-orange-200'
            }`}
          >
            <span className="block text-xs font-bold uppercase text-gray-500">Step {index + 1}</span>
            <span className="block text-sm font-bold text-gray-950">{step.title}</span>
            <span className="block text-xs text-gray-500">{step.subtitle}</span>
          </button>
        ))}
      </div>

      {message && (
        <div
          aria-live="polite"
          className={`mb-4 rounded-lg border px-4 py-3 text-sm font-semibold ${
            message.toLowerCase().includes('non riuscito')
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {message}
        </div>
      )}

      <div
        ref={stepContentRef}
        className="scroll-mt-6 rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        {currentStep === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Business</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Nome azienda"
                value={interview.azienda}
                onChange={(value) => updateField('azienda', value)}
                placeholder="Es. Studio Rossi"
              />
              <Field
                label="Servizio/prodotto principale"
                value={interview.servizioPrincipale}
                onChange={(value) => updateField('servizioPrincipale', value)}
                placeholder="Es. consulenza di vendita"
              />
            </div>
            <TextArea
              label="Cosa fa l'azienda"
              value={interview.descrizioneAzienda}
              onChange={(value) => updateField('descrizioneAzienda', value)}
              placeholder="Descrizione breve e concreta dell'attività"
            />
            <Field
              label="Sito web precedente (facoltativo)"
              value={interview.sitoVecchioUrl}
              onChange={(value) => updateField('sitoVecchioUrl', value)}
              placeholder="https://www.azienda.it"
              type="url"
            />
            <p className="-mt-3 text-xs leading-5 text-gray-500">
              Se presente, l’AI consulta il vecchio sito prima di creare struttura e testi. La ricerca
              resta limitata a quel dominio.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Cosa vogliamo spingere"
                value={interview.servizioFocus}
                onChange={(value) => updateField('servizioFocus', value)}
                placeholder="Servizio, prodotto o categoria prioritaria"
              />
              <Field
                label="Cliente ideale"
                value={interview.clienteIdeale}
                onChange={(value) => updateField('clienteIdeale', value)}
                placeholder="Es. giovani imprenditori, famiglie, aziende locali"
              />
            </div>
            <TextArea
              label="Da dove arrivano oggi i clienti"
              value={interview.provenienzaClienti}
              onChange={(value) => updateField('provenienzaClienti', value)}
              placeholder="Passaparola, Google, social, ads, partnership..."
              rows={3}
            />
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Obiettivi</h2>
            </div>
            <OptionGrid
              label="Cosa deve ottenere il sito"
              options={OPTIONS.obiettivi}
              value={interview.obiettivi}
              onChange={(value) => updateField('obiettivi', value)}
              multiple
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Cosa deve fare l'utente appena entra"
                value={interview.azioneUtente}
                onChange={(value) => updateField('azioneUtente', value)}
                placeholder="Es. vedere i contatti, prenotare, acquistare"
              />
              <Field
                label="CTA principale"
                value={interview.ctaPrincipale}
                onChange={(value) => updateField('ctaPrincipale', value)}
                placeholder="Es. Contattaci, Prenota, Acquista ora"
              />
            </div>
            <OptionGrid
              label="Tipologia sito"
              options={OPTIONS.tipoSito}
              value={interview.tipoSito}
              onChange={(value) => updateField('tipoSito', value)}
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Chi siamo generico</h2>
              <p className="mt-1 text-sm text-gray-500">
                Informazioni utili per costruire un testo Chi siamo completo e autentico.
              </p>
            </div>
            <TextArea
              label="Come nasce l'azienda e da dove siete partiti?"
              value={interview.chiSiamoNascita}
              onChange={(value) => updateField('chiSiamoNascita', value)}
              placeholder="Racconta l'idea iniziale, chi l'ha fondata e il punto di partenza"
            />
            <TextArea
              label="Di cosa vi occupate oggi e quali sono i vostri servizi/prodotti principali?"
              value={interview.chiSiamoAttivita}
              onChange={(value) => updateField('chiSiamoAttivita', value)}
              placeholder="Descrivi l'attività attuale e l'offerta principale"
            />
            <TextArea
              label="A chi vi rivolgete principalmente?"
              value={interview.chiSiamoTarget}
              onChange={(value) => updateField('chiSiamoTarget', value)}
              placeholder="Clienti, settori, territori o bisogni principali"
              rows={3}
            />
            <TextArea
              label="Cosa vi distingue dalle altre aziende del vostro settore?"
              value={interview.chiSiamoDifferenziazione}
              onChange={(value) => updateField('chiSiamoDifferenziazione', value)}
              placeholder="Metodo, esperienza, specializzazione o vantaggi distintivi"
            />
            <TextArea
              label="Quali sono i valori su cui avete costruito l'azienda e come si traducono concretamente nel vostro lavoro?"
              value={interview.chiSiamoValori}
              onChange={(value) => updateField('chiSiamoValori', value)}
              placeholder="Indica i valori e aggiungi esempi concreti"
            />
            <TextArea
              label="Qual è il vostro modo di lavorare con un cliente?"
              value={interview.chiSiamoMetodo}
              onChange={(value) => updateField('chiSiamoMetodo', value)}
              placeholder="Dal primo contatto alla consegna e all'assistenza"
            />
            <TextArea
              label="Qual è stato il percorso dell'azienda fino ad oggi?"
              value={interview.chiSiamoPercorso}
              onChange={(value) => updateField('chiSiamoPercorso', value)}
              placeholder="Crescita, cambiamenti, nuovi servizi, ampliamento del team e traguardi importanti"
            />
            <TextArea
              label="Dove volete arrivare nei prossimi anni?"
              value={interview.chiSiamoVisione}
              onChange={(value) => updateField('chiSiamoVisione', value)}
              placeholder="Visione, obiettivi e direzione futura"
              rows={3}
            />
            <TextArea
              label="Contatti"
              value={interview.chiSiamoContatti}
              onChange={(value) => updateField('chiSiamoContatti', value)}
              placeholder="Telefono, email, indirizzo, orari o altri riferimenti da pubblicare"
              rows={3}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Struttura, stile e materiali</h2>
            </div>
            <OptionGrid
              label="Sezioni/pagine da includere"
              options={OPTIONS.sezioni}
              value={interview.sezioni}
              onChange={(value) => updateField('sezioni', value)}
              multiple
            />
            <Field
              label="Altre sezioni"
              value={interview.sezioniAltro}
              onChange={(value) => updateField('sezioniAltro', value)}
              placeholder="Aggiungi sezioni non presenti sopra"
            />
            <OptionGrid
              label="Stile desiderato"
              options={OPTIONS.stile}
              value={interview.stile}
              onChange={(value) => updateField('stile', value)}
              multiple
            />
            <Field
              label="Altro stile"
              value={interview.stileAltro}
              onChange={(value) => updateField('stileAltro', value)}
              placeholder="Mood, siti simili, dettagli particolari"
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGrid
                label="Animazioni"
                options={OPTIONS.animazioni}
                value={interview.animazioni}
                onChange={(value) => updateField('animazioni', value)}
              />
              <div className="space-y-4">
                <OptionGrid
                  label="Video in homepage"
                  options={['No', 'Si']}
                  value={interview.videoHomepage}
                  onChange={(value) => updateField('videoHomepage', value)}
                />
                <OptionGrid
                  label="Linee guida brand"
                  options={['No', 'Si']}
                  value={interview.lineeGuidaBrand}
                  onChange={(value) => updateField('lineeGuidaBrand', value)}
                />
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field
                label="Colori preferiti o da evitare"
                value={interview.colori}
                onChange={(value) => updateField('colori', value)}
                placeholder="Es. blu, marrone, evitare rosso..."
              />
              <Field
                label="Font o riferimenti tipografici"
                value={interview.font}
                onChange={(value) => updateField('font', value)}
                placeholder="Font specifici o riferimento stile"
              />
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-950">Materiali disponibili</h3>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                <MaterialGroup
                  label="Materiali brand"
                  description="Logo, palette e identità visiva"
                  options={OPTIONS.brandAssets}
                  value={interview.brandAssets}
                  onChange={(value) => updateField('brandAssets', value)}
                />
                <MaterialGroup
                  label="Media disponibili"
                  description="Foto e video pronti per il sito"
                  options={OPTIONS.mediaAssets}
                  value={interview.mediaAssets}
                  onChange={(value) => updateField('mediaAssets', value)}
                />
                <MaterialGroup
                  label="Testi disponibili"
                  description="Copy e contenuti gia raccolti"
                  options={OPTIONS.textAssets}
                  value={interview.textAssets}
                  onChange={(value) => updateField('textAssets', value)}
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-950">Dominio e risultato</h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <OptionGrid
                label="Dominio esistente"
                options={['No', 'Si']}
                value={interview.dominioEsistente}
                onChange={(value) => updateField('dominioEsistente', value)}
              />
              <Field
                label="Dominio / URL"
                value={interview.dominio}
                onChange={(value) => updateField('dominio', value)}
                placeholder="azienda.it"
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <Field
                label="Provider dominio/hosting"
                value={interview.providerDominio}
                onChange={(value) => updateField('providerDominio', value)}
                placeholder="Aruba, OVH, SiteGround..."
              />
              <Field
                label="Email collegate"
                value={interview.emailCollegate}
                onChange={(value) => updateField('emailCollegate', value)}
                placeholder="info@azienda.it, amministrazione..."
              />
              <Field
                label="Scadenza dominio"
                value={interview.scadenzaDominio}
                onChange={(value) => updateField('scadenzaDominio', value)}
                placeholder="Data o mese/anno"
              />
            </div>
            <TextArea
              label="Accessi dominio/hosting"
              value={interview.accessiDominio}
              onChange={(value) => updateField('accessiDominio', value)}
              placeholder="Credenziali o note operative"
              rows={3}
            />
            <TextArea
              label="Note finali"
              value={interview.noteFinali}
              onChange={(value) => updateField('noteFinali', value)}
              placeholder="Vincoli, cose da evitare, richieste particolari"
              rows={3}
            />

            <section className="rounded-xl border border-violet-200 bg-violet-50 p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 text-violet-800">
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                    <h3 className="text-base font-bold">Documento strategico generato con AI</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-violet-950/75">
                    Il gestionale analizza l’eventuale sito precedente e produce sempre lo stesso
                    formato: sintesi, pagine, testi completi, cinque domande, schema visuale e prompt
                    per Codex.
                  </p>
                </div>
                {(!aiAnalysis || aiStale) && (
                  <button
                    type="button"
                    onClick={() => generateAiAnalysis('initial')}
                    disabled={aiGenerating || tracking}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {aiGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Sparkles className="h-4 w-4" aria-hidden="true" />
                    )}
                    {aiGenerating
                      ? 'Prima analisi in corso...'
                      : aiStale
                        ? 'Aggiorna prima analisi'
                        : 'Genera prima analisi + 5 domande'}
                  </button>
                )}
              </div>

              {aiError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                >
                  {aiError}
                </div>
              )}

              {aiGenerating && (
                <div className="mt-5 rounded-lg border border-violet-200 bg-white px-4 py-5 text-sm text-violet-900">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-violet-700" aria-hidden="true" />
                    <div>
                      <div className="font-bold">Sto organizzando il documento</div>
                      <div className="mt-1 text-violet-800/70">
                        Analisi dell’intervista e del vecchio sito, struttura delle pagine e testi.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {aiAnalysis && !aiGenerating && (
                <div className="mt-6 space-y-6">
                  {aiStale && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Hai modificato l’intervista dopo l’ultima analisi. Aggiorna il documento prima di
                      usarlo.
                    </div>
                  )}

                  {!aiStale && aiAnswersDirty && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Le nuove risposte non sono ancora salvate né integrate nel risultato finale.
                    </div>
                  )}

                  {!aiStale && !aiAnswersDirty && aiFinalStale && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                      Le risposte sono salvate, ma il risultato finale mostra ancora la versione
                      precedente. Puoi rigenerarlo ora o più avanti.
                    </div>
                  )}

                  <ExistingWebsiteAnalysis analysis={aiAnalysis.analisiSitoEsistente} />

                  <SiteStructureDiagram
                    pages={aiAnalysis.strutturaSito}
                    azienda={interview.azienda}
                    siteType={aiAnalysis.sintesiStrategica?.tipologiaSito}
                    siteTypeReason={aiAnalysis.sintesiStrategica?.motivazioneTipologia}
                    filename={`${filenameBase} - Schema sito.svg`}
                  />

                  <WebsiteCopyPreview pages={aiAnalysis.strutturaSito} />

                  <div>
                    <h4 className="text-sm font-bold text-violet-950">
                      Domande per completare i testi
                    </h4>
                    <p className="mt-1 text-sm leading-6 text-violet-950/70">
                      Raccogli le cinque risposte durante l’intervista. Puoi salvarle e generare il
                      risultato finale subito oppure in un secondo momento.
                    </p>
                    <div className="mt-4 space-y-4">
                      {(aiAnalysis.domandeApprofondimento || []).map((item, index) => (
                        <div key={`${item.domanda}-${index}`} className="rounded-lg bg-white p-4">
                          <div className="text-sm font-bold text-gray-950">
                            {index + 1}. {item.domanda}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-gray-500">{item.motivo}</div>
                          <label className="mt-3 block">
                            <span className="sr-only">Risposta alla domanda {index + 1}</span>
                            <textarea
                              value={aiAnswers[index] || ''}
                              onChange={(event) => {
                                setAiAnswers((answers) => ({
                                  ...answers,
                                  [index]: event.target.value,
                                }));
                                setAiAnswersDirty(true);
                                if (aiStage === 'finale') setAiFinalStale(true);
                              }}
                              rows={3}
                              placeholder="Scrivi qui la risposta del cliente..."
                              className="w-full resize-y rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={saveAnswersForLater}
                        disabled={aiGenerating || tracking}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-300 bg-white px-4 py-3 text-sm font-bold text-violet-800 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Save className="h-4 w-4" aria-hidden="true" />
                        Salva e completa dopo
                      </button>
                      <button
                        type="button"
                        onClick={() => generateAiAnalysis('final')}
                        disabled={aiGenerating || tracking || aiStale}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Sparkles className="h-4 w-4" aria-hidden="true" />
                        {aiStage === 'finale' ? 'Rigenera risultato finale' : 'Genera risultato finale'}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-gray-950">
                          {aiStage === 'finale'
                            ? aiFinalStale
                              ? 'Risultato finale precedente'
                              : 'Risultato finale salvato'
                            : 'Prima analisi salvata'}
                        </h4>
                        <p className="mt-1 text-xs text-gray-500">
                          {aiAnalysis.sintesiStrategica?.tipologiaSito || 'Tipologia da definire'} ·{' '}
                          {(aiAnalysis.strutturaSito || []).length} pagine organizzate · formato stabile
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          onClick={copyAiResult}
                          disabled={aiStale || aiAnswersDirty || aiFinalStale}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Clipboard className="h-4 w-4" aria-hidden="true" />
                          Copia documento
                        </button>
                        <button
                          type="button"
                          onClick={downloadAiResult}
                          disabled={aiStale || aiAnswersDirty || aiFinalStale}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                          Scarica TXT AI
                        </button>
                      </div>
                    </div>
                    <pre className="mt-4 max-h-[620px] overflow-auto whitespace-pre-wrap border-t border-gray-100 pt-4 text-sm leading-6 text-gray-800">
                      {aiResultText}
                    </pre>
                  </div>
                </div>
              )}
            </section>

            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold text-gray-950">Intervista grezza</h3>
                  {message && (
                    <span aria-live="polite" className="text-xs font-semibold text-emerald-700">
                      {message}
                    </span>
                  )}
                </div>
                <pre className="max-h-[460px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-gray-800">
                  {resultText}
                </pre>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-bold text-gray-950">Azioni</h3>
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={copyResultText}
                    disabled={tracking}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-white px-4 py-3 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
                  >
                    <Clipboard className="h-4 w-4" />
                    {tracking ? 'Salvataggio...' : 'Copia intervista'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadTxt}
                    disabled={tracking}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-700"
                  >
                    <FileText className="h-4 w-4" />
                    {tracking ? 'Salvataggio...' : 'Scarica intervista TXT'}
                  </button>
                  <button
                    type="button"
                    onClick={downloadJson}
                    disabled={tracking}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-gray-800"
                  >
                    <FileJson className="h-4 w-4" />
                    Scarica JSON
                  </button>
                </div>
                <div className="mt-5 border-t border-gray-200 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="inline-flex items-center gap-2 text-sm font-bold text-gray-950">
                      <History className="h-4 w-4 text-gray-500" />
                      Storico
                    </h3>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-bold text-gray-500">
                      {historyItems.length}
                    </span>
                  </div>
                  {historyLoading ? (
                    <p className="text-sm text-gray-500">Caricamento storico...</p>
                  ) : historyItems.length === 0 ? (
                    <p className="text-sm leading-5 text-gray-500">
                      Nessuna intervista salvata per questo web designer.
                    </p>
                  ) : (
                    <div className="max-h-80 space-y-2 overflow-auto pr-1">
                      {historyItems.map((item) => (
                        <div
                          key={item._id}
                          className="rounded-lg border border-gray-200 bg-white p-3 text-sm"
                        >
                          <div className="font-bold text-gray-950">
                            {item.azienda || 'Senza nome azienda'}
                          </div>
                          <div className="mt-1 text-xs leading-5 text-gray-500">
                            {formatHistoryDate(item.createdAt)} · {item.autoreNome || 'Utente'}
                          </div>
                          {item.autoreEmail && (
                            <div className="text-xs text-gray-400">{item.autoreEmail}</div>
                          )}
                          <button
                            type="button"
                            onClick={() => downloadHistoryTxt(item)}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Intervista TXT
                          </button>
                          {item.aiRisultatoTxt && (
                            <button
                              type="button"
                              onClick={() => downloadHistoryAiTxt(item)}
                              className="ml-4 mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 hover:text-violet-800"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Documento AI
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={currentStep === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Indietro
        </button>
        {currentStep === STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => generateAiAnalysis(aiAnalysis && !aiStale ? 'final' : 'initial')}
            disabled={aiGenerating || tracking}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {aiGenerating
              ? 'Analisi in corso...'
              : aiAnalysis && !aiStale
                ? aiStage === 'finale'
                  ? 'Rigenera risultato finale'
                  : 'Genera risultato finale'
                : 'Genera prima analisi + 5 domande'}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={tracking}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {tracking ? 'Salvataggio...' : 'Avanti'}
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default InterviewPage;
