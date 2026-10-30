"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const TEXT_EDIT_VERSION = 2;
const CUSTOM_PROPERTIES = ["editorId", "sourceKind", "sourceText", "sourceFontSize", "sourceFontFamily", "sourceFontWeight", "sourceFill", "dataBinding", "referenceLayer", "maskLayer", "fromSource", "replacesSource", "sourceInitial", "name"];
const fontLoadCache = new Map();

const uid = () => `fabric-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function decorateObject(object, values = {}) {
  Object.assign(object, {
    editorId: values.editorId || object.editorId || uid(),
    sourceKind: values.sourceKind || object.sourceKind || object.type,
    sourceText: values.sourceText ?? object.sourceText ?? "",
    sourceFontSize: values.sourceFontSize ?? object.sourceFontSize ?? null,
    sourceFontFamily: values.sourceFontFamily ?? object.sourceFontFamily ?? null,
    sourceFontWeight: values.sourceFontWeight ?? object.sourceFontWeight ?? null,
    sourceFill: values.sourceFill ?? object.sourceFill ?? null,
    dataBinding: values.dataBinding ?? object.dataBinding ?? "",
    referenceLayer: values.referenceLayer ?? object.referenceLayer ?? false,
    maskLayer: values.maskLayer ?? object.maskLayer ?? false,
    fromSource: values.fromSource ?? object.fromSource ?? false,
    replacesSource: values.replacesSource ?? object.replacesSource ?? false,
    sourceInitial: values.sourceInitial ?? object.sourceInitial ?? null,
    name: values.name || object.name || values.sourceText || object.type,
    cornerColor: "#ffffff",
    cornerStrokeColor: "#2563eb",
    borderColor: "#2563eb",
    transparentCorners: false,
    cornerStyle: "circle",
    padding: 2,
  });
  object.setControlsVisibility?.({ mtr: true });
  return object;
}

function objectFill(object) {
  if (typeof object?.fill === "string" && object.fill !== "none") return object.fill;
  for (const child of object?.getObjects?.() || []) {
    const fill = objectFill(child);
    if (fill) return fill;
  }
  return "#111111";
}

function editableTextFromObject(fabric, object, text = object.sourceText || "") {
  const bounds = object.getBoundingRect();
  const replacement = new fabric.IText(text, {
    left: bounds.left,
    top: bounds.top,
    originX: "left",
    originY: "top",
    angle: object.angle || 0,
    fontSize: Math.max(6, Number(object.sourceFontSize) || bounds.height || 18),
    fontFamily: object.sourceFontFamily || object.fontFamily || "Arial",
    fontWeight: object.fontWeight || object.sourceFontWeight || 400,
    fill: object.sourceFill || objectFill(object) || "#111111",
    opacity: object.opacity ?? 1,
    objectCaching: false,
    perPixelTargetFind: true,
  });
  replacement.set({
    scaleX: bounds.width / Math.max(1, replacement.width || bounds.width),
    scaleY: bounds.height / Math.max(1, replacement.height || bounds.height),
  });
  replacement.setCoords();
  const existingEdit = object.sourceEdit || {};
  const sourceInitial = {
    left: (replacement.left || 0) - (Number(existingEdit.dx) || 0),
    top: (replacement.top || 0) - (Number(existingEdit.dy) || 0),
    scaleX: (replacement.scaleX || 1) / (Number(existingEdit.scaleX) || 1),
    scaleY: (replacement.scaleY || 1) / (Number(existingEdit.scaleY) || 1),
    angle: (replacement.angle || 0) - (Number(existingEdit.rotation) || 0),
  };
  return decorateObject(replacement, {
    editorId: object.editorId,
    sourceKind: "text",
    sourceText: object.sourceText || text,
    sourceFontSize: object.sourceFontSize,
    sourceFontFamily: object.sourceFontFamily,
    sourceFontWeight: object.sourceFontWeight,
    sourceFill: object.sourceFill,
    dataBinding: object.dataBinding,
    fromSource: object.fromSource,
    replacesSource: Boolean(object.fromSource || object.replacesSource),
    sourceInitial,
    name: text,
  });
}

async function loadEmbeddedFonts(markup) {
  if (typeof FontFace === "undefined" || !document.fonts) return;
  const documentNode = new DOMParser().parseFromString(markup, "image/svg+xml");
  const fonts = JSON.parse(documentNode.documentElement.getAttribute("data-editor-fonts") || "{}");
  await Promise.all(Object.entries(fonts).map(([family, url]) => {
    const key = `${family}:${url}`;
    if (!fontLoadCache.has(key)) {
      fontLoadCache.set(key, new FontFace(family, `url("${url}")`).load().then((font) => {
        document.fonts.add(font);
        return font;
      }).catch((error) => {
        fontLoadCache.delete(key);
        console.warn(`Font PDF non caricato: ${family}`, error);
        return null;
      }));
    }
    return fontLoadCache.get(key);
  }));
}

function detachFromSvgGroup(object) {
  // Fabric keeps imported SVG children in the coordinate plane of their
  // original <g>. Re-grouping them without first leaving that plane makes the
  // visible glyphs, controls and metadata refer to different positions.
  if (object.group?.exitGroup) object.group.exitGroup(object);
  object.set({
    objectCaching: false,
    perPixelTargetFind: true,
  });
  object.setCoords();
  return object;
}

async function loadSourceSvg(fabric, asset) {
  const response = await fetch(asset);
  if (!response.ok) throw new Error(`Template SVG non disponibile: ${response.status}`);
  const markup = await response.text();
  await loadEmbeddedFonts(markup);
  const result = await fabric.loadSVGFromString(markup, (element, object) => {
    const wrapper = element.closest?.("[data-editor-id]");
    decorateObject(object, {
      editorId: wrapper?.getAttribute("data-editor-id") || uid(),
      sourceKind: wrapper?.getAttribute("data-editor-kind") || element.tagName.toLowerCase(),
      sourceText: wrapper?.getAttribute("data-editor-text") || "",
      sourceFontSize: Number.parseFloat(wrapper?.getAttribute("data-editor-font-size") || "") || null,
      sourceFontFamily: wrapper?.getAttribute("data-editor-font-family") || null,
      sourceFontWeight: wrapper?.getAttribute("data-editor-font-weight") || null,
      sourceFill: wrapper?.getAttribute("data-editor-fill") || null,
    });
  });

  const grouped = new Map();
  for (const rawObject of result.objects.filter(Boolean)) {
    const object = detachFromSvgGroup(rawObject);
    const key = object.editorId || uid();
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(object);
  }

  return [...grouped.entries()].map(([editorId, objects]) => {
    if (objects.length === 1) return decorateObject(objects[0], { editorId });
    const first = objects[0];
    return decorateObject(new fabric.Group(objects, {
      subTargetCheck: false,
      objectCaching: false,
      perPixelTargetFind: true,
    }), {
      editorId,
      sourceKind: first.sourceKind,
      sourceText: first.sourceText,
      sourceFontSize: first.sourceFontSize,
      sourceFontFamily: first.sourceFontFamily,
      sourceFontWeight: first.sourceFontWeight,
      sourceFill: first.sourceFill,
      name: first.sourceText || first.sourceKind,
    });
  });
}

const FabricQuoteCanvas = forwardRef(function FabricQuoteCanvas({ page, preview, zoom, onChange, onSelection, onReady }, ref) {
  const elementRef = useRef(null);
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const pageIdRef = useRef("");
  const loadingRef = useRef(false);
  const clipboardRef = useRef([]);
  const pasteOffsetRef = useRef(0);
  const changeRef = useRef(onChange);
  const selectionRef = useRef(onSelection);
  const [readyVersion, setReadyVersion] = useState(0);

  useEffect(() => { changeRef.current = onChange; }, [onChange]);
  useEffect(() => { selectionRef.current = onSelection; }, [onSelection]);

  const commit = (history = true) => {
    const canvas = canvasRef.current;
    if (!canvas || loadingRef.current) return;
    const sourceEdits = {};
    const extraObjects = [];
    const blocks = [];
    for (const object of canvas.getObjects()) {
      if (object.referenceLayer) continue;
      if (object.fromSource) {
        const initial = object.sourceInitial || { left: object.left || 0, top: object.top || 0, scaleX: object.scaleX || 1, scaleY: object.scaleY || 1, angle: object.angle || 0 };
        const sourceEdit = {
          dx: (object.left || 0) - initial.left,
          dy: (object.top || 0) - initial.top,
          scaleX: (object.scaleX || 1) / (initial.scaleX || 1),
          scaleY: (object.scaleY || 1) / (initial.scaleY || 1),
          rotation: (object.angle || 0) - (initial.angle || 0),
          opacity: object.opacity ?? 1,
          hidden: object.visible === false,
          ...(object.replacesSource ? { text: object.text || "", fontSize: object.fontSize, fontFamily: object.fontFamily, fontWeight: object.fontWeight, color: object.fill, textEditVersion: TEXT_EDIT_VERSION } : {}),
        };
        sourceEdits[object.editorId] = sourceEdit;
        object.sourceEdit = sourceEdit;
        continue;
      }
      const serialized = object.toObject(CUSTOM_PROPERTIES);
      extraObjects.push(serialized);
      const width = object.getScaledWidth?.() || object.width || 1;
      const height = object.getScaledHeight?.() || object.height || 1;
      if (["i-text", "textbox", "text"].includes(object.type)) blocks.push({ id: object.editorId, type: "text", text: object.text || "", x: object.left || 0, y: object.top || 0, width, height, fontSize: object.fontSize || 18, fontWeight: Number(object.fontWeight) || 400, fontFamily: object.fontFamily || "Arial", lineHeight: object.lineHeight || 1.2, letterSpacing: Number(object.charSpacing || 0) / 10, color: typeof object.fill === "string" ? object.fill : "#111111", background: object.backgroundColor || "transparent", align: object.textAlign || "left", rotation: object.angle || 0, layer: blocks.length + 1000, opacity: object.opacity ?? 1 });
      else if (["rect", "circle", "ellipse"].includes(object.type)) blocks.push({ id: object.editorId, type: "shape", text: "", x: object.left || 0, y: object.top || 0, width, height, background: typeof object.fill === "string" ? object.fill : "transparent", color: "#111111", rotation: object.angle || 0, layer: blocks.length + 1000, opacity: object.opacity ?? 1, shapeType: object.type === "rect" ? "rectangle" : "ellipse", borderColor: typeof object.stroke === "string" ? object.stroke : "transparent", borderWidth: object.strokeWidth || 0, borderRadius: object.rx || 0, locked: object.lockMovementX === true, maskLayer: Boolean(object.maskLayer) });
      else if (object.type === "image" && object.getSrc) blocks.push({ id: object.editorId, type: "image", imageUrl: object.getSrc(), x: object.left || 0, y: object.top || 0, width, height, rotation: object.angle || 0, layer: blocks.length + 1000, opacity: object.opacity ?? 1, objectFit: "contain" });
    }
    changeRef.current?.({ fabricJson: { version: fabricRef.current?.version || "7", sourceAsset: page.svgAsset || "", sourceEdits, objects: extraObjects }, svgEdits: sourceEdits, blocks }, history);
  };

  const active = () => canvasRef.current?.getActiveObject() || null;
  const emitSelection = () => {
    const object = active();
    const bounds = object?.getBoundingRect?.();
    selectionRef.current?.(object ? {
      editorId: object.editorId,
      type: object.type,
      sourceKind: object.sourceKind,
      sourceText: object.sourceText,
      text: object.text,
      left: Math.round(bounds?.left ?? object.left ?? 0),
      top: Math.round(bounds?.top ?? object.top ?? 0),
      width: Math.round(bounds?.width ?? object.getScaledWidth?.() ?? object.width ?? 0),
      height: Math.round(bounds?.height ?? object.getScaledHeight?.() ?? object.height ?? 0),
      angle: Math.round(object.angle || 0),
      opacity: object.opacity ?? 1,
      fill: ["i-text", "textbox", "text"].includes(object.type)
        ? (typeof object.fill === "string" ? object.fill : "#111111")
        : object.sourceFill || (typeof object.fill === "string" ? object.fill : "#111111"),
      fontFamily: object.fontFamily || object.sourceFontFamily,
      fontSize: object.fontSize || object.sourceFontSize,
      fontWeight: object.fontWeight || object.sourceFontWeight,
      textAlign: object.textAlign,
      locked: object.lockMovementX === true,
      dataBinding: object.dataBinding || "",
      count: object.type === "activeselection" ? object.getObjects().length : 1,
    } : null);
  };

  useEffect(() => {
    let cancelled = false;
    let canvas;
    (async () => {
      const fabric = await import("fabric");
      if (cancelled || !elementRef.current) return;
      fabricRef.current = fabric;
      fabric.FabricObject.customProperties = CUSTOM_PROPERTIES;
      canvas = new fabric.Canvas(elementRef.current, {
        width: PAGE_WIDTH,
        height: PAGE_HEIGHT,
        backgroundColor: page.background || "#ffffff",
        selection: true,
        preserveObjectStacking: true,
        controlsAboveOverlay: true,
        enableRetinaScaling: true,
        perPixelTargetFind: true,
        targetFindTolerance: 4,
        altSelectionKey: "altKey",
        fireRightClick: true,
        stopContextMenu: true,
      });
      canvasRef.current = canvas;

      const snap = (event) => {
        const object = event.target;
        if (!object || event.e?.altKey) return;
        const threshold = 5;
        const center = object.getCenterPoint();
        if (Math.abs(center.x - PAGE_WIDTH / 2) <= threshold) object.set({ left: (object.left || 0) + PAGE_WIDTH / 2 - center.x });
        if (Math.abs(center.y - PAGE_HEIGHT / 2) <= threshold) object.set({ top: (object.top || 0) + PAGE_HEIGHT / 2 - center.y });
        if (Math.abs(object.left || 0) <= threshold) object.set({ left: 0 });
        if (Math.abs(object.top || 0) <= threshold) object.set({ top: 0 });
      };
      canvas.on("object:moving", snap);
      canvas.on("object:modified", () => { commit(true); emitSelection(); });
      canvas.on("text:changed", () => { commit(false); emitSelection(); });
      canvas.on("mouse:dblclick", (event) => {
        let object = event.target;
        if (!object || object.sourceKind !== "text" || preview) return;
        if (!["i-text", "textbox"].includes(object.type)) {
          const replacement = editableTextFromObject(fabric, object);
          canvas.remove(object);
          canvas.add(replacement);
          canvas.setActiveObject(replacement);
          object = replacement;
          commit(true);
        } else {
          canvas.setActiveObject(object);
          commit(true);
        }
        const cursor = object.getSelectionStartFromPointer?.(event.e) ?? String(object.text || "").length;
        object.enterEditing?.();
        object.setSelectionStart?.(cursor);
        object.setSelectionEnd?.(cursor);
        object.hiddenTextarea?.focus?.();
        canvas.requestRenderAll();
        emitSelection();
      });
      canvas.on("selection:created", emitSelection);
      canvas.on("selection:updated", emitSelection);
      canvas.on("selection:cleared", emitSelection);
      setReadyVersion((value) => value + 1);
      onReady?.();
    })();
    return () => {
      cancelled = true;
      canvas?.dispose();
      canvasRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fabric = fabricRef.current;
    if (!canvas || !fabric || !page?.id || pageIdRef.current === page.id) return;
    pageIdRef.current = page.id;
    loadingRef.current = true;
    canvas.clear();
    canvas.backgroundColor = page.background || "#ffffff";

    (async () => {
      let migratedLegacyText = false;
      if (page.svgAsset) {
        const objects = await loadSourceSvg(fabric, page.svgAsset);
        for (const object of objects) {
          object.fromSource = true;
          object.sourceInitial = { left: object.left || 0, top: object.top || 0, scaleX: object.scaleX || 1, scaleY: object.scaleY || 1, angle: object.angle || 0 };
          const edit = page.svgEdits?.[object.editorId] || page.fabricJson?.sourceEdits?.[object.editorId];
          const legacyTextEdit = object.sourceKind === "text" && edit?.text != null && edit.textEditVersion !== TEXT_EDIT_VERSION;
          const sanitizedEdit = legacyTextEdit
            ? (edit.text === object.sourceText ? null : { text: edit.text })
            : edit;
          if (legacyTextEdit) migratedLegacyText = true;
          object.sourceEdit = sanitizedEdit || {};
          if (sanitizedEdit && !(sanitizedEdit.text != null && object.sourceKind === "text")) object.set({ left: (object.left || 0) + (Number(sanitizedEdit.dx) || 0), top: (object.top || 0) + (Number(sanitizedEdit.dy) || 0), scaleX: (object.scaleX || 1) * (Number(sanitizedEdit.scaleX) || 1), scaleY: (object.scaleY || 1) * (Number(sanitizedEdit.scaleY) || 1), angle: (object.angle || 0) + (Number(sanitizedEdit.rotation) || 0), opacity: sanitizedEdit.opacity ?? 1, visible: !sanitizedEdit.hidden });
        }
        canvas.add(...objects);
        for (const object of [...objects]) {
          const persistedEdit = page.svgEdits?.[object.editorId] || page.fabricJson?.sourceEdits?.[object.editorId];
          const edit = object.sourceKind === "text" && persistedEdit?.text != null && persistedEdit.textEditVersion !== TEXT_EDIT_VERSION
            ? (persistedEdit.text === object.sourceText ? null : { text: persistedEdit.text })
            : persistedEdit;
          if (edit?.text == null || object.sourceKind !== "text") continue;
          object.sourceEdit = {};
          const replacement = editableTextFromObject(fabric, object, edit.text);
          const initial = replacement.sourceInitial;
          replacement.set({
            left: initial.left + (Number(edit.dx) || 0),
            top: initial.top + (Number(edit.dy) || 0),
            scaleX: initial.scaleX * (Number(edit.scaleX) || 1),
            scaleY: initial.scaleY * (Number(edit.scaleY) || 1),
            angle: initial.angle + (Number(edit.rotation) || 0),
            fontSize: edit.fontSize || replacement.fontSize,
            fontFamily: edit.fontFamily || replacement.fontFamily,
            fontWeight: edit.fontWeight || replacement.fontWeight,
            fill: edit.color || replacement.fill,
            opacity: edit.opacity ?? 1,
            visible: !edit.hidden,
          });
          replacement.sourceEdit = edit;
          replacement.setCoords();
          canvas.remove(object); canvas.add(replacement);
        }
        if (page.fabricJson?.objects?.length) {
          const extras = await fabric.util.enlivenObjects(page.fabricJson.objects);
          extras.forEach((object) => canvas.add(decorateObject(object)));
        }
      } else {
        if (page.backgroundImage) {
          const background = await fabric.FabricImage.fromURL(page.backgroundImage, { crossOrigin: "anonymous" });
          background.set({ left: 0, top: 0, scaleX: PAGE_WIDTH / background.width, scaleY: PAGE_HEIGHT / background.height, selectable: false, evented: false });
          decorateObject(background, { editorId: `background-${page.id}`, sourceKind: "reference", referenceLayer: true, name: "Livello originale di riferimento" });
          canvas.add(background);
        }
        if (page.fabricJson?.objects?.length) {
          const extras = await fabric.util.enlivenObjects(page.fabricJson.objects);
          extras.forEach((object) => canvas.add(decorateObject(object)));
        } else for (const block of page.blocks || []) {
          let object;
          const common = { left: block.x, top: block.y, angle: block.rotation || 0, opacity: block.opacity ?? 1, fill: block.background === "transparent" ? "transparent" : block.background, stroke: block.borderColor, strokeWidth: block.borderWidth || 0 };
          if (block.type === "text") object = new fabric.Textbox(block.text || "", { ...common, width: block.width, height: block.height, fill: block.color, fontSize: block.fontSize, fontFamily: block.fontFamily || "Arial", fontWeight: block.fontWeight, textAlign: block.align, lineHeight: block.lineHeight || 1.2 });
          else if (block.type === "shape" && block.shapeType === "ellipse") object = new fabric.Ellipse({ ...common, rx: block.width / 2, ry: block.height / 2 });
          else if (block.type === "shape") object = new fabric.Rect({ ...common, width: block.width, height: block.height, rx: block.borderRadius || 0, ry: block.borderRadius || 0 });
          else if (block.type === "image" && block.imageUrl) {
            object = await fabric.FabricImage.fromURL(block.imageUrl, { crossOrigin: "anonymous" });
            object.set({
              ...common,
              scaleX: Number(block.width || object.width) / Math.max(1, object.width),
              scaleY: Number(block.height || object.height) / Math.max(1, object.height),
            });
          }
          if (object) {
            decorateObject(object, { editorId: block.id, sourceKind: block.type, sourceText: block.text, maskLayer: Boolean(block.maskLayer) });
            if (block.locked || block.maskLayer) object.set({ lockMovementX: true, lockMovementY: true, lockScalingX: true, lockScalingY: true, lockRotation: true, selectable: !block.maskLayer, evented: !block.maskLayer });
            canvas.add(object);
          }
        }
      }
      canvas.getObjects().forEach((object) => decorateObject(object));
      canvas.requestRenderAll();
      loadingRef.current = false;
      if (migratedLegacyText || !page.fabricJson?.objects) commit(false);
    })().catch((error) => {
      loadingRef.current = false;
      console.error("Errore caricamento pagina Fabric", error);
    });
  }, [page?.id, readyVersion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.selection = !preview;
    canvas.skipTargetFind = Boolean(preview);
    canvas.getObjects().forEach((object) => { object.selectable = !preview && !object.referenceLayer && !object.maskLayer; object.evented = !preview && !object.referenceLayer && !object.maskLayer; });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [preview, page?.id, readyVersion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const safeZoom = Math.max(0.1, Number(zoom) || 1);
    canvas.setDimensions({
      width: Math.round(PAGE_WIDTH * safeZoom),
      height: Math.round(PAGE_HEIGHT * safeZoom),
    });
    canvas.setViewportTransform([safeZoom, 0, 0, safeZoom, 0, 0]);
    canvas.calcOffset();
    canvas.requestRenderAll();
  }, [zoom, readyVersion]);

  useImperativeHandle(ref, () => ({
    addText(text = "Nuovo testo", options = {}) {
      const fabric = fabricRef.current; const canvas = canvasRef.current; if (!fabric || !canvas) return;
      const object = decorateObject(new fabric.IText(text, { left: 80, top: 110, fontFamily: "Arial", fontSize: 28, fill: "#111111", ...options }), { sourceKind: "text", sourceText: text, name: text });
      canvas.add(object); canvas.setActiveObject(object); canvas.requestRenderAll(); commit(true); emitSelection();
    },
    addShape(kind = "rect") {
      const fabric = fabricRef.current; const canvas = canvasRef.current; if (!fabric || !canvas) return;
      const object = kind === "circle" ? new fabric.Circle({ left: 120, top: 140, radius: 55, fill: "#16a6d9" }) : new fabric.Rect({ left: 100, top: 130, width: 180, height: 90, rx: 6, ry: 6, fill: "#16a6d9" });
      decorateObject(object, { sourceKind: "vector", name: kind === "circle" ? "Cerchio" : "Rettangolo" }); canvas.add(object); canvas.setActiveObject(object); commit(true); emitSelection();
    },
    async addImage(url) {
      const fabric = fabricRef.current; const canvas = canvasRef.current; if (!fabric || !canvas) return;
      const image = await fabric.FabricImage.fromURL(url, { crossOrigin: "anonymous" });
      const scale = Math.min(300 / image.width, 250 / image.height, 1);
      decorateObject(image, { sourceKind: "image", name: "Immagine" }); image.set({ left: 100, top: 120, scaleX: scale, scaleY: scale }); canvas.add(image); canvas.setActiveObject(image); commit(true); emitSelection();
    },
    replaceSelectedText(text) {
      const fabric = fabricRef.current; const canvas = canvasRef.current; const object = active(); if (!fabric || !canvas || !object) return;
      if (["i-text", "textbox", "text"].includes(object.type)) { object.set({ text }); object.sourceText = text; object.name = text; object.setCoords(); }
      else {
        const replacement = editableTextFromObject(fabric, object, text);
        canvas.remove(object); canvas.add(replacement); canvas.setActiveObject(replacement);
      }
      canvas.requestRenderAll(); commit(true); emitSelection();
    },
    updateSelected(patch) {
      const object = active(); const canvas = canvasRef.current; if (!object || !canvas) return;
      if (patch.width != null && object.width) patch.scaleX = Math.max(0.01, Number(patch.width) / object.width);
      if (patch.height != null && object.height) patch.scaleY = Math.max(0.01, Number(patch.height) / object.height);
      delete patch.width; delete patch.height;
      if (patch.fill && object.type === "group") object.getObjects().forEach((child) => child.set({ fill: patch.fill }));
      object.set(patch); object.setCoords(); canvas.requestRenderAll(); commit(true); emitSelection();
    },
    deleteSelected() { const canvas = canvasRef.current; const object = active(); if (!canvas || !object) return; const objects = object.type === "activeselection" ? object.getObjects() : [object]; canvas.discardActiveObject(); for (const item of objects) { if (item.fromSource) item.set({ visible: false, selectable: false, evented: false }); else canvas.remove(item); } commit(true); emitSelection(); },
    async duplicateSelected() { const canvas = canvasRef.current; const object = active(); if (!canvas || !object) return; const copy = await object.clone(CUSTOM_PROPERTIES); decorateObject(copy, { editorId: uid(), fromSource: false, replacesSource: false, sourceInitial: null, name: `${object.name || object.type} copia` }); copy.set({ left: (object.left || 0) + 12, top: (object.top || 0) + 12 }); canvas.add(copy); canvas.setActiveObject(copy); commit(true); emitSelection(); },
    async copySelected() {
      const object = active();
      if (!object) return false;
      const objects = object.type === "activeselection" ? object.getObjects() : [object];
      clipboardRef.current = await Promise.all(objects.map((item) => item.clone(CUSTOM_PROPERTIES)));
      pasteOffsetRef.current = 0;
      return true;
    },
    async pasteSelected() {
      const fabric = fabricRef.current; const canvas = canvasRef.current;
      if (!fabric || !canvas || !clipboardRef.current.length) return false;
      pasteOffsetRef.current += 12;
      const pasted = await Promise.all(clipboardRef.current.map((item) => item.clone(CUSTOM_PROPERTIES)));
      for (const object of pasted) {
        decorateObject(object, { editorId: uid(), fromSource: false, replacesSource: false, sourceInitial: null, name: `${object.name || object.type} copia` });
        object.set({ left: (object.left || 0) + pasteOffsetRef.current, top: (object.top || 0) + pasteOffsetRef.current });
        object.setCoords();
        canvas.add(object);
      }
      const selection = pasted.length === 1 ? pasted[0] : new fabric.ActiveSelection(pasted, { canvas });
      canvas.setActiveObject(selection);
      canvas.requestRenderAll();
      commit(true);
      emitSelection();
      return true;
    },
    isEditingText() { return Boolean(active()?.isEditing); },
    layer(direction) { const canvas = canvasRef.current; const object = active(); if (!canvas || !object) return; if (direction === "front") canvas.bringObjectToFront(object); else if (direction === "back") canvas.sendObjectToBack(object); else if (direction === "up") canvas.bringObjectForward(object); else canvas.sendObjectBackwards(object); commit(true); },
    toggleLock() { const object = active(); if (!object) return; const lock = !object.lockMovementX; object.set({ lockMovementX: lock, lockMovementY: lock, lockScalingX: lock, lockScalingY: lock, lockRotation: lock }); commit(true); emitSelection(); },
    getLayers() { return (canvasRef.current?.getObjects() || []).map((object, index) => ({ editorId: object.editorId, name: object.name || object.sourceText || object.type, type: object.type, index, visible: object.visible !== false, locked: object.lockMovementX === true })).reverse(); },
    selectLayer(editorId) { const canvas = canvasRef.current; const object = canvas?.getObjects().find((item) => item.editorId === editorId); if (canvas && object) { canvas.setActiveObject(object); canvas.requestRenderAll(); emitSelection(); } },
    clearSelection() { canvasRef.current?.discardActiveObject(); canvasRef.current?.requestRenderAll(); emitSelection(); },
  }));

  return <div className="relative bg-white shadow-2xl" style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}>
    <div className="absolute left-0 top-0">
      <canvas ref={elementRef} />
    </div>
  </div>;
});

export default FabricQuoteCanvas;
