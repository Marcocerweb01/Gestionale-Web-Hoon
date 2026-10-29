const euro = (value) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const date = (value) => value ? new Intl.DateTimeFormat("it-IT").format(new Date(value)) : "";

/**
 * The first visual-editor implementation used a complete page JPG and placed
 * invisible hotspots over it. Editing a hotspot consequently duplicated the
 * source text and tried to hide it with a flat rectangle. Convert those pages
 * to the native block model so the editor and the exported PDF share the same
 * source of truth.
 */
export function normalizeQuotePages(pages = []) {
  return pages.map((page) => {
    const blocks = Array.isArray(page.blocks) ? page.blocks : [];
    const legacyReferencePage = Boolean(page.backgroundImage && blocks.some((block) => block.referenceMode));

    return {
      ...page,
      ...(legacyReferencePage ? { backgroundImage: "", backgroundImageOpacity: 1 } : {}),
      blocks: blocks.map((block) => {
        if (!block.referenceMode) return { ...block };
        const editableBlock = { ...block };
        delete editableBlock.sourceX;
        delete editableBlock.sourceY;
        delete editableBlock.sourceWidth;
        delete editableBlock.sourceHeight;
        delete editableBlock.sourceMaskColor;
        return { ...editableBlock, referenceMode: false, modified: true };
      }),
    };
  });
}

export function resolveQuoteVariables(text, quote = {}, version = {}) {
  const organization = quote.organization || {};
  const primary = organization.people?.find((person) => person.primary) || organization.people?.[0] || {};
  const values = {
    azienda: organization.tradingName || organization.businessName || "",
    referente: [primary.firstName, primary.lastName].filter(Boolean).join(" "),
    logo_cliente: organization.logoUrl || "",
    data_preventivo: date(quote.issuedAt),
    numero_preventivo: quote.number || "",
    descrizione_progetto: version.projectDescription || "",
    servizi: version.items?.map((item) => {
      const hasEditablePrice = item.discountedPrice != null || item.unitPrice != null;
      const net = (Number(item.quantity) || 0) * (Number(item.discountedPrice ?? item.unitPrice) || 0);
      const calculatedGross = net * (1 + (Number(item.vatRate) || 0) / 100);
      const gross = hasEditablePrice && Number.isFinite(calculatedGross) ? calculatedGross : item.gross;
      return `- ${item.service}${item.description ? ` - ${item.description}` : ""}: ${euro(gross)}`;
    }).join("\n") || "",
    prezzo_totale: euro(version.totals?.gross),
    iva: euro(version.totals?.vat),
    condizioni_pagamento: version.paymentConditions || "",
  };
  return String(text || "").replace(/{{\s*([a-z_]+)\s*}}/g, (_match, key) => values[key] ?? "");
}
