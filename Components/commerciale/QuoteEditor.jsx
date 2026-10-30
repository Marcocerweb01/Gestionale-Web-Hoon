"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Circle, Copy, Download, Eye, EyeOff, FileUp, ImagePlus, Layers, Lock, Plus, Redo2, Save, Shapes, Square, Trash2, Type, Undo2, Unlock, X } from "lucide-react";
import { normalizeQuotePages, resolveQuoteVariables } from "@/lib/commerciale/quoteCanvas";
import FabricQuoteCanvas from "./FabricQuoteCanvas";

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

function PageThumbnail({ page, resolveText = (text) => text }) {
  return <div className="aspect-[595/842] rounded bg-white border relative overflow-hidden" style={{ background: page.background || "#ffffff" }}>
    {page.svgAsset && <SourceSvgLayer asset={page.svgAsset} edits={page.svgEdits || page.fabricJson?.sourceEdits || {}} preview />}
    {page.backgroundImage && <img src={page.backgroundImage} alt="" className="absolute inset-0 w-full h-full object-fill" style={{ opacity: page.backgroundImageOpacity ?? 1 }} />}
    {[...(page.blocks || [])].sort((a, b) => (a.layer || 0) - (b.layer || 0)).map((block) => <div key={block.id} className="absolute overflow-hidden" style={{
      left: `${(block.x / 595) * 100}%`, top: `${(block.y / 842) * 100}%`, width: `${(block.width / 595) * 100}%`, height: `${(block.height / 842) * 100}%`,
      color: block.color, background: block.background, fontSize: Math.max(2, (block.fontSize || 12) * 0.25), fontWeight: block.fontWeight,
      textAlign: block.align, opacity: block.opacity ?? 1, zIndex: block.layer,
      border: Number(block.borderWidth) > 0 ? `${Math.max(0.5, block.borderWidth * 0.25)}px solid ${block.borderColor || "#111111"}` : undefined,
      borderRadius: block.shapeType === "ellipse" ? "9999px" : Math.max(0, (block.borderRadius || 0) * 0.25),
    }}>
      {block.type === "text" && <div className="whitespace-pre-wrap leading-tight">{resolveText(block.text)}</div>}
      {block.type === "image" && block.imageUrl && <img src={block.imageUrl} alt="" className={`w-full h-full ${block.objectFit === "cover" ? "object-cover" : block.objectFit === "fill" ? "object-fill" : "object-contain"}`} />}
    </div>)}
  </div>;
}

