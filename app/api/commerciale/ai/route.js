import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { requireCommercialAdmin } from "@/lib/commerciale/auth";
import { CommercialFile, Interview, InterviewTemplate } from "@/models/Commerciale";
import { connectToDB } from "@/utils/database";
import { extractStructuredOutput, DEFAULT_WEB_DESIGN_AI_MODEL } from "@/lib/webdesign-interview-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

async function callOpenAI({ instructions, prompt, file }) {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY non configurata sul server");
  const content = [{ type: "input_text", text: prompt }];
  if (file) {
    const dataUrl = `data:${file.mimeType};base64,${Buffer.from(file.data).toString("base64")}`;
    if (file.mimeType === "application/pdf") {
      content.push({ type: "input_file", filename: file.filename, file_data: dataUrl });
    } else {
      content.push({ type: "input_image", image_url: dataUrl, detail: "high" });
    }
  }
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.COMMERCIAL_AI_MODEL || DEFAULT_WEB_DESIGN_AI_MODEL,
      store: false,
      instructions,
      input: [{ role: "user", content }],
      text: { format: { type: "json_object" } },
      max_output_tokens: 12000,
    }),
    signal: AbortSignal.timeout(115000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || "Analisi AI non riuscita");
  const output = extractStructuredOutput(payload);
  if (!output) throw new Error("L'AI non ha restituito dati utilizzabili");
  return JSON.parse(output);
}

export async function POST(req) {
  const auth = await requireCommercialAdmin();
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  await connectToDB();

  try {
    if (body.action === "propose_template") {
      if (!mongoose.Types.ObjectId.isValid(body.fileId)) return NextResponse.json({ error: "File non valido" }, { status: 400 });
      const file = await CommercialFile.findById(body.fileId).select("+data").lean();
      if (!file) return NextResponse.json({ error: "File non trovato" }, { status: 404 });
      const proposal = await callOpenAI({
        file,
        instructions: "Sei un analista di moduli Hoon. Estrai esclusivamente ciò che è visibile nel documento. Non inventare domande o opzioni. Rispondi in JSON valido.",
        prompt: `Trasforma il documento in una proposta di questionario. Restituisci {name,serviceType,description,questions:[{key,label,type,required,options,section,sortOrder}],warnings}. I type ammessi sono text, textarea, select, multiselect, number, date, checkbox. Le informazioni dubbie vanno in warnings. Non salvare o sovrascrivere nulla.`,
      });
      return NextResponse.json({ proposal, sourceFile: body.fileId });
    }

    if (body.action === "extract_interview") {
      if (!mongoose.Types.ObjectId.isValid(body.fileId) || !mongoose.Types.ObjectId.isValid(body.templateId)) {
        return NextResponse.json({ error: "File o template non validi" }, { status: 400 });
      }
      const [file, template] = await Promise.all([
        CommercialFile.findById(body.fileId).select("+data").lean(),
        InterviewTemplate.findById(body.templateId).lean(),
      ]);
      if (!file || !template) return NextResponse.json({ error: "File o template non trovati" }, { status: 404 });
      const extraction = await callOpenAI({
        file,
        instructions: "Sei un sistema OCR prudente. Non inventare risposte mancanti e indica sempre l'incertezza. Rispondi in JSON valido.",
        prompt: `Il template atteso è ${JSON.stringify(template.questions)}. Identifica le risposte nel documento e restituisci {templateMatch,answers:[{questionKey,value,confidence,confirmed:false,source:"ocr"}],missingQuestionKeys,warnings}. confidence deve essere tra 0 e 1.`,
      });
      return NextResponse.json(extraction);
    }

    if (body.action === "analyze_interview") {
      if (!mongoose.Types.ObjectId.isValid(body.interviewId)) return NextResponse.json({ error: "Intervista non valida" }, { status: 400 });
      const interview = await Interview.findById(body.interviewId).populate("template").populate("organization", "businessName sector website");
      if (!interview) return NextResponse.json({ error: "Intervista non trovata" }, { status: 404 });
      const analysis = await callOpenAI({
        instructions: "Sei un consulente commerciale Hoon. Separa rigorosamente fatti dichiarati e suggerimenti AI. Non stabilire prezzi. Rispondi in JSON valido.",
        prompt: `Analizza questa intervista: ${JSON.stringify({ organization: interview.organization, questions: interview.template?.questions, answers: interview.answers, notes: interview.notes })}. Restituisci {companyOverview,objectives,criticalIssues,targetAudience,mainNeeds,requestedServices,usefulServices,projectCharacteristics,priorities,missingInformation,commercialProposals,draftQuoteCopy,declaredFacts,aiSuggestions}. Ogni campo deve essere stringa o array di stringhe.`,
      });
      interview.aiAnalysis = analysis;
      interview.aiAnalyzedAt = new Date();
      await interview.save();
      return NextResponse.json({ analysis, interview });
    }

    return NextResponse.json({ error: "Azione AI non valida" }, { status: 400 });
  } catch (error) {
    console.error("Errore AI commerciale:", error);
    return NextResponse.json({ error: error.message || "Analisi AI non riuscita" }, { status: 502 });
  }
}

