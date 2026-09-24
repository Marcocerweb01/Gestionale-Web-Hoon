"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, CalendarRange, MapPin, MessageSquareText, Pencil, Target, Trash2, UserRound } from "lucide-react";
import EventForm from "./EventForm";
import EventAssignments from "./EventAssignments";

export default function EventoDetailClient({ eventId }) {
  const router = useRouter();
  const [event, setEvent] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const load = async () => {
    const response = await fetch(`/api/eventi/${eventId}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    setEvent(data);
  };
  useEffect(() => { load().catch((err) => setError(err.message)); }, [eventId]);
  const remove = async () => {
    if (!window.confirm("Eliminare definitivamente l'evento e tutte le sue attività?")) return;
    const response = await fetch(`/api/eventi/${eventId}`, { method: "DELETE" });
    if (response.ok) router.push("/Eventi"); else setError((await response.json()).message);
  };
  if (error) return <div className="rounded-xl bg-red-50 p-5 text-red-700">{error}</div>;
  if (!event) return <p className="py-12 text-center text-gray-500">Caricamento evento…</p>;

  return (
    <div className="space-y-6">
      <Link href="/Eventi" className="text-sm font-semibold text-blue-600 hover:text-blue-800">← Tutti gli eventi</Link>
      <header className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start"><div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">{event.access === "admin" ? "Amministrazione" : event.access === "responsabile" ? "Responsabile evento" : "La tua assegnazione"}</span><h1 className="mt-3 text-3xl font-bold">{event.nome}</h1><div className="mt-4 flex flex-wrap gap-4 text-sm text-blue-100"><span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {formatRange(event.dataInizio, event.dataFine)}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {event.luogo}</span><span className="flex items-center gap-2"><UserRound className="h-4 w-4" /> {event.responsabile?.nome} {event.responsabile?.cognome}</span></div></div>{event.access !== "collaboratore" && <div className="flex gap-2"><button onClick={() => setEditing(!editing)} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 font-semibold text-slate-900"><Pencil className="h-4 w-4" /> Modifica</button>{event.access === "admin" && <button onClick={remove} className="rounded-lg bg-red-600 p-2.5 text-white" title="Elimina evento"><Trash2 className="h-4 w-4" /></button>}</div>}</div>
      </header>

      {editing && <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><EventForm event={event} access={event.access} onCancel={() => setEditing(false)} onSaved={(updated) => { setEvent(updated); setEditing(false); }} /></div>}

      {event.access !== "collaboratore" && !editing && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-blue-50 p-2.5 text-blue-700"><Target className="h-5 w-5" /></span>
              <div><h2 className="text-lg font-bold text-slate-900">Avanzamento e social</h2><p className="text-sm text-slate-500">Risultati operativi rispetto agli obiettivi dell’evento.</p></div>
            </div>
          </div>
          <div className="grid lg:grid-cols-[1.4fr_0.6fr]">
            <div className="grid gap-4 p-5 sm:grid-cols-2 md:p-6 lg:border-r lg:border-slate-100">
              <Progress label="Post" done={event.postFatti} total={event.postTotali} color="blue" />
              <Progress label="Appuntamenti" done={event.appuntamentiFatti} total={event.appuntamentiTotali} color="violet" />
            </div>
            <div className="grid grid-cols-2 gap-3 bg-slate-50/70 p-5 lg:grid-cols-1 lg:content-center md:p-6">
              <SocialDate label="Inizio social" value={event.inizioSocial} />
              <SocialDate label="Fine social" value={event.fineSocial} />
            </div>
          </div>
        </section>
      )}
      {event.access !== "collaboratore" && event.noteInterne && <section className="flex gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm"><span className="h-fit rounded-xl bg-white p-2.5 text-amber-700 shadow-sm"><MessageSquareText className="h-5 w-5" /></span><div className="min-w-0"><h2 className="font-bold text-slate-900">Note operative interne</h2><p className="mt-1 whitespace-pre-wrap leading-relaxed text-slate-700">{event.noteInterne}</p></div></section>}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><EventAssignments event={event} /></div>

      {event.access === "admin" && <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl border border-gray-200 bg-white p-5"><h2 className="text-xl font-bold text-gray-900">Amministrazione</h2><p className="mt-4 text-3xl font-bold text-gray-900">€ {event.pagamentoTotale}</p><div className="mt-4 space-y-2">{event.tranche.map((item) => <div key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3 text-sm"><span><strong>{item.descrizione}</strong><br /><span className="text-gray-500">{formatDate(item.scadenza)}</span></span><span className="text-right"><strong>€ {item.importo}</strong><br /><span className="text-gray-500">{item.stato.replace("_", " ")}</span></span></div>)}</div></section><section className="rounded-2xl border border-gray-200 bg-white p-5"><h2 className="text-xl font-bold text-gray-900">Chiusura evento</h2><div className="mt-5 space-y-3"><Status label="Materiale su Hard Disk" checked={event.hardDisk} /><Status label="Report finale" checked={event.report} /></div></section></div>}
    </div>
  );
}

function Progress({ label, done = 0, total = 0, color = "blue" }) { const percentage = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0; const palette = color === "violet" ? { box: "border-violet-100 bg-violet-50/60", text: "text-violet-700", bar: "bg-violet-600" } : { box: "border-blue-100 bg-blue-50/60", text: "text-blue-700", bar: "bg-blue-600" }; return <div className={`rounded-2xl border p-4 ${palette.box}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-600">{label}</p><p className="mt-1 text-3xl font-black tracking-tight text-slate-900">{done}<span className="mx-1.5 text-lg font-medium text-slate-400">/</span><span className="text-xl text-slate-600">{total}</span></p><p className="text-xs text-slate-500">fatti su previsti</p></div><span className={`rounded-full bg-white px-2.5 py-1 text-sm font-extrabold shadow-sm ${palette.text}`}>{percentage}%</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-white shadow-inner"><div className={`h-full rounded-full transition-all ${palette.bar}`} style={{ width: `${percentage}%` }} /></div>{done > total && <p className="mt-2 text-xs font-semibold text-amber-700">+{done - total} oltre l’obiettivo</p>}</div>; }
function SocialDate({ label, value }) { return <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"><span className="rounded-lg bg-slate-100 p-2 text-slate-600"><CalendarRange className="h-4 w-4" /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="font-bold text-slate-900">{formatDate(value)}</p></div></div>; }
function Status({ label, checked }) { return <div className={`rounded-lg p-4 font-semibold ${checked ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{checked ? "✓" : "○"} {label}</div>; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString("it-IT", { timeZone: "UTC" }) : "—"; }
function formatRange(start, end) { const a = formatDate(start); const b = formatDate(end); return a === b ? a : `${a} – ${b}`; }
