import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { JSDOM } from "jsdom";
import * as fontkit from "fontkit";

const require = createRequire(import.meta.url);
const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");
const projectRoot = process.cwd();
const inputPath = process.argv[2] || "/Users/marcocerasa/Downloads/cchio.pdf";
const outputDir = path.join(projectRoot, "public/commerciale/hoon-template-svg");
const startPage = Math.max(1, Number(process.argv[3]) || 1);
const dom = new JSDOM("<!doctype html><html><body></body></html>");

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.Image = dom.window.Image;

const SVG_NS = "http://www.w3.org/2000/svg";
const data = new Uint8Array(await readFile(inputPath));
const loadingTask = pdfjs.getDocument({
  data,
  disableWorker: true,
  ownerDocument: document,
  fontExtraProperties: true,
});
const pdf = await loadingTask.promise;
await mkdir(outputDir, { recursive: true });

const pages = [];
const elementNames = ["path", "image"];

for (let pageNumber = startPage; pageNumber <= pdf.numPages; pageNumber += 1) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const operatorList = await page.getOperatorList();
  for (let index = 0; index < operatorList.fnArray.length; index += 1) {
    const fn = operatorList.fnArray[index];
    const args = operatorList.argsArray[index];
    if (args?.[0] !== "Shading") continue;
    if (fn === pdfjs.OPS.setStrokeColorN) {
      operatorList.fnArray[index] = pdfjs.OPS.setStrokeRGBColor;
      operatorList.argsArray[index] = [0, 0, 0];
    } else if (fn === pdfjs.OPS.setFillColorN) {
      operatorList.fnArray[index] = pdfjs.OPS.setFillRGBColor;
      operatorList.argsArray[index] = [1, 1, 1];
    }
  }
  const graphics = new pdfjs.SVGGraphics(page.commonObjs, page.objs);
  graphics.embedFonts = true;
  const svg = await graphics.getSVG(operatorList, viewport);
  const getElements = (name) => [...svg.getElementsByTagNameNS(SVG_NS, name)];
  const textContent = await page.getTextContent();
  const textItems = textContent.items.filter((item) => "str" in item && item.str);
  const textElements = getElements("text");

  const fontFaces = new Map();
  const styleElement = getElements("style")[0];
  const matches = [...(styleElement?.textContent || "").matchAll(/font-family:\s*"([^"]+)";\s*src:\s*url\((blob:[^)]+)\)/g)];
  for (const [, family, blobUrl] of matches) {
    const response = await fetch(blobUrl);
    fontFaces.set(family, fontkit.create(Buffer.from(await response.arrayBuffer())));
  }

  let editorIndex = 0;
  for (const [textIndex, textElement] of textElements.entries()) {
    const group = document.createElementNS(SVG_NS, "g");
    for (const attribute of [...textElement.attributes]) group.setAttribute(attribute.name, attribute.value);
    group.setAttribute("data-editor-id", `p${pageNumber}-text-${editorIndex++}`);
    group.setAttribute("data-editor-kind", "text");
    group.setAttribute("data-editor-base-transform", textElement.getAttribute("transform") || "");
    group.setAttribute("data-editor-text", textItems[textIndex]?.str || "");
    const firstTspan = textElement.children[0];
    group.setAttribute("data-editor-x", firstTspan?.getAttribute("x")?.split(/\s+/)[0] || "0");
    group.setAttribute("data-editor-y", firstTspan?.getAttribute("y") || "0");
    group.setAttribute("data-editor-font-size", firstTspan?.getAttribute("font-size") || "16");
    group.setAttribute("data-editor-fill", firstTspan?.getAttribute("fill") || "#000000");

    for (const tspan of [...textElement.children]) {
      const font = fontFaces.get(tspan.getAttribute("font-family"));
      const fontSize = Number.parseFloat(tspan.getAttribute("font-size") || "16");
      const xValues = String(tspan.getAttribute("x") || "0").trim().split(/\s+/).map(Number);
      const y = Number.parseFloat(tspan.getAttribute("y") || "0");
      let cursorX = xValues[0] || 0;

      for (const [glyphIndex, character] of [...(tspan.textContent || "")].entries()) {
        const glyph = font?.glyphForCodePoint(character.codePointAt(0));
        if (!glyph || !font) continue;
        const glyphPath = document.createElementNS(SVG_NS, "path");
        glyphPath.setAttribute("d", glyph.path.toSVG());
        glyphPath.setAttribute("fill", tspan.getAttribute("fill") || "#000000");
        glyphPath.setAttribute("fill-opacity", tspan.getAttribute("fill-opacity") || "1");
        const glyphX = Number.isFinite(xValues[glyphIndex]) ? xValues[glyphIndex] : cursorX;
        glyphPath.setAttribute("transform", `translate(${glyphX} ${y}) scale(${fontSize / font.unitsPerEm} ${-fontSize / font.unitsPerEm})`);
        group.append(glyphPath);
        cursorX = glyphX + (glyph.advanceWidth * fontSize) / font.unitsPerEm;
      }
    }
    textElement.replaceWith(group);
  }

  styleElement?.remove();
  for (const name of elementNames) {
    for (const element of getElements(name)) {
      if (element.closest("defs, clipPath, [data-editor-id]")) continue;
      if (name === "path" && element.getAttribute("fill") === "none" && !element.getAttribute("stroke")) continue;
      const wrapper = document.createElementNS(SVG_NS, "g");
      wrapper.setAttribute("data-editor-id", `p${pageNumber}-${name}-${editorIndex++}`);
      wrapper.setAttribute("data-editor-kind", name === "image" ? "image" : "vector");
      element.replaceWith(wrapper);
      wrapper.append(element);
    }
  }

  let markup = svg.outerHTML;
  const blobUrls = [...new Set(markup.match(/blob:nodedata:[a-z0-9-]+/g) || [])];
  for (const blobUrl of blobUrls) {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    if (blob.type.startsWith("font/")) {
      markup = markup.replaceAll(blobUrl, "");
      continue;
    }
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
    markup = markup.replaceAll(blobUrl, `data:${blob.type || "application/octet-stream"};base64,${base64}`);
  }

  markup = markup
    .replace(/<\/?svg:/g, (value) => value.replace("svg:", ""))
    .replace(/\sxmlns:svg="http:\/\/www\.w3\.org\/2000\/svg"/, "")
    .replace(/\sxmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/, "")
    .replace(/<svg /, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" data-template-page="true" ');

  const fileName = `page-${String(pageNumber).padStart(2, "0")}.svg`;
  await writeFile(path.join(outputDir, fileName), markup, "utf8");
  pages.push({
    pageNumber,
    asset: `/commerciale/hoon-template-svg/${fileName}`,
    width: viewport.width,
    height: viewport.height,
    editableObjects: editorIndex,
    textObjects: textElements.length,
  });
  console.log(`Pagina ${pageNumber}/${pdf.numPages}: ${editorIndex} oggetti, ${textElements.length} testi`);
}

await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify({ source: path.basename(inputPath), pages }, null, 2)}\n`);
await pdf.destroy();
console.log(`Import completato: ${pages.length} pagine in ${outputDir}`);
