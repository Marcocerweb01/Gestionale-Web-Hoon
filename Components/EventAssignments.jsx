"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Plus, SlidersHorizontal } from "lucide-react";

const blank = { collaboratore: "", dataLavoro: "", mansione: "", noteCollaboratore: "" };
const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200";

export default function EventAssignments({ event }) {
  const canManage = ["admin", "responsabile"].includes(event.access);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterCollaborator, setFilterCollaborator] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (filterDate) params.set("data", filterDate);
    if (filterCollaborator) params.set("collaboratore", filterCollaborator);
    const response = await fetch(`/api/eventi/${event._id}/assegnazioni?${params}`, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message);
    setItems(data);
  };
  useEffect(() => { load().catch((err) => setError(err.message)); }, [event._id, filterDate, filterCollaborator]);

  const members = useMemo(() => event.collaboratori || [], [event.collaboratori]);
  const eventDays = useMemo(() => (event.giornateEvento || []).map((value) => new Date(value).toISOString().slice(0, 10)).sort(), [event.giornateEvento]);
  const submit = async (e) => {
    e.preventDefault(); setError("");
    const url = editing ? `/api/eventi/${event._id}/assegnazioni/${editing}` : `/api/eventi/${event._id}/assegnazioni`;
    const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    if (!response.ok) return setError(data.message);
    setForm(blank); setEditing(null); await load();
  };
  const edit = (item) => { setEditing(item._id); setForm({ collaboratore: item.collaboratore._id, dataLavoro: new Date(item.dataLavoro).toISOString().slice(0, 10), mansione: item.mansione, noteCollaboratore: item.noteCollaboratore }); };
  const remove = async (id) => {
    if (!window.confirm("Eliminare questa attività?")) return;
    const response = await fetch(`/api/eventi/${event._id}/assegnazioni/${id}`, { method: "DELETE" });
    if (response.ok) load(); else setError((await response.json()).message);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-bold text-gray-900">Team e attività</h2><p className="text-sm text-gray-500">Giornate, mansioni e indicazioni visibili al collaboratore.</p></div>{canManage && <button type="button" onClick={() => setShowFilters((value) => !value)} className={`inline-flex items-center justify-center gap-2 self-start rounded-xl border px-4 py-2.5 text-sm font-bold transition sm:self-auto ${showFilters || filterDate || filterCollaborator ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"}`}><SlidersHorizontal className="h-4 w-4" /> Filtri{(filterDate || filterCollaborator) && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] text-white">{Number(Boolean(filterDate)) + Number(Boolean(filterCollaborator))}</span>}<ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`} /></button>}</div>
      {canManage && showFilters && <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4"><div className="mb-3 flex items-center justify-between"><div><h3 className="font-bold text-gray-900">Filtra le attività inserite</h3><p className="text-xs text-gray-500">Restringi l’elenco per data o collaboratore.</p></div>{(filterDate || filterCollaborator) && <button type="button" onClick={() => { setFilterDate(""); setFilterCollaborator(""); }} className="text-sm font-semibold text-blue-600 hover:text-blue-800">Azzera filtri</button>}</div><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1"><span className="text-xs font-semibold text-gray-600">Data da cercare</span><input className={inputClass} type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></label><label className="space-y-1"><span className="text-xs font-semibold text-gray-600">Collaboratore da cercare</span><select className={inputClass} value={filterCollaborator} onChange={(e) => setFilterCollaborator(e.target.value)}><option value="">Tutto il team</option>{members.map((item) => <option key={item._id} value={item._id}>{item.nome} {item.cognome}</option>)}</select></label></div></section>}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {canManage && (
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4 md:p-5"><div className="mb-4"><h3 className="font-bold text-gray-900">{editing ? "Modifica attività" : "Nuova attività"}</h3><p className="text-xs text-gray-500">Compila questi campi per assegnare una giornata di lavoro.</p></div><form onSubmit={submit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <label className="space-y-1 lg:col-span-3"><span className="text-xs font-semibold text-gray-600">Collaboratore *</span><select required className={inputClass} value={form.collaboratore} onChange={(e) => setForm({ ...form, collaboratore: e.target.value })}><option value="">Seleziona</option>{members.map((item) => <option key={item._id} value={item._id}>{item.nome} {item.cognome}</option>)}</select></label>
          <label className="space-y-1 lg:col-span-2"><span className="text-xs font-semibold text-gray-600">Data EVENTO *</span><select required className={inputClass} value={form.dataLavoro} onChange={(e) => setForm({ ...form, dataLavoro: e.target.value })}><option value="">Seleziona giornata</option>{eventDays.map((day) => <option key={day} value={day}>{new Date(`${day}T12:00:00.000Z`).toLocaleDateString("it-IT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" })}</option>)}</select></label>
          <label className="space-y-1 lg:col-span-2"><span className="text-xs font-semibold text-gray-600">Mansione *</span><input required className={inputClass} placeholder="Es. Fotografo" value={form.mansione} onChange={(e) => setForm({ ...form, mansione: e.target.value })} /></label>
          <label className="space-y-1 lg:col-span-3"><span className="text-xs font-semibold text-gray-600">Nota visibile</span><input className={inputClass} placeholder="Indicazioni operative" value={form.noteCollaboratore} onChange={(e) => setForm({ ...form, noteCollaboratore: e.target.value })} /></label>
          <div className="flex gap-2 lg:col-span-2"><button className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md active:scale-[0.98]"><Plus className="h-4 w-4" />{editing ? "Salva" : "Aggiungi"}</button>{editing && <button type="button" className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 font-bold text-slate-500 hover:bg-slate-50" onClick={() => { setEditing(null); setForm(blank); }}>×</button>}</div>
        </form></section>
      )}
      <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {items.length === 0 && <p className="p-6 text-center text-gray-500">Nessuna attività assegnata.</p>}
        {items.map((item) => <div key={item._id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center"><div><p className="font-semibold text-gray-900">{new Date(item.dataLavoro).toLocaleDateString("it-IT", { timeZone: "UTC" })} · {item.collaboratore?.nome} {item.collaboratore?.cognome}</p><p className="text-sm text-blue-700">{item.mansione}</p>{item.noteCollaboratore && <p className="mt-1 text-sm text-gray-600">{item.noteCollaboratore}</p>}</div>{canManage && <div className="flex gap-2"><button onClick={() => edit(item)} className="text-sm font-semibold text-blue-600">Modifica</button><button onClick={() => remove(item._id)} className="text-sm font-semibold text-red-600">Elimina</button></div>}</div>)}
      </div>
    </section>
  );
}
