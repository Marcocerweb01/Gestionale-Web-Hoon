#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const jiti = require("jiti")(path.join(process.cwd(), "scripts", "generate-v3-schema-reference.cjs"), {
  interopDefault: true,
  alias: { "@": process.cwd() },
});

const root = process.cwd();
const modelDir = path.join(root, "models", "v3");
const outputPath = path.join(root, "SCHEMA_DATI_V3_CANONICO.md");
const legacyOutputPath = path.join(root, "SCHEMA_DATI_LEGACY_COMPLETO.md");

for (const file of fs.readdirSync(path.join(root, "models")).sort()) {
  if (!file.endsWith(".js")) continue;
  jiti(path.join(root, "models", file));
}

for (const file of fs.readdirSync(modelDir).sort()) {
  if (!file.endsWith(".js") || ["constants.js", "index.js"].includes(file)) continue;
  jiti(path.join(modelDir, file));
}

const descriptions = {
  AgenziaV3: "Tenant principale e configurazione dell'agenzia.",
  UserV3: "Identità autenticabile per amministrazione, collaboratori e utenti cliente.",
  AziendaV3: "Cliente/azienda gestita dall'agenzia.",
  CollaboratoreProfileV3: "Dati professionali ed economici del collaboratore.",
  CollaborazioneV3: "Contenitore contrattuale e operativo di una collaborazione.",
  CollaborazioneAssegnazioneV3: "Relazione storicizzata tra collaborazione e collaboratore.",
  LeadCommercialeV3: "Pipeline commerciale senza perdita della timeline legacy.",
  CatalogoServizioV3: "Catalogo dei servizi vendibili dall'agenzia.",
  NotebookNoteV3: "Nota storicizzata collegata ad azienda e, opzionalmente, collaborazione.",
  CalendarioOperativoV3: "Calendario e task operativi di una collaborazione.",
  SmmServiceV3: "Configurazione e contatori del servizio social media.",
  WebDesignServiceV3: "Workflow completo del progetto web design.",
  SeoServiceV3: "Audit, keyword, pagine, task e report SEO.",
  GoogleAdsServiceV3: "Stato operativo e campagne Google Ads.",
  MetaAdsServiceV3: "Stato operativo, campagne e creatività Meta Ads.",
  ChatThreadV3: "Conversazione cliente/team o interna.",
  ChatMessageV3: "Messaggio appartenente a un thread.",
  TicketV3: "Richiesta di assistenza collegata a un thread.",
  FileAssetV3: "Metadati dei file archiviati fuori da MongoDB.",
  CredentialVaultItemV3: "Credenziale cifrata, esclusa dalle query ordinarie.",
  DominioV3: "Dominio, scadenza, alert e collegamenti operativi.",
  ValutazioneCollaboratoreV3: "Valutazione periodica del collaboratore.",
  ResetLogV3: "Registro immutabile dei reset e relativi snapshot.",
  KnowledgeItemV3: "FAQ, dispense e contenuti operativi unificati.",
  AuditLogV3: "Audit trail delle modifiche applicative.",
  NotificaV3: "Notifica in-app indirizzata a un utente o broadcast di agenzia.",
  NotificationDeliveryV3: "Tentativo di consegna multicanale deduplicato.",
  PagamentoV3: "Movimento economico di entrata o uscita.",
  FatturaCollaboratoreV3: "Fattura mensile emessa da un collaboratore.",
  EventoV3: "Evento o shooting con obiettivi e gestione economica.",
  DisponibilitaEventoV3: "Disponibilità del collaboratore per ciascuna giornata evento.",
  AssegnazioneEventoV3: "Assegnazione effettiva del collaboratore a una giornata evento.",
};

function escapeCell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", " ");
}

function getRequired(schemaType) {
  const required = schemaType.options?.required;
  if (typeof required === "function") return "condizionale";
  return required ? "sì" : "no";
}

function getDefault(schemaType) {
  if (!("default" in (schemaType.options || {}))) return "—";
  const value = schemaType.options.default;
  if (value === undefined) return "—";
  if (typeof value === "function") {
    if (value === Date.now) return "Date.now";
    return "funzione";
  }
  if (value === null) return "null";
  if (typeof value === "string") return value === "" ? '""' : `\`${value}\``;
  return `\`${JSON.stringify(value)}\``;
}

