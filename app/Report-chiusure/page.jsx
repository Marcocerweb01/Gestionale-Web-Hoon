"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, FileSpreadsheet, RotateCcw } from "lucide-react";

const STATUS = {
  generazione: ["Generazione", "bg-blue-100 text-blue-800"],
  da_visionare: ["Da visionare", "bg-amber-100 text-amber-800"],
  reset_in_corso: ["Reset in corso", "bg-blue-100 text-blue-800"],
  completato: ["Completato", "bg-emerald-100 text-emerald-800"],
  errore: ["Errore", "bg-red-100 text-red-800"],
};

export default function ReportChiusurePage() {
  const [reports, setReports] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/report-chiusure", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Impossibile caricare i report");
    else setReports(data.reports || []);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function view(report) {
    setBusy(report._id);
    const response = await fetch(`/api/report-chiusure/${report._id}`, { cache: "no-store" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setError(data.error || "Impossibile aprire il report");
    setSelected(data.report);
    await load();
  }

  async function approve(report) {
    if (!confirm(`Confermi il reset ${report.tipo} per ${report.titolo}?\n\nIl file resterà nello storico.`)) return;
    setBusy(report._id);
    const response = await fetch(`/api/report-chiusure/${report._id}/approva-reset`, { method: "POST" });
    const data = await response.json();
    setBusy("");
    if (!response.ok) return setError(data.error || "Reset non riuscito");
    setSelected(null);
    await load();
    alert(`Reset completato. ${data.modifiedCount} collaborazioni aggiornate.`);
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-7xl">
    <div className="mb-6"><div>
      <Link href="/" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700"><ArrowLeft size={16} /> Dashboard</Link>
      <h1 className="text-3xl font-bold text-slate-950">Chiusure e snapshot</h1>
      <p className="mt-2 text-slate-600">I file vengono creati automaticamente. Il reset parte soltanto dopo la visione e la tua approvazione.</p>
    </div></div>
    {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {loading ? <div className="p-12 text-center text-slate-500">Caricamento report…</div> : reports.length === 0 ? <div className="p-12 text-center"><FileSpreadsheet className="mx-auto mb-3 text-slate-400" size={42} /><p className="font-semibold">Nessun report creato</p><p className="mt-1 text-sm text-slate-500">Il primo comparirà automaticamente alla prossima chiusura.</p></div> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-100 text-slate-600"><tr><th className="p-4">Periodo</th><th className="p-4">Tipo</th><th className="p-4">Collaborazioni</th><th className="p-4">Stato</th><th className="p-4">Creato</th><th className="p-4 text-right">Azioni</th></tr></thead><tbody>
        {reports.map((report) => { const status = STATUS[report.stato] || [report.stato, "bg-slate-100"]; return <tr key={report._id} className="border-t"><td className="p-4 font-semibold">{report.titolo}</td><td className="p-4 capitalize">{report.tipo}</td><td className="p-4">{report.numeroCollaborazioni}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status[1]}`}>{status[0]}</span></td><td className="p-4 text-slate-500">{report.generatoAt ? new Date(report.generatoAt).toLocaleString("it-IT") : "—"}</td><td className="p-4"><div className="flex justify-end gap-2"><button onClick={() => view(report)} disabled={busy === report._id} className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-2 font-semibold text-indigo-700"><Eye size={15} /> Vedi</button>{report.fileNome && <a href={`/api/report-chiusure/${report._id}/download`} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700"><Download size={15} /> Excel</a>}</div></td></tr>; })}
      </tbody></table></div>}
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
      <div className="sticky top-0 flex items-start justify-between border-b bg-white p-5"><div><h2 className="text-xl font-bold">{selected.titolo}</h2><p className="mt-1 text-sm text-slate-500">Snapshot immutabile di {selected.numeroCollaborazioni} collaborazioni</p></div><button onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 hover:bg-slate-100">Chiudi</button></div>
      <div className="overflow-x-auto p-5"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="bg-slate-100"><tr><th className="p-3">Collaboratore</th><th className="p-3">Cliente</th><th className="p-3">App mese</th><th className="p-3">IG mese</th><th className="p-3">TikTok mese</th><th className="p-3">LinkedIn mese</th><th className="p-3">App trim.</th><th className="p-3">Post trim.</th></tr></thead><tbody>{selected.collaborazioniSnapshot.map((row) => <tr key={row.collaborazioneId} className="border-t"><td className="p-3 font-semibold">{row.collaboratore}</td><td className="p-3">{row.cliente}</td><td className="p-3">{row.appuntamentiMensiliFatti}/{row.appuntamentiMensili}</td><td className="p-3">{row.instagramMensiliFatti}/{row.instagramMensili}</td><td className="p-3">{row.tiktokMensiliFatti}/{row.tiktokMensili}</td><td className="p-3">{row.linkedinMensiliFatti}/{row.linkedinMensili}</td><td className="p-3">{row.appuntamentiTrimFatti}/{row.appuntamentiTrimTotali}</td><td className="p-3">{row.instagramTrimFatti + row.tiktokTrimFatti + row.linkedinTrimFatti}/{row.instagramTrimTotali + row.tiktokTrimTotali + row.linkedinTrimTotali}</td></tr>)}</tbody></table></div>
      <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-white p-5"><a href={`/api/report-chiusure/${selected._id}/download`} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white"><Download size={17} /> Scarica Excel</a>{selected.stato === "da_visionare" && <button onClick={() => approve(selected)} disabled={!!busy} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white disabled:opacity-50"><RotateCcw size={17} /> Approva e avvia reset {selected.tipo}</button>}</div>
    </div></div>}
  </div></main>;
}
