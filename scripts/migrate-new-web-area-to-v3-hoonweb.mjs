#!/usr/bin/env node

import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const args = new Set(process.argv.slice(2));
const apply = args.has("--apply");
const verbose = args.has("--verbose");

const getArgValue = (name, fallback = "") => {
  const prefix = `${name}=`;
  const item = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return item ? item.slice(prefix.length) : fallback;
};

const scope = getArgValue("--scope", "hoonweb-v3");
const agencyName = getArgValue("--agency-name", "Hoonweb");
const agencyEmail = getArgValue("--agency-email", "admin@hoonweb.it").toLowerCase();
const dbName = getArgValue("--db", process.env.MONGODB_DB || "Webarea");

const MONGODB_URI = process.env.MONGODB_URI;
const memoryMaps = new Map();
const memoryDocs = new Map();
const existingMapCache = new Map();
const naturalCache = {
  usersByEmail: new Map(),
  usersByDisplayName: new Map(),
  companiesByPiva: new Map(),
  companiesByName: new Map(),
  domainsByUrl: new Map(),
  collaborationsByLegacyRef: new Map(),
};

if (!MONGODB_URI) {
  console.error("MONGODB_URI non trovato. Imposta .env.local o .env prima di eseguire lo script.");
  process.exit(1);
}

const now = () => new Date();
const oid = (value) => (value ? new mongoose.Types.ObjectId(String(value)) : null);
const clean = (value) => String(value || "").trim();
const lower = (value) => clean(value).toLowerCase();
const nonEmpty = (value) => clean(value).length > 0;
const cloneDate = (value) => (value ? new Date(value) : null);
const mapKey = (legacyCollection, legacyId) => `${scope}:${legacyCollection}:${String(legacyId)}`;
const docKey = (collection, id) => `${collection}:${String(id)}`;
const userEmailKey = (agenziaId, email) => `${String(agenziaId)}:${lower(email)}`;
const displayNameKey = (agenziaId, displayName) => `${String(agenziaId)}:${lower(displayName)}`;
const companyPivaKey = (agenziaId, piva) => `${String(agenziaId)}:${lower(piva)}`;
const companyNameKey = (agenziaId, name) => `${String(agenziaId)}:${lower(name)}`;
const domainUrlKey = (agenziaId, url) => `${String(agenziaId)}:${lower(url)}`;
const legacyRefKey = (model, id) => `${model}:${String(id)}`;

const collections = {
  legacyCompanies: "aziendas",
  legacyCollaborators: "collaboratores",
  legacyAdmins: "amministratores",
  legacySmmCollaborations: "collaboraziones",
  legacyWebDesignV2: "collaborazionewebdesignv2",
  legacyGoogleAds: "googleads",
  legacyNotes: "notas",
  legacyCommNotes: "notacomms",
  legacyDomains: "dominios",
  legacyLeads: "leadcommerciales",
  legacyPayments: "pagamentis",
  legacyInvoices: "fatturaziones",
  legacyBoysConfig: "configurazioneragazzis",
  legacyServices: "servizios",
  legacyNotifications: "notificas",
  legacyNotificationDeliveries: "notificationdeliveries",
  legacyEvents: "eventos",
  legacyEventAvailability: "disponibilitaeventos",
  legacyEventAssignments: "assegnazioneeventos",

  agencies: "agenziav3",
  users: "userv3",
  companies: "aziendav3",
  collaboratorProfiles: "collaboratoreprofilev3",
  collaborations: "collaborazionev3",
  assignments: "collaborazioneassegnazionev3",
  smmServices: "smmservicev3",
  webDesignServices: "webdesignservicev3",
  googleAdsServices: "googleadsservicev3",
  notebookNotes: "notebooknotev3",
  domains: "dominiov3",
  commercialLeads: "leadcommercialev3",
  payments: "pagamentov3",
  collaboratorInvoices: "fatturacollaboratorev3",
  serviceCatalog: "catalogoserviziov3",
  notifications: "notificav3",
  notificationDeliveries: "notificationdeliveryv3",
  events: "eventov3",
  eventAvailability: "disponibilitaeventov3",
  eventAssignments: "assegnazioneeventov3",
  migrationMaps: "migrationmaps",
};

const rolePermissions = {
  agenzia: [
    "agency.manage",
    "users.manage",
    "admins.delete",
    "companies.manage",
    "collaborations.manage",
    "collaborations.assign",
    "collaborations.export",
    "collaborations.reset_monthly",
    "collaborations.reset_quarterly",
    "evaluations.manage",
    "payments.manage",
    "invoices.manage",
    "domains.manage",
    "credentials.view",
    "credentials.manage",
    "tickets.manage",
    "chat.use",
    "knowledge.manage",
    "operations.use",
    "notifications.manage",
  ],
  amministrazione: [
    "users.manage",
    "admins.delete",
    "companies.manage",
    "collaborations.manage",
    "collaborations.assign",
    "collaborations.export",
    "collaborations.reset_monthly",
    "collaborations.reset_quarterly",
    "evaluations.manage",
    "payments.manage",
    "invoices.manage",
    "domains.manage",
    "credentials.view",
    "credentials.manage",
    "tickets.manage",
    "chat.use",
    "knowledge.manage",
    "operations.use",
    "notifications.manage",
  ],
  segretaria: [
    "companies.manage",
    "collaborations.manage",
    "collaborations.assign",
    "collaborations.export",
    "invoices.manage",
    "domains.manage",
    "tickets.manage",
    "chat.use",
    "knowledge.manage",
    "operations.use",
    "notifications.manage",
  ],
  collaboratore: ["chat.use", "tickets.manage", "operations.use"],
  azienda: ["chat.use", "tickets.manage"],
};

const stats = {};
const skipReasons = {};

function stat(name, field, amount = 1) {
  stats[name] ||= { legacy: 0, created: 0, reused: 0, skipped: 0, warnings: 0 };
  stats[name][field] += amount;
}

function skip(name, reason) {
  stat(name, "skipped");
  skipReasons[name] ||= {};
  skipReasons[name][reason] = (skipReasons[name][reason] || 0) + 1;
}

function normalizeSubRole(role) {
  const value = lower(role).replaceAll("_", " ");
  const map = {
    commerciale: "commerciale",
    smm: "smm",
    "web designer": "web_designer",
    webdesigner: "web_designer",
    seo: "seo",
    "google ads": "google_ads",
    googleads: "google_ads",
    "meta ads": "meta_ads",
    metaads: "meta_ads",
  };
  return map[value] || "";
}

function normalizeSubRoles(roles = []) {
  return [...new Set(roles.map(normalizeSubRole).filter(Boolean))];
}

function mapStatusToUser(status) {
  return status === "non_attivo" ? "disattivato" : "attivo";
}

function mapCollaborationStatus(status) {
  const value = lower(status);
  if (value === "terminata") return "terminata";
  if (value === "in sospeso" || value === "in pausa") return "in pausa";
  if (value === "archiviata") return "archiviata";
  return "attiva";
}

function mapAssignmentStatus(status) {
  const value = mapCollaborationStatus(status);
  if (value === "terminata") return "terminata";
  if (value === "in pausa") return "sospesa";
  return "attiva";
}

function mapServiceStatus(status) {
  const value = mapCollaborationStatus(status);
  if (value === "terminata") return "terminato";
  if (value === "in pausa") return "in pausa";
  if (value === "bozza") return "bozza";
  return "attivo";
}

function mapCompanyStatus(status) {
  return status === "non_attivo" ? "ex_cliente" : "attivo";
}

function mapGoogleAdsStatus(item) {
  if (item.campagnaTerminata) return "terminata";
  if (item.campagnaAvviata) return "attiva";
  if (item.contattato) return "setup";
  return "da_contattare";
}

function mapWebDesignProjectType(value) {
  const normalized = lower(value);
  if (normalized === "e-commerce") return "e-commerce";
  if (normalized === "sito starter" || normalized === "starter") return "starter";
  if (normalized === "vetrina" || normalized === "sito vetrina") return "vetrina";
  return "custom";
}

function splitName(fullName) {
  const parts = clean(fullName).split(/\s+/).filter(Boolean);
  return {
    nome: parts[0] || "Senza nome",
    cognome: parts.slice(1).join(" "),
  };
}

function parseAddress(address = "") {
  return {
    via: clean(address),
    citta: "",
    provincia: "",
    cap: "",
    nazione: "Italia",
  };
}

