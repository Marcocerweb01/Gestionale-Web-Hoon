"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CalendarDays, Camera, ChevronRight, MapPin, Plus, Search, UserRound } from "lucide-react";
import EventForm from "./EventForm";
import EventAvailabilityClient from "./EventAvailabilityClient";

const collaboratorTabs = [
  { id: "partecipazioni", label: "I tuoi eventi e shooting" },
  { id: "disponibilita", label: "Disponibilità richieste" },
];

export default function EventiClient() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState("partecipazioni");
  const [availabilityCount, setAvailabilityCount] = useState({ pending: 0, unseen: 0 });
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState("");
  const [requestResult, setRequestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isAdmin = session?.user?.role === "amministratore";

  const load = useCallback(async (term = "") => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/eventi?search=${encodeURIComponent(term)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setEvents(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, []);
  const handleCreated = (event, feedback) => {
    setShowCreate("");
    if (feedback) {
      setRequestResult({ ...feedback, eventId: event._id });
      load(search);
    } else {
      router.push(`/Eventi/${event._id}`);
    }
  };

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  useEffect(() => {
    const syncTab = () => {
      setActiveTab(window.location.hash === "#disponibilita" ? "disponibilita" : "partecipazioni");
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  const selectTab = (id) => {
    setActiveTab(id);
    const hash = `#${id}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
  };

  const handleTabKeyDown = (event, index) => {
    const last = collaboratorTabs.length - 1;
    let next;
    if (event.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (event.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = last;
    else return;

    event.preventDefault();
    const { id } = collaboratorTabs[next];
    selectTab(id);
    document.getElementById(`tab-${id}`)?.focus();
  };

  if (status === "loading") return <p className="py-12 text-center text-gray-500">Caricamento…</p>;
  if (!session) return <p className="py-12 text-center text-red-600">Accesso richiesto.</p>;
  if (!["amministratore", "collaboratore"].includes(session.user.role)) return <p className="py-12 text-center text-red-600">Non sei autorizzato ad accedere agli eventi.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-3xl font-bold text-gray-900">Gestione Eventi & Shooting</h1><p className="mt-1 text-gray-600">{isAdmin ? "Organizzazione, team, social e amministrazione." : "I prossimi eventi, shooting e le tue attività."}</p></div>
        {isAdmin && <div className="flex flex-wrap gap-2"><button onClick={() => setShowCreate("evento")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"><Plus className="h-4 w-4" /> Nuovo evento</button><button onClick={() => setShowCreate("shooting")} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-800"><Camera className="h-4 w-4" /> Aggiungi Shooting</button></div>}
      </div>

      {showCreate && <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-7"><div className="mb-6 flex items-center justify-between"><h2 className="text-2xl font-bold text-gray-900">Crea {showCreate}</h2><button onClick={() => setShowCreate("")} className="text-gray-500">Chiudi</button></div><EventForm defaultType={showCreate} onCancel={() => setShowCreate("")} onSaved={handleCreated} /></div>}

      {requestResult && (
        <div role="status" className={`rounded-lg p-4 ${requestResult.error ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-900"}`}>
          {requestResult.message} <Link className="font-semibold underline" href={`/Eventi/${requestResult.eventId}`}>Apri il dettaglio</Link>
        </div>
      )}

      {!isAdmin && (
        <div role="tablist" aria-label="Eventi e shooting" className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {collaboratorTabs.map(({ id, label }, index) => {
            const selected = activeTab === id;
            const isAvailability = id === "disponibilita";
            const needsReply = isAvailability && availabilityCount.pending > 0;
            const hasUnseen = isAvailability && availabilityCount.unseen > 0;
            return (
              <button
                key={id}
                type="button"
                id={`tab-${id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`flex min-h-12 flex-wrap items-center justify-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 sm:px-4 ${selected ? "bg-blue-600 text-white" : hasUnseen ? "bg-amber-50 text-amber-900 hover:bg-amber-100" : "text-slate-700 hover:bg-slate-100"}`}
              >
                {label}
                {needsReply && (
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${hasUnseen ? "bg-amber-200 text-amber-950" : "bg-blue-100 text-blue-900"}`}>
                    {availabilityCount.pending}<span className="sr-only"> da rispondere{hasUnseen && `, di cui ${availabilityCount.unseen} nuove`}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <section
        id={isAdmin ? undefined : "panel-partecipazioni"}
        role={isAdmin ? undefined : "tabpanel"}
        aria-label={isAdmin ? "Elenco eventi e shooting" : undefined}
        aria-labelledby={isAdmin ? undefined : "tab-partecipazioni"}
        hidden={!isAdmin && activeTab !== "partecipazioni"}
        className="space-y-3"
      >
        <form onSubmit={(e) => { e.preventDefault(); load(search); }} className="flex gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3" placeholder="Cerca un evento…" /></div><button className="rounded-lg bg-gray-900 px-4 py-2 font-semibold text-white">Cerca</button></form>
        {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="py-12 text-center text-gray-500">Caricamento eventi…</p> : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {events.map((event, index) => <Link key={event._id} href={`/Eventi/${event._id}`} className={`group grid gap-4 p-4 transition hover:bg-blue-50/60 sm:grid-cols-[92px_1fr_auto] sm:items-center md:p-5 ${index > 0 ? "border-t border-slate-100" : ""}`}><div className="flex w-fit min-w-[76px] flex-col items-center overflow-hidden rounded-xl border border-blue-100 bg-blue-50 text-center"><span className={`w-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${event.tipo === "shooting" ? "bg-slate-800" : "bg-blue-600"}`}>{monthName(firstEventDay(event))}</span><span className="py-1.5 text-2xl font-black leading-none text-slate-900">{dayNumber(firstEventDay(event))}</span></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-lg font-bold text-slate-900 group-hover:text-blue-700">{event.nome}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${event.tipo === "shooting" ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-700"}`}>{event.tipo === "shooting" ? "Shooting" : "Evento"}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${event.access === "admin" ? "bg-purple-100 text-purple-700" : event.access === "responsabile" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{event.access === "responsabile" ? "Responsabile" : event.access === "collaboratore" ? "Assegnato" : "Admin"}</span></div><p className="mt-1 text-sm font-medium text-slate-500"><CalendarDays className="mr-1.5 inline h-4 w-4" /><strong>DATE {event.tipo === "shooting" ? "SHOOTING" : "EVENTO"}:</strong> {eventDaysSummary(event)}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600"><span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-slate-400" /> {event.luogo}</span><span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-slate-400" /> {event.responsabile?.nome} {event.responsabile?.cognome}</span></div></div><span className="hidden rounded-full bg-slate-50 p-2 text-slate-400 transition group-hover:translate-x-1 group-hover:bg-blue-100 group-hover:text-blue-700 sm:block"><ChevronRight className="h-5 w-5" /></span></Link>)}
            {events.length === 0 && <div className="py-16 text-center text-gray-500">{isAdmin || search ? "Nessun evento o shooting trovato." : "Nessuna partecipazione da mostrare."}</div>}
          </div>
        )}
      </section>

      {!isAdmin && (
        <section id="panel-disponibilita" role="tabpanel" aria-labelledby="tab-disponibilita" hidden={activeTab !== "disponibilita"}>
          <EventAvailabilityClient pendingOnly onPendingCount={setAvailabilityCount} />
        </section>
      )}
    </div>
  );
}

function firstEventDay(event) { return event.giornateEvento?.[0] || event.dataInizio; }
function eventDaysSummary(event) { const days = event.giornateEvento?.length ? event.giornateEvento : [event.dataInizio]; const labels = days.map((value) => new Date(value).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })); return labels.length <= 3 ? labels.join(" · ") : `${labels.slice(0, 2).join(" · ")} · +${labels.length - 2} giornate`; }
function monthName(value) { return new Date(value).toLocaleDateString("it-IT", { month: "short", timeZone: "UTC" }).replace(".", ""); }
function dayNumber(value) { return new Date(value).toLocaleDateString("it-IT", { day: "2-digit", timeZone: "UTC" }); }
