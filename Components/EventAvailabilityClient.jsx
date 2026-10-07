"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronDown, HelpCircle, MapPin, X } from "lucide-react";

export default function EventAvailabilityClient() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState("");
  const load = () => fetch("/api/disponibilita-eventi", { cache: "no-store" }).then(async (res) => { const body = await res.json(); if (!res.ok) throw new Error(body.message); setData(body); }).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!data) return <p className="py-12 text-center text-slate-500">Caricamento disponibilità…</p>;
  return <div className="space-y-6"><header><h1 className="text-3xl font-bold text-slate-900">Disponibilità Eventi & Shooting</h1><p className="mt-1 text-slate-600">{data.mode === "admin" ? "Controlla chi è disponibile e chi deve ancora rispondere." : "Indica la tua disponibilità per ogni data o periodo."}</p></header><div className="space-y-3">{data.events.map((event) => data.mode === "admin" ? <AdminRow key={event._id} event={event} data={data} open={open === event._id} toggle={() => setOpen(open === event._id ? "" : event._id)} /> : <CollaboratorRow key={event._id} event={event} onSaved={load} />)}{!data.events.length && <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">Nessun evento o shooting futuro.</div>}</div></div>;
}

function EventSummary({ event }) { return <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold text-slate-900">{event.nome}</h2><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${event.tipo === "shooting" ? "bg-slate-100 text-slate-700" : "bg-blue-50 text-blue-700"}`}>{event.tipo === "shooting" ? "Shooting" : "Evento"}</span></div><p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" />{daysLabel(event)}</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{event.luogo}</span></p></div>; }

function CollaboratorRow({ event, onSaved }) {
  const [stato, setStato] = useState(event.risposta?.stato || ""); const [nota, setNota] = useState(event.risposta?.nota || ""); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const save = async () => { setSaving(true); setError(""); const res = await fetch("/api/disponibilita-eventi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evento: event._id, stato, nota }) }); const body = await res.json(); setSaving(false); if (!res.ok) return setError(body.message); onSaved(); };
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><EventSummary event={event} /><div className="mt-4 flex flex-wrap gap-2">{[{ v: "si", l: "Sì", I: Check }, { v: "no", l: "No", I: X }, { v: "forse", l: "Forse", I: HelpCircle }].map(({ v, l, I }) => <button type="button" key={v} onClick={() => setStato(v)} className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-lg border px-4 py-2 font-semibold ${stato === v ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}><I className="h-4 w-4" />{l}</button>)}</div>{stato === "forse" && <textarea value={nota} onChange={(e) => setNota(e.target.value)} className="mt-3 min-h-24 w-full rounded-lg border border-slate-300 p-3" placeholder="Spiega cosa devi verificare…" />}{error && <p className="mt-2 text-sm text-red-600">{error}</p>}<button disabled={!stato || saving} onClick={save} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white disabled:opacity-40">{saving ? "Salvataggio…" : "Salva disponibilità"}</button></article>;
}

function AdminRow({ event, data, open, toggle }) {
  const responses = useMemo(() => data.responses.filter((item) => String(item.evento) === String(event._id)), [data.responses, event._id]);
  const count = (value) => responses.filter((item) => item.stato === value).length;
  return <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><button onClick={toggle} className="flex w-full items-center justify-between gap-4 p-5 text-left"><EventSummary event={event} /><div className="flex items-center gap-3"><span className="hidden text-sm text-slate-500 sm:block"><b className="text-green-700">{count("si")} sì</b> · <b className="text-red-700">{count("no")} no</b> · <b className="text-amber-700">{count("forse")} forse</b> · {data.collaborators.length - responses.length} senza risposta</span><ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} /></div></button>{open && <div className="border-t border-slate-100 p-5"><div className="divide-y divide-slate-100">{data.collaborators.map((person) => { const answer = responses.find((item) => String(item.collaboratore) === String(person._id)); return <div key={person._id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"><span className="font-semibold text-slate-800">{person.nome} {person.cognome}</span><span className="text-sm text-slate-600"><b className="uppercase">{answer?.stato || "Non risposta"}</b>{answer?.nota ? ` · ${answer.nota}` : ""}</span></div>; })}</div></div>}</article>;
}

function daysLabel(event) { const dates = event.giornateEvento?.length ? event.giornateEvento : [event.dataInizio, event.dataFine].filter(Boolean); const labels = [...new Set(dates.map((value) => new Date(value).toLocaleDateString("it-IT", { timeZone: "UTC" })))]; return labels.length <= 3 ? labels.join(" · ") : `${labels.slice(0, 2).join(" · ")} · +${labels.length - 2} giornate`; }
