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
    nome: event.nome,
    dataInizio: event.dataInizio,
    dataFine: event.dataFine,
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
    noteInterne: event.noteInterne || "",
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
  const nome = String(body.nome || "").trim();
  const luogo = String(body.luogo || "").trim();
  if (!nome) throw new Error("Nome evento obbligatorio");
  if (!luogo) throw new Error("Luogo evento obbligatorio");
  if (!isValidId(body.responsabile)) throw new Error("Responsabile non valido");

  const dataInizio = parseDate(body.dataInizio, true);
  const dataFine = parseDate(body.dataFine || body.dataInizio, true);
  if (dataFine < dataInizio) throw new Error("La data finale non può precedere quella iniziale");

  const inizioSocial = parseDate(body.inizioSocial);
  const fineSocial = parseDate(body.fineSocial);
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

  return {
    nome, azienda, dataInizio, dataFine, luogo,
    responsabile: body.responsabile,
    collaboratori: collaboratorIds,
    postTotali: nonNegativeInteger(body.postTotali, "Post totali"),
    postFatti: nonNegativeInteger(body.postFatti, "Post fatti"),
    appuntamentiTotali: nonNegativeInteger(body.appuntamentiTotali, "Appuntamenti totali"),
    appuntamentiFatti: nonNegativeInteger(body.appuntamentiFatti, "Appuntamenti fatti"),
    inizioSocial, fineSocial,
    noteInterne: String(body.noteInterne || ""),
    pagamentoTotale: decimal(body.pagamentoTotale, "Pagamento totale"),
    tranche,
    hardDisk: Boolean(body.hardDisk),
    report: Boolean(body.report),
  };
}

export function validateResponsibleEventPayload(body) {
  const updates = {};
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
