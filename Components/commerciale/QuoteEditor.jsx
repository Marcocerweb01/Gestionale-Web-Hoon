"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Download, GripVertical, Layers, Plus, Redo2, Save, Trash2, Undo2, X } from "lucide-react";

const clone = (value) => JSON.parse(JSON.stringify(value));
const money = (value) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const visualStyle = (block) => ({
  left: block.x,
  top: block.y,
  width: block.width,
  height: block.height,
  color: block.color,
  background: block.background,
  fontSize: block.fontSize,
  fontWeight: block.fontWeight,
  textAlign: block.align,
  transform: `rotate(${block.rotation || 0}deg)`,
  zIndex: block.layer,
  opacity: block.opacity ?? 1,
  border: Number(block.borderWidth) > 0 ? `${block.borderWidth}px solid ${block.borderColor || "#111111"}` : undefined,
  borderRadius: block.shapeType === "ellipse" ? "9999px" : block.borderRadius || 0,
});

function PageThumbnail({ page }) {
  return <div className="aspect-[595/842] rounded bg-white border relative overflow-hidden" style={{ background: page.background || "#ffffff" }}>
    {[...(page.blocks || [])].sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((block) => <div key={block.id} className="absolute overflow-hidden" style={{
      left: `${(block.x / 595) * 100}%`, top: `${(block.y / 842) * 100}%`, width: `${(block.width / 595) * 100}%`, height: `${(block.height / 842) * 100}%`,
      color: block.color, background: block.background, fontSize: Math.max(2, (block.fontSize || 12) * 0.25), fontWeight: block.fontWeight,
      textAlign: block.align, opacity: block.opacity ?? 1, zIndex: block.layer,
      border: Number(block.borderWidth) > 0 ? `${Math.max(0.5, block.borderWidth * 0.25)}px solid ${block.borderColor || "#111111"}` : undefined,
      borderRadius: block.shapeType === "ellipse" ? "9999px" : Math.max(0, (block.borderRadius || 0) * 0.25),
    }}>
      {block.type === "text" && <div className="whitespace-pre-wrap leading-tight">{block.text}</div>}
      {block.type === "image" && block.imageUrl && <img src={block.imageUrl} alt="" className="w-full h-full object-contain" />}
    </div>)}
  </div>;
}

