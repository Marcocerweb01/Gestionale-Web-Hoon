export const DEFAULT_COMPANY = {
  name: "Hoon",
  address: "",
  email: "",
  phone: "",
  vatNumber: ""
};

export const DEFAULT_PDF_TEMPLATES = {
  quote: {
    name: "Preventivo standard",
    html: `
      <header>
        <div>
          <strong>{{company.name}}</strong>
          <p>{{company.address}}</p>
        </div>
        <div class="doc-meta">
          <h1>Preventivo {{document.number}}</h1>
          <p>Data: {{document.issueDate}}</p>
          <p>Valido fino al: {{document.validUntil}}</p>
        </div>
      </header>
      <section>
        <h2>Cliente</h2>
        <p><strong>{{customer.name}}</strong></p>
        <p>{{customer.email}}</p>
      </section>
      {{rowsTable}}
      {{totalsTable}}
      <section><h2>Note</h2><p>{{document.notes}}</p></section>
    `
  },
  order_confirmation: {
    name: "Conferma ordine standard",
    html: `
      <header>
        <strong>{{company.name}}</strong>
        <div class="doc-meta"><h1>Conferma ordine {{document.number}}</h1><p>Data: {{document.issueDate}}</p></div>
      </header>
      <section><h2>Cliente</h2><p><strong>{{customer.name}}</strong></p></section>
      {{rowsTable}}
      {{totalsTable}}
      <section><h2>Note</h2><p>{{document.notes}}</p></section>
    `
  },
  delivery_note: {
    name: "DDT standard",
    html: `
      <header>
        <strong>{{company.name}}</strong>
        <div class="doc-meta"><h1>Documento di trasporto {{document.number}}</h1><p>Data: {{document.issueDate}}</p></div>
      </header>
      <section><h2>Cliente</h2><p><strong>{{customer.name}}</strong></p></section>
      <section><h2>Destinazione</h2><p>{{shippingAddress.address}} {{shippingAddress.city}}</p></section>
      <p><strong>Causale:</strong> {{document.reason}}</p>
      {{rowsTable}}
      <section><h2>Note</h2><p>{{document.notes}}</p></section>
    `
  }
};

export const DEFAULT_PDF_CSS = `
  body { color: #172033; font-family: Arial, sans-serif; font-size: 13px; margin: 40px; }
  header { align-items: flex-start; border-bottom: 2px solid #172033; display: flex; justify-content: space-between; margin-bottom: 28px; padding-bottom: 18px; }
  h1 { font-size: 24px; margin: 0 0 8px; }
  h2 { font-size: 14px; margin: 24px 0 8px; text-transform: uppercase; }
  p { margin: 2px 0; }
  table { border-collapse: collapse; margin-top: 18px; width: 100%; }
  th, td { border-bottom: 1px solid #d8dee9; padding: 9px 8px; text-align: left; vertical-align: top; }
  th { background: #f3f6fb; font-size: 11px; text-transform: uppercase; }
  .number { text-align: right; white-space: nowrap; }
  .doc-meta { text-align: right; }
  .totals { margin-left: auto; max-width: 320px; }
`;

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT").format(new Date(value));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function getByPath(data, path) {
  return path.split(".").reduce((value, key) => value?.[key], data) ?? "";
}

function replaceVariables(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => String(getByPath(data, path)));
}

function buildRowsTable(document, withPrices) {
  const head = withPrices
    ? "<tr><th>Prodotto</th><th class=\"number\">Qta</th><th class=\"number\">Prezzo</th><th class=\"number\">Totale</th></tr>"
    : "<tr><th>Prodotto</th><th class=\"number\">Qta</th><th>Unita</th><th>Note</th></tr>";

  const rows = (document.lines || []).map((line) => {
    if (withPrices) {
      return `<tr><td>${line.description || ""}<br><small>${line.notes || ""}</small></td><td class="number">${line.quantity || 0}</td><td class="number">${formatCurrency(line.unitPrice)}</td><td class="number">${formatCurrency(line.lineTotal)}</td></tr>`;
    }

    return `<tr><td>${line.description || ""}</td><td class="number">${line.quantity || 0}</td><td>${line.unit || "pz"}</td><td>${line.notes || ""}</td></tr>`;
  }).join("");

  return `<table>${head}${rows}</table>`;
}

function buildTotalsTable(document) {
  return `
    <table class="totals">
      <tr><th>Subtotale</th><td class="number">${formatCurrency(document.subtotal)}</td></tr>
      <tr><th>Sconti</th><td class="number">${formatCurrency(document.discountTotal)}</td></tr>
      <tr><th>Aumenti</th><td class="number">${formatCurrency(document.increaseTotal)}</td></tr>
      <tr><th>Totale</th><td class="number"><strong>${formatCurrency(document.total)}</strong></td></tr>
    </table>
  `;
}

export function renderPdfHtml({ type, document, template, company = DEFAULT_COMPANY }) {
  const withPrices = type !== "delivery_note";
  const data = {
    company,
    customer: document.customerSnapshot || {},
    shippingAddress: document.shippingAddressSnapshot || document.customerSnapshot?.shippingAddress || {},
    document: {
      ...document,
      issueDate: formatDate(document.issueDate),
      validUntil: formatDate(document.validUntil)
    },
    rowsTable: buildRowsTable(document, withPrices),
    totalsTable: withPrices ? buildTotalsTable(document) : ""
  };

  const html = replaceVariables(template?.html || DEFAULT_PDF_TEMPLATES[type]?.html || "", data)
    .replace("{{rowsTable}}", data.rowsTable)
    .replace("{{totalsTable}}", data.totalsTable);

  const css = template?.css || DEFAULT_PDF_CSS;

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${document.number}</title><style>${css}</style></head><body>${html}</body></html>`;
}
