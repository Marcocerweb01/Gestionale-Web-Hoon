"use client";

import { useEffect, useMemo, useState } from "react";

const dateValue = (value) => value ? new Date(value).toISOString().slice(0, 10) : "";
const emptyTranche = (index) => ({ descrizione: `Tranche ${index + 1}`, importo: "0.00", scadenza: "", stato: "da_pagare" });

const legacyEventDays = (event) => {
  if (!event) return [];
  if (event.giornateEvento?.length) return event.giornateEvento.map(dateValue).sort();
  const start = dateValue(event.dataInizio);
  const end = dateValue(event.dataFine || event.dataInizio);
  if (!start) return [];
  const days = [];
  const cursor = new Date(`${start}T12:00:00.000Z`);
  const last = new Date(`${end}T12:00:00.000Z`);
  while (cursor <= last && days.length < 366) {
    days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
};

const initialForm = (event) => ({
  tipo: event?.tipo || "evento",
  nome: event?.nome || "",
  azienda: event?.azienda?._id || "",
  giornateEvento: legacyEventDays(event),
  orariGiornate: Object.fromEntries((event?.orariGiornate || []).map(({ data, inizio, fine }) => [data, { inizio, fine }])),
  luogo: event?.luogo || "",
  responsabile: event?.responsabile?._id || "",
  collaboratori: event?.collaboratori?.map((item) => item._id) || [],
  postTotali: event?.postTotali ?? 0,
  postFatti: event?.postFatti ?? 0,
  appuntamentiTotali: event?.appuntamentiTotali ?? 0,
  appuntamentiFatti: event?.appuntamentiFatti ?? 0,
  inizioSocial: dateValue(event?.inizioSocial),
  fineSocial: dateValue(event?.fineSocial),
  socialGestiti: event?.socialGestiti || [],
  noteInterne: event?.noteInterne || "",
  noteShooting: event?.noteShooting || "",
  pagamentoTotale: event?.pagamentoTotale || "0.00",
  tranche: event
    ? (event.tranche || []).map((item) => ({ ...item, scadenza: dateValue(item.scadenza) }))
    : [emptyTranche(0)],
  hardDisk: Boolean(event?.hardDisk),
  report: Boolean(event?.report),
});

const field = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export async function requestEventAvailability(eventId) {
  try {
    const response = await fetch(`/api/eventi/${eventId}/richiedi-disponibilita`, { method: "POST" });
    const data = await response.json();
    return { message: data.message, error: !response.ok, destinatari: data.destinatari };
  } catch {
    return { message: "Impossibile inviare la richiesta. Riprova.", error: true };
  }
}

export default function EventForm({ event, defaultType = "evento", access = "admin", onSaved, onCancel }) {
  const [form, setForm] = useState(() => ({ ...initialForm(event), tipo: event?.tipo || defaultType }));
  const [options, setOptions] = useState({ collaboratori: [], responsabili: [], aziende: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  useEffect(() => setForm({ ...initialForm(event), tipo: event?.tipo || defaultType }), [event, defaultType]);
  useEffect(() => {
    if (access !== "admin") return;
    fetch("/api/eventi/opzioni", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setOptions(data);
      })
      .catch((err) => setError(err.message));
  }, [access]);

  const trancheTotal = useMemo(
    () => form.tranche.reduce((sum, item) => sum + (Number(String(item.importo).replace(",", ".")) || 0), 0),
    [form.tranche]
  );
  const paymentDifference = Math.abs(trancheTotal - (Number(String(form.pagamentoTotale).replace(",", ".")) || 0));
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const addEventDates = (dates) => set("giornateEvento", [...new Set([...form.giornateEvento, ...dates])].sort());
  const setDayTime = (day, key, value) => setForm((current) => ({
    ...current,
    orariGiornate: {
      ...current.orariGiornate,
      [day]: { ...current.orariGiornate[day], [key]: value },
    },
  }));
  const removeDay = (day) => setForm((current) => {
    const orariGiornate = { ...current.orariGiornate };
    delete orariGiornate[day];
    return { ...current, orariGiornate, giornateEvento: current.giornateEvento.filter((value) => value !== day) };
  });
  const addSingleDate = () => {
    if (!singleDate) return;
    addEventDates([singleDate]);
    setSingleDate("");
  };
  const addDateRange = () => {
    if (!rangeStart || !rangeEnd) return setError("Seleziona inizio e fine dell’intervallo EVENTO");
    const start = new Date(`${rangeStart}T12:00:00.000Z`);
    const end = new Date(`${rangeEnd}T12:00:00.000Z`);
    if (end < start) return setError("La fine dell’intervallo EVENTO non può precedere l’inizio");
    const dates = [];
    while (start <= end && dates.length < 366) {
      dates.push(start.toISOString().slice(0, 10));
      start.setUTCDate(start.getUTCDate() + 1);
    }
    addEventDates(dates);
    setRangeStart("");
    setRangeEnd("");
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const action = e.nativeEvent.submitter?.value;
    const requestAvailability = access === "admin" && action === "request-availability";
    const confermaTeam = access === "admin" && action === "confirm-team";
    setLoading(true);
    setError("");
    try {
      const response = await fetch(event ? `/api/eventi/${event._id}` : "/api/eventi", {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          confermaTeam,
          orariGiornate: Object.entries(form.orariGiornate).map(([data, orari]) => ({ data, ...orari })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Salvataggio non riuscito");
      const feedback = requestAvailability ? await requestEventAvailability(data._id) : null;
      if (feedback?.destinatari) data.destinatariDisponibilita = feedback.destinatari;
      onSaved?.(data, feedback);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (access === "responsabile") {
    if (form.tipo === "shooting") return (
      <form onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <DatePanel title="DATE SHOOTING" tone="blue"><div className="flex flex-wrap gap-2">{form.giornateEvento.map((day) => <DateBadge key={day} value={day} />)}</div></DatePanel>
        <Label title="Note Shooting"><textarea className={`${field} min-h-36`} value={form.noteShooting} onChange={(e) => set("noteShooting", e.target.value)} /></Label>
        <Actions loading={loading} onCancel={onCancel} type="shooting" />
      </form>
    );
    return (
      <form onSubmit={submit} className="space-y-5">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <DatePanel title="DATE EVENTO" tone="blue">
          <div className="flex flex-wrap gap-2">{form.giornateEvento.map((day) => <DateBadge key={day} value={day} />)}</div>
        </DatePanel>
        <div className="grid gap-4 md:grid-cols-2">
          <Label title="Post previsti"><input className={field} type="number" min="0" value={form.postTotali} onChange={(e) => set("postTotali", e.target.value)} /></Label>
          <Label title="Post fatti"><input className={field} type="number" min="0" value={form.postFatti} onChange={(e) => set("postFatti", e.target.value)} /></Label>
          <Label title="Appuntamenti previsti"><input className={field} type="number" min="0" value={form.appuntamentiTotali} onChange={(e) => set("appuntamentiTotali", e.target.value)} /></Label>
          <Label title="Appuntamenti fatti"><input className={field} type="number" min="0" value={form.appuntamentiFatti} onChange={(e) => set("appuntamentiFatti", e.target.value)} /></Label>
        </div>
        <DatePanel title="DATE GESTIONE SOCIAL" tone="violet">
          <div className="grid gap-4 md:grid-cols-2"><Label title="Inizio gestione social"><input className={field} type="date" value={form.inizioSocial} onChange={(e) => set("inizioSocial", e.target.value)} /></Label><Label title="Fine gestione social"><input className={field} type="date" min={form.inizioSocial} value={form.fineSocial} onChange={(e) => set("fineSocial", e.target.value)} /></Label></div>
        </DatePanel>
        <Label title="Note operative interne"><textarea className={`${field} min-h-28`} value={form.noteInterne} onChange={(e) => set("noteInterne", e.target.value)} /></Label>
        <Actions loading={loading} onCancel={onCancel} type={form.tipo} />
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Section title="Informazioni generali">
        <div className="grid gap-4 md:grid-cols-2">
          <Label title={`Nome ${form.tipo} *`}><input className={field} required value={form.nome} onChange={(e) => set("nome", e.target.value)} /></Label>
          <Label title="Luogo *"><input className={field} required value={form.luogo} onChange={(e) => set("luogo", e.target.value)} /></Label>
          <Label title="Anagrafica collegata">
            <select className={field} value={form.azienda} onChange={(e) => set("azienda", e.target.value)}>
              <option value="">Nessuna azienda</option>
              {options.aziende.map((item) => <option key={item._id} value={item._id}>{item.etichetta || item.ragioneSociale}</option>)}
            </select>
          </Label>
          <Label title="Responsabile *">
            <select className={field} required value={form.responsabile} onChange={(e) => set("responsabile", e.target.value)}>
              <option value="">Seleziona</option>
              {event?.responsabile && !options.responsabili.some((item) => item._id === event.responsabile._id) && (
                <option value={event.responsabile._id}>{event.responsabile.nome} {event.responsabile.cognome} (attuale)</option>
              )}
              {options.responsabili.map((item) => <option key={item._id} value={item._id}>{item.nome} {item.cognome}</option>)}
            </select>
          </Label>
        </div>
      </Section>

      <DatePanel title={`DATE ${form.tipo.toUpperCase()}`} tone="blue">
        <p className="text-sm text-slate-600">Aggiungi tutte le giornate effettive, anche quando non sono consecutive.</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_1fr_auto] lg:items-end">
          <Label title="Singola giornata"><input className={field} type="date" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} /></Label>
          <button type="button" onClick={addSingleDate} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">Aggiungi data</button>
          <Label title="Intervallo dal"><input className={field} type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /></Label>
          <Label title="al"><input className={field} type="date" min={rangeStart} value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} /></Label>
          <button type="button" onClick={addDateRange} className="rounded-lg border border-blue-300 bg-white px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50">Aggiungi intervallo</button>
        </div>
        <div className="min-h-12 space-y-3 rounded-xl border border-blue-100 bg-white p-3">
          {form.giornateEvento.length === 0 && <span className="text-sm text-slate-400">Nessuna data {form.tipo.toUpperCase()} inserita</span>}
          {form.giornateEvento.map((day) => (
            <div key={day} className="grid items-end gap-3 sm:grid-cols-3">
              <div><DateBadge value={day} onRemove={() => removeDay(day)} /></div>
              <Label title="Inizio (facoltativo)">
                <input className={field} type="time" value={form.orariGiornate[day]?.inizio || ""} onChange={(e) => setDayTime(day, "inizio", e.target.value)} />
              </Label>
              <Label title="Fine (facoltativa)">
                <input className={field} type="time" value={form.orariGiornate[day]?.fine || ""} onChange={(e) => setDayTime(day, "fine", e.target.value)} />
              </Label>
            </div>
          ))}
        </div>
      </DatePanel>

      <TeamPicker
        title="Team"
        description={event?.teamConfermato === true
          ? "Seleziona chi partecipa all’evento."
          : "Dopo aver controllato le risposte, seleziona chi partecipa e premi Conferma team. La raccolta delle disponibilità si chiuderà."}
        people={options.collaboratori}
        selected={form.collaboratori}
        onChange={(ids) => set("collaboratori", ids)}
      />

      {form.tipo === "evento" ? <><Section title="Obiettivi e avanzamento">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Label title="Post previsti"><input className={field} type="number" min="0" value={form.postTotali} onChange={(e) => set("postTotali", e.target.value)} /></Label>
          <Label title="Post fatti"><input className={field} type="number" min="0" value={form.postFatti} onChange={(e) => set("postFatti", e.target.value)} /></Label>
          <Label title="Appuntamenti previsti"><input className={field} type="number" min="0" value={form.appuntamentiTotali} onChange={(e) => set("appuntamentiTotali", e.target.value)} /></Label>
          <Label title="Appuntamenti fatti"><input className={field} type="number" min="0" value={form.appuntamentiFatti} onChange={(e) => set("appuntamentiFatti", e.target.value)} /></Label>
        </div>
        <Label title="Note operative interne"><textarea className={`${field} min-h-28`} value={form.noteInterne} onChange={(e) => set("noteInterne", e.target.value)} /></Label>
      </Section>

      <DatePanel title="DATE GESTIONE SOCIAL" tone="violet">
        <p className="text-sm text-slate-600">Periodo dedicato alla comunicazione social: è separato dalle giornate in cui si svolge l’evento.</p>
        <div className="grid gap-4 md:grid-cols-2"><Label title="Inizio gestione social"><input className={field} type="date" value={form.inizioSocial} onChange={(e) => set("inizioSocial", e.target.value)} /></Label><Label title="Fine gestione social"><input className={field} type="date" min={form.inizioSocial} value={form.fineSocial} onChange={(e) => set("fineSocial", e.target.value)} /></Label></div>
        <div><p className="mb-2 text-sm font-semibold text-violet-900">Social gestiti</p><div className="flex flex-wrap gap-2">{SOCIALS.map((social) => <label key={social.value} className={`cursor-pointer rounded-full border px-3 py-2 text-sm font-semibold transition ${form.socialGestiti.includes(social.value) ? "border-violet-600 bg-violet-600 text-white" : "border-violet-200 bg-white text-violet-800"}`}><input type="checkbox" className="sr-only" checked={form.socialGestiti.includes(social.value)} onChange={(e) => set("socialGestiti", e.target.checked ? [...form.socialGestiti, social.value] : form.socialGestiti.filter((item) => item !== social.value))} />{social.label}</label>)}</div></div>
      </DatePanel>
      </> : <Section title="Note Shooting"><Label title="Indicazioni, obiettivi e dettagli operativi"><textarea className={`${field} min-h-40`} value={form.noteShooting} onChange={(e) => set("noteShooting", e.target.value)} placeholder="Inserisci tutte le note utili per lo shooting…" /></Label></Section>}

      <Section title="Amministrazione">
        <Label title="Pagamento totale (€)"><input className={field} type="number" min="0" step="0.01" value={form.pagamentoTotale} onChange={(e) => set("pagamentoTotale", e.target.value)} /></Label>
        <div className="space-y-3">
          {form.tranche.map((item, index) => (
            <div key={item._id || index} className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-4">
              <input className={field} aria-label="Descrizione tranche" value={item.descrizione} onChange={(e) => set("tranche", form.tranche.map((row, i) => i === index ? { ...row, descrizione: e.target.value } : row))} />
              <input className={field} aria-label="Importo tranche" type="number" min="0" step="0.01" value={item.importo} onChange={(e) => set("tranche", form.tranche.map((row, i) => i === index ? { ...row, importo: e.target.value } : row))} />
              <input className={field} aria-label="Scadenza tranche" type="date" value={item.scadenza} onChange={(e) => set("tranche", form.tranche.map((row, i) => i === index ? { ...row, scadenza: e.target.value } : row))} />
              <div className="flex gap-2"><select className={field} value={item.stato} onChange={(e) => set("tranche", form.tranche.map((row, i) => i === index ? { ...row, stato: e.target.value } : row))}><option value="da_pagare">Da pagare</option><option value="pagata">Pagata</option><option value="scaduta">Scaduta</option></select><button type="button" className="rounded-lg px-3 text-red-600 hover:bg-red-50" onClick={() => set("tranche", form.tranche.filter((_, i) => i !== index))}>×</button></div>
            </div>
          ))}
          <button type="button" className="text-sm font-semibold text-blue-600 hover:text-blue-800" onClick={() => set("tranche", [...form.tranche, emptyTranche(form.tranche.length)])}>+ Aggiungi tranche</button>
          <p className={`text-sm ${paymentDifference > 0.009 ? "text-amber-700" : "text-green-700"}`}>Totale tranche: € {trancheTotal.toFixed(2)}{paymentDifference > 0.009 ? ` · differenza di € ${paymentDifference.toFixed(2)}` : " · importi allineati"}</p>
        </div>
      </Section>

      <Section title={`Chiusura ${form.tipo}`}>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.hardDisk} onChange={(e) => set("hardDisk", e.target.checked)} /> Hard Disk completato</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.report} onChange={(e) => set("report", e.target.checked)} /> Report completato</label>
        </div>
      </Section>
      <Actions loading={loading} onCancel={onCancel} type={form.tipo} canConfirmTeam={access === "admin" && event?.teamConfermato !== true} />
    </form>
  );
}

function TeamPicker({ title, description, people, selected, onChange }) {
  const groups = [
    { title: "Social Media Manager", people: people.filter(({ subRoles }) => subRoles.includes("smm")) },
    { title: "Fotografi", people: people.filter(({ subRoles }) => subRoles.includes("fotografo")) },
    { title: "Videomaker", people: people.filter(({ subRoles }) => subRoles.includes("videomaker")) },
  ];
  return (
    <Section title={title}>
      <p className="text-sm text-slate-600">{description}</p>
      {groups.map(({ title, people }) => (
        <details key={title} className="rounded-lg border border-gray-200">
          <summary className="cursor-pointer p-3 font-semibold text-gray-900">
            {title} ({people.filter(({ _id }) => selected.includes(_id)).length}/{people.length})
          </summary>
          {people.length ? (
            <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-3">
              {people.map(({ _id, nome, cognome, subRoles }) => (
                <label key={_id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(_id)}
                    onChange={(e) => onChange(e.target.checked ? [...selected, _id] : selected.filter((id) => id !== _id))}
                  />
                  <span>
                    <span className="block font-medium text-gray-900">{nome} {cognome}</span>
                    <span className="text-xs text-gray-500">{subRoles.join(", ")}</span>
                  </span>
                </label>
              ))}
            </div>
          ) : <p className="px-3 pb-3 text-sm text-gray-600">Nessun profilo attivo.</p>}
        </details>
      ))}
    </Section>
  );
}

function Label({ title, children }) { return <label className="block space-y-1.5"><span className="text-sm font-semibold text-gray-700">{title}</span>{children}</label>; }
function Section({ title, children }) { return <section className="space-y-4"><h3 className="border-b border-gray-200 pb-2 text-lg font-bold text-gray-900">{title}</h3>{children}</section>; }
function DatePanel({ title, tone, children }) { const colors = tone === "violet" ? "border-violet-200 bg-violet-50/60 text-violet-900" : "border-blue-200 bg-blue-50/60 text-blue-900"; return <section className={`space-y-4 rounded-2xl border p-5 ${colors}`}><h3 className="text-sm font-black tracking-[0.12em]">{title}</h3>{children}</section>; }
function DateBadge({ value, onRemove }) { return <span className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-600 px-3 py-1.5 text-sm font-bold text-white">{new Date(`${value}T12:00:00.000Z`).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })}{onRemove && <button type="button" onClick={onRemove} className="text-blue-100 hover:text-white" aria-label={`Rimuovi ${value}`}>×</button>}</span>; }
const SOCIALS = [{ value: "instagram", label: "Instagram" }, { value: "facebook", label: "Facebook" }, { value: "tiktok", label: "TikTok" }, { value: "youtube", label: "YouTube" }, { value: "linkedin", label: "LinkedIn" }];
function Actions({ loading, onCancel, type = "evento", canConfirmTeam = false }) {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-5">
      {onCancel && <button type="button" disabled={loading} onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700">Annulla</button>}
      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
        {loading ? "Salvataggio…" : `Salva ${type}`}
      </button>
      {canConfirmTeam && (
        <button type="submit" value="request-availability" disabled={loading} className="rounded-lg border border-blue-600 px-5 py-2 font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
          Salva e richiedi disponibilità
        </button>
      )}
      {canConfirmTeam && (
        <button type="submit" value="confirm-team" disabled={loading} className="rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">
          Conferma team
        </button>
      )}
    </div>
  );
}