export default function QuoteEditor({ quote, onClose, onSaved }) {
  const initialVersion = useMemo(() => quote.versions.find((item) => item.version === quote.currentVersion) || quote.versions.at(-1), [quote]);
  const [pages, setPages] = useState(() => clone(initialVersion?.pages || []));
  const [items, setItems] = useState(() => clone(initialVersion?.items || []));
  const [projectDescription, setProjectDescription] = useState(initialVersion?.projectDescription || "");
  const [paymentConditions, setPaymentConditions] = useState(initialVersion?.paymentConditions || "");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const canvasRef = useRef(null);
  const dragRef = useRef(null);
  const savingRef = useRef(false);

  const currentPage = pages[pageIndex];
  const selected = currentPage?.blocks?.find((block) => block.id === selectedId);
  const totals = useMemo(() => items.reduce((acc, item) => {
    const net = (Number(item.quantity) || 0) * (Number(item.discountedPrice) || 0);
    const vat = net * ((Number(item.vatRate) || 0) / 100);
    acc.net += net; acc.vat += vat; acc.gross += net + vat; return acc;
  }, { net: 0, vat: 0, gross: 0 }), [items]);

  const remember = useCallback(() => {
    setHistory((old) => [...old.slice(-30), clone(pages)]);
    setFuture([]);
  }, [pages]);

  const mutatePages = (updater, withHistory = true) => {
    if (withHistory) remember();
    setPages((old) => typeof updater === "function" ? updater(old) : updater);
    setDirty(true);
  };

  const updateBlock = (patch, withHistory = true) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.map((block) => block.id === selectedId ? { ...block, ...patch } : block) } : page), withHistory);

  const save = useCallback(async ({ newVersion = false, silent = false } = {}) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch(`/api/commerciale/quotes/${quote._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_version", pages, items, projectDescription, paymentConditions, createNewVersion: newVersion, reason: newVersion ? "Revisione manuale" : "Salvataggio automatico" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Salvataggio non riuscito");
      setDirty(false);
      setMessage(newVersion ? `Versione ${payload.currentVersion} creata` : "Salvato");
      onSaved(payload);
      setTimeout(() => setMessage(""), 1800);
    } catch (error) {
      if (!silent) setMessage(error.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [items, onSaved, pages, paymentConditions, projectDescription, quote._id]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => save({ silent: true }), 1800);
    return () => clearTimeout(timer);
  }, [dirty, save]);

  useEffect(() => {
    const move = (event) => {
      const drag = dragRef.current;
      const canvas = canvasRef.current;
      if (!drag || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = 595 / rect.width;
      const scaleY = 842 / rect.height;
      const x = Math.max(0, Math.min(595 - drag.width, (event.clientX - rect.left) * scaleX - drag.offsetX));
      const y = Math.max(0, Math.min(842 - drag.height, (event.clientY - rect.top) * scaleY - drag.offsetY));
      updateBlock({ x: Math.round(x), y: Math.round(y) }, false);
    };
    const up = () => { dragRef.current = null; };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  });

  const startDrag = (event, block) => {
    event.preventDefault();
    setSelectedId(block.id);
    remember();
    const rect = canvasRef.current.getBoundingClientRect();
    dragRef.current = {
      width: block.width,
      height: block.height,
      offsetX: (event.clientX - rect.left) * (595 / rect.width) - block.x,
      offsetY: (event.clientY - rect.top) * (842 / rect.height) - block.y,
    };
  };

  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setFuture((old) => [clone(pages), ...old]);
    setPages(previous);
    setHistory((old) => old.slice(0, -1));
    setDirty(true);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((old) => [...old, clone(pages)]);
    setPages(next);
    setFuture((old) => old.slice(1));
    setDirty(true);
  };

  const addBlock = (type) => {
    const block = { id: uid(), type, text: type === "text" ? "Nuovo testo" : "", imageUrl: "", x: 60, y: 100, width: 260, height: type === "shape" ? 60 : 90, fontSize: 22, fontWeight: 400, color: "#111111", background: type === "shape" ? "#ffd800" : "transparent", align: "left", layer: (currentPage?.blocks?.length || 0) + 1, shapeType: "rectangle", borderColor: "#111111", borderWidth: 0, borderRadius: 0, opacity: 1 };
    mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: [...page.blocks, block] } : page));
    setSelectedId(block.id);
  };

  const addPage = () => {
    mutatePages((old) => [...old, { id: uid(), name: `Pagina ${old.length + 1}`, background: "#ffffff", blocks: [] }]);
    setPageIndex(pages.length);
  };
  const duplicatePage = () => {
    const duplicate = clone(currentPage);
    duplicate.id = uid(); duplicate.name = `${duplicate.name} copia`; duplicate.blocks = duplicate.blocks.map((block) => ({ ...block, id: uid() }));
    mutatePages((old) => [...old.slice(0, pageIndex + 1), duplicate, ...old.slice(pageIndex + 1)]);
    setPageIndex(pageIndex + 1);
  };
  const movePage = (direction) => {
    const target = pageIndex + direction;
    if (target < 0 || target >= pages.length) return;
    mutatePages((old) => {
      const next = [...old];
      [next[pageIndex], next[target]] = [next[target], next[pageIndex]];
      return next;
    });
    setPageIndex(target);
  };
  const deletePage = () => {
    if (pages.length <= 1 || !window.confirm(`Eliminare la pagina “${currentPage?.name || "Pagina"}”?`)) return;
    mutatePages((old) => old.filter((_, index) => index !== pageIndex));
    setPageIndex((index) => Math.min(index, pages.length - 2));
    setSelectedId("");
  };

  const changeStatus = async (status) => {
    const needsReason = status === "rejected" || status === "postponed";
    const reason = needsReason ? window.prompt(status === "rejected" ? "Motivazione del rifiuto" : "Motivo del rinvio") : "";
    if (needsReason && !reason) return;
    const resumeAt = status === "postponed" ? window.prompt("Data di ripresa (AAAA-MM-GG)") : "";
    if (status === "postponed" && !resumeAt) return;
    const response = await fetch(`/api/commerciale/quotes/${quote._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_status", status, reason, resumeAt }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error || "Cambio stato non riuscito");
    onSaved(payload); setMessage("Stato aggiornato");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-gray-950/80 p-2 md:p-5 overflow-hidden">
      <div className="h-full max-w-[1600px] mx-auto bg-gray-100 rounded-2xl overflow-hidden flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex flex-wrap items-center gap-2">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X /></button>
          <div className="mr-auto"><h2 className="font-bold">{quote.number}</h2><p className="text-xs text-gray-500">Versione {quote.currentVersion} · {quote.organization?.businessName}</p></div>
          <button onClick={undo} disabled={!history.length} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!future.length} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          <select value={quote.status} onChange={(event) => changeStatus(event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="draft">Bozza</option><option value="ready">Pronto</option><option value="presented">Presentato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="postponed">Posticipato</option><option value="archived">Archiviato</option></select>
          <a href={`/api/commerciale/quotes/${quote._id}/pdf?version=${quote.currentVersion}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"><Download className="w-4 h-4" />PDF</a>
          <button onClick={() => save({ newVersion: true })} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"><Copy className="w-4 h-4" />Nuova versione</button>
          <button onClick={() => save()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" />{saving ? "Salvo…" : dirty ? "Salva" : "Salvato"}</button>
          {message && <span className="text-xs text-gray-600">{message}</span>}
        </header>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[210px_minmax(620px,1fr)_310px]">
          <aside className="hidden lg:block bg-white border-r overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3"><strong className="text-sm">Pagine</strong><button onClick={addPage} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-4 h-4" /></button></div>
            <div className="space-y-2">{pages.map((page, index) => <button key={page.id} onClick={() => { setPageIndex(index); setSelectedId(""); }} className={`w-full text-left border rounded-lg p-2 ${index === pageIndex ? "border-yellow-500 bg-yellow-50" : "border-gray-200"}`}><PageThumbnail page={page} /><span className="mt-2 block truncate text-xs font-medium">{index + 1}. {page.name}</span></button>)}</div>
            <div className="sticky bottom-0 mt-3 grid grid-cols-4 gap-1 bg-white py-2">
              <button title="Sposta pagina su" onClick={() => movePage(-1)} disabled={pageIndex === 0} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
              <button title="Sposta pagina giù" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              <button title="Duplica pagina" onClick={duplicatePage} className="grid place-items-center border rounded-lg py-2"><Copy className="w-4 h-4" /></button>
              <button title="Elimina pagina" onClick={deletePage} disabled={pages.length <= 1} className="grid place-items-center border rounded-lg py-2 text-red-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </aside>

          <main className="overflow-auto p-4 md:p-8 bg-gray-200">
            <div className="flex items-center justify-center gap-2 mb-4">
              <button onClick={() => addBlock("text")} className="px-3 py-2 bg-white rounded-lg shadow text-sm">+ Testo</button>
              <button onClick={() => addBlock("shape")} className="px-3 py-2 bg-white rounded-lg shadow text-sm">+ Forma</button>
              <button onClick={() => addBlock("image")} className="px-3 py-2 bg-white rounded-lg shadow text-sm">+ Immagine</button>
            </div>
            {currentPage && <div ref={canvasRef} className="relative mx-auto shadow-2xl touch-none" style={{ width: 595, height: 842, background: currentPage.background }} onPointerDown={() => setSelectedId("")}>
              {[...currentPage.blocks].sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((block) => <div key={block.id} onPointerDown={(event) => { event.stopPropagation(); startDrag(event, block); }} className={`absolute overflow-hidden cursor-move ${selectedId === block.id ? "ring-2 ring-blue-500" : ""}`} style={visualStyle(block)}>
                {block.type === "text" && <div className="w-full h-full p-1 whitespace-pre-wrap">{block.text}</div>}
                {block.type === "image" && (block.imageUrl ? <img src={block.imageUrl} alt="" className="w-full h-full object-contain" /> : <div className="w-full h-full border-2 border-dashed grid place-items-center text-xs text-gray-400">Immagine</div>)}
                {selectedId === block.id && <GripVertical className="absolute right-0 top-0 w-4 h-4 bg-blue-500 text-white" />}
              </div>)}
            </div>}
          </main>

          <aside className="bg-white border-l overflow-y-auto p-4 space-y-5">
            {selected ? <section><div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" />Elemento</h3><button onClick={() => { mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.filter((block) => block.id !== selectedId) } : page)); setSelectedId(""); }} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
              {selected.type === "text" && <textarea value={selected.text} onChange={(event) => updateBlock({ text: event.target.value }, false)} onBlur={() => setDirty(true)} rows={5} className="mt-3 w-full border rounded-lg p-2 text-sm" />}
              {selected.type === "image" && <input value={selected.imageUrl} onChange={(event) => updateBlock({ imageUrl: event.target.value }, false)} placeholder="URL o data:image…" className="mt-3 w-full border rounded-lg p-2 text-sm" />}
              <div className="grid grid-cols-2 gap-2 mt-3">{[["X", "x"], ["Y", "y"], ["Larghezza", "width"], ["Altezza", "height"]].map(([label, key]) => <label key={key} className="text-xs">{label}<input type="number" value={selected[key]} onChange={(event) => updateBlock({ [key]: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>)}</div>
              {selected.type === "text" && <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Font<input type="number" value={selected.fontSize} onChange={(event) => updateBlock({ fontSize: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label><label className="text-xs">Peso<select value={selected.fontWeight} onChange={(event) => updateBlock({ fontWeight: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1"><option value="400">Normale</option><option value="700">Bold</option><option value="900">Black</option></select></label></div>}
              {selected.type === "shape" && <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Forma<select value={selected.shapeType || "rectangle"} onChange={(event) => updateBlock({ shapeType: event.target.value })} className="mt-1 w-full border rounded p-1"><option value="rectangle">Rettangolo</option><option value="ellipse">Ellisse</option></select></label><label className="text-xs">Angoli<input type="number" min="0" value={selected.borderRadius || 0} onChange={(event) => updateBlock({ borderRadius: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label></div>}
              <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Colore<input type="color" value={selected.color || "#111111"} onChange={(event) => updateBlock({ color: event.target.value }, false)} className="mt-1 w-full h-8" /></label><label className="text-xs">Sfondo<input type="color" value={selected.background === "transparent" ? "#ffffff" : selected.background} onChange={(event) => updateBlock({ background: event.target.value }, false)} className="mt-1 w-full h-8" /></label></div>
              <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Bordo<input type="color" value={selected.borderColor === "transparent" ? "#111111" : selected.borderColor || "#111111"} onChange={(event) => updateBlock({ borderColor: event.target.value }, false)} className="mt-1 w-full h-8" /></label><label className="text-xs">Spessore<input type="number" min="0" step="0.5" value={selected.borderWidth || 0} onChange={(event) => updateBlock({ borderWidth: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label></div>
              <label className="mt-3 block text-xs">Opacità {Math.round((selected.opacity ?? 1) * 100)}%<input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(event) => updateBlock({ opacity: Number(event.target.value) }, false)} className="mt-1 w-full" /></label>
              <div className="flex gap-2 mt-3"><button onClick={() => updateBlock({ layer: (selected.layer || 0) + 1 })} className="flex-1 border rounded py-1 text-xs">Porta avanti</button><button onClick={() => updateBlock({ layer: (selected.layer || 0) - 1 })} className="flex-1 border rounded py-1 text-xs">Porta indietro</button></div>
            </section> : <section><p className="text-sm text-gray-500">Seleziona un elemento per modificarlo.</p>{currentPage && <label className="mt-4 block text-xs">Sfondo pagina<input type="color" value={currentPage.background || "#ffffff"} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, background: event.target.value } : page))} className="mt-1 w-full h-9" /></label>}</section>}

            <section className="border-t pt-4"><h3 className="font-bold">Testi dinamici</h3><textarea value={projectDescription} onChange={(event) => { setProjectDescription(event.target.value); setDirty(true); }} placeholder="Descrizione progetto" rows={4} className="mt-2 w-full border rounded-lg p-2 text-sm" /><textarea value={paymentConditions} onChange={(event) => { setPaymentConditions(event.target.value); setDirty(true); }} placeholder="Condizioni pagamento" rows={4} className="mt-2 w-full border rounded-lg p-2 text-sm" /></section>
            <section className="border-t pt-4"><div className="flex justify-between"><h3 className="font-bold">Prezzi strutturati</h3><button onClick={() => { setItems((old) => [...old, { service: "Nuovo servizio", description: "", quantity: 1, unitPrice: 0, standardPrice: 0, discountedPrice: 0, vatRate: 22, periodicity: "one_off", renewal: false }]); setDirty(true); }} className="p-1"><Plus className="w-4 h-4" /></button></div>
              <div className="space-y-3 mt-3">{items.map((item, index) => <div key={item._id || index} className="border rounded-lg p-2 space-y-2"><input value={item.service} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, service: event.target.value } : value)); setDirty(true); }} className="w-full border-b font-semibold text-sm" /><div className="grid grid-cols-3 gap-1"><input type="number" min="0" step="0.01" title="Quantità" value={item.quantity} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, quantity: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /><input type="number" min="0" step="0.01" title="Prezzo" value={item.discountedPrice} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, discountedPrice: Number(event.target.value), unitPrice: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /><input type="number" min="0" title="IVA" value={item.vatRate} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, vatRate: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /></div><select value={item.periodicity} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, periodicity: event.target.value } : value)); setDirty(true); }} className="w-full border rounded p-1 text-xs"><option value="one_off">Una tantum</option><option value="monthly">Mensile</option><option value="annual">Annuale</option><option value="custom">Personalizzato</option></select><button onClick={() => { setItems((old) => old.filter((_, i) => i !== index)); setDirty(true); }} className="text-xs text-red-600">Rimuovi</button></div>)}</div>
              <div className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm"><div className="flex justify-between"><span>Imponibile</span><strong>{money(totals.net)}</strong></div><div className="flex justify-between"><span>IVA</span><strong>{money(totals.vat)}</strong></div><div className="flex justify-between text-base mt-1"><span>Totale</span><strong>{money(totals.gross)}</strong></div></div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

