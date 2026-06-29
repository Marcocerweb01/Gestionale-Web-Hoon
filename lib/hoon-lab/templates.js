import fs from "node:fs";
import path from "node:path";

function getLogoDataUri() {
  try {
    const logoPath = path.join(process.cwd(), "public", "Hoon_lab_black.png");
    const logo = fs.readFileSync(logoPath).toString("base64");
    return `data:image/png;base64,${logo}`;
  } catch {
    return "/Hoon_lab_black.png";
  }
}

export const DEFAULT_COMPANY = {
  name: "Hoon Lab",
  address: "",
  email: "",
  phone: "",
  vatNumber: "",
  logoDataUri: getLogoDataUri()
};

export const DEFAULT_PDF_TEMPLATES = {
  quote: {
    name: "Preventivo Hoon Lab",
    html: `
      <header class="quote-header quote-header-modern">
        <img class="quote-logo" src="{{company.logoDataUri}}" alt="{{company.name}}" />
        <div class="quote-meta-row">
          <div>
            <p class="company-name">{{company.name}}</p>
            <p>{{company.address}}</p>
            <p>{{company.email}}</p>
            <p>{{company.phone}}</p>
          </div>
          <div class="doc-title">
            <span>Preventivo</span>
            <h1>{{document.number}}</h1>
            <p>Data: {{document.issueDate}}</p>
          </div>
        </div>
      </header>

      <section class="recipient-grid">
        <div class="recipient-card">
          <h2>Spett.le</h2>
          {{customerDetails}}
        </div>
        <div class="recipient-card">
          <h2>Dettagli preventivo</h2>
          <dl>
            <dt>Numero</dt><dd>{{document.number}}</dd>
            <dt>Data</dt><dd>{{document.issueDate}}</dd>
            <dt>Valido fino al</dt><dd>{{document.validUntil}}</dd>
          </dl>
        </div>
      </section>

      {{rowsTable}}
      {{totalsTable}}
      <section class="notes"><h2>Note</h2><p>{{document.notes}}</p></section>
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
  @page { margin: 18mm 16mm; size: A4; }
  * { box-sizing: border-box; }
  body { background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 11.5px; line-height: 1.45; margin: 0; }
  .quote-header { margin-bottom: 22px; }
  .quote-header-modern { border-bottom: 2px solid #111; padding-bottom: 14px; }
  .quote-logo { display: block; height: auto; margin: 0 auto 16px 0; width: 260px; }
  .quote-meta-row { align-items: flex-end; display: flex; justify-content: space-between; gap: 24px; }
  .company-name { font-size: 13px; font-weight: 700; text-transform: uppercase; }
  .doc-title { text-align: right; text-transform: uppercase; }
  .doc-title span { color: #555; display: block; font-size: 10px; font-weight: 700; letter-spacing: .14em; }
  .doc-title p { font-size: 11px; margin-top: 6px; text-transform: none; }
  h1 { font-size: 24px; line-height: 1; margin: 5px 0 0; }
  h2 { color: #111; font-size: 11px; letter-spacing: .08em; margin: 0 0 9px; text-transform: uppercase; }
  p { margin: 2px 0; }
  .recipient-grid { display: grid; gap: 18px; grid-template-columns: 1.1fr .9fr; margin: 18px 0 24px; }
  .recipient-card { border: 1px solid #111; min-height: 116px; padding: 12px 14px; }
  dl { display: grid; grid-template-columns: 106px 1fr; margin: 0; row-gap: 6px; }
  dt { color: #555; font-weight: 700; text-transform: uppercase; }
  dd { font-weight: 600; margin: 0; text-align: left; }
  table { border-collapse: collapse; margin-top: 14px; width: 100%; }
  th, td { border: 1px solid #111; padding: 8px 8px; text-align: left; vertical-align: top; }
  th { background: #111; color: #fff; font-size: 10px; letter-spacing: .06em; text-transform: uppercase; }
  tbody tr:nth-child(even) td { background: #f4f4f4; }
  small { color: #555; display: block; margin-top: 3px; }
  .number { text-align: right; white-space: nowrap; }
  .sku { color: #555; font-size: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
  .totals { margin-left: auto; max-width: 340px; }
  .totals th { background: #f4f4f4; color: #111; }
  .totals tr:last-child th, .totals tr:last-child td { background: #111; color: #fff; font-size: 14px; }
  .notes { margin-top: 26px; }
  .notes p { border: 1px solid #111; min-height: 54px; padding: 12px; white-space: pre-wrap; }
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function replaceVariables(template, data) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    if (["rowsTable", "totalsTable", "customerDetails"].includes(path)) return `{{${path}}}`;
    return escapeHtml(getByPath(data, path));
  });
}

function detailRow(label, value) {
  return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "-")}</dd>`;
}

function buildCustomerDetails(customer = {}) {
  const type = customer.type || "azienda";
  const address = customer.billingAddress?.address || "";

  if (type === "privato") {
    return `
      <dl>
        ${detailRow("Nome e cognome", customer.name)}
        ${detailRow("Via", address)}
        ${detailRow("Codice fiscale", customer.taxCode)}
      </dl>
    `;
  }

  if (type === "team") {
    return `
      <dl>
        ${detailRow("Nome", customer.name)}
        ${detailRow("Partita IVA", customer.vatNumber)}
      </dl>
    `;
  }

  return `
    <dl>
      ${detailRow("Ragione sociale", customer.name)}
      ${detailRow("Via", address)}
      ${detailRow("Partita IVA", customer.vatNumber)}
    </dl>
  `;
}

function buildRowsTable(document, withPrices) {
  const head = withPrices
    ? "<tr><th>Descrizione</th><th class=\"number\">Qta</th><th class=\"number\">Prezzo unitario</th><th class=\"number\">Totale</th></tr>"
    : "<tr><th>Prodotto</th><th class=\"number\">Qta</th><th>Unita</th><th>Note</th></tr>";

  const rows = (document.lines || []).map((line) => {
    if (withPrices) {
      return `<tr><td><span class="sku">${escapeHtml(line.productSnapshot?.sku || "")}</span><br>${escapeHtml(line.description || "")}<small>${escapeHtml(line.notes || "")}</small></td><td class="number">${line.quantity || 0}</td><td class="number">${formatCurrency(line.unitPrice)}</td><td class="number">${formatCurrency(line.lineTotal)}</td></tr>`;
    }

    return `<tr><td>${escapeHtml(line.description || "")}</td><td class="number">${line.quantity || 0}</td><td>${escapeHtml(line.unit || "pz")}</td><td>${escapeHtml(line.notes || "")}</td></tr>`;
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
    totalsTable: withPrices ? buildTotalsTable(document) : "",
    customerDetails: buildCustomerDetails(document.customerSnapshot || {})
  };

  const html = replaceVariables(template?.html || DEFAULT_PDF_TEMPLATES[type]?.html || "", data)
    .replaceAll("{{rowsTable}}", data.rowsTable)
    .replaceAll("{{totalsTable}}", data.totalsTable)
    .replaceAll("{{customerDetails}}", data.customerDetails);

  const css = template?.css || DEFAULT_PDF_CSS;

  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>${document.number}</title><style>${css}</style></head><body>${html}</body></html>`;
}