function getType(schemaType) {
  if (schemaType.$isMongooseDocumentArray) return "Array<Subdocument>";
  if (schemaType.$isSingleNested) return "Subdocument";
  if (schemaType.instance === "Array") {
    const caster = schemaType.caster || schemaType.$embeddedSchemaType;
    return `Array<${caster?.instance || "Mixed"}>`;
  }
  return schemaType.instance || schemaType.constructor?.name || "Mixed";
}

function getEnumAndConstraints(schemaType) {
  const caster = schemaType.instance === "Array" ? (schemaType.caster || schemaType.$embeddedSchemaType) : schemaType;
  const enumValues = caster?.enumValues?.length ? caster.enumValues : caster?.options?.enum;
  const values = [];
  if (Array.isArray(enumValues) && enumValues.length) values.push(`enum: ${enumValues.map((v) => JSON.stringify(v)).join(", ")}`);
  const min = schemaType.options?.min;
  const max = schemaType.options?.max;
  if (min !== undefined) values.push(`min: ${min}`);
  if (max !== undefined) values.push(`max: ${max}`);
  if (schemaType.options?.trim) values.push("trim");
  if (schemaType.options?.lowercase) values.push("lowercase");
  if (schemaType.options?.select === false) values.push("select: false");
  return values.join("; ") || "—";
}

function getRef(schemaType) {
  const caster = schemaType.instance === "Array" ? (schemaType.caster || schemaType.$embeddedSchemaType) : schemaType;
  return caster?.options?.ref || schemaType.options?.ref || "—";
}

function fieldsFromSchema(schema, prefix = "") {
  const rows = [];
  for (const [name, schemaType] of Object.entries(schema.paths)) {
    if (["_id", "__v", "createdAt", "updatedAt"].includes(name)) continue;
    const field = prefix ? `${prefix}.${name}` : name;
    rows.push({
      field,
      type: getType(schemaType),
      required: getRequired(schemaType),
      defaultValue: getDefault(schemaType),
      constraints: getEnumAndConstraints(schemaType),
      ref: getRef(schemaType),
    });
    if (schemaType.$isMongooseDocumentArray || schemaType.$isSingleNested) {
      const childPrefix = schemaType.$isMongooseDocumentArray ? `${field}[]` : field;
      rows.push(...fieldsFromSchema(schemaType.schema, childPrefix));
    }
  }
  return rows;
}