function SourceSvgLayer({ asset, edits = {}, selectedId, preview, onSelect, onEdit, onInteractionStart }) {
  const [markup, setMarkup] = useState("");
  const layerRef = useRef(null);
  const pointerRef = useRef(null);

  useEffect(() => {
    if (!asset) return setMarkup("");
    const controller = new AbortController();
    fetch(asset, { signal: controller.signal }).then((response) => {
      if (!response.ok) throw new Error("Template SVG non disponibile");
      return response.text();
    }).then(setMarkup).catch((error) => {
      if (error.name !== "AbortError") console.error(error);
    });
    return () => controller.abort();
  }, [asset]);

  useEffect(() => {
    const root = layerRef.current;
    if (!root || !markup) return;
    for (const element of root.querySelectorAll("[data-editor-id]")) {
      const id = element.getAttribute("data-editor-id");
      const edit = edits[id] || {};
      const baseTransform = element.getAttribute("data-editor-base-transform") || "";
      const dx = Number(edit.dx) || 0;
      const dy = Number(edit.dy) || 0;
      const rotation = Number(edit.rotation) || 0;
      const scaleX = Number(edit.scaleX) || 1;
      const scaleY = Number(edit.scaleY) || 1;
      element.setAttribute("transform", `${baseTransform} translate(${dx} ${dy}) rotate(${rotation}) scale(${scaleX} ${scaleY})`.trim());
      element.style.display = edit.hidden ? "none" : "";
      element.style.opacity = edit.opacity == null ? "" : String(edit.opacity);
      element.toggleAttribute("data-editor-selected", !preview && id === selectedId);

      if (element.getAttribute("data-editor-kind") === "text") {
        const replacement = element.querySelector(":scope > [data-editor-replacement]");
        const hasReplacement = edit.text != null;
        for (const path of element.querySelectorAll(":scope > path")) path.style.display = hasReplacement ? "none" : "";
        if (!hasReplacement) replacement?.remove();
        else {
          const text = replacement || document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("data-editor-replacement", "true");
          text.setAttribute("x", element.getAttribute("data-editor-x") || "0");
          text.setAttribute("y", element.getAttribute("data-editor-y") || "0");
          text.setAttribute("font-size", String(edit.fontSize || element.getAttribute("data-editor-font-size") || 16));
          text.setAttribute("font-family", edit.fontFamily || element.getAttribute("data-editor-font-family") || "Arial, sans-serif");
          text.setAttribute("font-weight", String(edit.fontWeight || element.getAttribute("data-editor-font-weight") || 400));
          text.setAttribute("fill", edit.color || element.getAttribute("data-editor-fill") || "#111111");
          text.textContent = edit.text;
          if (!replacement) element.append(text);
        }
      }
    }
  }, [edits, markup, preview, selectedId]);

  const pointerDown = (event) => {
    if (preview) return;
    const element = event.target.closest?.("[data-editor-id]");
    if (!element || !layerRef.current?.contains(element)) return;
    event.preventDefault();
    event.stopPropagation();
    const id = element.getAttribute("data-editor-id");
    const kind = element.getAttribute("data-editor-kind") || "vector";
    onSelect({ id, kind, text: element.getAttribute("data-editor-text") || "" });
    pointerRef.current = { id, x: event.clientX, y: event.clientY, dx: Number(edits[id]?.dx) || 0, dy: Number(edits[id]?.dy) || 0, started: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const pointerMove = (event) => {
    const pointer = pointerRef.current;
    if (!pointer || !layerRef.current) return;
    const distance = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
    if (!pointer.started && distance < 3) return;
    if (!pointer.started) {
      pointer.started = true;
      onInteractionStart();
    }
    const rect = layerRef.current.getBoundingClientRect();
    onEdit(pointer.id, {
      dx: Math.round((pointer.dx + (event.clientX - pointer.x) * (PAGE_WIDTH / rect.width)) * 10) / 10,
      dy: Math.round((pointer.dy + (event.clientY - pointer.y) * (PAGE_HEIGHT / rect.height)) * 10) / 10,
    }, false);
  };

  return <div
    ref={layerRef}
    className="absolute inset-0 z-[1] [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&_[data-editor-id]]:cursor-move [&_[data-editor-id]:hover]:[filter:drop-shadow(0_0_2px_#2563eb)] [&_[data-editor-selected]]:[filter:drop-shadow(0_0_3px_#2563eb)]"
    onPointerDown={pointerDown}
    onPointerMove={pointerMove}
    onPointerUp={() => { pointerRef.current = null; }}
    onPointerCancel={() => { pointerRef.current = null; }}
    dangerouslySetInnerHTML={{ __html: markup }}
  />;
}

export default function QuoteEditor({ quote, template, onClose, onSaved }) {
  const isTemplate = Boolean(template);
  const initialVersion = useMemo(() => isTemplate
    ? { pages: template.pages || [], items: [], projectDescription: "", paymentConditions: "" }
    : quote.versions.find((item) => item.version === quote.currentVersion) || quote.versions.at(-1), [isTemplate, quote, template]);
  const [pages, setPages] = useState(() => normalizeQuotePages(clone(initialVersion?.pages || [])));
  const [items, setItems] = useState(() => clone(initialVersion?.items || []));
  const [projectDescription, setProjectDescription] = useState(initialVersion?.projectDescription || "");
  const [paymentConditions, setPaymentConditions] = useState(initialVersion?.paymentConditions || "");
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState("");
  const [selectedSource, setSelectedSource] = useState(null);
  const [fabricSelection, setFabricSelection] = useState(null);
  const [leftPanel, setLeftPanel] = useState("pages");
  const [importingPdf, setImportingPdf] = useState(false);
  const [canvasGeneration, setCanvasGeneration] = useState(0);
  const [sourceFileId, setSourceFileId] = useState(() => String(template?.sourceFile?._id || template?.sourceFile || ""));
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
  const pdfInputRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const dragRef = useRef(null);
  const savingRef = useRef(false);

  const currentPage = pages[pageIndex];
  const selected = currentPage?.blocks?.find((block) => block.id === selectedId);
  const selectedSourceEdit = selectedSource ? (currentPage?.svgEdits?.[selectedSource.id] || {}) : null;
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
    setPages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.map((block) => block.id === blockId ? { ...block, ...patch } : block) } : page));
    setDirty(true);
  }, [pageIndex, remember]);

  const updateBlock = useCallback((patch, withHistory = true) => updateBlockById(selectedId, patch, withHistory), [selectedId, updateBlockById]);

  const updateSvgEdit = useCallback((objectId, patch, withHistory = true) => {
    if (withHistory) remember();
    setPages((old) => old.map((page, index) => index === pageIndex ? {
      ...page,
      svgEdits: { ...(page.svgEdits || {}), [objectId]: { ...(page.svgEdits?.[objectId] || {}), ...patch } },
    } : page));
    setDirty(true);
  }, [pageIndex, remember]);

  const save = useCallback(async ({ newVersion = false, silent = false } = {}) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const response = await fetch(isTemplate ? `/api/commerciale/quote-templates/${template._id}` : `/api/commerciale/quotes/${quote._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isTemplate
          ? { pages, serviceCatalog: template.serviceCatalog || [], sourceFile: sourceFileId || null }
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
  }, [isTemplate, items, onSaved, pages, paymentConditions, projectDescription, quote?._id, sourceFileId, template?._id, template?.serviceCatalog]);

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
      const pointerDistance = Math.hypot(event.clientX - interaction.pointerX, event.clientY - interaction.pointerY);
      if (!interaction.started && pointerDistance < 3) return;
      if (!interaction.started) {
        interaction.started = true;
        remember();
      }
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
  }, [currentPage?.blocks, remember, updateBlockById]);

  const startInteraction = (event, block, mode = "drag", handle = "") => {
    if (preview || block.locked || editingTextId === block.id) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedSource(null);
    setSelectedId(block.id);
    dragRef.current = {
      id: block.id,
      mode,
      handle,
      block: clone(block),
      pointerX: event.clientX,
      pointerY: event.clientY,
      started: false,
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
    setCanvasGeneration((value) => value + 1);
  };
  const redo = () => {
    const next = future[0];
    if (!next) return;
    setHistory((old) => [...old, clone(pages)]);
    setPages(next);
    setFuture((old) => old.slice(1));
    setDirty(true);
    setCanvasGeneration((value) => value + 1);
  };

  useEffect(() => {
    const onEditorShortcut = (event) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const target = event.target;
      const isFormField = target?.matches?.("input, textarea, select, [contenteditable='true']");
      if (isFormField || fabricCanvasRef.current?.isEditingText?.()) return;
      const key = event.key.toLowerCase();

      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (key === "y" && !event.metaKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "c" && fabricSelection) {
        event.preventDefault();
        fabricCanvasRef.current?.copySelected?.();
        return;
      }
      if (key === "v") {
        event.preventDefault();
        fabricCanvasRef.current?.pasteSelected?.();
      }
    };
    window.addEventListener("keydown", onEditorShortcut);
    return () => window.removeEventListener("keydown", onEditorShortcut);
  }, [fabricSelection, future, history, pages]);

  const addBlock = (type) => {
    const block = { id: uid(), type, text: type === "text" ? "Nuovo testo" : "", imageUrl: "", x: 60, y: 100, width: 260, height: type === "shape" ? 60 : 90, fontSize: 22, fontWeight: 400, fontFamily: "Arial", lineHeight: 1.2, letterSpacing: 0, color: "#111111", background: type === "shape" ? "#ffd800" : "transparent", align: "left", layer: (currentPage?.blocks?.length || 0) + 1, shapeType: "rectangle", borderColor: "#111111", borderWidth: 0, borderRadius: 0, opacity: 1, rotation: 0, objectFit: "contain", locked: false };
    mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: [...page.blocks, block] } : page));
    setSelectedSource(null);
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
        fabricCanvasRef.current?.addImage(imageData);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const importPdfProject = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") return setMessage("Seleziona un file PDF");
    if (file.size > 12 * 1024 * 1024) return setMessage("Il PDF supera il limite di 12 MB");
    setImportingPdf(true);
    setMessage("Analisi del PDF in corso…");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("purpose", "quote_source");
      const upload = await fetch("/api/commerciale/files", { method: "POST", body: form });
      const uploaded = await upload.json();
      if (!upload.ok) throw new Error(uploaded.error || "Caricamento PDF non riuscito");
      setSourceFileId(uploaded._id);

      const pdfjsModule = await import("pdfjs-dist/legacy/build/pdf");
      const pdfjs = pdfjsModule.default || pdfjsModule;
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      const bytes = new Uint8Array(await file.arrayBuffer());
      const documentTask = pdfjs.getDocument({ data: bytes });
      const pdf = await documentTask.promise;
      if (pdf.numPages > 60) throw new Error("Il PDF supera il limite di 60 pagine");
      const importedPages = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        setMessage(`Importazione pagina ${pageNumber} di ${pdf.numPages}…`);
        const page = await pdf.getPage(pageNumber);
        const logicalViewport = page.getViewport({ scale: 1 });
        const renderScale = Math.min(1.35, 1100 / Math.max(logicalViewport.width, logicalViewport.height));
        const renderViewport = page.getViewport({ scale: renderScale });
        const raster = document.createElement("canvas");
        raster.width = Math.ceil(renderViewport.width);
        raster.height = Math.ceil(renderViewport.height);
        const context = raster.getContext("2d", { willReadFrequently: true });
        await page.render({ canvasContext: context, viewport: renderViewport }).promise;
        const backgroundImage = raster.toDataURL("image/jpeg", 0.72);
        const textContent = await page.getTextContent();
        const scaleX = PAGE_WIDTH / logicalViewport.width;
        const scaleY = PAGE_HEIGHT / logicalViewport.height;
        const blocks = [];

        for (const [textIndex, item] of textContent.items.entries()) {
          if (!item.str?.trim()) continue;
          const transform = pdfjs.Util.transform(logicalViewport.transform, item.transform);
          const fontHeight = Math.max(5, Math.hypot(transform[2], transform[3]));
          const x = transform[4] * scaleX;
          const y = (transform[5] - fontHeight) * scaleY;
          const width = Math.max(6, (item.width || item.str.length * fontHeight * 0.5) * scaleX);
          const height = Math.max(7, fontHeight * 1.15 * scaleY);
          const sampleX = Math.max(0, Math.min(raster.width - 1, Math.round((transform[4] + (item.width || 1) / 2) * renderScale)));
          const sampleY = Math.max(0, Math.min(raster.height - 1, Math.round((transform[5] - fontHeight / 2) * renderScale)));
          const pixel = context.getImageData(sampleX, sampleY, 1, 1).data;
          const maskColor = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
          blocks.push({ id: `pdf-mask-${pageNumber}-${textIndex}`, type: "shape", x: x - 1, y: y - 1, width: width + 2, height: height + 2, background: maskColor, color: maskColor, rotation: 0, layer: textIndex * 2 + 1, opacity: 1, shapeType: "rectangle", borderColor: "transparent", borderWidth: 0, borderRadius: 0, locked: true, maskLayer: true });
          blocks.push({ id: `pdf-text-${pageNumber}-${textIndex}`, type: "text", text: item.str, x, y, width: Math.max(width, 20), height: Math.max(height, fontHeight * 1.5), fontSize: fontHeight * scaleY, fontWeight: 400, fontFamily: "Arial", lineHeight: 1, letterSpacing: 0, color: "#111111", background: "transparent", align: "left", rotation: 0, layer: textIndex * 2 + 2, opacity: 1, locked: false, sourceFont: item.fontName || "" });
        }

        importedPages.push({ id: `imported-${Date.now().toString(36)}-${pageNumber}`, name: `Pagina ${pageNumber}`, background: "#ffffff", backgroundImage, backgroundImageOpacity: 1, svgAsset: "", svgEdits: {}, fabricJson: null, includedByDefault: pageNumber === 1, sourcePage: pageNumber, serviceKeys: [], blocks, importMeta: { mode: "pdfjs-raster-reference", editableTextCount: blocks.filter((block) => block.type === "text").length, originalWidth: logicalViewport.width, originalHeight: logicalViewport.height } });
      }
      await pdf.destroy();
      remember();
      setPages(importedPages);
      setPageIndex(0);
      setFabricSelection(null);
      setDirty(true);
      setMessage(`${importedPages.length} pagine importate · testi riconosciuti modificabili · grafica non recuperabile mantenuta come riferimento`);
    } catch (error) {
      setMessage(error.message || "Importazione PDF non riuscita");
    } finally {
      setImportingPdf(false);
    }
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
          <button onClick={() => { setPreview((value) => !value); setSelectedId(""); setSelectedSource(null); setFabricSelection(null); setEditingTextId(""); }} className={`inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm ${preview ? "bg-blue-50 border-blue-400" : ""}`}>{preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}{preview ? "Modifica" : "Anteprima"}</button>
          {!isTemplate && <><select value={quote.status} onChange={(event) => changeStatus(event.target.value)} className="border rounded-lg px-3 py-2 text-sm"><option value="draft">Bozza</option><option value="ready">Pronto</option><option value="presented">Presentato</option><option value="accepted">Accettato</option><option value="rejected">Rifiutato</option><option value="postponed">Posticipato</option><option value="archived">Archiviato</option></select>
          <a href={`/api/commerciale/quotes/${quote._id}/pdf?version=${quote.currentVersion}`} target="_blank" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm"><Download className="w-4 h-4" />PDF</a>
          <button onClick={() => save({ newVersion: true })} className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"><Copy className="w-4 h-4" />Nuova versione</button></>}
          <button onClick={() => save()} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-300 hover:bg-yellow-400 rounded-lg text-sm font-semibold"><Save className="w-4 h-4" />{saving ? "Salvo…" : dirty ? "Salva" : "Salvato"}</button>
          {message && <span className="text-xs text-gray-600">{message}</span>}
        </header>

        <div className={`flex-1 min-h-0 grid grid-cols-1 ${preview ? "lg:grid-cols-1" : "lg:grid-cols-[210px_minmax(620px,1fr)_310px]"}`}>
          {!preview && <aside className="hidden lg:block bg-white border-r overflow-y-auto p-3">
            <div className="grid grid-cols-4 gap-1 border-b pb-3">{[
              ["pages", "Pagine", Layers], ["text", "Testi", Type], ["elements", "Elementi", Shapes], ["images", "Immagini", ImagePlus],
              ["layers", "Livelli", Layers], ["template", "Template", FileUp], ["fields", "Campi", Plus],
            ].map(([key, label, Icon]) => <button key={key} title={label} onClick={() => setLeftPanel(key)} className={`grid place-items-center gap-1 rounded-lg p-2 text-[10px] ${leftPanel === key ? "bg-blue-50 text-blue-700" : "hover:bg-gray-100"}`}><Icon className="h-4 w-4" />{label}</button>)}</div>
            {leftPanel === "pages" && <><div className="flex items-center justify-between my-3"><strong className="text-sm">Pagine PDF</strong><button onClick={addPage} className="p-1 hover:bg-gray-100 rounded"><Plus className="w-4 h-4" /></button></div>
            <div className="space-y-2">{pages.map((page, index) => <button key={page.id} onClick={() => { setPageIndex(index); setSelectedId(""); setSelectedSource(null); setFabricSelection(null); }} className={`w-full text-left border rounded-lg p-2 ${index === pageIndex ? "border-yellow-500 bg-yellow-50" : "border-gray-200"}`}><PageThumbnail page={page} resolveText={(text) => isTemplate ? text : resolveQuoteVariables(text, quote, { ...initialVersion, items, projectDescription, paymentConditions, totals })} /><span className="mt-2 block truncate text-xs font-medium">{index + 1}. {page.name}</span></button>)}</div>
            <div className="sticky bottom-0 mt-3 grid grid-cols-4 gap-1 bg-white py-2">
              <button title="Sposta pagina su" onClick={() => movePage(-1)} disabled={pageIndex === 0} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
              <button title="Sposta pagina giù" onClick={() => movePage(1)} disabled={pageIndex === pages.length - 1} className="grid place-items-center border rounded-lg py-2 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
              <button title="Duplica pagina" onClick={duplicatePage} className="grid place-items-center border rounded-lg py-2"><Copy className="w-4 h-4" /></button>
              <button title="Elimina pagina" onClick={deletePage} disabled={pages.length <= 1} className="grid place-items-center border rounded-lg py-2 text-red-600 disabled:opacity-30"><Trash2 className="w-4 h-4" /></button>
            </div></>}
            {leftPanel === "text" && <div className="space-y-2 pt-4"><button onClick={() => fabricCanvasRef.current?.addText("Aggiungi un titolo", { fontSize: 38, fontWeight: "bold" })} className="w-full rounded-xl border p-3 text-left text-xl font-bold">Titolo</button><button onClick={() => fabricCanvasRef.current?.addText("Aggiungi un sottotitolo", { fontSize: 25, fontWeight: "600" })} className="w-full rounded-xl border p-3 text-left text-base font-semibold">Sottotitolo</button><button onClick={() => fabricCanvasRef.current?.addText("Aggiungi del testo", { fontSize: 16 })} className="w-full rounded-xl border p-3 text-left text-sm">Corpo testo</button></div>}
            {leftPanel === "elements" && <div className="grid grid-cols-2 gap-2 pt-4"><button onClick={() => fabricCanvasRef.current?.addShape("rect")} className="grid aspect-square place-items-center rounded-xl border"><Square className="h-12 w-12" /><span className="text-xs">Rettangolo</span></button><button onClick={() => fabricCanvasRef.current?.addShape("circle")} className="grid aspect-square place-items-center rounded-xl border"><Circle className="h-12 w-12" /><span className="text-xs">Cerchio</span></button></div>}
            {leftPanel === "images" && <div className="pt-4"><button onClick={() => imageInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-sm"><ImagePlus className="h-6 w-6" />Carica logo o immagine</button></div>}
            {leftPanel === "template" && <div className="space-y-3 pt-4"><p className="text-xs text-gray-500">Il PDF originale viene conservato. Testi riconosciuti diventano oggetti modificabili; grafica non recuperabile resta nel livello di riferimento.</p><button onClick={() => pdfInputRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 p-3 text-sm font-semibold text-white"><FileUp className="h-5 w-5" />Importa PDF</button></div>}
            {leftPanel === "fields" && <div className="space-y-2 pt-4">{[["Nome azienda", "{{azienda}}"], ["Referente", "{{referente}}"], ["Data", "{{data_preventivo}}"], ["Numero preventivo", "{{numero_preventivo}}"], ["Servizi", "{{servizi}}"], ["Totale", "{{prezzo_totale}}"], ["IVA", "{{iva}}"]].map(([label, token]) => <button key={token} onClick={() => fabricCanvasRef.current?.addText(token, { fontSize: 18 })} className="w-full rounded-lg border p-2 text-left text-xs"><strong>{label}</strong><span className="block text-gray-400">{token}</span></button>)}</div>}
            {leftPanel === "layers" && <div className="space-y-1 pt-4">{(fabricCanvasRef.current?.getLayers?.() || []).map((layer) => <button key={layer.editorId} onClick={() => fabricCanvasRef.current?.selectLayer(layer.editorId)} className="flex w-full items-center gap-2 rounded-lg border px-2 py-2 text-left text-xs"><Layers className="h-3 w-3" /><span className="truncate">{layer.name}</span>{layer.locked && <Lock className="ml-auto h-3 w-3" />}</button>)}</div>}
          </aside>}

          <main ref={canvasViewportRef} className="overflow-auto p-4 md:p-8 bg-gray-200">
            {!preview && <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <button onClick={() => fabricCanvasRef.current?.addText()} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"><Type className="h-4 w-4" />Testo</button>
              <button onClick={() => fabricCanvasRef.current?.addShape("rect")} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"><Square className="h-4 w-4" />Rettangolo</button>
              <button onClick={() => fabricCanvasRef.current?.addShape("circle")} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"><Circle className="h-4 w-4" />Cerchio</button>
              <button onClick={() => imageInputRef.current?.click()} className="inline-flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow text-sm"><ImagePlus className="w-4 h-4" />Carica immagine</button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
              <button disabled={importingPdf} onClick={() => pdfInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"><FileUp className="h-4 w-4" />{importingPdf ? "Importo…" : "Importa PDF modificabile"}</button>
              <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" onChange={importPdfProject} className="hidden" />
              <span className="mx-2 h-6 border-l" />
              <label className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow">Zoom<input type="range" min="0.35" max="1.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-24" /><span className="w-10 text-right">{Math.round(zoom * 100)}%</span></label>
            </div>}
            {currentPage && <div className="mx-auto"><FabricQuoteCanvas key={`${currentPage.id}-${canvasGeneration}`} ref={fabricCanvasRef} page={currentPage} preview={preview} zoom={zoom} onSelection={setFabricSelection} onChange={(patch, withHistory) => mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, ...patch } : page), withHistory)} /></div>}
          </main>

          {!preview && <aside className="bg-white border-l overflow-y-auto p-4 space-y-5">
            {fabricSelection ? <section>
              <div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Layers className="h-4 w-4" />{fabricSelection.count > 1 ? `${fabricSelection.count} elementi` : fabricSelection.sourceKind === "text" ? "Testo PDF" : fabricSelection.sourceKind === "image" ? "Immagine" : "Elemento grafico"}</h3><div className="flex"><button title="Duplica" onClick={() => fabricCanvasRef.current?.duplicateSelected()} className="p-1"><Copy className="h-4 w-4" /></button><button title="Blocca o sblocca" onClick={() => fabricCanvasRef.current?.toggleLock()} className="p-1">{fabricSelection.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}</button><button title="Elimina" onClick={() => fabricCanvasRef.current?.deleteSelected()} className="p-1 text-red-600"><Trash2 className="h-4 w-4" /></button></div></div>
              <p className="mt-1 text-[11px] text-gray-500">Trascina, ridimensiona con le maniglie e ruota dal controllo superiore. Shift abilita la selezione multipla.</p>
              {(fabricSelection.sourceKind === "text" || ["i-text", "textbox", "text", "group"].includes(fabricSelection.type) && fabricSelection.sourceText) && <><textarea value={fabricSelection.text ?? fabricSelection.sourceText ?? ""} onChange={(event) => { setFabricSelection((old) => ({ ...old, text: event.target.value })); fabricCanvasRef.current?.replaceSelectedText(event.target.value); }} rows={5} className="mt-3 w-full rounded-lg border p-2 text-sm" /><p className="mt-1 text-[11px] text-blue-700">Puoi modificare qui oppure fare doppio clic direttamente sul testo nel foglio.</p></>}
              <div className="mt-3 grid grid-cols-2 gap-2">{[["X", "left"], ["Y", "top"], ["Larghezza", "width"], ["Altezza", "height"]].map(([label, key]) => <label key={key} className="text-xs">{label}<input type="number" value={fabricSelection[key] ?? 0} onChange={(event) => fabricCanvasRef.current?.updateSelected({ [key]: Number(event.target.value) })} className="mt-1 w-full rounded border p-1" /></label>)}</div>
              <label className="mt-2 block text-xs">Rotazione<input type="number" value={fabricSelection.angle || 0} onChange={(event) => fabricCanvasRef.current?.updateSelected({ angle: Number(event.target.value) })} className="mt-1 w-full rounded border p-1" /></label>
              {(fabricSelection.sourceKind === "text" || ["i-text", "textbox", "text"].includes(fabricSelection.type)) && <div className="mt-3 space-y-2"><label className="block text-xs">Font<select value={fabricSelection.fontFamily || "Arial"} onChange={(event) => fabricCanvasRef.current?.updateSelected({ fontFamily: event.target.value })} className="mt-1 w-full rounded border p-2">{fabricSelection.fontFamily && !["Arial", "Helvetica", "Montserrat", "Georgia", "Times New Roman", "Courier New"].includes(fabricSelection.fontFamily) && <option value={fabricSelection.fontFamily}>Originale PDF</option>}<option>Arial</option><option>Helvetica</option><option>Montserrat</option><option>Georgia</option><option>Times New Roman</option><option>Courier New</option></select></label><div className="grid grid-cols-2 gap-2"><label className="text-xs">Dimensione<input type="number" min="6" value={fabricSelection.fontSize || 18} onChange={(event) => fabricCanvasRef.current?.updateSelected({ fontSize: Number(event.target.value) })} className="mt-1 w-full rounded border p-1" /></label><label className="text-xs">Peso<select value={fabricSelection.fontWeight || 400} onChange={(event) => fabricCanvasRef.current?.updateSelected({ fontWeight: event.target.value })} className="mt-1 w-full rounded border p-1"><option value="400">Normale</option><option value="700">Bold</option><option value="900">Black</option></select></label></div></div>}
              <div className="mt-3 grid grid-cols-2 gap-2"><label className="text-xs">Colore<input type="color" value={fabricSelection.fill?.startsWith?.("#") ? fabricSelection.fill : "#111111"} onChange={(event) => fabricCanvasRef.current?.updateSelected({ fill: event.target.value })} className="mt-1 h-8 w-full" /></label><label className="text-xs">Opacità {Math.round((fabricSelection.opacity ?? 1) * 100)}%<input type="range" min="0.05" max="1" step="0.05" value={fabricSelection.opacity ?? 1} onChange={(event) => fabricCanvasRef.current?.updateSelected({ opacity: Number(event.target.value) })} className="mt-2 w-full" /></label></div>
              <label className="mt-3 block text-xs">Collegamento dati<select value={fabricSelection.dataBinding || ""} onChange={(event) => fabricCanvasRef.current?.updateSelected({ dataBinding: event.target.value })} className="mt-1 w-full rounded border p-2"><option value="">Nessuno</option><option value="azienda">Nome azienda</option><option value="referente">Referente</option><option value="data_preventivo">Data preventivo</option><option value="numero_preventivo">Numero preventivo</option><option value="prezzo_totale">Totale</option><option value="iva">IVA</option></select></label>
              <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => fabricCanvasRef.current?.layer("front")} className="rounded border py-1 text-xs">In primo piano</button><button onClick={() => fabricCanvasRef.current?.layer("back")} className="rounded border py-1 text-xs">Sullo sfondo</button><button onClick={() => fabricCanvasRef.current?.layer("up")} className="rounded border py-1 text-xs">Avanti</button><button onClick={() => fabricCanvasRef.current?.layer("down")} className="rounded border py-1 text-xs">Indietro</button></div>
            </section> : selectedSource ? <section>
              <div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" />Elemento PDF · {selectedSource.kind === "text" ? "testo" : selectedSource.kind === "image" ? "immagine" : "vettore"}</h3><button title="Nascondi elemento" onClick={() => updateSvgEdit(selectedSource.id, { hidden: true })} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
              <p className="mt-1 text-[11px] text-gray-500">Questo è un oggetto del PDF originale. Trascinalo direttamente sul foglio oppure usa i controlli precisi.</p>
              {selectedSource.kind === "text" && <textarea value={selectedSourceEdit?.text ?? selectedSource.text} onChange={(event) => updateSvgEdit(selectedSource.id, { text: event.target.value }, false)} onBlur={() => setDirty(true)} rows={5} className="mt-3 w-full border rounded-lg p-2 text-sm" />}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <label className="text-xs">Sposta X<input type="number" step="0.5" value={selectedSourceEdit?.dx || 0} onChange={(event) => updateSvgEdit(selectedSource.id, { dx: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>
                <label className="text-xs">Sposta Y<input type="number" step="0.5" value={selectedSourceEdit?.dy || 0} onChange={(event) => updateSvgEdit(selectedSource.id, { dy: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>
                <label className="text-xs">Larghezza %<input type="number" min="10" step="1" value={Math.round((selectedSourceEdit?.scaleX || 1) * 100)} onChange={(event) => updateSvgEdit(selectedSource.id, { scaleX: Number(event.target.value) / 100 }, false)} className="mt-1 w-full border rounded p-1" /></label>
                <label className="text-xs">Altezza %<input type="number" min="10" step="1" value={Math.round((selectedSourceEdit?.scaleY || 1) * 100)} onChange={(event) => updateSvgEdit(selectedSource.id, { scaleY: Number(event.target.value) / 100 }, false)} className="mt-1 w-full border rounded p-1" /></label>
              </div>
              <label className="mt-2 block text-xs">Rotazione<input type="number" min="-360" max="360" value={selectedSourceEdit?.rotation || 0} onChange={(event) => updateSvgEdit(selectedSource.id, { rotation: Number(event.target.value) }, false)} className="mt-1 w-full border rounded p-1" /></label>
              {selectedSource.kind === "text" && <div className="grid grid-cols-2 gap-2 mt-3"><label className="text-xs">Dimensione<input type="number" min="6" value={selectedSourceEdit?.fontSize || 18} onChange={(event) => updateSvgEdit(selectedSource.id, { fontSize: Number(event.target.value), text: selectedSourceEdit?.text ?? selectedSource.text }, false)} className="mt-1 w-full border rounded p-1" /></label><label className="text-xs">Colore<input type="color" value={selectedSourceEdit?.color || "#111111"} onChange={(event) => updateSvgEdit(selectedSource.id, { color: event.target.value, text: selectedSourceEdit?.text ?? selectedSource.text }, false)} className="mt-1 h-8 w-full" /></label></div>}
              <label className="mt-3 block text-xs">Opacità {Math.round((selectedSourceEdit?.opacity ?? 1) * 100)}%<input type="range" min="0.1" max="1" step="0.05" value={selectedSourceEdit?.opacity ?? 1} onChange={(event) => updateSvgEdit(selectedSource.id, { opacity: Number(event.target.value) }, false)} className="mt-1 w-full" /></label>
              <button onClick={() => { remember(); setPages((old) => old.map((page, index) => { if (index !== pageIndex) return page; const svgEdits = { ...(page.svgEdits || {}) }; delete svgEdits[selectedSource.id]; return { ...page, svgEdits }; })); setDirty(true); }} className="mt-4 w-full rounded-lg border py-2 text-sm">Ripristina originale</button>
            </section> : selected ? <section><div className="flex items-center justify-between"><h3 className="font-bold flex items-center gap-2"><Layers className="w-4 h-4" />Elemento {selected.type === "text" ? "testo" : selected.type === "image" ? "immagine" : "forma"}</h3><div className="flex items-center"><button title="Duplica elemento" onClick={duplicateBlock} className="p-1 text-gray-700"><Copy className="w-4 h-4" /></button><button title={selected.locked ? "Sblocca" : "Blocca"} onClick={() => updateBlock({ locked: !selected.locked })} className="p-1 text-gray-700">{selected.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</button><button title="Elimina elemento" onClick={() => { mutatePages((old) => old.map((page, index) => index === pageIndex ? { ...page, blocks: page.blocks.filter((block) => block.id !== selectedId) } : page)); setSelectedId(""); }} className="p-1 text-red-600"><Trash2 className="w-4 h-4" /></button></div></div>
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

