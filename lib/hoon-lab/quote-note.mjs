export const QUOTE_DEPOSIT_PLACEHOLDER = "{{acconto}}";

export const DEFAULT_QUOTE_NOTE = `Per l’avvio dell’ordine è richiesto un acconto del 50% sul totale IVA inclusa, pari a ${QUOTE_DEPOSIT_PLACEHOLDER}. Il restante 50% dovrà essere versato prima della consegna della merce`;

export const LEGACY_DEFAULT_QUOTE_NOTES = [
  "Per l’avvio dell’ordine è richiesto un acconto pari al 50% dell’importo totale. Il restante 50% dovrà essere saldato prima della consegna della merce",
  "Per l’avvio dell’ordine è richiesto un acconto pari al 50% dell’imponibile, IVA esclusa. Il saldo comprenderà l’importo residuo e l’intera IVA e dovrà essere versato prima della consegna della merce"
];

function formatCurrency(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));
}

export function normalizeQuoteNote(note) {
  const value = String(note || "").trim();
  return !value || LEGACY_DEFAULT_QUOTE_NOTES.includes(value) ? DEFAULT_QUOTE_NOTE : value;
}

export function renderQuoteNote(note, total) {
  const depositAmount = Math.round((Number(total || 0) / 2 + Number.EPSILON) * 100) / 100;
  return normalizeQuoteNote(note).replaceAll(QUOTE_DEPOSIT_PLACEHOLDER, formatCurrency(depositAmount));
}