function formatIndexes(schema) {
  const indexes = schema.indexes();
  if (!indexes.length) return "- Solo indice MongoDB predefinito su `_id`.";
  return indexes.map(([keys, options]) => `- \`${JSON.stringify(keys)}\`${Object.keys(options).length ? ` — \`${JSON.stringify(options)}\`` : ""}`).join("\n");
}

const models = mongoose.modelNames()
  .filter((name) => name.endsWith("V3"))
  .map((name) => mongoose.model(name))
  .sort((a, b) => a.modelName.localeCompare(b.modelName));

const header = `# Schema dati V3 canonico\n\n` +
`Generato dai modelli Mongoose in \`models/v3\` il 2026-10-19. È il contratto tecnico per la migrazione da \`Webarea\`: tipi, obbligatorietà, default, enum, riferimenti e indici derivano direttamente dal codice.\n\n` +
`## Convenzioni\n\n` +
`- Ogni documento ha \`_id: ObjectId\`; salvo \`AuditLogV3\`, i modelli hanno \`createdAt: Date\` e \`updatedAt: Date\`.\n` +
`- \`agenziaId\` è la chiave tenant e deve essere sempre inclusa nei filtri applicativi e negli indici univoci multi-tenant.\n` +
`- Gli importi sono in EUR. \`Decimal128\` è usato per gli eventi; i modelli economici generali usano \`Number\` e richiedono arrotondamento applicativo a due decimali.\n` +
`- I riferimenti Mongoose non sono foreign key MongoDB: l'integrità referenziale va validata nell'applicazione e nel verificatore post-migrazione.\n` +
`- I segreti con \`select: false\` non vengono restituiti dalle query normali e devono restare cifrati/hashati.\n\n` +
`## Correzioni strutturali già recepite\n\n` +
`- Aggiunto il legame molti-a-molti \`UserV3.aziendaIds\` per gli utenti cliente: lo stesso account può accedere a più aziende senza fondere i record.\n` +
`- Aggiunto \`agenziaId\` alle assegnazioni e ai messaggi; gli indici univoci ora rispettano il tenant.\n` +
`- Rimossa la relazione inesistente \`CollaborazioneV3.notebookId -> NotebookV3\`: le note puntano direttamente alla collaborazione.\n` +
`- Bloccate le assegnazioni attive duplicate con indice univoco parziale.\n` +
`- Corrette le fatture: \`mese\` numerico, \`anno\` obbligatorio e unicità per tenant/collaboratore/anno/mese.\n` +
`- Aggiunte entità mancanti per lead commerciali ed eventi.\n` +
`- Estesi SMM e Web Design affinché la migrazione non perda contatori, workflow, controlli, appuntamenti, approvazioni e pubblicazione.\n` +
`- Password, credenziali e note cifrate sono escluse dalle query ordinarie.\n\n` +
`## Relazioni cardinali principali\n\n` +
`- \`AgenziaV3 1—N UserV3/AziendaV3/CollaborazioneV3\`.\n` +
`- \`AziendaV3 1—N CollaborazioneV3/LeadCommercialeV3/EventoV3/PagamentoV3\`.\n` +
`- \`CollaborazioneV3 1—N CollaborazioneAssegnazioneV3/NotebookNoteV3\`; al massimo un documento per ciascun servizio specifico.\n` +
`- \`CollaborazioneV3 1—1 CalendarioOperativoV3\`.\n` +
`- \`ChatThreadV3 1—N ChatMessageV3\`; \`TicketV3 N—0..1 ChatThreadV3\`.\n` +
`- \`EventoV3 1—N DisponibilitaEventoV3/AssegnazioneEventoV3\`.\n\n` +
`## Entità (${models.length})\n\n`;

let body = "";
for (const model of models) {
  body += `### ${model.modelName}\n\n`;
  body += `${descriptions[model.modelName] || "Modello applicativo V3."}\n\n`;
  body += `Collezione: \`${model.collection.name}\`.\n\n`;
  body += `| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |\n`;
  body += `| --- | --- | --- | --- | --- | --- |\n`;
  for (const row of fieldsFromSchema(model.schema)) {
    body += `| \`${escapeCell(row.field)}\` | ${escapeCell(row.type)} | ${row.required} | ${escapeCell(row.defaultValue)} | ${escapeCell(row.constraints)} | ${escapeCell(row.ref)} |\n`;
  }
  body += `\nIndici:\n\n${formatIndexes(model.schema)}\n\n`;
}

fs.writeFileSync(outputPath, header + body, "utf8");

const legacyModels = mongoose.modelNames()
  .filter((name) => !name.endsWith("V3"))
  .map((name) => mongoose.model(name))
  .sort((a, b) => a.modelName.localeCompare(b.modelName));

let legacyBody = `# Schema dati legacy completo\n\n` +
  `Generato dai modelli Mongoose in \`models/*.js\` il 2026-10-19. Descrive il contratto del codice sorgente, non un validator MongoDB: l'audit live ha confermato che le collezioni non hanno validator server-side e alcuni documenti storici divergono dai modelli.\n\n` +
  `Ogni documento ha \`_id: ObjectId\`; i timestamp sono elencati solo quando definiti manualmente, mentre l'opzione Mongoose \`timestamps\` aggiunge automaticamente \`createdAt\` e \`updatedAt\`.\n\n` +
  `## Entità (${legacyModels.length})\n\n`;

for (const model of legacyModels) {
  legacyBody += `### ${model.modelName}\n\n`;
  legacyBody += `Collezione: \`${model.collection.name}\`.\n\n`;
  legacyBody += `| Campo | Tipo | Obbligatorio | Default | Enum / vincoli | Ref |\n`;
  legacyBody += `| --- | --- | --- | --- | --- | --- |\n`;
  for (const row of fieldsFromSchema(model.schema)) {
    legacyBody += `| \`${escapeCell(row.field)}\` | ${escapeCell(row.type)} | ${row.required} | ${escapeCell(row.defaultValue)} | ${escapeCell(row.constraints)} | ${escapeCell(row.ref)} |\n`;
  }
  legacyBody += `\nIndici:\n\n${formatIndexes(model.schema)}\n\n`;
}

fs.writeFileSync(legacyOutputPath, legacyBody, "utf8");
console.log(`Generati ${path.relative(root, outputPath)} (${models.length} entità) e ${path.relative(root, legacyOutputPath)} (${legacyModels.length} entità).`);
