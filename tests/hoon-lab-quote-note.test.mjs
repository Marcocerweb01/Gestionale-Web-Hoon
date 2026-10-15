import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_QUOTE_NOTE,
  LEGACY_DEFAULT_QUOTE_NOTES,
  renderQuoteNote
} from "../lib/hoon-lab/quote-note.mjs";

test("la nota calcola l'acconto sul totale IVA inclusa", () => {
  const note = renderQuoteNote(DEFAULT_QUOTE_NOTE, 1220);

  assert.match(note, /50% sul totale IVA inclusa/);
  assert.match(note, /pari a 610,00\s€/);
  assert.doesNotMatch(note, /imponibile|IVA esclusa/i);
});

test("la metà del totale viene arrotondata ai centesimi", () => {
  assert.match(renderQuoteNote(DEFAULT_QUOTE_NOTE, 100.01), /50,01\s€/);
});

test("le precedenti note predefinite vengono aggiornate automaticamente", () => {
  for (const legacyNote of LEGACY_DEFAULT_QUOTE_NOTES) {
    const note = renderQuoteNote(legacyNote, 244);
    assert.match(note, /pari a 122,00\s€/);
    assert.doesNotMatch(note, /imponibile|IVA esclusa/i);
  }
});

test("una nota personalizzata resta invariata", () => {
  assert.equal(renderQuoteNote("Condizioni concordate con il cliente", 100), "Condizioni concordate con il cliente");
});
