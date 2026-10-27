import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_ADMIN_EMAIL,
  PIPELINE_STATES,
  DEFAULT_INTERVIEW_TEMPLATES,
  DEFAULT_QUOTE_TEMPLATES,
  HOON_GENERAL_QUOTE_TEMPLATE,
  buildDefaultQuotePages,
  calculateQuote,
  createPublicToken,
  hashPublicToken,
  normalizeEmail,
  normalizePhone,
} from "../lib/commerciale/core.js";

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

test("il preventivo generale Hoon ricostruisce le 36 pagine Canva come elementi editabili", () => {
  const pages = buildDefaultQuotePages();
  assert.equal(pages.length, 36);
  assert.equal(pages[0].name, "Copertina");
  assert.equal(pages.at(-1).name, "ASSISTENZA");
  assert.equal(new Set(pages.map((page) => page.id)).size, pages.length);
  assert.ok(pages.every((page) => page.blocks.length > 0));
  assert.ok(pages.flatMap((page) => page.blocks).every((block) => ["text", "shape", "image"].includes(block.type)));
  assert.ok(pages.flatMap((page) => page.blocks).some((block) => block.shapeType === "ellipse"));
  assert.ok(pages.flatMap((page) => page.blocks).some((block) => block.borderWidth > 0));
  const text = pages.flatMap((page) => page.blocks).map((block) => block.text || "").join(" ");
  assert.match(text, /{{azienda}}/);
  assert.match(text, /{{numero_preventivo}}/);
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

