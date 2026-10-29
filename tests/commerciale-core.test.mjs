import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_ADMIN_EMAIL,
  PIPELINE_STATES,
  DEFAULT_INTERVIEW_TEMPLATES,
  DEFAULT_QUOTE_TEMPLATES,
  HOON_GENERAL_QUOTE_TEMPLATE,
  HOON_QUOTE_SERVICE_CATALOG,
  buildDefaultQuotePages,
  calculateQuote,
  createPublicToken,
  hashPublicToken,
  normalizeEmail,
  normalizePhone,
  selectQuoteTemplatePages,
  shouldUpgradeHoonQuoteTemplate,
} from "../lib/commerciale/core.js";
import { normalizeQuotePages, resolveQuoteVariables } from "../lib/commerciale/quoteCanvas.js";

test("il modulo commerciale è riservato all'account amministratore corretto", () => {
  assert.equal(COMMERCIAL_ADMIN_EMAIL, "marcocerasaweb@gmail.com");
});

test("la pipeline contiene tutti i dodici stati nell'ordine operativo", () => {
  assert.equal(PIPELINE_STATES.length, 12);
  assert.equal(PIPELINE_STATES[0], "nuovo_contatto");
  assert.equal(PIPELINE_STATES.at(-1), "convertito");
});

test("il motore prezzi mantiene imponibile, IVA e totale separati", () => {
  const result = calculateQuote([
    { service: "SMM", quantity: 2, unitPrice: 100, standardPrice: 100, discountedPrice: 90, vatRate: 22 },
    { service: "Dominio", quantity: 1, unitPrice: 100, standardPrice: 100, discountedPrice: 100, vatRate: 10 },
  ]);
  assert.equal(result.totals.net, 280);
  assert.equal(result.totals.vat, 49.6);
  assert.equal(result.totals.gross, 329.6);
  assert.equal(result.items[0].gross, 219.6);
});

test("il motore prezzi normalizza valori negativi e stringhe numeriche", () => {
  const result = calculateQuote([{ service: "Test", quantity: "2", discountedPrice: "25.50", unitPrice: -10, vatRate: "22" }]);
  assert.equal(result.items[0].unitPrice, 0);
  assert.equal(result.items[0].net, 51);
  assert.equal(result.items[0].gross, 62.22);
});

test("i template specifici esistenti restano nativi e multipagina", () => {
  const pages = buildDefaultQuotePages("Social Media Management");
  assert.equal(pages.length, 3);
  const text = pages.flatMap((page) => page.blocks).map((block) => block.text || "").join(" ");
  for (const variable of ["{{azienda}}", "{{numero_preventivo}}", "{{servizi}}", "{{prezzo_totale}}", "{{condizioni_pagamento}}"])
    assert.match(text, new RegExp(variable.replace(/[{}]/g, "\\$&")));
  assert.ok(pages.flatMap((page) => page.blocks).some((block) => block.background === "#ffd800"));
});

test("il preventivo generale Hoon usa le 36 pagine SVG importate dal PDF reale", () => {
  const pages = buildDefaultQuotePages();
  assert.equal(pages.length, 36);
  assert.equal(pages[0].name, "Copertina");
  assert.equal(pages.at(-1).name, "Assistenza - orari");
  assert.equal(new Set(pages.map((page) => page.id)).size, pages.length);
  assert.ok(pages.every((page) => !page.backgroundImage));
  assert.ok(pages.every((page, index) => page.svgAsset === `/commerciale/hoon-template-svg/page-${String(index + 1).padStart(2, "0")}.svg`));
  assert.ok(pages.every((page) => page.svgEdits && Object.keys(page.svgEdits).length === 0));
  assert.ok(pages.every((page) => page.fabricJson === null));
  assert.ok(pages.every((page) => page.blocks.length === 0));
  assert.deepEqual(pages.filter((page) => page.includedByDefault).map((page) => page.sourcePage), [1, 2, 35, 36]);
  assert.ok(HOON_QUOTE_SERVICE_CATALOG.length >= 20);
});

test("il vecchio master senza versione viene aggiornato", () => {
  assert.equal(shouldUpgradeHoonQuoteTemplate(undefined), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(null), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(1), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(2), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(3), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(4), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(5), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(6), true);
  assert.equal(shouldUpgradeHoonQuoteTemplate(7), false);
});

test("le vecchie pagine JPG con hotspot vengono convertite senza duplicare il testo", () => {
  const [page] = normalizeQuotePages([{ id: "old", backgroundImage: "/page.jpg", blocks: [{ id: "title", type: "text", text: "Titolo", referenceMode: true, modified: false, sourceX: 1, sourceMaskColor: "#fff" }] }]);
  assert.equal(page.backgroundImage, "");
  assert.equal(page.blocks[0].referenceMode, false);
  assert.equal(page.blocks[0].modified, true);
  assert.equal("sourceX" in page.blocks[0], false);
  assert.equal("sourceMaskColor" in page.blocks[0], false);
});

test("l'editor mostra i valori reali al posto dei segnaposto del template", () => {
  const text = resolveQuoteVariables("{{azienda}} - {{prezzo_totale}}", { organization: { businessName: "Azienda Demo" } }, { totals: { gross: 122 } });
  assert.equal(text, "Azienda Demo - 122,00 €");
});

test("la selezione servizi copia solo pagine comuni e pagine collegate", () => {
  const pages = buildDefaultQuotePages();
  const social = selectQuoteTemplatePages(pages, ["social-media-management"]);
  assert.deepEqual(social.map((page) => page.sourcePage), [1, 2, 3, 4, 5, 6, 7, 35, 36]);
  const website = selectQuoteTemplatePages(pages, ["sito-one-page"]);
  assert.deepEqual(website.map((page) => page.sourcePage), [1, 2, 23, 25, 35, 36]);
});

test("sono predisposti i template iniziali richiesti", () => {
  assert.equal(DEFAULT_QUOTE_TEMPLATES.length, 7);
  assert.equal(DEFAULT_INTERVIEW_TEMPLATES.length, 5);
  assert.ok(DEFAULT_QUOTE_TEMPLATES.includes("Preventivo personalizzato"));
  assert.equal(DEFAULT_QUOTE_TEMPLATES[0], HOON_GENERAL_QUOTE_TEMPLATE);
  assert.ok(DEFAULT_INTERVIEW_TEMPLATES.includes("Sito internet"));
});

test("i token pubblici sono casuali e nel database resta solo l'hash", () => {
  const first = createPublicToken();
  const second = createPublicToken();
  assert.notEqual(first.token, second.token);
  assert.equal(first.hash, hashPublicToken(first.token));
  assert.equal(first.hash.length, 64);
  assert.doesNotMatch(first.hash, new RegExp(first.token));
});

test("email e telefono vengono normalizzati per il controllo duplicati", () => {
  assert.equal(normalizeEmail("  INFO@ESEMPIO.IT "), "info@esempio.it");
  assert.equal(normalizePhone("+39 333-12 34 567"), "+393331234567");
});

