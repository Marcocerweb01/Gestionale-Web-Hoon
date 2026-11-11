"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CirclePlay,
  Pencil,
  PowerOff,
  RefreshCw,
  Trash2,
  UserRoundPlus,
  X,
} from "lucide-react";
import Header from "@/Components/Header";

const emptyClosure = { collaborazioneKey: "", dataEvento: "", note: "" };
const emptyActivation = {
  ragioneSociale: "",
  referente: "",
  email: "",
  telefono: "",
  partitaIva: "",
  servizio: "",
  dataEvento: "",
  importo: "",
  periodicita: "mensile",
  collaboratore: "",
  note: "",
};

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("it-IT", { timeZone: "Europe/Rome" })
  : "—";
const statusStyle = {
  programmata: "bg-amber-100 text-amber-800",
  attiva: "bg-emerald-100 text-emerald-800",
  completata: "bg-slate-200 text-slate-700",
  annullata: "bg-red-100 text-red-700",
  errore: "bg-red-100 text-red-700",
};

export default function ChiusureAttivazioniPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [eventi, setEventi] = useState([]);
  const [utenti, setUtenti] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [closure, setClosure] = useState(emptyClosure);
  const [activation, setActivation] = useState(emptyActivation);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [eventsResponse, collaborationsResponse, peopleResponse] = await Promise.all([
        fetch("/api/chiusure-attivazioni", { cache: "no-store" }),
        fetch("/api/collaborazioni-utente", { cache: "no-store" }),
        fetch("/api/lista_collaboratori", { cache: "no-store" }),
      ]);
      if (!eventsResponse.ok || !collaborationsResponse.ok || !peopleResponse.ok) {
        throw new Error("Impossibile caricare i dati");
      }
      const [eventsData, collaborationsData, peopleData] = await Promise.all([
        eventsResponse.json(), collaborationsResponse.json(), peopleResponse.json(),
      ]);
      setEventi(Array.isArray(eventsData) ? eventsData : []);
      setUtenti(Array.isArray(collaborationsData) ? collaborationsData : []);
      setCollaboratori(Array.isArray(peopleData) ? peopleData.filter((item) => item.status !== "inattivo") : []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && ["amministratore", "segretaria"].includes(session?.user?.role)) load();
  }, [load, session, status]);

  const collaborationOptions = useMemo(() => utenti.flatMap((utente) => [
    ...(utente.social || []).filter((item) => !["terminata", "in sospeso"].includes(item.stato)).map((item) => ({
      key: `social:${item._id}`,
      id: item._id,
      tipo: "social",
      label: `${utente.ragioneSociale} · Social · ${item.collaboratore}`,
    })),
    ...(utente.webDesign || []).filter((item) => item.stato !== "terminata").map((item) => ({
      key: `${item.tipo}:${item._id}`,
      id: item._id,
      tipo: item.tipo,
      label: `${utente.ragioneSociale} · Web Design${item.versione ? ` ${item.versione}` : ""} · ${item.collaboratore}`,
    })),
    ...(utente.googleAds || []).filter((item) => !item.campagnaTerminata).map((item) => ({
      key: `googleads:${item._id}`,
      id: item._id,
      tipo: "googleads",
      label: `${utente.ragioneSociale} · Google Ads · ${item.collaboratore}`,
    })),
  ]), [utenti]);

  const saveClosure = async (event) => {
    event.preventDefault();
    const selected = collaborationOptions.find((item) => item.key === closure.collaborazioneKey);
    if (!selected) return setError("Seleziona una collaborazione");
    await save("chiusura", {
      categoria: "chiusura",
      collaborazioneId: selected.id,
      collaborazioneTipo: selected.tipo,
      collaborazioneEtichetta: selected.label,
      dataEvento: closure.dataEvento,
      note: closure.note,
    }, () => setClosure(emptyClosure));
  };

  const saveActivation = async (event) => {
    event.preventDefault();
    const person = collaboratori.find((item) => item.id === activation.collaboratore);
    await save("attivazione", {
      ...activation,
      categoria: "attivazione",
      collaboratoreNome: person ? `${person.nome || ""} ${person.cognome || ""}`.trim() : "",
    }, () => setActivation(emptyActivation));
  };

  const save = async (kind, body, reset) => {
    setSaving(kind);
    setError("");
    try {
      const response = await fetch("/api/chiusure-attivazioni", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore durante il salvataggio");
      reset();
      await load();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving("");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Vuoi eliminare o annullare questa voce?")) return;
    setSaving(id);
    try {
      const response = await fetch(`/api/chiusure-attivazioni/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Operazione non riuscita");
      await load();
    } catch (removeError) {
      setError(removeError.message);
    } finally {
      setSaving("");
    }
  };

  const update = async (event, body) => {
    event.preventDefault();
    setSaving(editing._id);
    setError("");
    try {
      const response = await fetch(`/api/chiusure-attivazioni/${editing._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Errore durante la modifica");
      setEditing(null);
      await load();
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setSaving("");
    }
  };

  if (status === "loading") return <div className="min-h-screen grid place-items-center">Caricamento…</div>;
  if (status === "unauthenticated" || !["amministratore", "segretaria"].includes(session?.user?.role)) {
    router.push("/Login");
    return null;
  }

  const chiusure = eventi.filter((item) => item.categoria === "chiusura");
  const attivazioni = eventi.filter((item) => item.categoria === "attivazione");
  const fieldClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  return <>
    <Header />
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><ArrowLeft size={17} /> Dashboard</Link>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-black text-slate-950"><CalendarClock className="text-indigo-600" /> Chiusure / Attivazioni</h1>
            <p className="mt-2 text-slate-600">Programma la fine delle collaborazioni e registra le prossime partenze.</p>
          </div>
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2.5 font-semibold text-slate-700 shadow-sm"><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Aggiorna</button>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">{error}</div>}

        <div className="mb-8 grid gap-6 xl:grid-cols-2">
          <EventList title="Chiusure programmate" items={chiusure} empty="Nessuna chiusura registrata" edit={setEditing} remove={remove} saving={saving} />
          <EventList title="Attivazioni" items={attivazioni} empty="Nessuna attivazione registrata" edit={setEditing} remove={remove} saving={saving} activation />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-red-100 bg-white shadow-sm">
            <div className="border-b border-red-100 bg-red-50 p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold text-red-950"><PowerOff size={21} /> Nuova chiusura</h2>
              <p className="mt-1 text-sm text-red-700">Alla data scelta la collaborazione verrà terminata automaticamente.</p>
            </div>
            <form onSubmit={saveClosure} className="space-y-4 p-5">
              <label className="block text-sm font-bold text-slate-700">Collaborazione
                <select required value={closure.collaborazioneKey} onChange={(e) => setClosure({ ...closure, collaborazioneKey: e.target.value })} className={`${fieldClass} mt-1`}>
                  <option value="">Seleziona collaborazione…</option>
                  {collaborationOptions.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                </select>
              </label>
              <label className="block text-sm font-bold text-slate-700">Data fine
                <input required type="date" value={closure.dataEvento} onChange={(e) => setClosure({ ...closure, dataEvento: e.target.value })} className={`${fieldClass} mt-1`} />
              </label>
              <label className="block text-sm font-bold text-slate-700">Note
                <textarea value={closure.note} onChange={(e) => setClosure({ ...closure, note: e.target.value })} className={`${fieldClass} mt-1 min-h-20`} />
              </label>
              <button disabled={saving === "chiusura"} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white disabled:opacity-50"><PowerOff size={18} /> Programma chiusura</button>
            </form>
          </section>

          <section className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
            <div className="border-b border-emerald-100 bg-emerald-50 p-5">
              <h2 className="flex items-center gap-2 text-xl font-bold text-emerald-950"><UserRoundPlus size={21} /> Nuova attivazione</h2>
              <p className="mt-1 text-sm text-emerald-700">Inserisci manualmente anagrafica e dettagli economici.</p>
            </div>
            <form onSubmit={saveActivation} className="grid gap-4 p-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Ragione sociale *<input required value={activation.ragioneSociale} onChange={(e) => setActivation({ ...activation, ragioneSociale: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Referente Hoon<input value={activation.referente} onChange={(e) => setActivation({ ...activation, referente: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Partita IVA<input value={activation.partitaIva} onChange={(e) => setActivation({ ...activation, partitaIva: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Email<input type="email" value={activation.email} onChange={(e) => setActivation({ ...activation, email: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Telefono<input value={activation.telefono} onChange={(e) => setActivation({ ...activation, telefono: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Servizio *<input required value={activation.servizio} onChange={(e) => setActivation({ ...activation, servizio: e.target.value })} placeholder="Es. Social, sito web, Google Ads…" className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Data partenza *<input required type="date" value={activation.dataEvento} onChange={(e) => setActivation({ ...activation, dataEvento: e.target.value })} className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Collaboratore<select required value={activation.collaboratore} onChange={(e) => setActivation({ ...activation, collaboratore: e.target.value })} className={`${fieldClass} mt-1`}><option value="">Seleziona…</option>{collaboratori.map((item) => <option key={item.id} value={item.id}>{item.nome} {item.cognome}</option>)}</select></label>
              <label className="text-sm font-bold text-slate-700">Quanto paga (€) *<input required type="text" value={activation.importo} onChange={(e) => setActivation({ ...activation, importo: e.target.value })} placeholder="Es. 500 + IVA" className={`${fieldClass} mt-1`} /></label>
              <label className="text-sm font-bold text-slate-700">Periodicità<select value={activation.periodicita} onChange={(e) => setActivation({ ...activation, periodicita: e.target.value })} className={`${fieldClass} mt-1`}><option>una tantum</option><option>mensile</option><option>trimestrale</option><option>semestrale</option><option>annuale</option></select></label>
              <label className="text-sm font-bold text-slate-700 sm:col-span-2">Note<textarea value={activation.note} onChange={(e) => setActivation({ ...activation, note: e.target.value })} className={`${fieldClass} mt-1 min-h-20`} /></label>
              <button disabled={saving === "attivazione"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white disabled:opacity-50 sm:col-span-2"><CirclePlay size={18} /> Salva attivazione</button>
            </form>
          </section>
        </div>

      </div>
    </main>
    {editing && <EditEventModal item={editing} collaborationOptions={collaborationOptions} collaboratori={collaboratori} fieldClass={fieldClass} saving={saving} onClose={() => setEditing(null)} onSave={update} />}
  </>;
}

function EventList({ title, items, empty, edit, remove, saving, activation = false }) {
  return <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
    <h2 className="border-b p-5 text-xl font-bold text-slate-900">{title} <span className="ml-2 text-sm text-slate-400">({items.length})</span></h2>
    <div className="divide-y">
      {!items.length && <p className="p-8 text-center text-slate-500">{empty}</p>}
      {items.map((item) => <article key={item._id} className="flex items-start gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{activation ? item.ragioneSociale : item.collaborazioneEtichetta}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[item.stato] || "bg-slate-100"}`}>{item.stato}</span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{activation ? `Parte il ${formatDate(item.dataEvento)} · ${item.servizio}` : `Fine: ${formatDate(item.dataEvento)}`}</p>
          {activation && <p className="mt-1 text-sm font-semibold text-emerald-700">{item.importo || "—"} · {item.periodicita} · {item.collaboratoreNome || "Collaboratore non indicato"}</p>}
          {item.note && <p className="mt-2 text-sm text-slate-500">{item.note}</p>}
          {item.errore && <p className="mt-2 text-sm font-semibold text-red-600">{item.errore}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <button onClick={() => edit(item)} disabled={saving === item._id} title="Modifica" className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"><Pencil size={18} /></button>
          <button onClick={() => remove(item._id)} disabled={saving === item._id} title="Elimina o annulla" className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={18} /></button>
        </div>
      </article>)}
    </div>
  </section>;
}

function EditEventModal({ item, collaborationOptions, collaboratori, fieldClass, saving, onClose, onSave }) {
  const activation = item.categoria === "attivazione";
  const currentCollaborationKey = `${item.collaborazioneTipo}:${item.collaborazioneId}`;
  const currentOptionExists = collaborationOptions.some((option) => option.key === currentCollaborationKey);
  const [form, setForm] = useState(activation ? {
    ragioneSociale: item.ragioneSociale || "", referente: item.referente || "", email: item.email || "",
    telefono: item.telefono || "", partitaIva: item.partitaIva || "", servizio: item.servizio || "",
    dataEvento: String(item.dataEvento || "").slice(0, 10), importo: item.importo || "",
    periodicita: item.periodicita || "mensile", collaboratore: item.collaboratore?._id || item.collaboratore || "", note: item.note || "",
  } : { collaborazioneKey: currentCollaborationKey, dataEvento: String(item.dataEvento || "").slice(0, 10), note: item.note || "" });

  const submit = (event) => {
    if (activation) {
      const person = collaboratori.find((candidate) => candidate.id === form.collaboratore);
      onSave(event, { ...form, collaboratoreNome: person ? `${person.nome || ""} ${person.cognome || ""}`.trim() : item.collaboratoreNome || "" });
      return;
    }
    const selected = collaborationOptions.find((option) => option.key === form.collaborazioneKey);
    const fallback = form.collaborazioneKey === currentCollaborationKey ? {
      id: item.collaborazioneId, tipo: item.collaborazioneTipo, label: item.collaborazioneEtichetta,
    } : null;
    const collaboration = selected || fallback;
    onSave(event, { dataEvento: form.dataEvento, note: form.note, collaborazioneId: collaboration?.id, collaborazioneTipo: collaboration?.tipo, collaborazioneEtichetta: collaboration?.label });
  };

  const change = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b p-5"><h2 className="text-xl font-black text-slate-950">Modifica {activation ? "attivazione" : "chiusura"}</h2><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>
      <form onSubmit={submit} className={`grid gap-4 p-5 ${activation ? "sm:grid-cols-2" : ""}`}>
        {activation ? <>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">Ragione sociale *<input required value={form.ragioneSociale} onChange={(e) => change("ragioneSociale", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Referente Hoon<input value={form.referente} onChange={(e) => change("referente", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Partita IVA<input value={form.partitaIva} onChange={(e) => change("partitaIva", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Email<input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Telefono<input value={form.telefono} onChange={(e) => change("telefono", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700 sm:col-span-2">Servizio *<input required value={form.servizio} onChange={(e) => change("servizio", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Data partenza *<input required type="date" value={form.dataEvento} onChange={(e) => change("dataEvento", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Collaboratore<select required value={form.collaboratore} onChange={(e) => change("collaboratore", e.target.value)} className={`${fieldClass} mt-1`}><option value="">Seleziona…</option>{collaboratori.map((person) => <option key={person.id} value={person.id}>{person.nome} {person.cognome}</option>)}</select></label>
          <label className="text-sm font-bold text-slate-700">Quanto paga (€) *<input required value={form.importo} onChange={(e) => change("importo", e.target.value)} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-bold text-slate-700">Periodicità<select value={form.periodicita} onChange={(e) => change("periodicita", e.target.value)} className={`${fieldClass} mt-1`}><option>una tantum</option><option>mensile</option><option>trimestrale</option><option>semestrale</option><option>annuale</option></select></label>
        </> : <label className="text-sm font-bold text-slate-700">Collaborazione<select required value={form.collaborazioneKey} onChange={(e) => change("collaborazioneKey", e.target.value)} className={`${fieldClass} mt-1`}>{!currentOptionExists && <option value={currentCollaborationKey}>{item.collaborazioneEtichetta}</option>}{collaborationOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}</select></label>}
        {!activation && <label className="text-sm font-bold text-slate-700">Data fine *<input required type="date" value={form.dataEvento} onChange={(e) => change("dataEvento", e.target.value)} className={`${fieldClass} mt-1`} /></label>}
        <label className={`text-sm font-bold text-slate-700 ${activation ? "sm:col-span-2" : ""}`}>Note<textarea value={form.note} onChange={(e) => change("note", e.target.value)} className={`${fieldClass} mt-1 min-h-20`} /></label>
        <div className={`flex justify-end gap-3 ${activation ? "sm:col-span-2" : ""}`}><button type="button" onClick={onClose} className="rounded-xl border px-4 py-2.5 font-bold text-slate-700">Annulla</button><button disabled={saving === item._id} className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white disabled:opacity-50">Salva modifiche</button></div>
      </form>
    </section>
  </div>;
}