function makeProgress(done, total) {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

async function createIndexes(db) {
  if (!apply) return;
  await db.collection(collections.migrationMaps).createIndex(
    { scope: 1, legacyCollection: 1, legacyId: 1 },
    { unique: true }
  );
  await db.collection(collections.migrationMaps).createIndex(
    { scope: 1, v3Collection: 1, v3Id: 1 }
  );
}

async function preloadMigrationMaps(db) {
  const rows = await db.collection(collections.migrationMaps).find({ scope }).toArray();
  for (const row of rows) {
    existingMapCache.set(mapKey(row.legacyCollection, row.legacyId), row);
  }
}

async function preloadNaturalCaches(db, agenziaId) {
  const [users, companies, domains, collaborations] = await Promise.all([
    db.collection(collections.users).find({ agenziaId }).project({
      email: 1,
      displayName: 1,
      nome: 1,
      cognome: 1,
    }).toArray(),
    db.collection(collections.companies).find({ agenziaId }).project({
      ragioneSociale: 1,
      partitaIva: 1,
    }).toArray(),
    db.collection(collections.domains).find({ agenziaId }).project({ urlDominio: 1 }).toArray(),
    db.collection(collections.collaborations).find({ agenziaId }).project({ legacyRef: 1 }).toArray(),
  ]);

  for (const user of users) cacheUser(agenziaId, user);
  for (const company of companies) cacheCompany(agenziaId, company);
  for (const domain of domains) cacheDomain(agenziaId, domain);
  for (const collaboration of collaborations) {
    if (collaboration.legacyRef?.model && collaboration.legacyRef?.id) {
      naturalCache.collaborationsByLegacyRef.set(
        legacyRefKey(collaboration.legacyRef.model, collaboration.legacyRef.id),
        collaboration
      );
    }
  }
}

function cacheUser(agenziaId, user) {
  if (!user) return;
  if (user.email) naturalCache.usersByEmail.set(userEmailKey(agenziaId, user.email), user);
  if (user.displayName) naturalCache.usersByDisplayName.set(displayNameKey(agenziaId, user.displayName), user);
  const fullName = clean(`${clean(user.nome)} ${clean(user.cognome)}`);
  if (fullName) naturalCache.usersByDisplayName.set(displayNameKey(agenziaId, fullName), user);
}

function cacheCompany(agenziaId, company) {
  if (!company) return;
  if (company.partitaIva) naturalCache.companiesByPiva.set(companyPivaKey(agenziaId, company.partitaIva), company);
  if (company.ragioneSociale) naturalCache.companiesByName.set(companyNameKey(agenziaId, company.ragioneSociale), company);
}

function cacheDomain(agenziaId, domain) {
  if (!domain?.urlDominio) return;
  naturalCache.domainsByUrl.set(domainUrlKey(agenziaId, domain.urlDominio), domain);
}

async function getMap(db, legacyCollection, legacyId) {
  if (!legacyId) return null;
  const key = mapKey(legacyCollection, legacyId);
  if (memoryMaps.has(key)) return memoryMaps.get(key);
  return existingMapCache.get(key) || null;
}

async function saveMap(db, legacyCollection, legacyId, v3Collection, v3Id, meta = {}) {
  if (!legacyId || !v3Id) return;
  const memoryDoc = {
    scope,
    legacyCollection,
    legacyId: oid(legacyId),
    v3Collection,
    v3Id: oid(v3Id),
    meta,
    updatedAt: now(),
  };
  memoryMaps.set(mapKey(legacyCollection, legacyId), memoryDoc);
  existingMapCache.set(mapKey(legacyCollection, legacyId), memoryDoc);
  if (!apply) return;
  await db.collection(collections.migrationMaps).updateOne(
    { scope, legacyCollection, legacyId: oid(legacyId) },
    {
      $set: {
        scope,
        legacyCollection,
        legacyId: oid(legacyId),
        v3Collection,
        v3Id: oid(v3Id),
        meta,
        updatedAt: now(),
      },
      $setOnInsert: { createdAt: now() },
    },
    { upsert: true }
  );
}

async function resolveMappedId(db, legacyCollection, legacyId) {
  const map = await getMap(db, legacyCollection, legacyId);
  return map?.v3Id || null;
}

async function insertOne(db, collection, doc) {
  if (doc?._id) memoryDocs.set(docKey(collection, doc._id), doc);
  if (!apply) return { insertedId: new mongoose.Types.ObjectId() };
  return db.collection(collection).insertOne(doc);
}

async function updateOne(db, collection, filter, update, options = {}) {
  if (!apply) return { matchedCount: 0, modifiedCount: 0, upsertedId: null };
  return db.collection(collection).updateOne(filter, update, options);
}

async function findById(db, collection, id) {
  if (!id) return null;
  const cached = memoryDocs.get(docKey(collection, id));
  if (cached) return cached;
  return db.collection(collection).findOne({ _id: oid(id) });
}

async function ensureAgency(db) {
  const existing = await db.collection(collections.agencies).findOne({
    $or: [{ email: agencyEmail }, { nome: agencyName }],
  });

  if (existing) {
    stat("agency", "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    nome: agencyName,
    ragioneSociale: agencyName,
    partitaIva: "",
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    email: agencyEmail,
    telefono: "",
    sitoWeb: "",
    indirizzo: { via: "", citta: "", provincia: "", cap: "", nazione: "Italia" },
    logoUrl: "",
    impostazioni: {
      timezone: "Europe/Rome",
      valuta: "EUR",
      resetMensileAbilitato: true,
      resetTrimestraleAbilitato: true,
      soglieNotificheDomini: [30, 20, 10, 5, 3, 2, 1],
    },
    billing: { iban: "", banca: "", intestatario: "" },
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  };

  await insertOne(db, collections.agencies, doc);
  stat("agency", "created");
  return doc;
}

async function ensureMigrationUser(db, agenziaId) {
  const email = "migration+hoonweb@local.invalid";
  const existing = await db.collection(collections.users).findOne({ agenziaId, email });
  if (existing) return existing;

  const admin = await db.collection(collections.users).findOne({
    agenziaId,
    tipo: { $in: ["agenzia", "amministrazione", "segretaria"] },
  });
  if (admin) return admin;

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId,
    aziendaIds: [],
    tipo: "amministrazione",
    nome: "Migrazione",
    cognome: "Hoonweb",
    displayName: "Migrazione Hoonweb",
    email,
    telefono: "",
    passwordHash: "migration-disabled",
    avatarUrl: "",
    stato: "disattivato",
    subRoles: [],
    permissions: rolePermissions.amministrazione,
    ultimoAccessoAt: null,
    preferenze: {
      sidebarCollapsed: false,
      dashboardDefaultView: "dashboard",
      notificheEmail: false,
      notificheInApp: false,
    },
    sicurezza: {
      mustChangePassword: true,
      passwordUpdatedAt: null,
      twoFactorEnabled: false,
    },
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  };

  await insertOne(db, collections.users, doc);
  stat("migrationUser", "created");
  return doc;
}

async function ensureUserFromLegacy(db, legacyCollection, item, agenziaId, type, options = {}) {
  stat(options.statName || "users", "legacy");

  const existingMap = await getMap(db, legacyCollection, item._id);
  if (existingMap) {
    stat(options.statName || "users", "reused");
    return { _id: existingMap.v3Id, reused: true };
  }

  const email = lower(item.email);
  if (!email) {
    skip(options.statName || "users", "email_mancante");
    stat(options.statName || "users", "warnings");
    console.warn(`Skip user ${legacyCollection}/${item._id}: email mancante`);
    return null;
  }

  const cachedUser = naturalCache.usersByEmail.get(userEmailKey(agenziaId, email));
  if (cachedUser) {
    await saveMap(db, legacyCollection, item._id, collections.users, cachedUser._id, { naturalKey: "email" });
    stat(options.statName || "users", "reused");
    return cachedUser;
  }

  const natural = await db.collection(collections.users).findOne({ agenziaId, email });
  if (natural) {
    cacheUser(agenziaId, natural);
    await saveMap(db, legacyCollection, item._id, collections.users, natural._id, { naturalKey: "email" });
    stat(options.statName || "users", "reused");
    return natural;
  }

  const subRoles = normalizeSubRoles(item.subRoles || []);
  const displayName = clean(`${clean(item.nome)} ${clean(item.cognome)}`) || clean(item.ragioneSociale) || email;
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId,
    aziendaIds: options.aziendaId ? [oid(options.aziendaId)] : [],
    tipo: type,
    nome: clean(item.nome) || clean(item.ragioneSociale) || splitName(displayName).nome,
    cognome: clean(item.cognome),
    displayName,
    email,
    telefono: clean(item.telefono || item.numero || ""),
    passwordHash: clean(item.password) || "legacy-password-missing",
    avatarUrl: "",
    stato: mapStatusToUser(item.status),
    subRoles: type === "collaboratore" ? subRoles : [],
    permissions: rolePermissions[type] || [],
    ultimoAccessoAt: null,
    preferenze: {
      sidebarCollapsed: false,
      dashboardDefaultView: "dashboard",
      notificheEmail: true,
      notificheInApp: true,
    },
    sicurezza: {
      mustChangePassword: !item.password,
      passwordUpdatedAt: null,
      twoFactorEnabled: false,
    },
    createdBy: null,
    updatedBy: null,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };

  await insertOne(db, collections.users, doc);
  cacheUser(agenziaId, doc);
  await saveMap(db, legacyCollection, item._id, collections.users, doc._id, { type });
  stat(options.statName || "users", "created");
  return doc;
}

async function migrateAdmins(db, agenziaId) {
  const rows = await db.collection(collections.legacyAdmins).find({}).toArray();
  for (const item of rows) {
    const type = item.ruolo === "segretaria" ? "segretaria" : "amministrazione";
    await ensureUserFromLegacy(db, collections.legacyAdmins, item, agenziaId, type, { statName: "admins" });
  }
}

async function migrateCollaborators(db, agenziaId) {
  const rows = await db.collection(collections.legacyCollaborators).find({}).toArray();
  for (const item of rows) {
    const user = await ensureUserFromLegacy(db, collections.legacyCollaborators, item, agenziaId, "collaboratore", {
      statName: "collaborators",
    });
    if (!user?._id) continue;

    const existingProfile = await db.collection(collections.collaboratorProfiles).findOne({ userId: oid(user._id) });
    if (existingProfile) {
      stat("collaboratorProfiles", "reused");
      continue;
    }

    const profile = {
      _id: new mongoose.Types.ObjectId(),
      userId: oid(user._id),
      agenziaId,
      partitaIva: clean(item.partitaIva),
      codiceFiscale: "",
      iban: "",
      intestatarioConto: clean(`${clean(item.nome)} ${clean(item.cognome)}`),
      indirizzo: { via: "", citta: "", provincia: "", cap: "", nazione: "Italia" },
      subRoles: normalizeSubRoles(item.subRoles || []),
      competenze: [],
      seniority: "middle",
      disponibilitaSettimanaleOre: null,
      costoOrario: null,
      percentualeDefault: null,
      percentuale_hoon: item.percentuale_hoon || 50,
      statoOperativo: item.status || "attivo",
      noteAmministratore: clean(item.noteAmministratore),
      metriche: {
        tot_fatturato: item.tot_fatturato || 0,
        guadagno_da_hoon: item.guadagno_da_hoon || 0,
        totale_fatture_terzi: item.totale_fatture_terzi || 0,
      },
      createdBy: null,
      updatedBy: null,
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    };
    await insertOne(db, collections.collaboratorProfiles, profile);
    stat("collaboratorProfiles", "created");
  }
}

