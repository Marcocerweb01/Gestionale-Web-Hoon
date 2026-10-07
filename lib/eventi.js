import mongoose from "mongoose";
import { Collaboratore, Azienda } from "@/models/User";

export const isAdmin = (session) => session?.user?.role === "amministratore";

export const isValidId = (value) => mongoose.Types.ObjectId.isValid(value);

export const eventAccess = (event, session) => {
  if (!session?.user) return "none";
  if (isAdmin(session)) return "admin";
  if (session.user.role !== "collaboratore") return "none";
  const userId = String(session.user.id);
  if (String(event.responsabile?._id || event.responsabile) === userId) return "responsabile";
  const assigned = (event.collaboratori || []).some(
    (item) => String(item?._id || item) === userId
  );
  return assigned ? "collaboratore" : "none";
};

const decimalString = (value) => {
  if (value == null) return "0.00";
  const raw = typeof value === "object" && value.toString ? value.toString() : String(value);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : "0.00";
};

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

const expandDateRange = (startValue, endValue = startValue) => {
  if (!startValue) return [];
  const start = new Date(startValue);
  const end = new Date(endValue || startValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];
  const days = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 12));
  while (cursor <= last && days.length < 366) {
    days.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const eventDays = (event) => {
  const source = event.giornateEvento?.length
    ? event.giornateEvento
    : expandDateRange(event.dataInizio, event.dataFine);
  return [...source].sort((a, b) => new Date(a) - new Date(b));
};

const person = (value) => value ? {
  _id: String(value._id || value),
  nome: value.nome || "",
  cognome: value.cognome || "",
  subRoles: value.subRoles || [],
} : null;

export const serializeEvent = (document, access) => {
  const event = document.toObject ? document.toObject() : document;
  const common = {
    _id: String(event._id),
    tipo: event.tipo || "evento",
    nome: event.nome,
    dataInizio: event.dataInizio,
    dataFine: event.dataFine,
    giornateEvento: eventDays(event),
    luogo: event.luogo,
    responsabile: person(event.responsabile),
    access,
  };

  if (access === "collaboratore") return common;

  const operational = {
    ...common,
    azienda: event.azienda ? {
      _id: String(event.azienda._id || event.azienda),
      etichetta: event.azienda.etichetta || event.azienda.ragioneSociale || "",
    } : null,
    collaboratori: (event.collaboratori || []).map(person),
    postTotali: event.postTotali || 0,
    postFatti: event.postFatti || 0,
    appuntamentiTotali: event.appuntamentiTotali || 0,
    appuntamentiFatti: event.appuntamentiFatti || 0,
    inizioSocial: event.inizioSocial,
    fineSocial: event.fineSocial,
    socialGestiti: event.socialGestiti || [],
    noteInterne: event.noteInterne || "",
    noteShooting: event.noteShooting || "",
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };

  if (access !== "admin") return operational;
  return {
    ...operational,
    pagamentoTotale: decimalString(event.pagamentoTotale),
    tranche: (event.tranche || []).map((item) => ({
      _id: String(item._id),
      descrizione: item.descrizione || "",
      importo: decimalString(item.importo),
      scadenza: item.scadenza,
      stato: item.stato,
    })),
    hardDisk: Boolean(event.hardDisk),
    report: Boolean(event.report),
  };
};

export const populateEvent = (query) => query
  .populate("responsabile", "nome cognome subRoles status")
  .populate("collaboratori", "nome cognome subRoles status")
  .populate("azienda", "etichetta ragioneSociale");

const parseDate = (value, required = false) => {
  if (!value) {
    if (required) throw new Error("Data obbligatoria");
    return null;
  }
  const date = new Date(`${value}`.length === 10 ? `${value}T12:00:00.000Z` : value);
  if (Number.isNaN(date.getTime())) throw new Error("Data non valida");
  return date;
};

const normalizeEventDays = (body) => {
  const rawDays = Array.isArray(body.giornateEvento) && body.giornateEvento.length
    ? body.giornateEvento
    : expandDateRange(body.dataInizio, body.dataFine || body.dataInizio);
  const unique = [...new Set(rawDays.map((value) => dateKey(parseDate(value, true))))].sort();
  if (!unique.length) throw new Error("Inserisci almeno una data EVENTO");
  if (unique.length > 366) throw new Error("Un evento non può contenere più di 366 giornate");
  return unique.map((value) => parseDate(value, true));
};

const nonNegativeInteger = (value, label) => {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number < 0) throw new Error(`${label} deve essere un intero maggiore o uguale a zero`);
  return number;
};

