"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Download, Eye, EyeOff, ImagePlus, Layers, Lock, Plus, Redo2, Save, Trash2, Undo2, Unlock, X } from "lucide-react";

const clone = (value) => JSON.parse(JSON.stringify(value));
const money = (value) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(Number(value) || 0);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MIN_BLOCK_SIZE = 12;
const SNAP_DISTANCE = 5;
const resizeHandles = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const handlePosition = {
  nw: "-left-1.5 -top-1.5 cursor-nwse-resize",
  n: "left-1/2 -translate-x-1/2 -top-1.5 cursor-ns-resize",
  ne: "-right-1.5 -top-1.5 cursor-nesw-resize",
  e: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
  se: "-right-1.5 -bottom-1.5 cursor-nwse-resize",
  s: "left-1/2 -translate-x-1/2 -bottom-1.5 cursor-ns-resize",
  sw: "-left-1.5 -bottom-1.5 cursor-nesw-resize",
  w: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function snapValue(value, candidates) {
  let best = value;
  let distance = SNAP_DISTANCE + 1;
  for (const candidate of candidates) {
    const currentDistance = Math.abs(value - candidate);
    if (currentDistance <= SNAP_DISTANCE && currentDistance < distance) {
      best = candidate;
      distance = currentDistance;
    }
  }
  return { value: best, snapped: distance <= SNAP_DISTANCE };
}

const visualStyle = (block) => ({
  left: block.x,
  top: block.y,
  width: block.width,
  height: block.height,
  color: block.color,
  background: block.background,
  fontSize: block.fontSize,
  fontWeight: block.fontWeight,
  fontFamily: block.fontFamily || "Arial, sans-serif",
  lineHeight: block.lineHeight || 1.2,
  letterSpacing: block.letterSpacing || 0,
  textAlign: block.align,
  transform: `rotate(${block.rotation || 0}deg)`,
  zIndex: block.layer,
  opacity: block.opacity ?? 1,
  border: Number(block.borderWidth) > 0 ? `${block.borderWidth}px solid ${block.borderColor || "#111111"}` : undefined,
  borderRadius: block.shapeType === "ellipse" ? "9999px" : block.borderRadius || 0,
});

function PageThumbnail({ page }) {
  return <div className="aspect-[595/842] rounded bg-white border relative overflow-hidden" style={{ background: page.background || "#ffffff" }}>
    {page.backgroundImage && <img src={page.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-fill" style={{ opacity: page.backgroundImageOpacity ?? 1 }} />}
    {[...(page.blocks || [])].filter((block) => !block.referenceMode || block.modified).sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((block) => <div key={block.id} className="absolute overflow-hidden" style={{
      left: `${(block.x / 595) * 100}%`, top: `${(block.y / 842) * 100}%`, width: `${(block.width / 595) * 100}%`, height: `${(block.height / 842) * 100}%`,
      color: block.color, background: block.background, fontSize: Math.max(2, (block.fontSize || 12) * 0.25), fontWeight: block.fontWeight,
      textAlign: block.align, opacity: block.opacity ?? 1, zIndex: block.layer,
      border: Number(block.borderWidth) > 0 ? `${Math.max(0.5, block.borderWidth * 0.25)}px solid ${block.borderColor || "#111111"}` : undefined,
      borderRadius: block.shapeType === "ellipse" ? "9999px" : Math.max(0, (block.borderRadius || 0) * 0.25),
    }}>
      {block.type === "text" && <div className="whitespace-pre-wrap leading-tight">{block.text}</div>}
      {block.type === "image" && block.imageUrl && <img src={block.imageUrl} alt="" className={`w-full h-full ${block.objectFit === "cover" ? "object-cover" : block.objectFit === "fill" ? "object-fill" : "object-contain"}`} />}
    </div>)}
  </div>;
}

export default function QuoteEditor({ quote, template, onClose, onSaved }) {
  const isTemplate = Boolean(template);
  const initialVersion = useMemo(() => isTemplate
    ? { pages: template.pages || [], items: [], projectDescription: "", paymentConditions: "" }
    : quote.versions.find((item) => item.version === quote.currentVersion) || quote.versions.at(-1), [isTemplate, quote, template]);
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
  const [editingTextId, setEditingTextId] = useState("");
  const [preview, setPreview] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [guides, setGuides] = useState({ x: null, y: null });
  const canvasRef = useRef(null);
  const canvasViewportRef = useRef(null);
  const imageInputRef = useRef(null);
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

  const updateBlockById = useCallback((blockId, patch, withHistory = true) => {
    if (withHistory) remember();
    const visualKeys = ["x", "y", "width", "height", "rotation", "text", "imageUrl", "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing", "color", "background", "align", "shapeType", "borderColor", "borderWidth", "borderRadius", "opacity", "objectFit"];
    const changesVisual = visualKeys.some((key) => Object.prototype.hasOwnProperty.call(patch, key));
    setPages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.map((block) => block.id === blockId ? { ...block, ...patch, ...(block.referenceMode && changesVisual ? { modified: true } : {}) } : block) } : page));
    setDirty(true);
  }, [pageIndex, remember]);

  const updateBlock = useCallback((patch, withHistory = true) => updateBlockById(selectedId, patch, withHistory), [selectedId, updateBlockById]);

  const save = useCallback(async ({ newVersion = false, silent = false } = {}) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch(isTemplate ? `/api/commerciale/quote-templates/${template._id}` : `/api/commerciale/quotes/${quote._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isTemplate
          ? { pages, serviceCatalog: template.serviceCatalog || [] }
          : { action: "save_version", pages, items, projectDescription, paymentConditions, createNewVersion: newVersion, reason: newVersion ? "Revisione manuale" : "Salvataggio automatico" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Salvataggio non riuscito");
      setDirty(false);
      setMessage(isTemplate ? "Template salvato" : newVersion ? `Versione ${payload.currentVersion} creata` : "Salvato");
      onSaved?.(payload);
      setTimeout(() => setMessage(""), 1800);
    } catch (error) {
      if (!silent) setMessage(error.message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [isTemplate, items, onSaved, pages, paymentConditions, projectDescription, quote?._id, template?._id, template?.serviceCatalog]);

  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => save({ silent: true }), 1800);
    return () => clearTimeout(timer);
  }, [dirty, save]);

  useEffect(() => {
    const move = (event) => {
      const interaction = dragRef.current;
      const canvas = canvasRef.current;
      if (!interaction || !canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dx = (event.clientX - interaction.pointerX) * (PAGE_WIDTH / rect.width);
      const dy = (event.clientY - interaction.pointerY) * (PAGE_HEIGHT / rect.height);
      const start = interaction.block;

      if (interaction.mode === "rotate") {
        const centerX = rect.left + ((start.x + start.width / 2) / PAGE_WIDTH) * rect.width;
        const centerY = rect.top + ((start.y + start.height / 2) / PAGE_HEIGHT) * rect.height;
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI) + 90;
        updateBlockById(interaction.id, { rotation: Math.round(event.shiftKey ? Math.round(angle / 15) * 15 : angle) }, false);
        return;
      }

      if (interaction.mode === "resize") {
        const handle = interaction.handle;
        let { x, y, width, height } = start;
        if (handle.includes("e")) width = clamp(start.width + dx, MIN_BLOCK_SIZE, PAGE_WIDTH - start.x);
        if (handle.includes("s")) height = clamp(start.height + dy, MIN_BLOCK_SIZE, PAGE_HEIGHT - start.y);
        if (handle.includes("w")) {
          x = clamp(start.x + dx, 0, start.x + start.width - MIN_BLOCK_SIZE);
          width = start.width + (start.x - x);
        }
        if (handle.includes("n")) {
          y = clamp(start.y + dy, 0, start.y + start.height - MIN_BLOCK_SIZE);
          height = start.height + (start.y - y);
        }
        updateBlockById(interaction.id, { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) }, false);
        return;
      }

      const otherBlocks = (currentPage?.blocks || []).filter((block) => block.id !== interaction.id);
      const xCandidates = [0, PAGE_WIDTH / 2 - start.width / 2, PAGE_WIDTH - start.width];
      const yCandidates = [0, PAGE_HEIGHT / 2 - start.height / 2, PAGE_HEIGHT - start.height];
      for (const block of otherBlocks) {
        xCandidates.push(block.x, block.x + block.width, block.x + block.width / 2 - start.width / 2);
        yCandidates.push(block.y, block.y + block.height, block.y + block.height / 2 - start.height / 2);
      }
      const rawX = clamp(start.x + dx, 0, PAGE_WIDTH - start.width);
      const rawY = clamp(start.y + dy, 0, PAGE_HEIGHT - start.height);
      const snappedX = event.altKey ? { value: rawX, snapped: false } : snapValue(rawX, xCandidates);
      const snappedY = event.altKey ? { value: rawY, snapped: false } : snapValue(rawY, yCandidates);
      setGuides({
        x: snappedX.snapped ? snappedX.value + start.width / 2 : null,
        y: snappedY.snapped ? snappedY.value + start.height / 2 : null,
      });
      updateBlockById(interaction.id, { x: Math.round(snappedX.value), y: Math.round(snappedY.value) }, false);
    };
    const up = () => { dragRef.current = null; setGuides({ x: null, y: null }); };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
  }, [currentPage?.blocks, updateBlockById]);

  const startInteraction = (event, block, mode = "drag", handle = "") => {
    if (block.locked || editingTextId === block.id) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(block.id);
    remember();
    dragRef.current = {
      id: block.id,
      mode,
      handle,
      block: clone(block),
      pointerX: event.clientX,
      pointerY: event.clientY,
    };
  };

  useEffect(() => {
    const fitCanvas = () => {
      const viewport = canvasViewportRef.current;
      if (!viewport) return;
      const available = Math.max(320, viewport.clientWidth - 48);
      setZoom(Math.min(1.2, available / PAGE_WIDTH));
    };
    fitCanvas();
    window.addEventListener("resize", fitCanvas);
    return () => window.removeEventListener("resize", fitCanvas);
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      const target = event.target;
      if (!selected || editingTextId || target?.matches?.("input, textarea, select, [contenteditable='true']")) return;
      if ((event.key === "Delete" || event.key === "Backspace") && !selected.locked) {
        event.preventDefault();
        mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.filter((block) => block.id !== selectedId) } : page));
        setSelectedId("");
        return;
      }
      const amount = event.shiftKey ? 10 : 1;
      const movement = {
        ArrowLeft: { x: clamp(selected.x - amount, 0, PAGE_WIDTH - selected.width) },
        ArrowRight: { x: clamp(selected.x + amount, 0, PAGE_WIDTH - selected.width) },
        ArrowUp: { y: clamp(selected.y - amount, 0, PAGE_HEIGHT - selected.height) },
        ArrowDown: { y: clamp(selected.y + amount, 0, PAGE_HEIGHT - selected.height) },
      }[event.key];
      if (movement && !selected.locked) {
        event.preventDefault();
        updateBlock(movement, false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editingTextId, pageIndex, selected, selectedId]);

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
    const block = { id: uid(), type, text: type === "text" ? "Nuovo testo" : "", imageUrl: "", x: 60, y: 100, width: 260, height: type === "shape" ? 60 : 90, fontSize: 22, fontWeight: 400, fontFamily: "Arial", lineHeight: 1.2, letterSpacing: 0, color: "#111111", background: type === "shape" ? "#ffd800" : "transparent", align: "left", layer: (currentPage?.blocks?.length || 0) + 1, shapeType: "rectangle", borderColor: "#111111", borderWidth: 0, borderRadius: 0, opacity: 1, rotation: 0, objectFit: "contain", locked: false };
    mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: [...page.blocks, block] } : page));
    setSelectedId(block.id);
    if (type === "text") setEditingTextId(block.id);
  };

  const duplicateBlock = () => {
    if (!selected) return;
    const duplicate = { ...clone(selected), id: uid(), x: clamp(selected.x + 12, 0, PAGE_WIDTH - selected.width), y: clamp(selected.y + 12, 0, PAGE_HEIGHT - selected.height), locked: false, layer: Math.max(...(currentPage?.blocks || []).map((block) => Number(block.layer) || 0), 0) + 1 };
    mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: [...page.blocks, duplicate] } : page));
    setSelectedId(duplicate.id);
  };

  const uploadImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setMessage("Seleziona un file immagine");
    if (file.size > 12 * 1024 * 1024) return setMessage("Immagine troppo grande: massimo 12 MB");
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
        const compressionScale = Math.min(1, 1800 / Math.max(1, longestSide));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * compressionScale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * compressionScale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/jpeg", 0.88);
        const maxWidth = 360;
        const ratio = image.naturalWidth ? image.naturalHeight / image.naturalWidth : 0.75;
        const width = Math.min(maxWidth, image.naturalWidth || maxWidth);
        const height = Math.min(360, Math.max(40, width * ratio));
        if (selected?.type === "image") {
          updateBlock({ imageUrl: imageData }, false);
          setDirty(true);
          return;
        }
        const block = { id: uid(), type: "image", text: "", imageUrl: imageData, x: Math.round((PAGE_WIDTH - width) / 2), y: Math.round((PAGE_HEIGHT - height) / 2), width, height, fontSize: 18, fontWeight: 400, color: "#111111", background: "transparent", align: "left", layer: Math.max(...(currentPage?.blocks || []).map((item) => Number(item.layer) || 0), 0) + 1, shapeType: "rectangle", borderColor: "transparent", borderWidth: 0, borderRadius: 0, opacity: 1, rotation: 0, objectFit: "contain", locked: false };
        mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: [...page.blocks, block] } : page));
        setSelectedId(block.id);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addPage = () => {
    mutatePages((old) => [...old, { id: uid(), name: `Pagina ${old.length + 1}`, background: "#ffffff", backgroundImage: "", backgroundImageOpacity: 1, includedByDefault: false, serviceKeys: [], blocks: [] }]);
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
    if (isTemplate) return;
    const needsReason = status === "rejected" || status === "postponed";
    const reason = needsReason ? window.prompt(status === "rejected" ? "Motivazione del rifiuto" : "Motivo del rinvio") : "";
    if (needsReason && !reason) return;
    const resumeAt = status === "postponed" ? window.prompt("Data di ripresa (AAAA-MM-GG)") : "";
    if (status === "postponed" && !resumeAt) return;
    const response = await fetch(`/api/commerciale/quotes/${quote._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "change_status", status, reason, resumeAt }) });
    const payload = await response.json();
    if (!response.ok) return setMessage(payload.error || "Cambio stato non riuscito");
    onSaved?.(payload); setMessage("Stato aggiornato");
  };

  return (
    <div className="fixed inset-0 z-[70] bg-gray-950/80 p-2 md:p-5 overflow-hidden">
      <div className="h-full max-w-[1600px] mx-auto bg-gray-100 rounded-2xl overflow-hidden flex flex-col">
        <header className="bg-white border-b px-4 py-3 flex flex-wrap items-center gap-2">
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100"><X /></button>
          <div className="mr-auto"><h2 className="font-bold">{isTemplate ? template.name : quote.number}</h2><p className="text-xs text-gray-500">{isTemplate ? "Editor master del template · le modifiche valgono per i nuovi preventivi" : `Versione ${quote.currentVersion} · ${quote.organization?.businessName || ""}`}</p></div>
          <button onClick={undo} disabled={!history.length} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
          <button onClick={redo} disabled={!future.length} className="p-2 rounded hover:bg-gray-100 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
          <button onClick={() => { setPreview((value) => !value); setSelectedId(""); setEditingTextId(""); }} className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${preview ? "bg-blue-50 border-blue-400" : ""}`}>{preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? "Modifica" : "Anteprima"}</button>
          {!isTemplate && <><select value={quote.status} onChange={(event) => changeStatus(event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="draft">Bozza</option><option value="ready">Pronto</option><option value="presented">Presentato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="postponed">Posticipato</option><option value="archived">Archiviato</option></select>
          <a href={`/api/commerciale/quotes/${quote._id}/pdf?version=${quote.currentVersion}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"><Download className="w-4 h-4" />PDF</a>
          <button onClick={() => save({ newVersion: true })} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"><Copy className="w-4 h-4" />Nuova versione</button></>}
          <button onClick={() => save()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" />{saving ? "Salvo…" : dirty ? "Salva" : "Salvato"}</button>
          {message && <span className="text-xs text-gray-600">{message}</span>}
        </header>

        <div className={`flex-1 min-h-0 grid grid-cols-1 ${preview ? "lg:grid-cols-1" : "lg:grid-cols-[210px_minmax(620px,1fr)_310px]"}`}>
          {!preview && <aside className="hidden lg:block bg-white border-r overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-3"><strong className="text-sm">Pagine</strong><button onClick={addPage} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-4 h-4" /></button></div>
            <div className="space-y-2">{pages.map((page, index) => <button key={page.id} onClick={() => { setPageIndex(index); setSelectedId(""); }} className={`w-full text-left border rounded-lg p-2 ${index === pageIndex ? "border-yellow-500 bg-yellow-50" : "border-gray-200"}`}><PageThumbnail page={page} /><span className="mt-2 block truncate text-xs font-medium">{index + 1}. {page.name}</span></button>)}</div>
            <div className="sticky bottom-0 mt-3 grid grid-cols-4 gap-1 bg-white py-2">
              <button title="Sposta pagina su" onClick={() => movePage(-1)} disabled={pageIndex === 0} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
              <button title="Sposta pagina giù" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              <button title="Duplica pagina" onClick={duplicatePage} className="grid place-items-center border rounded-lg py-2"><Copy className="w-4 h-4" /></button>
              <button title="Elimina pagina" onClick={deletePage} disabled={pages.length <= 1} className="grid place-items-center border rounded-lg py-2 text-red-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div>
          </aside>}

          <main ref={canvasViewportRef} className="overflow-auto p-4 md:p-8 bg-gray-200">
            {!preview && <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <button onClick={() => addBlock("text")} className="px-3 py-2 bg-white rounded-lg shadow text-sm">+ Testo</button>
              <button onClick={() => addBlock("shape")} className="px-3 py-2 bg-white rounded-lg shadow text-sm">+ Forma</button>
              <button onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"><ImagePlus className="w-4 h-4" />Carica immagine</button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              <span className="mx-2 h-6 border-l" />
              <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow">Zoom<input type="range" min="0.35" max="1.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24" /><span className="w-10 text-right">{Math.round(zoom * 100)}%</span></label>
            </div>}
            {currentPage && <div className="relative mx-auto" style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}>
              <div ref={canvasRef} className="absolute left-0 top-0 shadow-2xl touch-none overflow-hidden" style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, background: currentPage.background, transform: `scale(${zoom})`, transformOrigin: "top left" }} onPointerDown={() => { setSelectedId(""); setEditingTextId(""); }}>
                {currentPage.backgroundImage && <img src={currentPage.backgroundImage} alt="Sfondo del template" className="absolute inset-0 w-full h-full object-fill pointer-events-none" style={{ opacity: currentPage.backgroundImageOpacity ?? 1 }} />}
                {(currentPage.blocks || []).filter((block) => block.referenceMode && block.modified).map((block) => <div key={`mask-${block.id}`} className="absolute pointer-events-none" style={{ left: block.sourceX ?? block.x, top: block.sourceY ?? block.y, width: block.sourceWidth ?? block.width, height: block.sourceHeight ?? block.height, background: block.sourceMaskColor || "#ffffff", zIndex: Math.max(-1, (Number(block.layer) || 0) - 0.5) }} />)}
                {guides.x !== null && <div className="absolute top-0 bottom-0 w-px bg-fuchsia-500 z-[9999] pointer-events-none" style={{ left: guides.x }} />}
                {guides.y !== null && <div className="absolute left-0 right-0 h-px bg-fuchsia-500 z-[9999] pointer-events-none" style={{ top: guides.y }} />}
                {[...(currentPage.blocks || [])].sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((block) => {
                  const isSelected = !preview && selectedId === block.id;
                  const isEditing = editingTextId === block.id;
                  const pristineReference = block.referenceMode && !block.modified;
                  return <div key={block.id} onPointerDown={(event) => startInteraction(event, block)} onDoubleClick={(event) => { if (block.type === "text" && !block.locked) { event.stopPropagation(); updateBlockById(block.id, { modified: true }); setSelectedId(block.id); setEditingTextId(block.id); } }} className={`absolute ${preview || block.locked ? "cursor-default" : "cursor-move hover:outline hover:outline-1 hover:outline-blue-400"} ${isSelected ? "ring-2 ring-blue-500" : ""}`} style={{ ...visualStyle(block), ...(pristineReference ? { background: "transparent", border: "none", opacity: 1 } : {}) }}>
                    <div className="w-full h-full overflow-hidden" style={{ borderRadius: block.shapeType === "ellipse" ? "9999px" : block.borderRadius || 0 }}>
                      {block.type === "text" && (isEditing ? <textarea autoFocus value={block.text} onChange={(event) => updateBlock({ text: event.target.value }, false)} onBlur={() => { setEditingTextId(""); setDirty(true); }} onPointerDown={(event) => event.stopPropagation()} className="w-full h-full resize-none border-0 bg-transparent p-1 outline-none" style={{ color: block.color, fontFamily: block.fontFamily || "Arial", fontSize: block.fontSize, fontWeight: block.fontWeight, lineHeight: block.lineHeight || 1.2, letterSpacing: block.letterSpacing || 0, textAlign: block.align }} /> : !pristineReference && <div className="w-full h-full p-1 whitespace-pre-wrap">{block.text}</div>)}
                      {block.type === "image" && !pristineReference && (block.imageUrl ? <img src={block.imageUrl} alt="" draggable="false" className={`w-full h-full pointer-events-none ${block.objectFit === "cover" ? "object-cover" : block.objectFit === "fill" ? "object-fill" : "object-contain"}`} /> : <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full h-full border-2 border-dashed grid place-items-center text-xs text-gray-400">Carica immagine</button>)}
                    </div>
                    {isSelected && !block.locked && !isEditing && <>
                      {resizeHandles.map((handle) => <button type="button" aria-label={`Ridimensiona ${handle}`} key={handle} onPointerDown={(event) => startInteraction(event, block, "resize", handle)} className={`absolute z-[10000] h-3 w-3 rounded-sm border border-blue-700 bg-white ${handlePosition[handle]}`} />)}
                      <div className="absolute left-1/2 -translate-x-1/2 -top-7 h-6 w-px bg-blue-500" />
                      <button type="button" aria-label="Ruota" onPointerDown={(event) => startInteraction(event, block, "rotate")} className="absolute left-1/2 -translate-x-1/2 -top-10 z-[10000] h-4 w-4 rounded-full border-2 border-blue-700 bg-white cursor-grab" />
                    </>}
                  </div>;
                })}
              </div>
            </div>}
          </main>

          {!preview && <aside className="bg-white border-l overflow-y-auto p-4 space-y-5">
            {selected ? <section><div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" />Elemento {selected.type === "text" ? "testo" : selected.type === "image" ? "immagine" : "forma"}</h3><div className="flex items-center"><button title="Duplica elemento" onClick={duplicateBlock} className="p-1 text-gray-700"><Copy className="w-4 h-4" /></button><button title={selected.locked ? "Sblocca" : "Blocca"} onClick={() => updateBlock({ locked: !selected.locked })} className="p-1 text-gray-700">{selected.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button><button title="Elimina elemento" onClick={() => { mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.filter((block) => block.id !== selectedId) } : page)); setSelectedId(""); }} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>
              <p className="mt-1 text-[11px] text-gray-500">Trascina sul foglio · usa le maniglie per ridimensionare · doppio clic sul testo per scrivere.</p>
              {selected.type === "text" && <textarea value={selected.text} onChange={(event) => updateBlock({ text: event.target.value }, false)} onBlur={() => setDirty(true)} rows={5} className="mt-3 w-full border rounded-lg p-2 text-sm" />}
              {selected.type === "image" && <div className="mt-3 space-y-2"><button onClick={() => imageInputRef.current?.click()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"><ImagePlus className="w-4 h-4" />Sostituisci immagine</button><input value={selected.imageUrl} onChange={(event) => updateBlock({ imageUrl: event.target.value }, false)} placeholder="Oppure incolla URL o data:image…" className="w-full border rounded-lg p-2 text-sm" /><label className="block text-xs">Adattamento<select value={selected.objectFit || "contain"} onChange={(event) => updateBlock({ objectFit: event.target.value })} className="mt-1 w-full border rounded p-2"><option value="contain">Contieni</option><option value="cover">Riempi e ritaglia</option><option value="fill">Stira</option></select></label></div>}
              <div className="grid grid-cols-2 gap-2 mt-3">{[["X", "x"], ["Y", "y"], ["Larghezza", "width"], ["Altezza", "height"]].map(([label, key]) => <label key={key} className="text-xs">{label}<input type="number" value={selected[key]} onChange={(event) => updateBlock({ [key]: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>)}</div>
              <label className="mt-2 block text-xs">Rotazione<input type="number" min="-360" max="360" value={selected.rotation || 0} onChange={(event) => updateBlock({ rotation: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>
              {selected.type === "text" && <div className="mt-3 space-y-2"><label className="block text-xs">Carattere<select value={selected.fontFamily || "Arial"} onChange={(event) => updateBlock({ fontFamily: event.target.value })} className="mt-1 w-full border rounded p-1"><option value="Arial">Arial</option><option value="Helvetica">Helvetica</option><option value="Times New Roman">Times New Roman</option><option value="Georgia">Georgia</option><option value="Courier New">Courier New</option></select></label><div className="grid grid-cols-2 gap-2"><label className="text-xs">Dimensione<input type="number" min="6" value={selected.fontSize} onChange={(event) => updateBlock({ fontSize: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label><label className="text-xs">Peso<select value={selected.fontWeight} onChange={(event) => updateBlock({ fontWeight: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1"><option value="400">Normale</option><option value="700">Bold</option><option value="900">Black</option></select></label><label className="text-xs">Interlinea<input type="number" min="0.7" max="3" step="0.05" value={selected.lineHeight || 1.2} onChange={(event) => updateBlock({ lineHeight: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label><label className="text-xs">Spaziatura<input type="number" min="-5" max="20" step="0.1" value={selected.letterSpacing || 0} onChange={(event) => updateBlock({ letterSpacing: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label></div><div className="grid grid-cols-3 gap-1">{[["Sinistra", "left"], ["Centro", "center"], ["Destra", "right"]].map(([label, value]) => <button key={value} onClick={() => updateBlock({ align: value })} className={`rounded border px-1 py-1.5 text-xs ${selected.align === value ? "border-blue-500 bg-blue-50" : ""}`}>{label}</button>)}</div></div>}
              {selected.type === "shape" && <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Forma<select value={selected.shapeType || "rectangle"} onChange={(event) => updateBlock({ shapeType: event.target.value })} className="mt-1 w-full border rounded p-1"><option value="rectangle">Rettangolo</option><option value="ellipse">Ellisse</option></select></label><label className="text-xs">Angoli<input type="number" min="0" value={selected.borderRadius || 0} onChange={(event) => updateBlock({ borderRadius: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label></div>}
              <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Colore<input type="color" value={selected.color || "#111111"} onChange={(event) => updateBlock({ color: event.target.value }, false)} className="mt-1 w-full h-8" /></label><label className="text-xs">Sfondo<input type="color" value={selected.background === "transparent" ? "#ffffff" : selected.background} onChange={(event) => updateBlock({ background: event.target.value }, false)} className="mt-1 w-full h-8" /></label></div>
              <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Bordo<input type="color" value={selected.borderColor === "transparent" ? "#111111" : selected.borderColor || "#111111"} onChange={(event) => updateBlock({ borderColor: event.target.value }, false)} className="mt-1 w-full h-8" /></label><label className="text-xs">Spessore<input type="number" min="0" step="0.5" value={selected.borderWidth || 0} onChange={(event) => updateBlock({ borderWidth: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label></div>
              <label className="mt-3 block text-xs">Opacità {Math.round((selected.opacity ?? 1) * 100)}%<input type="range" min="0.1" max="1" step="0.05" value={selected.opacity ?? 1} onChange={(event) => updateBlock({ opacity: Number(event.target.value) }, false)} className="mt-1 w-full" /></label>
              <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={() => updateBlock({ layer: Math.max(...(currentPage?.blocks || []).map((block) => Number(block.layer) || 0), 0) + 1 })} className="border rounded py-1 text-xs">In primo piano</button><button onClick={() => updateBlock({ layer: Math.min(...(currentPage?.blocks || []).map((block) => Number(block.layer) || 0), 0) - 1 })} className="border rounded py-1 text-xs">Sullo sfondo</button><button onClick={() => updateBlock({ layer: (selected.layer || 0) + 1 })} className="border rounded py-1 text-xs">Avanti</button><button onClick={() => updateBlock({ layer: (selected.layer || 0) - 1 })} className="border rounded py-1 text-xs">Indietro</button></div>
            </section> : <section><h3 className="font-bold">Pagina</h3><p className="text-sm text-gray-500"><strong>{currentPage?.blocks?.length || 0} elementi modificabili.</strong> Clicca un testo, una forma o un&apos;immagine sul foglio. Doppio clic sui testi per scrivere.</p>{currentPage && <div className="mt-4 space-y-3"><label className="block text-xs">Nome pagina<input value={currentPage.name || ""} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, name: event.target.value } : page), false)} className="mt-1 w-full border rounded p-2" /></label><label className="block text-xs">Sfondo pagina<input type="color" value={currentPage.background || "#ffffff"} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, background: event.target.value } : page))} className="mt-1 w-full h-9" /></label><label className="block text-xs">Immagine master<input value={currentPage.backgroundImage || ""} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, backgroundImage: event.target.value } : page), false)} placeholder="/commerciale/..." className="mt-1 w-full border rounded p-2" /></label>{currentPage.backgroundImage && <label className="block text-xs">Opacità master {Math.round((currentPage.backgroundImageOpacity ?? 1) * 100)}%<input type="range" min="0" max="1" step="0.05" value={currentPage.backgroundImageOpacity ?? 1} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, backgroundImageOpacity: Number(event.target.value) } : page), false)} className="mt-1 w-full" /></label>}{isTemplate && <><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(currentPage.includedByDefault)} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, includedByDefault: event.target.checked } : page))} />Includi sempre nel preventivo</label><div><p className="text-xs font-semibold mb-2">Servizi collegati</p><div className="space-y-1 max-h-52 overflow-auto">{(template.serviceCatalog || []).map((service) => <label key={service.key} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={(currentPage.serviceKeys || []).includes(service.key)} onChange={(event) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, serviceKeys: event.target.checked ? [...new Set([...(page.serviceKeys || []), service.key])] : (page.serviceKeys || []).filter((key) => key !== service.key) } : page))} />{service.label}</label>)}</div></div></>}</div>}</section>}

            {!isTemplate && <><section className="border-t pt-4"><h3 className="font-bold">Testi dinamici</h3><textarea value={projectDescription} onChange={(event) => { setProjectDescription(event.target.value); setDirty(true); }} placeholder="Descrizione progetto" rows={4} className="mt-2 w-full border rounded-lg p-2 text-sm" /><textarea value={paymentConditions} onChange={(event) => { setPaymentConditions(event.target.value); setDirty(true); }} placeholder="Condizioni pagamento" rows={4} className="mt-2 w-full border rounded-lg p-2 text-sm" /></section>
            <section className="border-t pt-4"><div className="flex justify-between"><h3 className="font-bold">Prezzi strutturati</h3><button onClick={() => { setItems((old) => [...old, { service: "Nuovo servizio", description: "", quantity: 1, unitPrice: 0, standardPrice: 0, discountedPrice: 0, vatRate: 22, periodicity: "one_off", renewal: false }]); setDirty(true); }} className="p-1"><Plus className="w-4 h-4" /></button></div>
              <div className="space-y-3 mt-3">{items.map((item, index) => <div key={item._id || index} className="border rounded-lg p-2 space-y-2"><input value={item.service} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, service: event.target.value } : value)); setDirty(true); }} className="w-full border-b font-semibold text-sm" /><div className="grid grid-cols-3 gap-1"><input type="number" min="0" step="0.01" title="Quantità" value={item.quantity} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, quantity: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /><input type="number" min="0" step="0.01" title="Prezzo" value={item.discountedPrice} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, discountedPrice: Number(event.target.value), unitPrice: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /><input type="number" min="0" title="IVA" value={item.vatRate} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, vatRate: Number(event.target.value) } : value)); setDirty(true); }} className="border rounded p-1 text-xs" /></div><select value={item.periodicity} onChange={(event) => { setItems((old) => old.map((value, i) => i === index ? { ...value, periodicity: event.target.value } : value)); setDirty(true); }} className="w-full border rounded p-1 text-xs"><option value="one_off">Una tantum</option><option value="monthly">Mensile</option><option value="annual">Annuale</option><option value="custom">Personalizzato</option></select><button onClick={() => { setItems((old) => old.filter((_, i) => i !== index)); setDirty(true); }} className="text-xs text-red-600">Rimuovi</button></div>)}</div>
              <div className="mt-3 rounded-lg bg-yellow-100 p-3 text-sm"><div className="flex justify-between"><span>Imponibile</span><strong>{money(totals.net)}</strong></div><div className="flex justify-between"><span>IVA</span><strong>{money(totals.vat)}</strong></div><div className="flex justify-between text-base mt-1"><span>Totale</span><strong>{money(totals.gross)}</strong></div></div>
            </section></>}
          </aside>}
        </div>
      </div>
    </div>
  );
}

