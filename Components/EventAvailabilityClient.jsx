"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, HelpCircle, MapPin, X } from "lucide-react";

const ANSWER_OPTIONS = [
  { value: "si", label: "Sì", Icon: Check, selectedClass: "border-emerald-600 bg-emerald-600 text-white" },
  { value: "no", label: "No", Icon: X, selectedClass: "border-rose-600 bg-rose-600 text-white" },
  { value: "forse", label: "Forse", Icon: HelpCircle, selectedClass: "border-amber-500 bg-amber-500 text-slate-950" },
];

export default function EventAvailabilityClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState("");

  const load = async () => {
    try {
      const response = await fetch("/api/disponibilita-eventi", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Impossibile caricare le disponibilità");
      setData(body);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => { load(); }, []);

  if (error && !data) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!data) return <p className="py-12 text-center text-slate-500">Caricamento disponibilità…</p>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Disponibilità Eventi & Shooting</h1>
        <p className="mt-1 text-slate-600">
          {data.mode === "admin"
            ? "Controlla le risposte dei ragazzi, data per data."
            : "Apri un evento e indica la tua disponibilità per ciascuna data."}
        </p>
      </header>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <div className="space-y-3">
        {data.events.map((event) => {
          const isOpen = open === event._id;
          const sharedProps = {
            event,
            open: isOpen,
            toggle: () => setOpen(isOpen ? "" : event._id),
          };
          return data.mode === "admin"
            ? <AdminRow key={event._id} {...sharedProps} data={data} />
            : <CollaboratorRow key={event._id} {...sharedProps} onSaved={load} />;
        })}
        {!data.events.length && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">Nessun evento o shooting futuro.</div>}
      </div>
    </div>
  );
}

function EventSummary({ event }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-bold text-slate-900">{event.nome}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${event.tipo === "shooting" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}`}>
          {event.tipo === "shooting" ? "Shooting" : "Evento"}
        </span>
      </div>
      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{daysLabel(event)}</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.luogo}</span>
      </p>
    </div>
  );
}