async function ensureCompanyFromLegacy(db, legacyCollection, item, agenziaId, options = {}) {
  const statName = options.statName || "companies";
  stat(statName, "legacy");

  const existingMap = await getMap(db, legacyCollection, item._id);
  if (existingMap) {
    stat(statName, "reused");
    return { _id: existingMap.v3Id, reused: true };
  }

  const ragioneSociale = clean(item.ragioneSociale || item.etichetta || item.nome_attivita || item.nomeAzienda);
  if (!ragioneSociale) {
    skip(statName, "ragione_sociale_mancante");
    stat(statName, "warnings");
    console.warn(`Skip company ${legacyCollection}/${item._id}: ragione sociale mancante`);
    return null;
  }

  const piva = clean(item.partitaIva);
  const legacyKey = `${legacyCollection}:${String(item._id)}`;
  const existingByLegacyKey = await db.collection(collections.companies).findOne({
    agenziaId,
    legacyKeys: legacyKey,
  });
  if (existingByLegacyKey) {
    cacheCompany(agenziaId, existingByLegacyKey);
    await saveMap(db, legacyCollection, item._id, collections.companies, existingByLegacyKey._id, {
      naturalKey: "legacyKey",
    });
    stat(statName, "reused");
    return existingByLegacyKey;
  }

  const allowNaturalDeduplication = legacyCollection !== collections.legacyCompanies;
  const naturalFilter = piva
    ? { agenziaId, partitaIva: piva }
    : { agenziaId, ragioneSociale };
  const cachedCompany = piva
    ? naturalCache.companiesByPiva.get(companyPivaKey(agenziaId, piva))
    : naturalCache.companiesByName.get(companyNameKey(agenziaId, ragioneSociale));
  if (allowNaturalDeduplication && cachedCompany) {
    await updateOne(db, collections.companies, { _id: oid(cachedCompany._id) }, { $addToSet: { legacyKeys: legacyKey } });
    await saveMap(db, legacyCollection, item._id, collections.companies, cachedCompany._id, {
      naturalKey: piva ? "partitaIva" : "ragioneSociale",
    });
    stat(statName, "reused");
    return cachedCompany;
  }

  const natural = allowNaturalDeduplication
    ? await db.collection(collections.companies).findOne(naturalFilter)
    : null;
  if (natural) {
    await updateOne(db, collections.companies, { _id: oid(natural._id) }, { $addToSet: { legacyKeys: legacyKey } });
    cacheCompany(agenziaId, natural);
    await saveMap(db, legacyCollection, item._id, collections.companies, natural._id, {
      naturalKey: piva ? "partitaIva" : "ragioneSociale",
    });
    stat(statName, "reused");
    return natural;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId,
    ragioneSociale,
    etichetta: clean(item.etichetta || ragioneSociale),
    partitaIva: piva,
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    email: lower(item.email),
    telefono: clean(item.telefono || item.numero_telefono || item.numeroTelefono || ""),
    sitoWeb: "",
    settore: "",
    descrizioneAttivita: "",
    indirizzoLegale: parseAddress(item.indirizzo),
    indirizzoOperativo: parseAddress(item.indirizzo),
    referenti: [],
    utentiPortale: [],
    statoCliente: options.statoCliente || mapCompanyStatus(item.status),
    origine: options.origine || "altro",
    commercialeOwner: options.commercialeOwner || null,
    tags: options.tags || [],
    noteInterne: clean(options.noteInterne || item.notes || ""),
    privacy: {
      consensoMarketing: false,
      consensoTrattamentoDati: false,
    },
    gestioneEconomica: { incassoDestinatoA: "agenzia" },
    legacyKeys: [legacyKey],
    createdBy: null,
    updatedBy: null,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };

  if (nonEmpty(item.referente)) {
    doc.referenti.push({
      _id: new mongoose.Types.ObjectId(),
      nome: clean(item.referente),
      cognome: "",
      ruolo: "",
      email: lower(item.email),
      telefono: clean(item.numero_telefono || item.numeroTelefono || item.numero || ""),
      principale: true,
    });
  }

  await insertOne(db, collections.companies, doc);
  cacheCompany(agenziaId, doc);
  await saveMap(db, legacyCollection, item._id, collections.companies, doc._id, {
    source: options.source || "legacy-company",
  });
  stat(statName, "created");
  return doc;
}

async function migrateCompanies(db, agenziaId) {
  const rows = await db.collection(collections.legacyCompanies).find({}).toArray();
  for (const item of rows) {
    const company = await ensureCompanyFromLegacy(db, collections.legacyCompanies, item, agenziaId);
    if (!company?._id || !item.email || !item.password) continue;

    const user = await ensureUserFromLegacy(db, `${collections.legacyCompanies}:user`, item, agenziaId, "azienda", {
      statName: "companyUsers",
      aziendaId: company._id,
    });
    if (!user?._id) continue;

    await updateOne(
      db,
      collections.companies,
      { _id: oid(company._id), utentiPortale: { $ne: oid(user._id) } },
      { $push: { utentiPortale: oid(user._id) }, $set: { updatedAt: now() } }
    );
    await updateOne(
      db,
      collections.users,
      { _id: oid(user._id) },
      { $addToSet: { aziendaIds: oid(company._id) }, $set: { updatedAt: now() } }
    );
  }
}

async function ensureStandaloneCompany(db, agenziaId, name) {
  const cached = naturalCache.companiesByName.get(companyNameKey(agenziaId, name));
  if (cached) return cached;
  const existing = await db.collection(collections.companies).findOne({ agenziaId, ragioneSociale: name });
  if (existing) {
    cacheCompany(agenziaId, existing);
    return existing;
  }
  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId,
    ragioneSociale: name,
    etichetta: name,
    partitaIva: "",
    codiceFiscale: "",
    codiceUnivoco: "",
    pec: "",
    email: "",
    telefono: "",
    sitoWeb: "",
    settore: "",
    descrizioneAttivita: "Record tecnico creato per migrare dati legacy non collegati a una azienda.",
    indirizzoLegale: parseAddress(""),
    indirizzoOperativo: parseAddress(""),
    referenti: [],
    utentiPortale: [],
    statoCliente: "attivo",
    origine: "altro",
    commercialeOwner: null,
    tags: ["migration_placeholder"],
    noteInterne: "",
    privacy: {
      consensoMarketing: false,
      consensoTrattamentoDati: false,
    },
    gestioneEconomica: { incassoDestinatoA: "agenzia" },
    legacyKeys: [],
    createdBy: null,
    updatedBy: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await insertOne(db, collections.companies, doc);
  cacheCompany(agenziaId, doc);
  stat("placeholderCompanies", "created");
  return doc;
}

