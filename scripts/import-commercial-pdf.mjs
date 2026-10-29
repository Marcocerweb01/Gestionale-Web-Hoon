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
const IDENTITY_MATRIX = [1, 0, 0, 1, 0, 0];

function multiplyMatrices(left, right) {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ];
}

function parseSvgTransform(value = "") {
  let matrix = IDENTITY_MATRIX;
  for (const match of value.matchAll(/(matrix|translate|scale|rotate)\(([^)]+)\)/g)) {
    const values = match[2].trim().split(/[\s,]+/).map(Number);
    let operation = IDENTITY_MATRIX;
    if (match[1] === "matrix" && values.length >= 6) operation = values.slice(0, 6);
    else if (match[1] === "translate") operation = [1, 0, 0, 1, values[0] || 0, values[1] || 0];
    else if (match[1] === "scale") operation = [values[0] ?? 1, 0, 0, values[1] ?? values[0] ?? 1, 0, 0];
    else if (match[1] === "rotate") {
      const radians = (values[0] || 0) * Math.PI / 180;
      const rotation = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
      if (values.length >= 3) {
        const [cx, cy] = values.slice(1);
        operation = multiplyMatrices(
          multiplyMatrices([1, 0, 0, 1, cx, cy], rotation),
          [1, 0, 0, 1, -cx, -cy],
        );
      } else operation = rotation;
    }
    matrix = multiplyMatrices(matrix, operation);
  }
  return matrix;
}

function absoluteSvgMatrix(element, svg) {
  const chain = [];
  for (let node = element; node && node !== svg; node = node.parentElement) chain.unshift(node);
  return chain.reduce((matrix, node) => multiplyMatrices(matrix, parseSvgTransform(node.getAttribute("transform") || "")), IDENTITY_MATRIX);
}

function inkLength(value = "") {
  return [...String(value).replace(/\s/gu, "")].length;
}

function matchSvgTextItems(svg, textElements, textItems, viewport) {
  const candidates = textItems.map((item, index) => {
    const matrix = pdfjs.Util.transform(viewport.transform, item.transform);
    return { item, index, x: matrix[4], y: matrix[5], ink: inkLength(item.str) };
  });
  const used = new Set();

  return textElements.map((element) => {
    const tspan = element.children[0];
    const x = Number.parseFloat(tspan?.getAttribute("x")?.split(/\s+/)[0] || "0");
    const y = Number.parseFloat(tspan?.getAttribute("y") || "0");
    const matrix = absoluteSvgMatrix(element, svg);
    const point = {
      x: matrix[0] * x + matrix[2] * y + matrix[4],
      y: matrix[1] * x + matrix[3] * y + matrix[5],
    };
    const expectedInk = inkLength(element.textContent);
    let best = null;

    for (const candidate of candidates) {
      if (used.has(candidate.index)) continue;
      const distance = Math.hypot(point.x - candidate.x, point.y - candidate.y);
      const inkDifference = Math.abs(expectedInk - candidate.ink);
      const score = inkDifference * 10000 + distance;
      if (!best || score < best.score) best = { ...candidate, distance, inkDifference, score };
    }

    if (!best || best.inkDifference > 0) {
      const rawText = element.textContent || "";
      return /^[\x20-\x7E\u00A0-\u024F]+$/u.test(rawText) ? rawText : "";
    }
    used.add(best.index);
    return best.item.str;
  });
}

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
  const matchedText = matchSvgTextItems(svg, textElements, textItems, viewport);

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
    group.setAttribute("data-editor-text", matchedText[textIndex] || "");
    const firstTspan = textElement.children[0];
    group.setAttribute("data-editor-x", firstTspan?.getAttribute("x")?.split(/\s+/)[0] || "0");
    group.setAttribute("data-editor-y", firstTspan?.getAttribute("y") || "0");
    group.setAttribute("data-editor-font-size", firstTspan?.getAttribute("font-size") || "16");
    group.setAttribute("data-editor-font-weight", firstTspan?.getAttribute("font-weight") || "400");
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
