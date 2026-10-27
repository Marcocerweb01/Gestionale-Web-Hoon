import { randomBytes, createHash } from "node:crypto";
import {
  buildHoonGeneralQuotePages,
  HOON_GENERAL_QUOTE_TEMPLATE,
  HOON_QUOTE_SERVICE_CATALOG,
  HOON_TEMPLATE_SOURCE_VERSION,
  selectQuoteTemplatePages,
  shouldUpgradeHoonQuoteTemplate,
} from "./hoonQuoteTemplate.js";

export { HOON_GENERAL_QUOTE_TEMPLATE, HOON_QUOTE_SERVICE_CATALOG, HOON_TEMPLATE_SOURCE_VERSION, selectQuoteTemplatePages, shouldUpgradeHoonQuoteTemplate };

export const COMMERCIAL_ADMIN_EMAIL = "marcocerasaweb@gmail.com";

export const PIPELINE_STATES = [
  "nuovo_contatto",
  "intervista_pianificata",
  "intervista_completata",
  "preventivo_in_preparazione",
  "preventivo_pronto",
  "preventivo_presentato",
  "in_trattativa",
  "posticipato",
  "rifiutato",
  "accettato",
  "in_onboarding",
  "convertito",
];

export const PIPELINE_LABELS = {
  nuovo_contatto: "Nuovo contatto",
  intervista_pianificata: "Intervista pianificata",
  intervista_completata: "Intervista completata",
  preventivo_in_preparazione: "Preventivo in preparazione",
  preventivo_pronto: "Preventivo pronto",
  preventivo_presentato: "Preventivo presentato",
  in_trattativa: "In trattativa",
  posticipato: "Posticipato",
  rifiutato: "Rifiutato",
  accettato: "Accettato",
  in_onboarding: "In onboarding",
  convertito: "Convertito in cliente",
};

export const DEFAULT_QUOTE_TEMPLATES = [
  HOON_GENERAL_QUOTE_TEMPLATE,
  "Social Media Management",
  "Realizzazione sito web",
  "Brand Identity",
  "Campagne pubblicitarie",
  "Produzione video e fotografica",
  "Preventivo personalizzato",
];

export const DEFAULT_INTERVIEW_TEMPLATES = [
  "Sito internet",
  "Social Media Management",
  "Brand Identity",
  "Campagne pubblicitarie",
  "Altri servizi",
];

const textBlock = (id, text, x, y, width, options = {}) => ({
  id,
  type: "text",
  text,
  x,
  y,
  width,
  height: options.height || 48,
  fontSize: options.fontSize || 18,
  fontWeight: options.fontWeight || 400,
  color: options.color || "#111111",
  align: options.align || "left",
  background: options.background || "transparent",
});

export function buildDefaultQuotePages(templateName = HOON_GENERAL_QUOTE_TEMPLATE) {
  if (!templateName || templateName === HOON_GENERAL_QUOTE_TEMPLATE) {
    return buildHoonGeneralQuotePages();
  }

  return [
    {
      id: "cover",
      name: "Copertina",
      background: "#ffffff",
      blocks: [
        textBlock("brand", "HOON", 44, 54, 500, { fontSize: 72, fontWeight: 900 }),
        textBlock("title", "PROPOSTA COMMERCIALE", 44, 310, 510, {
          fontSize: 32,
          fontWeight: 800,
        }),
        textBlock("template", templateName, 44, 372, 510, { fontSize: 22 }),
        textBlock("company", "{{azienda}}", 44, 520, 510, { fontSize: 30, fontWeight: 700 }),
        textBlock("date", "{{data_preventivo}} · {{numero_preventivo}}", 44, 572, 510, {
          fontSize: 15,
          color: "#555555",
        }),
        {
          id: "yellow-bar",
          type: "shape",
          x: 44,
          y: 690,
          width: 510,
          height: 18,
          background: "#ffd800",
        },
      ],
    },
    {
      id: "proposal",
      name: "Progetto",
      background: "#ffffff",
      blocks: [
        textBlock("project-title", "IL PROGETTO", 44, 48, 510, { fontSize: 34, fontWeight: 800 }),
        textBlock("project-copy", "{{descrizione_progetto}}", 44, 125, 510, {
          height: 240,
          fontSize: 18,
        }),
        textBlock("services-title", "SERVIZI INCLUSI", 44, 410, 510, {
          fontSize: 24,
          fontWeight: 800,
        }),
        textBlock("services", "{{servizi}}", 44, 465, 510, { height: 230, fontSize: 17 }),
      ],
    },
    {
      id: "economics",
      name: "Investimento",
      background: "#ffffff",
      blocks: [
        textBlock("price-title", "INVESTIMENTO", 44, 48, 510, { fontSize: 34, fontWeight: 800 }),
        textBlock("price", "{{prezzo_totale}}", 44, 140, 510, {
          height: 110,
          fontSize: 52,
          fontWeight: 900,
          background: "#ffd800",
        }),
        textBlock("vat", "IVA: {{iva}}", 44, 280, 510, { fontSize: 18 }),
        textBlock("conditions-title", "CONDIZIONI DI PAGAMENTO", 44, 380, 510, {
          fontSize: 22,
          fontWeight: 800,
        }),
        textBlock("conditions", "{{condizioni_pagamento}}", 44, 432, 510, {
          height: 180,
          fontSize: 17,
        }),
        textBlock("contacts", "Hoon Srl · www.hoonweb.it · info@hoonweb.it", 44, 744, 510, {
          fontSize: 13,
          color: "#555555",
        }),
      ],
    },
  ];
}

export function calculateQuote(items = []) {
  const normalizedItems = items.map((item, index) => {
    const quantity = Math.max(0, Number(item.quantity) || 0);
    const unitPrice = Math.max(0, Number(item.unitPrice) || 0);
    const standardPrice = Math.max(0, Number(item.standardPrice ?? unitPrice) || 0);
    const discountedPrice = Math.max(0, Number(item.discountedPrice ?? unitPrice) || 0);
    const vatRate = Math.max(0, Number(item.vatRate ?? 22) || 0);
    const net = Math.round(quantity * discountedPrice * 100) / 100;
    const vat = Math.round(net * (vatRate / 100) * 100) / 100;
    return {
      ...item,
      sortOrder: index,
      quantity,
      unitPrice,
      standardPrice,
      discountedPrice,
      vatRate,
      net,
      vat,
      gross: Math.round((net + vat) * 100) / 100,
    };
  });

  const netTotal = normalizedItems.reduce((sum, item) => sum + item.net, 0);
  const vatTotal = normalizedItems.reduce((sum, item) => sum + item.vat, 0);
  return {
    items: normalizedItems,
    totals: {
      net: Math.round(netTotal * 100) / 100,
      vat: Math.round(vatTotal * 100) / 100,
      gross: Math.round((netTotal + vatTotal) * 100) / 100,
    },
  };
}

export function createPublicToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashPublicToken(token) };
}

export function hashPublicToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

export function sanitizeText(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

export function normalizeEmail(value) {
  return sanitizeText(value, 320).toLowerCase();
}

export function normalizePhone(value) {
  return sanitizeText(value, 80).replace(/[^+\d]/g, "");
}