const decimal = (value, label) => {
  const normalized = String(value ?? "0").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label} non valido`);
  return mongoose.Types.Decimal128.fromString(number.toFixed(2));
};

export async function validateAdminEventPayload(body) {
  const tipo = body.tipo === "shooting" ? "shooting" : "evento";
  const nome = String(body.nome || "").trim();
  const luogo = String(body.luogo || "").trim();
  if (!nome) throw new Error(`Nome ${tipo} obbligatorio`);
  if (!luogo) throw new Error(`Luogo ${tipo} obbligatorio`);
  if (!isValidId(body.responsabile)) throw new Error("Responsabile non valido");

  const giornateEvento = normalizeEventDays(body);
  const dataInizio = giornateEvento[0];
  const dataFine = giornateEvento[giornateEvento.length - 1];

  const inizioSocial = tipo === "evento" ? parseDate(body.inizioSocial) : null;
  const fineSocial = tipo === "evento" ? parseDate(body.fineSocial) : null;
  if (inizioSocial && fineSocial && fineSocial < inizioSocial) {
    throw new Error("La fine social non può precedere l'inizio social");
  }

  const collaboratorIds = [...new Set([...(body.collaboratori || []), body.responsabile].filter(Boolean))];
  if (collaboratorIds.some((id) => !isValidId(id))) throw new Error("Collaboratore non valido");
  const activeCount = await Collaboratore.countDocuments({ _id: { $in: collaboratorIds }, status: { $ne: "non_attivo" } });
  if (activeCount !== collaboratorIds.length) throw new Error("Uno o più collaboratori non sono attivi o non esistono");

  let azienda = null;
  if (body.azienda) {
    if (!isValidId(body.azienda) || !(await Azienda.exists({ _id: body.azienda }))) throw new Error("Azienda non valida");
    azienda = body.azienda;
  }

  const tranche = (body.tranche || []).map((item, index) => ({
    ...(item._id && isValidId(item._id) ? { _id: item._id } : {}),
    descrizione: String(item.descrizione || `Tranche ${index + 1}`).trim(),
    importo: decimal(item.importo, `Importo tranche ${index + 1}`),
    scadenza: parseDate(item.scadenza),
    stato: ["da_pagare", "pagata", "scaduta"].includes(item.stato) ? item.stato : "da_pagare",
  }));

  const socialConsentiti = ["instagram", "facebook", "tiktok", "youtube", "linkedin"];
  const socialGestiti = tipo === "evento"
    ? [...new Set((body.socialGestiti || []).filter((value) => socialConsentiti.includes(value)))]
    : [];

  return {
    tipo, nome, azienda, dataInizio, dataFine, giornateEvento, luogo,
    responsabile: body.responsabile,
    collaboratori: collaboratorIds,
    postTotali: tipo === "evento" ? nonNegativeInteger(body.postTotali, "Post totali") : 0,
    postFatti: tipo === "evento" ? nonNegativeInteger(body.postFatti, "Post fatti") : 0,
    appuntamentiTotali: tipo === "evento" ? nonNegativeInteger(body.appuntamentiTotali, "Appuntamenti totali") : 0,
    appuntamentiFatti: tipo === "evento" ? nonNegativeInteger(body.appuntamentiFatti, "Appuntamenti fatti") : 0,
    inizioSocial, fineSocial, socialGestiti,
    noteInterne: tipo === "evento" ? String(body.noteInterne || "") : "",
    noteShooting: tipo === "shooting" ? String(body.noteShooting || "") : "",
    pagamentoTotale: decimal(body.pagamentoTotale, "Pagamento totale"),
    tranche,
    hardDisk: Boolean(body.hardDisk),
    report: Boolean(body.report),
  };
}

export function validateResponsibleEventPayload(body) {
  const updates = {};
  if (body.tipo === "shooting") {
    if ("noteShooting" in body) updates.noteShooting = String(body.noteShooting || "");
    return updates;
  }
  if ("postTotali" in body) updates.postTotali = nonNegativeInteger(body.postTotali, "Post totali");
  if ("postFatti" in body) updates.postFatti = nonNegativeInteger(body.postFatti, "Post fatti");
  if ("appuntamentiTotali" in body) updates.appuntamentiTotali = nonNegativeInteger(body.appuntamentiTotali, "Appuntamenti totali");
  if ("appuntamentiFatti" in body) updates.appuntamentiFatti = nonNegativeInteger(body.appuntamentiFatti, "Appuntamenti fatti");
  if ("noteInterne" in body) updates.noteInterne = String(body.noteInterne || "");
  if ("inizioSocial" in body) updates.inizioSocial = parseDate(body.inizioSocial);
  if ("fineSocial" in body) updates.fineSocial = parseDate(body.fineSocial);
  const start = updates.inizioSocial || parseDate(body.currentInizioSocial);
  const end = updates.fineSocial || parseDate(body.currentFineSocial);
  if (start && end && end < start) throw new Error("La fine social non può precedere l'inizio social");
  return updates;
}

export const assignmentToJSON = (document) => {
  const item = document.toObject ? document.toObject() : document;
  return {
    _id: String(item._id),
    evento: String(item.evento?._id || item.evento),
    collaboratore: person(item.collaboratore),
    dataLavoro: item.dataLavoro,
    mansione: item.mansione,
    noteCollaboratore: item.noteCollaboratore || "",
  };
};

export const isEventDay = (event, value) => {
  if (!value) return false;
  const allowed = eventDays(event).map(dateKey);
  return allowed.includes(dateKey(value));
};