function CollaboratorRow({ event, open, toggle, onSaved }) {
  const dates = useMemo(() => eventDates(event), [event]);
  const [answers, setAnswers] = useState(() => answersFromResponse(event.risposta));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const completed = dates.filter((date) => answers[date]?.stato).length;
  const missingMaybeReason = dates.some((date) => answers[date]?.stato === "forse" && !answers[date]?.nota?.trim());
  const canSave = completed === dates.length && !missingMaybeReason && !saving;
  const panelId = `availability-${event._id}`;

  const updateStatus = (date, stato) => {
    setSaved(false);
    setError("");
    setAnswers((current) => ({
      ...current,
      [date]: { stato, nota: stato === "forse" ? current[date]?.nota || "" : "" },
    }));
  };

  const updateNote = (date, nota) => {
    setSaved(false);
    setAnswers((current) => ({ ...current, [date]: { ...current[date], nota } }));
  };

  const save = async (submitEvent) => {
    submitEvent.preventDefault();
    if (!canSave) {
      setError(missingMaybeReason ? "Spiega il motivo per ogni risposta Forse." : "Rispondi a tutte le date prima di salvare.");
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const response = await fetch("/api/disponibilita-eventi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evento: event._id,
          risposteGiornaliere: dates.map((data) => ({ data, ...answers[data] })),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.message || "Impossibile salvare le disponibilità");
      setAnswers(answersFromResponse(body));
      setSaved(true);
      await onSaved();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={panelId} className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600">
        <EventSummary event={event} />
        <div className="flex shrink-0 items-center gap-3">
          <span className={`hidden text-sm font-semibold sm:block ${completed === dates.length ? "text-emerald-700" : "text-slate-500"}`}>
            {completed === dates.length ? "Completo" : `${completed}/${dates.length} date`}
          </span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <form id={panelId} onSubmit={save} className="border-t border-slate-100 p-5">
          <div className="space-y-5">
            {dates.map((date, index) => {
              const answer = answers[date] || { stato: "", nota: "" };
              const needsReason = answer.stato === "forse";
              const fieldId = `reason-${event._id}-${date}`;
              return (
                <fieldset key={date} className={index ? "border-t border-slate-100 pt-5" : ""}>
                  <legend className="w-full text-sm font-bold capitalize text-slate-900">{longDate(date)}</legend>
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:flex">
                    {ANSWER_OPTIONS.map(({ value, label, Icon, selectedClass }) => (
                      <button
                        type="button"
                        key={value}
                        aria-pressed={answer.stato === value}
                        onClick={() => updateStatus(date, value)}
                        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 py-2 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:min-w-24 ${answer.stato === value ? selectedClass : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                      >
                        <Icon aria-hidden="true" className="h-4 w-4" />{label}
                      </button>
                    ))}
                  </div>
                  {needsReason && (
                    <div className="mt-3">
                      <label htmlFor={fieldId} className="text-sm font-semibold text-slate-800">Perché forse? <span className="text-rose-600">*</span></label>
                      <textarea
                        id={fieldId}
                        required
                        value={answer.nota}
                        onChange={(changeEvent) => updateNote(date, changeEvent.target.value)}
                        className="mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                        placeholder="Spiega cosa devi verificare per questa data…"
                      />
                    </div>
                  )}
                </fieldset>
              );
            })}
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="text-sm">
              {error && <p className="font-medium text-red-700">{error}</p>}
              {!error && saved && <p className="font-medium text-emerald-700">Disponibilità salvate.</p>}
              {!error && !saved && !canSave && <p className="text-slate-500">Completa tutte le date. Per “Forse” il motivo è obbligatorio.</p>}
            </div>
            <button disabled={!canSave} className="rounded-lg bg-slate-900 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? "Salvataggio…" : "Salva tutte le disponibilità"}
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

function AdminRow({ event, data, open, toggle }) {
  const dates = eventDates(event);
  const responses = useMemo(() => data.responses.filter((item) => String(item.evento) === String(event._id)), [data.responses, event._id]);
  const dailyAnswers = responses.flatMap((response) => response.risposteGiornaliere || []);
  const count = (value) => dailyAnswers.filter((answer) => answer.stato === value).length;
  const totalExpected = data.collaborators.length * dates.length;
  const panelId = `admin-availability-${event._id}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button type="button" onClick={toggle} aria-expanded={open} aria-controls={panelId} className="flex w-full items-center justify-between gap-4 p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600">
        <EventSummary event={event} />
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-slate-500 lg:block">
            <b className="text-emerald-700">{count("si")} sì</b> · <b className="text-rose-700">{count("no")} no</b> · <b className="text-amber-700">{count("forse")} forse</b> · {Math.max(0, totalExpected - dailyAnswers.length)} senza risposta
          </span>
          <ChevronDown aria-hidden="true" className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open && (
        <div id={panelId} className="border-t border-slate-100 p-5">
          <div className="space-y-6">
            {dates.map((date) => (
              <section key={date}>
                <h3 className="text-sm font-bold capitalize text-slate-900">{longDate(date)}</h3>
                <div className="mt-2 divide-y divide-slate-100 rounded-xl bg-slate-50 px-4">
                  {data.collaborators.map((person) => {
                    const response = responses.find((item) => String(item.collaboratore) === String(person._id));
                    const answer = response?.risposteGiornaliere?.find((item) => dateKey(item.data) === date);
                    return (
                      <div key={person._id} className="flex flex-col justify-between gap-1 py-3 sm:flex-row sm:items-start sm:gap-4">
                        <span className="font-semibold text-slate-800">{person.nome} {person.cognome}</span>
                        <span className={`text-sm sm:max-w-[60%] sm:text-right ${statusTextClass(answer?.stato)}`}>
                          <b>{statusLabel(answer?.stato)}</b>{answer?.nota ? ` · ${answer.nota}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

function eventDates(event) {
  const explicitDates = event.giornateEvento?.map(dateKey).filter(Boolean) || [];
  if (explicitDates.length) return [...new Set(explicitDates)].sort();
  const start = new Date(event.dataInizio);
  const end = new Date(event.dataFine || event.dataInizio);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  const dates = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate(), 12));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate(), 12));
  while (cursor <= last && dates.length < 366) {
    dates.push(dateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

function answersFromResponse(response) {
  return Object.fromEntries((response?.risposteGiornaliere || []).map((answer) => [dateKey(answer.data), { stato: answer.stato, nota: answer.nota || "" }]));
}

function dateKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function longDate(value) {
  return new Date(`${value}T12:00:00.000Z`).toLocaleDateString("it-IT", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
}

function daysLabel(event) {
  const dates = eventDates(event);
  const labels = dates.map((value) => new Date(`${value}T12:00:00.000Z`).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }));
  return labels.length <= 3 ? labels.join(" · ") : `${labels.slice(0, 2).join(" · ")} · +${labels.length - 2} giornate`;
}

function statusLabel(status) {
  return { si: "Sì", no: "No", forse: "Forse" }[status] || "Non risposta";
}

function statusTextClass(status) {
  return { si: "text-emerald-700", no: "text-rose-700", forse: "text-amber-700" }[status] || "text-slate-500";
}