async function createAssignment(db, collaboration, collaboratorId, subRole, sourceStatus) {
  const existing = await db.collection(collections.assignments).findOne({
    collaborazioneId: oid(collaboration._id),
    collaboratoreId: oid(collaboratorId),
    subRole,
  });
  if (existing) {
    stat("assignments", "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId: oid(collaboration.agenziaId),
    collaborazioneId: oid(collaboration._id),
    aziendaId: oid(collaboration.aziendaId),
    collaboratoreId: oid(collaboratorId),
    subRole,
    stato: mapAssignmentStatus(sourceStatus),
    dataInizio: collaboration.dataInizio || now(),
    dataFine: collaboration.dataFine || null,
    percentuale: null,
    cifraFissa: null,
    permessiCollaborazione: permissionsForSubRole(subRole),
    motivoSpostamento: "Migrazione legacy New Web Area -> Gestionale 3.0 Hoonweb",
    assegnatoDa: null,
    createdAt: now(),
    updatedAt: now(),
  };
  await insertOne(db, collections.assignments, doc);
  stat("assignments", "created");
  return doc;
}

function permissionsForSubRole(subRole) {
  if (subRole === "smm") return ["read", "manage_posts", "manage_notes"];
  if (subRole === "web_designer") return ["read", "update_status", "manage_calendar", "manage_notes"];
  if (subRole === "google_ads" || subRole === "meta_ads") return ["read", "manage_ads", "manage_notes"];
  if (subRole === "commerciale") return ["read", "manage_notes"];
  return ["read"];
}

async function ensureCollaboration(db, legacyCollection, item, payload, statName) {
  stat(statName, "legacy");

  const existingMap = await getMap(db, legacyCollection, item._id);
  if (existingMap) {
    stat(statName, "reused");
    return { _id: existingMap.v3Id, reused: true };
  }

  const cached = naturalCache.collaborationsByLegacyRef.get(legacyRefKey(payload.legacyRef.model, item._id));
  if (cached) {
    await saveMap(db, legacyCollection, item._id, collections.collaborations, cached._id, {
      naturalKey: "legacyRef",
    });
    stat(statName, "reused");
    return cached;
  }

  const existing = await db.collection(collections.collaborations).findOne({
    "legacyRef.model": payload.legacyRef.model,
    "legacyRef.id": oid(item._id),
  });
  if (existing) {
    naturalCache.collaborationsByLegacyRef.set(legacyRefKey(payload.legacyRef.model, item._id), existing);
    await saveMap(db, legacyCollection, item._id, collections.collaborations, existing._id, {
      naturalKey: "legacyRef",
    });
    stat(statName, "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    ...payload,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };
  await insertOne(db, collections.collaborations, doc);
  naturalCache.collaborationsByLegacyRef.set(legacyRefKey(payload.legacyRef.model, item._id), doc);
  await saveMap(db, legacyCollection, item._id, collections.collaborations, doc._id, {
    type: payload.tipo,
  });
  stat(statName, "created");
  return doc;
}

async function migrateSmmCollaborations(db, agenziaId) {
  const rows = await db.collection(collections.legacySmmCollaborations).find({}).toArray();
  for (const item of rows) {
    const aziendaId = await resolveMappedId(db, collections.legacyCompanies, item.azienda);
    const collaboratoreId = await resolveMappedId(db, collections.legacyCollaborators, item.collaboratore);
    if (!aziendaId || !collaboratoreId) {
      skip("smmCollaborations", "azienda_o_collaboratore_non_migrati");
      stat("smmCollaborations", "warnings");
      console.warn(`Skip SMM ${item._id}: azienda o collaboratore non migrati`);
      continue;
    }

    const done = (item.post_totali || 0) + (item.appuntamenti_totali || 0);
    const total = (item.post_totali_previsti || 0) + (item.appuntamenti_totali_previsti || 0);
    const collaboration = await ensureCollaboration(
      db,
      collections.legacySmmCollaborations,
      item,
      {
        agenziaId,
        aziendaId: oid(aziendaId),
        titolo: `SMM - ${clean(item.aziendaRagioneSociale)}`,
        tipo: "smm",
        stato: mapCollaborationStatus(item.stato),
        priorita: "media",
        dataInizio: cloneDate(item.dataInizio || item.data_inizio_contratto) || now(),
        dataFine: cloneDate(item.dataFine || item.data_fine_contratto),
        contratto: {
          durata: clean(item.durata_contratto),
          dataInizio: cloneDate(item.data_inizio_contratto),
          dataFine: cloneDate(item.data_fine_contratto),
          rinnovoAutomatico: false,
          valoreMensile: 0,
          valoreTotale: 0,
        },
        team: [{
          _id: new mongoose.Types.ObjectId(),
          collaboratoreId: oid(collaboratoreId),
          subRole: "smm",
          ruoloNelProgetto: "owner",
          percentuale: null,
          cifraFissa: null,
          dataAssegnazione: cloneDate(item.dataInizio) || now(),
          dataFineAssegnazione: null,
          attivo: item.stato !== "terminata",
        }],
        servizi: [{
          _id: new mongoose.Types.ObjectId(),
          tipo: "smm",
          nome: "Social Media Management",
          stato: mapServiceStatus(item.stato),
          budget: null,
          obiettivi: clean(item.note),
        }],
        avanzamento: {
          percentuale: makeProgress(done, total),
          statoSintetico: "",
          ultimoAggiornamentoAt: cloneDate(item.updatedAt),
        },
        calendarioId: null,
        chatId: null,
        legacyRef: { model: "Collaborazione", id: oid(item._id) },
        createdBy: null,
        updatedBy: null,
      },
      "smmCollaborations"
    );

    await createAssignment(db, collaboration, collaboratoreId, "smm", item.stato);
    await ensureSmmService(db, item, agenziaId, aziendaId, collaboration._id);
  }
}

async function ensureSmmService(db, item, agenziaId, aziendaId, collaborazioneId) {
  const existing = await db.collection(collections.smmServices).findOne({ collaborazioneId: oid(collaborazioneId) });
  if (existing) {
    stat("smmServices", "reused");
    return existing;
  }

  const platforms = [];
  if ((item.post_ig_fb || 0) > 0 || (item.post_ig_fb_fatti || 0) > 0) {
    platforms.push("instagram", "facebook");
  }
  if ((item.post_tiktok || 0) > 0 || (item.post_tiktok_fatti || 0) > 0) platforms.push("tiktok");
  if ((item.post_linkedin || 0) > 0 || (item.post_linkedin_fatti || 0) > 0) platforms.push("linkedin");

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    collaborazioneId: oid(collaborazioneId),
    agenziaId,
    aziendaId: oid(aziendaId),
    piattaforme: [...new Set(platforms)],
    pianoEditoriale: {
      postIgFbPrevistiMese: item.post_ig_fb || 0,
      postTikTokPrevistiMese: item.post_tiktok || 0,
      postLinkedInPrevistiMese: item.post_linkedin || 0,
      postPrevistiMese: (item.post_ig_fb || 0) + (item.post_tiktok || 0) + (item.post_linkedin || 0),
      storiesPrevisteMese: 0,
      reelPrevistiMese: 0,
      appuntamentiPrevistiMese: item.numero_appuntamenti || 0,
    },
    contatoriMensili: {
      post_ig_fb_fatti: item.post_ig_fb_fatti || 0,
      post_tiktok_fatti: item.post_tiktok_fatti || 0,
      post_linkedin_fatti: item.post_linkedin_fatti || 0,
      appuntamenti_fatti: item.appuntamenti_fatti || 0,
    },
    totaliContratto: {
      postFatti: item.post_totali || 0,
      postPrevisti: item.post_totali_previsti || 0,
      appuntamentiFatti: item.appuntamenti_totali || 0,
      appuntamentiPrevisti: item.appuntamenti_totali_previsti || 0,
    },
    contatoriTrimestrali: {
      instagram_trim_fatti: item.instagram_trim_fatti || item.valutazione_trimestrale_fatti || 0,
      instagram_trim_totali: item.instagram_trim_totali || item.valutazione_trimestrale_totali || 0,
      tiktok_trim_fatti: item.tiktok_trim_fatti || 0,
      tiktok_trim_totali: item.tiktok_trim_totali || 0,
      linkedin_trim_fatti: item.linkedin_trim_fatti || 0,
      linkedin_trim_totali: item.linkedin_trim_totali || 0,
      appuntamenti_trimestrale_fatti: item.appuntamenti_trimestrale_fatti || 0,
      appuntamenti_trimestrale_totali: item.appuntamenti_trimestrale_totali || 0,
    },
    valutazioneTrimestrale: {
      fatti: item.valutazione_trimestrale_fatti || 0,
      totali: item.valutazione_trimestrale_totali || 0,
    },
    escludiResetTrimestrale: Boolean(item.escludi_reset_trimestrale),
    storicoReset: [],
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };

  await insertOne(db, collections.smmServices, doc);
  stat("smmServices", "created");
  return doc;
}

function mapTasks(tasks = []) {
  return tasks.map((task) => ({
    _id: new mongoose.Types.ObjectId(),
    codice: clean(task.codice),
    titolo: clean(task.nome) || "Task legacy",
    descrizione: clean(task.descrizione || task.tempistica),
    stato: mapWebDesignTaskStatus(task.stato, task.completata),
    dataPrevista: cloneDate(task.dataFine || task.dataPrevista),
    dataCompletamento: task.completata ? cloneDate(task.dataFine) || now() : null,
    giorno: clean(task.giorno),
    giornoLavorativo: Number.isFinite(task.giornoLavorativo) ? task.giornoLavorativo : null,
    criticita: ["regolare", "attenzione", "critico"].includes(task.criticita) ? task.criticita : "regolare",
    motivoRitardo: mapWebDesignDelayReason(task.motivoRitardo),
    tipoControllo: normalizeWebDesignToken(task.tipoControllo),
    faseCollegata: normalizeWebDesignToken(task.faseCollegata),
    appuntamentoTipo: ["fisico", "online"].includes(task.appuntamentoTipo) ? task.appuntamentoTipo : "",
    confermaGruppo: Boolean(task.confermaGruppo),
    assegnatoA: [],
    note: clean(task.note),
  }));
}

function normalizeWebDesignToken(value) {
  return lower(value).replaceAll(" ", "_");
}

function mapWebDesignTaskStatus(value, completed = false) {
  if (completed) return "completato";
  const map = {
    "da fare": "da_fare",
    "in corso": "in_corso",
    "in attesa": "in_attesa",
    completata: "completato",
    "non applicabile": "non_applicabile",
  };
  return map[lower(value)] || "da_fare";
}

function mapWebDesignDelayReason(value) {
  const normalized = normalizeWebDesignToken(value);
  const allowed = ["", "ritardo_interno", "attesa_cliente", "mancanza_contenuti", "attesa_approvazione", "problema_tecnico", "altro"];
  return allowed.includes(normalized) ? normalized : "";
}

function mapWebDesignControlState(value) {
  const normalized = normalizeWebDesignToken(value);
  const allowed = ["", "da_fare", "in_corso", "completato", "ok", "attenzione", "critico", "non_applicabile"];
  return allowed.includes(normalized) ? normalized : "";
}

function mapWebDesignControlResult(value) {
  const normalized = normalizeWebDesignToken(value);
  const allowed = ["", "superato", "non_superato", "con_riserva", "non_applicabile"];
  return allowed.includes(normalized) ? normalized : "";
}

async function migrateWebDesignV2(db, agenziaId) {
  const rows = await db.collection(collections.legacyWebDesignV2).find({}).toArray();
  for (const item of rows) {
    const aziendaId = await resolveMappedId(db, collections.legacyCompanies, item.cliente);
    const webDesignerId = await resolveMappedId(db, collections.legacyCollaborators, item.webDesigner);
    if (!aziendaId || !webDesignerId) {
      skip("webDesignCollaborations", "azienda_o_web_designer_non_migrati");
      stat("webDesignCollaborations", "warnings");
      console.warn(`Skip WebDesignV2 ${item._id}: azienda o web designer non migrati`);
      continue;
    }

    const collaboration = await ensureCollaboration(
      db,
      collections.legacyWebDesignV2,
      item,
      {
        agenziaId,
        aziendaId: oid(aziendaId),
        titolo: `Web Design - ${clean(item.aziendaRagioneSociale)}`,
        tipo: "web_design",
        stato: mapCollaborationStatus(item.stato),
        priorita: "media",
        dataInizio: cloneDate(item.dataInizioContratto) || now(),
        dataFine: cloneDate(item.dataFineContratto),
        contratto: {
          durata: "",
          dataInizio: cloneDate(item.dataInizioContratto),
          dataFine: cloneDate(item.dataFineContratto),
          rinnovoAutomatico: false,
          valoreMensile: 0,
          valoreTotale: 0,
        },
        team: [{
          _id: new mongoose.Types.ObjectId(),
          collaboratoreId: oid(webDesignerId),
          subRole: "web_designer",
          ruoloNelProgetto: "owner",
          percentuale: null,
          cifraFissa: null,
          dataAssegnazione: cloneDate(item.dataInizioContratto) || now(),
          dataFineAssegnazione: null,
          attivo: item.stato !== "terminata",
        }],
        servizi: [{
          _id: new mongoose.Types.ObjectId(),
          tipo: "web_design",
          nome: `Web Design ${clean(item.tipoProgetto)}`,
          stato: mapServiceStatus(item.stato),
          budget: null,
          obiettivi: clean(item.note),
        }],
        avanzamento: {
          percentuale: 0,
          statoSintetico: "",
          ultimoAggiornamentoAt: cloneDate(item.updatedAt),
        },
        calendarioId: null,
        chatId: null,
        legacyRef: { model: "CollaborazioneWebDesignV2", id: oid(item._id) },
        createdBy: null,
        updatedBy: null,
      },
      "webDesignCollaborations"
    );

    await createAssignment(db, collaboration, webDesignerId, "web_designer", item.stato);
    const domain = await ensureDomainFromWebDesign(db, item, agenziaId, aziendaId, collaboration._id, webDesignerId);
    await ensureWebDesignService(db, item, agenziaId, aziendaId, collaboration._id, domain?._id || null);
  }
}

async function ensureWebDesignService(db, item, agenziaId, aziendaId, collaborazioneId, dominioId) {
  const existing = await db.collection(collections.webDesignServices).findOne({ collaborazioneId: oid(collaborazioneId) });
  if (existing) {
    stat("webDesignServices", "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    collaborazioneId: oid(collaborazioneId),
    agenziaId,
    aziendaId: oid(aziendaId),
    tipoProgetto: mapWebDesignProjectType(item.tipoProgetto),
    workflowVersion: clean(item.workflowVersion),
    workflowTimezone: clean(item.workflowTimezone) || "Europe/Rome",
    dataAvvioOperativo: cloneDate(item.dataAvvioOperativo),
    intervistaRicevutaAt: cloneDate(item.intervistaRicevutaAt),
    fasi: (item.fasi || []).map((fase) => ({
      _id: new mongoose.Types.ObjectId(),
      nome: clean(fase.nome) || "struttura",
      giornoInizio: Number.isFinite(fase.giornoInizio) ? fase.giornoInizio : null,
      giornoFine: Number.isFinite(fase.giornoFine) ? fase.giornoFine : null,
      dataInizioPrevista: cloneDate(fase.dataInizioPrevista),
      dataFinePrevista: cloneDate(fase.dataFinePrevista),
      controlloTipo: clean(fase.controlloTipo),
      stato: mapWebDesignTaskStatus(fase.stato),
      criticita: ["regolare", "attenzione", "critico"].includes(fase.criticita) ? fase.criticita : "regolare",
      tasks: mapTasks(fase.tasks || []),
      note: clean(fase.note),
    })),
    controlli: (item.controlli || []).map((controllo) => ({
      _id: new mongoose.Types.ObjectId(),
      nome: clean(controllo.nome) || "Controllo legacy",
      tasks: mapTasks(controllo.tasks || []),
      note: clean(controllo.note),
    })),
    fasiControllo: (item.fasiControllo || []).map((controllo) => ({
      _id: new mongoose.Types.ObjectId(),
      tipo: clean(controllo.tipo) || "controllo",
      giornoPrevisto: Number.isFinite(controllo.giornoPrevisto) ? controllo.giornoPrevisto : null,
      dataPrevista: cloneDate(controllo.dataPrevista),
      dataEffettiva: cloneDate(controllo.data),
      stato: mapWebDesignControlState(controllo.stato),
      esito: mapWebDesignControlResult(controllo.esito),
      note: clean(controllo.note),
      spuntiMiglioramento: clean(controllo.spuntiMiglioramento),
      anomalie: clean(controllo.anomalie),
      problemiBloccanti: clean(controllo.problemiBloccanti),
      completata: Boolean(controllo.completata),
      checkboxCompletamento: Boolean(controllo.checkboxCompletamento),
      condizionale: Boolean(controllo.condizionale),
      eccezione: {
        autorizzata: Boolean(controllo.eccezioneAutorizzata),
        autorizzataDa: clean(controllo.eccezioneAutorizzataDa),
        motivo: clean(controllo.eccezioneMotivo),
        data: cloneDate(controllo.eccezioneData),
      },
    })),
    checklistPubblicazione: (item.checklistPubblicazione || []).map((categoria) => ({
      _id: new mongoose.Types.ObjectId(),
      categoria: clean(categoria.categoria),
      items: mapTasks(categoria.items || []),
      note: clean(categoria.note),
    })),
    appuntamenti: (item.appuntamenti || []).map((entry) => ({
      _id: new mongoose.Types.ObjectId(),
      tipo: entry.tipo,
      obbligatorio: Boolean(entry.obbligatorio),
      stato: normalizeWebDesignToken(entry.stato) || "da_pianificare",
      data: cloneDate(entry.data),
      modalita: clean(entry.modalita),
      esito: clean(entry.esito),
      note: clean(entry.note),
    })),
    approvazioni: (item.approvazioni || []).map((entry) => ({
      _id: new mongoose.Types.ObjectId(),
      tipo: entry.tipo,
      stato: normalizeWebDesignToken(entry.stato) || "da_richiedere",
      modalita: clean(entry.modalita),
      data: cloneDate(entry.data),
      approvatoDa: clean(entry.approvatoDa),
      note: clean(entry.note),
    })),
    modificheTimeline: (item.modificheTimeline || []).map((entry) => ({
      dataPrecedente: cloneDate(entry.dataPrecedente),
      dataNuova: cloneDate(entry.dataNuova),
      dataFinePrecedente: cloneDate(entry.dataFinePrecedente),
      dataFineNuova: cloneDate(entry.dataFineNuova),
      modificataIl: cloneDate(entry.modificataIl),
      modificataDaId: null,
      modificataDaLegacyId: clean(entry.modificataDaId),
      modificataDaNome: clean(entry.modificataDaNome),
      motivo: clean(entry.motivo),
    })),
    interview: item.interview || {},
    interviewPrompt: clean(item.interviewPrompt),
    dominioId: dominioId ? oid(dominioId) : null,
    ambiente: {
      cms: "WordPress",
      hosting: "",
      stagingUrl: "",
      produzioneUrl: clean(item.dominio?.urlDominio),
    },
    consegna: {
      stato: normalizeWebDesignToken(item.consegna?.stato) || "non_consegnato",
      dataPrevista: cloneDate(item.consegna?.dataPrevista || item.dataFineContratto),
      dataEffettiva: cloneDate(item.consegna?.dataEffettiva),
      confermata: Boolean(item.consegna?.confermata),
      note: clean(item.consegna?.note),
    },
    pubblicazione: {
      stato: normalizeWebDesignToken(item.pubblicazione?.stato) || "da_pianificare",
      dataPrevista: cloneDate(item.pubblicazione?.dataPrevista),
      dataEffettiva: cloneDate(item.pubblicazione?.dataEffettiva),
      urlPubblico: clean(item.pubblicazione?.urlPubblico),
      note: clean(item.pubblicazione?.note),
    },
    note: clean(item.note),
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };

  await insertOne(db, collections.webDesignServices, doc);
  stat("webDesignServices", "created");
  return doc;
}

async function ensureDomainFromWebDesign(db, item, agenziaId, aziendaId, collaborazioneId, webDesignerId) {
  const urlDominio = clean(item.dominio?.urlDominio);
  const dataScadenza = cloneDate(item.dominio?.dataScadenza);
  if (!urlDominio || !dataScadenza) return null;

  const cachedDomain = naturalCache.domainsByUrl.get(domainUrlKey(agenziaId, urlDominio));
  if (cachedDomain) {
    stat("domains", "reused");
    return cachedDomain;
  }

  const existing = await db.collection(collections.domains).findOne({ agenziaId, urlDominio });
  if (existing) {
    cacheDomain(agenziaId, existing);
    stat("domains", "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId,
    aziendaId: oid(aziendaId),
    collaborazioneId: oid(collaborazioneId),
    webDesignerId: oid(webDesignerId),
    registrar: "",
    urlDominio,
    dataAcquisto: cloneDate(item.dominio?.dataAcquisto),
    dataScadenza,
    rinnovoAutomatico: false,
    stato: computeDomainStatus(dataScadenza),
    credenzialeId: null,
    note: "",
    alertInviati: item.dominio?.alertInviato ? [{ soglia: 30, dataInvio: cloneDate(item.dominio.novaAlertData) || now() }] : [],
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };

  await insertOne(db, collections.domains, doc);
  cacheDomain(agenziaId, doc);
  stat("domains", "created");
  return doc;
}

function computeDomainStatus(expiration) {
  if (!expiration) return "attivo";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((expiration.getTime() - today.getTime()) / 86400000);
  if (diff < 0) return "scaduto";
  if (diff <= 30) return "in_scadenza";
  return "attivo";
}

async function migrateGoogleAds(db, agenziaId) {
  const rows = await db.collection(collections.legacyGoogleAds).find({}).toArray();
  for (const item of rows) {
    const aziendaId = await resolveMappedId(db, collections.legacyCompanies, item.cliente);
    const collaboratoreId = await resolveMappedId(db, collections.legacyCollaborators, item.collaboratore);
    if (!aziendaId || !collaboratoreId) {
      skip("googleAdsCollaborations", "azienda_o_collaboratore_non_migrati");
      stat("googleAdsCollaborations", "warnings");
      console.warn(`Skip GoogleAds ${item._id}: azienda o collaboratore non migrati`);
      continue;
    }

    const state = mapGoogleAdsStatus(item);
    const collaboration = await ensureCollaboration(
      db,
      collections.legacyGoogleAds,
      item,
      {
        agenziaId,
        aziendaId: oid(aziendaId),
        titolo: `Google Ads - ${clean(item.clienteEtichetta)}`,
        tipo: "google_ads",
        stato: state === "terminata" ? "terminata" : "attiva",
        priorita: "media",
        dataInizio: item.createdAt || now(),
        dataFine: state === "terminata" ? cloneDate(item.updatedAt) : null,
        contratto: {
          durata: "",
          dataInizio: null,
          dataFine: null,
          rinnovoAutomatico: false,
          valoreMensile: 0,
          valoreTotale: 0,
        },
        team: [{
          _id: new mongoose.Types.ObjectId(),
          collaboratoreId: oid(collaboratoreId),
          subRole: "google_ads",
          ruoloNelProgetto: "owner",
          percentuale: null,
          cifraFissa: null,
          dataAssegnazione: item.createdAt || now(),
          dataFineAssegnazione: null,
          attivo: state !== "terminata",
        }],
        servizi: [{
          _id: new mongoose.Types.ObjectId(),
          tipo: "google_ads",
          nome: "Google Ads",
          stato: state === "terminata" ? "terminato" : "attivo",
          budget: null,
          obiettivi: clean(item.note),
        }],
        avanzamento: {
          percentuale: state === "terminata" ? 100 : state === "attiva" ? 60 : state === "setup" ? 30 : 0,
          statoSintetico: state,
          ultimoAggiornamentoAt: cloneDate(item.updatedAt),
        },
        calendarioId: null,
        chatId: null,
        legacyRef: { model: "GoogleAds", id: oid(item._id) },
        createdBy: null,
        updatedBy: null,
      },
      "googleAdsCollaborations"
    );

    await createAssignment(db, collaboration, collaboratoreId, "google_ads", state);
    await ensureGoogleAdsService(db, item, agenziaId, aziendaId, collaboration._id, state);
  }
}

async function ensureGoogleAdsService(db, item, agenziaId, aziendaId, collaborazioneId, state) {
  const existing = await db.collection(collections.googleAdsServices).findOne({ collaborazioneId: oid(collaborazioneId) });
  if (existing) {
    stat("googleAdsServices", "reused");
    return existing;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    collaborazioneId: oid(collaborazioneId),
    agenziaId,
    aziendaId: oid(aziendaId),
    accountId: "",
    customerId: "",
    budgetMensile: 0,
    obiettivo: "lead",
    campagne: [],
    statoOperativo: state,
    note: clean(item.note),
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now(),
  };
  await insertOne(db, collections.googleAdsServices, doc);
  stat("googleAdsServices", "created");
  return doc;
}

async function migrateStandaloneDomains(db, agenziaId) {
  const rows = await db.collection(collections.legacyDomains).find({}).toArray();
  const placeholder = await ensureStandaloneCompany(db, agenziaId, "Domini standalone Hoonweb");
  for (const item of rows) {
    stat("standaloneDomains", "legacy");
    const existingMap = await getMap(db, collections.legacyDomains, item._id);
    if (existingMap) {
      stat("standaloneDomains", "reused");
      continue;
    }
    const urlDominio = clean(item.urlDominio);
    if (!urlDominio || !item.dataScadenza) {
      skip("standaloneDomains", "url_o_scadenza_mancante");
      continue;
    }
    const cachedDomain = naturalCache.domainsByUrl.get(domainUrlKey(agenziaId, urlDominio));
    if (cachedDomain) {
      await saveMap(db, collections.legacyDomains, item._id, collections.domains, cachedDomain._id, { naturalKey: "urlDominio" });
      stat("standaloneDomains", "reused");
      continue;
    }

    const existing = await db.collection(collections.domains).findOne({ agenziaId, urlDominio });
    if (existing) {
      cacheDomain(agenziaId, existing);
      await saveMap(db, collections.legacyDomains, item._id, collections.domains, existing._id, { naturalKey: "urlDominio" });
      stat("standaloneDomains", "reused");
      continue;
    }
    const webDesignerId = await findUserByDisplayName(db, agenziaId, item.webDesigner);
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      aziendaId: oid(placeholder._id),
      collaborazioneId: null,
      webDesignerId: webDesignerId ? oid(webDesignerId) : null,
      registrar: "",
      urlDominio,
      dataAcquisto: null,
      dataScadenza: cloneDate(item.dataScadenza),
      rinnovoAutomatico: false,
      stato: computeDomainStatus(cloneDate(item.dataScadenza)),
      credenzialeId: null,
      note: [
        clean(item.note),
        item.isEsterno ? "Dominio esterno legacy." : "",
      ].filter(Boolean).join("\n"),
      alertInviati: item.alertInviato ? [{ soglia: 30, dataInvio: now() }] : [],
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    };
    await insertOne(db, collections.domains, doc);
    cacheDomain(agenziaId, doc);
    await saveMap(db, collections.legacyDomains, item._id, collections.domains, doc._id, { standalone: true });
    stat("standaloneDomains", "created");
  }
}

async function findUserByDisplayName(db, agenziaId, displayName) {
  const name = clean(displayName);
  if (!name) return null;
  const cached = naturalCache.usersByDisplayName.get(displayNameKey(agenziaId, name));
  if (cached) return cached._id;
  const exact = await db.collection(collections.users).findOne({ agenziaId, displayName: name });
  if (exact) {
    cacheUser(agenziaId, exact);
    return exact._id;
  }
  const parts = splitName(name);
  const loose = await db.collection(collections.users).findOne({
    agenziaId,
    nome: parts.nome,
    cognome: parts.cognome,
  });
  if (loose) cacheUser(agenziaId, loose);
  return loose?._id || null;
}

async function migrateLeadCommerciali(db, agenziaId, fallbackAuthorId) {
  const rows = await db.collection(collections.legacyLeads).find({}).toArray();
  for (const item of rows) {
    const commercialeOwner = await resolveMappedId(db, collections.legacyCollaborators, item.commerciale) || fallbackAuthorId;

    const company = await ensureCompanyFromLegacy(db, collections.legacyLeads, item, agenziaId, {
      statName: "commercialLeads",
      statoCliente: item.stato_attuale === "completato" ? "attivo" : "lead",
      origine: "commerciale",
      commercialeOwner: commercialeOwner ? oid(commercialeOwner) : null,
      tags: ["legacy_lead_commerciale", item.stato_attuale || "in_lavorazione"].filter(Boolean),
      noteInterne: clean(item.nota_generale),
      source: "legacy-lead-commerciale",
    });

    if (!company?._id) continue;

    const leadMapCollection = `${collections.legacyLeads}:entity`;
    const existingMap = await getMap(db, leadMapCollection, item._id);
    if (existingMap) {
      stat("commercialLeadEntities", "reused");
    } else {
      const existing = await db.collection(collections.commercialLeads).findOne({
        agenziaId,
        "legacyRef.model": "LeadCommerciale",
        "legacyRef.id": oid(item._id),
      });
      if (existing) {
        await saveMap(db, leadMapCollection, item._id, collections.commercialLeads, existing._id);
        stat("commercialLeadEntities", "reused");
      } else {
        const lead = {
          _id: new mongoose.Types.ObjectId(),
          agenziaId,
          aziendaId: oid(company._id),
          commercialeId: oid(commercialeOwner),
          referente: clean(item.referente),
          telefonoPrincipale: clean(item.numero_telefono),
          telefonoSecondario: clean(item.secondo_numero),
          email: lower(item.email),
          indirizzo: clean(item.indirizzo),
          citta: clean(item.citta),
          timeline: {
            contatto: mapCommercialTimelineStep(item.timeline?.contatto),
            appuntamento: mapCommercialTimelineStep(item.timeline?.appuntamento),
            preventivo: mapCommercialTimelineStep(item.timeline?.preventivo),
            contratto: mapCommercialTimelineStep(item.timeline?.contratto),
          },
          stato: item.stato_attuale || "in_lavorazione",
          statoCambiatoAt: cloneDate(item.data_cambio_stato),
          richiamoAt: cloneDate(item.data_richiamo),
          nonInteressato: {
            completato: Boolean(item.non_interessato?.completato),
            dataCompletamento: cloneDate(item.non_interessato?.data_completamento),
            nota: clean(item.non_interessato?.nota),
          },
          daRicontattare: {
            completato: Boolean(item.da_ricontattare?.completato),
            dataCompletamento: cloneDate(item.da_ricontattare?.data_completamento),
            dataRicontatto: cloneDate(item.da_ricontattare?.data_ricontatto),
            nota: clean(item.da_ricontattare?.nota),
          },
          notaGenerale: clean(item.nota_generale),
          archiviato: Boolean(item.archiviato),
          archiviatoAt: cloneDate(item.data_archiviazione),
          legacyRef: { model: "LeadCommerciale", id: oid(item._id) },
          createdBy: null,
          updatedBy: null,
          createdAt: item.createdAt || now(),
          updatedAt: item.updatedAt || now(),
        };
        await insertOne(db, collections.commercialLeads, lead);
        await saveMap(db, leadMapCollection, item._id, collections.commercialLeads, lead._id);
        stat("commercialLeadEntities", "created");
      }
    }

    if (nonEmpty(item.nota_generale)) {
      await ensureNotebookNote(db, {
        legacyCollection: `${collections.legacyLeads}:notebook`,
        legacyId: item._id,
        agenziaId,
        aziendaId: company._id,
        collaborazioneId: null,
        autoreId: commercialeOwner || fallbackAuthorId,
        visibilita: "interna",
        tipo: item.stato_attuale === "da_richiamare" ? "follow_up" : "generale",
        titolo: "Nota lead commerciale legacy",
        contenuto: item.nota_generale,
        dataAppuntamento: cloneDate(item.data_richiamo),
        statoProblema: "",
        feeling: { emoji: "", nota: "" },
        createdAt: item.createdAt || item.data_cambio_stato || now(),
        updatedAt: item.updatedAt || now(),
      });
    }
  }
}

function mapCommercialTimelineStep(step = {}) {
  return {
    completato: Boolean(step?.completato),
    dataCompletamento: cloneDate(step?.data_completamento),
  };
}

async function migrateBoysPaymentConfiguration(db) {
  const configs = await db.collection(collections.legacyBoysConfig).find({}).toArray();
  for (const config of configs) {
    for (const legacyCompanyId of config.aziende_ragazzi || []) {
      const aziendaId = await resolveMappedId(db, collections.legacyCompanies, legacyCompanyId);
      if (!aziendaId) {
        skip("boysPaymentConfiguration", "azienda_non_migrata");
        continue;
      }
      await updateOne(
        db,
        collections.companies,
        { _id: oid(aziendaId) },
        { $set: { "gestioneEconomica.incassoDestinatoA": "collaboratori", updatedAt: now() } }
      );
      stat("boysPaymentConfiguration", "created");
    }
  }
}

async function migrateLegacyPayments(db, agenziaId) {
  const rows = await db.collection(collections.legacyPayments).find({}).toArray();
  for (const item of rows) {
    stat("payments", "legacy");
    const aziendaId = await resolveMappedId(db, collections.legacyCompanies, item.cliente);
    if (!aziendaId) {
      skip("payments", "azienda_non_migrata");
      continue;
    }
    const existing = await db.collection(collections.payments).findOne({
      agenziaId,
      "legacyRef.model": "Pagamenti",
      "legacyRef.id": oid(item._id),
    });
    if (existing) {
      stat("payments", "reused");
      continue;
    }
    const invoiceDate = cloneDate(item.data_fattura);
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      aziendaId: oid(aziendaId),
      collaborazioneId: null,
      assegnazioneId: null,
      tipo: "entrata",
      importo: null,
      valuta: "EUR",
      importoConfermato: false,
      stato_pagamento: ["si", "no", "ragazzi"].includes(item.stato)
        ? { si: "pagato", no: "non_pagato", ragazzi: "ragazzi" }[item.stato]
        : "non_pagato",
      servizio: "legacy_non_specificato",
      numeroDocumento: "",
      dataCompetenzaDa: invoiceDate,
      dataCompetenzaA: invoiceDate,
      data_pagamento: cloneDate(item.data_pagato),
      scadenzaPagamento: null,
      mese: invoiceDate ? invoiceDate.getUTCMonth() + 1 : null,
      anno: invoiceDate ? invoiceDate.getUTCFullYear() : null,
      metodoPagamento: "",
      note: "Importo assente nel record legacy: da riconciliare prima del cut-over.",
      allegati: [],
      legacyRef: { model: "Pagamenti", id: oid(item._id) },
      createdBy: null,
      updatedBy: null,
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    };
    await insertOne(db, collections.payments, doc);
    stat("payments", "created");
  }
}

async function migrateLegacyInvoices(db, agenziaId) {
  const rows = await db.collection(collections.legacyInvoices).find({}).toArray();
  for (const item of rows) {
    stat("collaboratorInvoices", "legacy");
    const collaboratoreId = await resolveMappedId(db, collections.legacyCollaborators, item.collaboratore);
    const match = /^(\d{4})-(\d{2})$/.exec(clean(item.mese));
    if (!collaboratoreId || !match) {
      skip("collaboratorInvoices", !collaboratoreId ? "collaboratore_non_migrato" : "mese_non_valido");
      continue;
    }
    const anno = Number(match[1]);
    const mese = Number(match[2]);
    const existing = await db.collection(collections.collaboratorInvoices).findOne({
      agenziaId,
      "legacyRef.model": "Fatturazione",
      "legacyRef.id": oid(item._id),
    });
    if (existing) {
      stat("collaboratorInvoices", "reused");
      continue;
    }
    const doc = {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      collaboratoreId: oid(collaboratoreId),
      collaborazioneIds: [],
      assegnazioneIds: [],
      mese,
      anno,
      totale: typeof item.totale === "number" ? item.totale : null,
      numeroFattura: "",
      dataEmissione: cloneDate(item.data),
      dataScadenza: null,
      statoCollaboratore: item.statoCollaboratore || "non emessa",
      statoAmministratore: item.statoAmministratore || "non pagata",
      fileUrl: "",
      noteAdmin: item.totale == null ? "Totale assente nel record legacy: da riconciliare." : "",
      legacyRef: { model: "Fatturazione", id: oid(item._id) },
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    };
    await insertOne(db, collections.collaboratorInvoices, doc);
    stat("collaboratorInvoices", "created");
  }
}

function slugifyService(value) {
  return lower(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "servizio";
}

async function migrateServiceCatalog(db, agenziaId) {
  const rows = await db.collection(collections.legacyServices).find({}).toArray();
  for (const item of rows) {
    stat("serviceCatalog", "legacy");
    const codice = slugifyService(item.nome);
    const existing = await db.collection(collections.serviceCatalog).findOne({ agenziaId, codice });
    if (existing) {
      stat("serviceCatalog", "reused");
      continue;
    }
    await insertOne(db, collections.serviceCatalog, {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      codice,
      nome: clean(item.nome) || "Servizio legacy",
      tipoCollaborazione: "mista",
      descrizione: "",
      prezzoBase: null,
      valuta: "EUR",
      attivo: item.attivo !== false,
      legacyRef: { model: "Servizio", id: oid(item._id) },
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    });
    stat("serviceCatalog", "created");
  }
}

async function migrateNotifications(db, agenziaId) {
  const rows = await db.collection(collections.legacyNotifications).find({}).toArray();
  for (const item of rows) {
    stat("notifications", "legacy");
    const existing = await db.collection(collections.notifications).findOne({
      agenziaId,
      "legacyRef.model": "Notifica",
      "legacyRef.id": oid(item._id),
    });
    if (existing) {
      stat("notifications", "reused");
      continue;
    }
    const destinatarioId = item.destinatario
      ? await resolveMappedId(db, collections.legacyCollaborators, item.destinatario)
      : null;
    await insertOne(db, collections.notifications, {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      destinatarioId: destinatarioId ? oid(destinatarioId) : null,
      tipo: item.tipo || "sistema",
      titolo: clean(item.titolo),
      messaggio: clean(item.messaggio),
      link: clean(item.link),
      lettaAt: item.letta ? cloneDate(item.updatedAt || item.createdAt) || now() : null,
      entity: { type: "legacy", id: null },
      dedupeKey: item.refId ? `legacy:${item.tipo}:${item.refId}:${destinatarioId || "broadcast"}` : "",
      legacyRef: { model: "Notifica", id: oid(item._id) },
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    });
    stat("notifications", "created");
  }

  const deliveries = await db.collection(collections.legacyNotificationDeliveries).find({}).toArray();
  for (const item of deliveries) {
    stat("notificationDeliveries", "legacy");
    const destinatarioId = await resolveMappedId(db, collections.legacyCollaborators, item.destinatario);
    if (!destinatarioId) {
      skip("notificationDeliveries", "destinatario_non_migrato");
      continue;
    }
    const existing = await db.collection(collections.notificationDeliveries).findOne({
      agenziaId,
      dedupeKey: clean(item.dedupeKey),
    });
    if (existing) {
      stat("notificationDeliveries", "reused");
      continue;
    }
    await insertOne(db, collections.notificationDeliveries, {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      notificaId: null,
      destinatarioId: oid(destinatarioId),
      channel: item.channel,
      target: clean(item.target),
      subject: clean(item.subject),
      message: clean(item.message),
      link: clean(item.link),
      status: item.status,
      attempts: item.attempts || 0,
      lastError: clean(item.lastError),
      sentAt: cloneDate(item.sentAt),
      deliveredAt: null,
      dedupeKey: clean(item.dedupeKey),
      legacyRef: { model: "NotificationDelivery", id: oid(item._id) },
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    });
    stat("notificationDeliveries", "created");
  }
}

async function migrateEvents(db, agenziaId) {
  const rows = await db.collection(collections.legacyEvents).find({}).toArray();
  for (const item of rows) {
    stat("events", "legacy");
    const responsabileId = await resolveMappedId(db, collections.legacyCollaborators, item.responsabile);
    if (!responsabileId) {
      skip("events", "responsabile_non_migrato");
      continue;
    }
    const aziendaId = item.azienda
      ? await resolveMappedId(db, collections.legacyCompanies, item.azienda)
      : null;
    const invited = [];
    for (const legacyCollaboratorId of item.collaboratori || []) {
      const userId = await resolveMappedId(db, collections.legacyCollaborators, legacyCollaboratorId);
      if (userId) invited.push(oid(userId));
    }
    const existingMap = await getMap(db, collections.legacyEvents, item._id);
    if (existingMap) {
      stat("events", "reused");
      continue;
    }
    const existing = await db.collection(collections.events).findOne({
      agenziaId,
      "legacyRef.model": "Evento",
      "legacyRef.id": oid(item._id),
    });
    if (existing) {
      await saveMap(db, collections.legacyEvents, item._id, collections.events, existing._id);
      stat("events", "reused");
      continue;
    }
    const event = {
      _id: new mongoose.Types.ObjectId(),
      agenziaId,
      aziendaId: aziendaId ? oid(aziendaId) : null,
      tipo: item.tipo || "evento",
      nome: clean(item.nome),
      dataInizio: cloneDate(item.dataInizio),
      dataFine: cloneDate(item.dataFine),
      giornate: (item.giornateEvento || []).map(cloneDate).filter(Boolean),
      luogo: clean(item.luogo),
      responsabileId: oid(responsabileId),
      collaboratoriInvitati: invited,
      obiettivi: {
        postPrevisti: item.postTotali || 0,
        postFatti: item.postFatti || 0,
        appuntamentiPrevisti: item.appuntamentiTotali || 0,
        appuntamentiFatti: item.appuntamentiFatti || 0,
      },
      finestraSocial: {
        inizio: cloneDate(item.inizioSocial),
        fine: cloneDate(item.fineSocial),
        piattaforme: item.socialGestiti || [],
      },
      noteInterne: clean(item.noteInterne),
      noteShooting: clean(item.noteShooting),
      pagamentoTotale: item.pagamentoTotale ?? "0.00",
      tranche: (item.tranche || []).map((entry) => ({
        _id: new mongoose.Types.ObjectId(),
        descrizione: clean(entry.descrizione),
        importo: entry.importo ?? "0.00",
        scadenza: cloneDate(entry.scadenza),
        stato: entry.stato || "da_pagare",
      })),
      hardDisk: Boolean(item.hardDisk),
      report: Boolean(item.report),
      legacyRef: { model: "Evento", id: oid(item._id) },
      createdBy: null,
      updatedBy: null,
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    };
    await insertOne(db, collections.events, event);
    await saveMap(db, collections.legacyEvents, item._id, collections.events, event._id);
    stat("events", "created");
  }

  const availability = await db.collection(collections.legacyEventAvailability).find({}).toArray();
  for (const item of availability) {
    stat("eventAvailability", "legacy");
    const eventoId = await resolveMappedId(db, collections.legacyEvents, item.evento);
    const collaboratoreId = await resolveMappedId(db, collections.legacyCollaborators, item.collaboratore);
    if (!eventoId || !collaboratoreId) {
      skip("eventAvailability", "evento_o_collaboratore_non_migrato");
      continue;
    }
    const filter = { agenziaId, eventoId: oid(eventoId), collaboratoreId: oid(collaboratoreId) };
    if (await db.collection(collections.eventAvailability).findOne(filter)) {
      stat("eventAvailability", "reused");
      continue;
    }
    await insertOne(db, collections.eventAvailability, {
      _id: new mongoose.Types.ObjectId(),
      ...filter,
      stato: item.stato,
      nota: clean(item.nota),
      risposteGiornaliere: (item.risposteGiornaliere || []).map((entry) => ({
        data: cloneDate(entry.data),
        stato: entry.stato,
        nota: clean(entry.nota),
      })),
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    });
    stat("eventAvailability", "created");
  }

  const assignments = await db.collection(collections.legacyEventAssignments).find({}).toArray();
  for (const item of assignments) {
    stat("eventAssignments", "legacy");
    const eventoId = await resolveMappedId(db, collections.legacyEvents, item.evento);
    const collaboratoreId = await resolveMappedId(db, collections.legacyCollaborators, item.collaboratore);
    if (!eventoId || !collaboratoreId) {
      skip("eventAssignments", "evento_o_collaboratore_non_migrato");
      continue;
    }
    const filter = {
      agenziaId,
      eventoId: oid(eventoId),
      collaboratoreId: oid(collaboratoreId),
      dataLavoro: cloneDate(item.dataLavoro),
    };
    if (await db.collection(collections.eventAssignments).findOne(filter)) {
      stat("eventAssignments", "reused");
      continue;
    }
    await insertOne(db, collections.eventAssignments, {
      _id: new mongoose.Types.ObjectId(),
      ...filter,
      mansione: clean(item.mansione),
      noteCollaboratore: clean(item.noteCollaboratore),
      createdBy: null,
      updatedBy: null,
      createdAt: item.createdAt || now(),
      updatedAt: item.updatedAt || now(),
    });
    stat("eventAssignments", "created");
  }
}

async function migrateSmmNotes(db, agenziaId, fallbackAuthorId) {
  const rows = await db.collection(collections.legacyNotes).find({}).toArray();
  let orphanCompany = null;
  for (const item of rows) {
    stat("smmNotes", "legacy");
    const collaborazioneId = await resolveMappedId(db, collections.legacySmmCollaborations, item.collaborazione);
    let aziendaId = null;
    if (collaborazioneId) {
      const collaboration = await findById(db, collections.collaborations, collaborazioneId);
      aziendaId = collaboration?.aziendaId || null;
    }
    if (!aziendaId) {
      orphanCompany ||= await ensureStandaloneCompany(db, agenziaId, "Note SMM legacy senza collaborazione attiva");
      aziendaId = orphanCompany._id;
      stat("smmOrphanNotes", "legacy");
    }
    const autoreId = await resolveMappedAuthor(db, item.autoreId) || fallbackAuthorId;
    await ensureNotebookNote(db, {
      legacyCollection: collections.legacyNotes,
      legacyId: item._id,
      agenziaId,
      aziendaId,
      collaborazioneId: collaborazioneId || null,
      autoreId,
      visibilita: "team",
      tipo: mapNoteType(item.tipo),
      titolo: collaborazioneId ? clean(item.autore) : `Nota SMM orfana — collaborazione legacy ${item.collaborazione}`,
      contenuto: clean(item.nota) || "[Nota legacy priva di contenuto]",
      dataAppuntamento: cloneDate(item.data_appuntamento),
      statoProblema: item.tipo === "problema" ? "aperto" : "",
      feeling: {
        emoji: clean(item.feeling_emoji),
        nota: clean(item.feeling_note),
      },
      createdAt: item.data || now(),
      updatedAt: item.data || now(),
    });
  }
}

function mapNoteType(tipo) {
  const map = {
    generico: "generale",
    appuntamento: "appuntamento",
    problema: "problema",
    post_mancante: "post_mancante",
  };
  return map[tipo] || "generale";
}

async function resolveMappedAuthor(db, legacyAuthorId) {
  return (
    await resolveMappedId(db, collections.legacyCollaborators, legacyAuthorId) ||
    await resolveMappedId(db, collections.legacyAdmins, legacyAuthorId) ||
    await resolveMappedId(db, collections.legacyCompanies, legacyAuthorId)
  );
}

async function ensureNotebookNote(db, payload) {
  const existingMap = await getMap(db, payload.legacyCollection, payload.legacyId);
  if (existingMap && existingMap.v3Collection === collections.notebookNotes) {
    stat("notebookNotes", "reused");
    return { _id: existingMap.v3Id };
  }

  if (!payload.autoreId || !payload.aziendaId) {
    skip("notebookNotes", "autore_o_azienda_mancante");
    return null;
  }

  const doc = {
    _id: new mongoose.Types.ObjectId(),
    agenziaId: payload.agenziaId,
    aziendaId: oid(payload.aziendaId),
    collaborazioneId: payload.collaborazioneId ? oid(payload.collaborazioneId) : null,
    autoreId: oid(payload.autoreId),
    visibilita: payload.visibilita || "team",
    tipo: payload.tipo || "generale",
    titolo: clean(payload.titolo),
    contenuto: clean(payload.contenuto) || "[Nota legacy priva di contenuto]",
    dataAppuntamento: cloneDate(payload.dataAppuntamento),
    statoProblema: payload.statoProblema || "",
    feeling: payload.feeling || { emoji: "", nota: "" },
    allegati: [],
    mentions: [],
    createdAt: payload.createdAt || now(),
    updatedAt: payload.updatedAt || now(),
  };

  await insertOne(db, collections.notebookNotes, doc);
  await saveMap(db, payload.legacyCollection, payload.legacyId, collections.notebookNotes, doc._id, {
    noteType: doc.tipo,
  });
  stat("notebookNotes", "created");
  return doc;
}

async function migrateCommercialNotes(db, agenziaId, fallbackAuthorId) {
  const rows = await db.collection(collections.legacyCommNotes).find({}).toArray();
  const placeholder = await ensureStandaloneCompany(db, agenziaId, "Note commerciali non collegate Hoonweb");
  for (const item of rows) {
    stat("commercialNotes", "legacy");
    const autoreId = await resolveMappedAuthor(db, item.autoreId) || fallbackAuthorId;
    let company = placeholder;

    if (item.mainCategoria === "contatto" && nonEmpty(item.nomeAzienda)) {
      company = await ensureCompanyFromLegacy(db, collections.legacyCommNotes, item, agenziaId, {
        statName: "commercialNoteCompanies",
        statoCliente: "lead",
        origine: mapCommercialOrigin(item.comeArrivato),
        tags: ["legacy_note_comm"],
        noteInterne: clean(item.nota),
        source: "legacy-note-comm",
      });
    }

    const content = [
      clean(item.nota),
      item.tipoContatto ? `Tipo contatto: ${item.tipoContatto}` : "",
      item.comeArrivato ? `Come arrivato: ${item.comeArrivato}` : "",
      item.referal ? `Referal: ${item.referal}` : "",
      item.luogo ? `Luogo: ${item.luogo}` : "",
      item.luogo_appuntamento ? `Luogo appuntamento: ${item.luogo_appuntamento}` : "",
      item.numeroTelefono ? `Telefono: ${item.numeroTelefono}` : "",
      item.referente ? `Referente: ${item.referente}` : "",
    ].filter(Boolean).join("\n");

    await ensureNotebookNote(db, {
      legacyCollection: `${collections.legacyCommNotes}:notebook`,
      legacyId: item._id,
      agenziaId,
      aziendaId: company?._id || placeholder._id,
      collaborazioneId: null,
      autoreId,
      visibilita: "interna",
      tipo: item.mainCategoria === "appuntamento" ? "appuntamento" : "follow_up",
      titolo: item.mainCategoria === "appuntamento" ? "Appuntamento commerciale legacy" : "Contatto commerciale legacy",
      contenuto: content,
      dataAppuntamento: cloneDate(item.data_appuntamento),
      statoProblema: "",
      feeling: { emoji: "", nota: "" },
      createdAt: item.data || now(),
      updatedAt: item.data || now(),
    });
  }
}

function mapCommercialOrigin(value) {
  const normalized = lower(value);
  if (normalized === "referal") return "referal";
  if (normalized === "chiamata") return "chiamata";
  if (normalized === "ricerca") return "ricerca";
  return "commerciale";
}

async function countLegacy(db) {
  const keys = [
    "legacyCompanies",
    "legacyCollaborators",
    "legacyAdmins",
    "legacySmmCollaborations",
    "legacyWebDesignV2",
    "legacyGoogleAds",
    "legacyNotes",
    "legacyCommNotes",
    "legacyDomains",
    "legacyLeads",
    "legacyPayments",
    "legacyInvoices",
    "legacyBoysConfig",
    "legacyServices",
    "legacyNotifications",
    "legacyNotificationDeliveries",
    "legacyEvents",
    "legacyEventAvailability",
    "legacyEventAssignments",
  ];
  const result = {};
  for (const key of keys) {
    result[collections[key]] = await db.collection(collections[key]).countDocuments({});
  }
  return result;
}

function printStats() {
  console.log("");
  console.log(apply ? "Migrazione completata." : "Dry-run completato. Nessuna scrittura eseguita.");
  console.log("");
  console.table(stats);
  if (Object.keys(skipReasons).length > 0) {
    console.log("");
    console.log("Motivi skip:");
    console.table(skipReasons);
  }
}

async function main() {
  console.log(apply ? "Modalita APPLY: scrittura abilitata." : "Modalita DRY-RUN: nessuna scrittura verra eseguita.");
  console.log(`Database: ${dbName}`);
  console.log(`Agency target: ${agencyName} <${agencyEmail}>`);
  console.log(`Scope mapping: ${scope}`);
  console.log("");

  await mongoose.connect(MONGODB_URI, { dbName });
  const db = mongoose.connection.db;
  await createIndexes(db);

  if (verbose) {
    console.log("Conteggio collection legacy:");
    console.table(await countLegacy(db));
  }

  const agency = await ensureAgency(db);
  const agenziaId = oid(agency._id);
  await preloadMigrationMaps(db);
  await preloadNaturalCaches(db, agenziaId);

  await migrateAdmins(db, agenziaId);
  await migrateCollaborators(db, agenziaId);
  await migrateCompanies(db, agenziaId);
  await migrateBoysPaymentConfiguration(db);
  await migrateServiceCatalog(db, agenziaId);

  const migrationUser = await ensureMigrationUser(db, agenziaId);

  await migrateSmmCollaborations(db, agenziaId);
  await migrateWebDesignV2(db, agenziaId);
  await migrateGoogleAds(db, agenziaId);
  await migrateStandaloneDomains(db, agenziaId);
  await migrateLeadCommerciali(db, agenziaId, migrationUser._id);
  await migrateSmmNotes(db, agenziaId, migrationUser._id);
  await migrateCommercialNotes(db, agenziaId, migrationUser._id);
  await migrateLegacyPayments(db, agenziaId);
  await migrateLegacyInvoices(db, agenziaId);
  await migrateNotifications(db, agenziaId);
  await migrateEvents(db, agenziaId);

  printStats();

  if (!apply) {
    console.log("");
    console.log("Per scrivere davvero:");
    console.log(`node scripts/migrate-new-web-area-to-v3-hoonweb.mjs --apply --agency-email=${agencyEmail}`);
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("Migrazione fallita:");
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
