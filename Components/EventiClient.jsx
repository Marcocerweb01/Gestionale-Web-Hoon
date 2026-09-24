"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarDays, ChevronRight, MapPin, Plus, Search, UserRound } from "lucide-react";
import EventForm from "./EventForm";

export default function EventiClient() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = session?.user?.role === "amministratore";

  const load = async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/eventi?search=${encodeURIComponent(search)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEvents(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { if (status === "authenticated") load(); }, [status]);

  if (status === "loading") return <p className="py-12 text-center text-gray-500">Caricamento…</p>;
  if (!session) return <p className="py-12 text-center text-red-600">Accesso richiesto.</p>;
  if (!["amministratore", "collaboratore"].includes(session.user.role)) return <p className="py-12 text-center text-red-600">Non sei autorizzato ad accedere agli eventi.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Eventi</h1><p className="mt-1 text-gray-600">{isAdmin ? "Organizzazione, team, social e amministrazione." : "I prossimi eventi e le tue attività."}</p></div>
        {isAdmin && <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Nuovo evento</button>}
      </div>

      {showCreate && <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">Crea evento</h2><button onClick={() => setShowCreate(false)} className="text-gray-500">Chiudi</button></div><EventForm onCancel={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); load(); }} /></div>}

      <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3" placeholder="Cerca un evento…" /></div><button className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white">Cerca</button></form>
      {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
      {loading ? <p className="py-12 text-center text-gray-500">Caricamento eventi…</p> : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {events.map((event, index) => <Link key={event._id} href={`/Eventi/${event._id}`} className={`group grid gap-4 p-4 transition hover:bg-blue-50/60 sm:grid-cols-[92px_1fr_auto] sm:items-center md:p-5 ${index > 0 ? "border-t border-slate-100" : ""}`}><div className="flex w-fit min-w-[76px] flex-col items-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50 text-center"><span className="w-full bg-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{monthName(event.dataInizio)}</span><span className="py-1.5 text-2xl font-black leading-none text-slate-900">{dayNumber(event.dataInizio)}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-700">{event.nome}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${event.access === "admin" ? "bg-purple-100 text-purple-700" : event.access === "responsabile" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{event.access === "responsabile" ? "Responsabile" : event.access === "collaboratore" ? "Assegnato" : "Admin"}</span></div><p className="mt-1 text-sm font-medium text-slate-500"><CalendarDays className="mr-1.5 inline h-4 w-4" />{formatRange(event.dataInizio, event.dataFine)}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600"><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {event.luogo}</span><span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-slate-400" /> {event.responsabile?.nome} {event.responsabile?.cognome}</span></div></div><span className="hidden rounded-full bg-slate-50 p-2 text-slate-400 transition group-hover:translate-x-1 group-hover:bg-blue-100 group-hover:text-blue-700 sm:block"><ChevronRight className="h-5 w-5" /></span></Link>)}
          {events.length === 0 && <div className="py-16 text-center text-gray-500">Nessun evento trovato.</div>}
        </div>
      )}
    </div>
  );
}

function formatRange(start, end) { const a = new Date(start).toLocaleDateString("it-IT", { timeZone: "UTC" }); const b = new Date(end).toLocaleDateString("it-IT", { timeZone: "UTC" }); return a === b ? a : `${a} – ${b}`; }
function monthName(value) { return new Date(value).toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" }).replace(".", ""); }
function dayNumber(value) { return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", timeZone: "UTC" }); }
