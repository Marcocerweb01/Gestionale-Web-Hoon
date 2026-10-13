const SVG_COLORS = {
  background: '#f8fafc',
  surface: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  line: '#d1d5db',
  softLine: '#e5e7eb',
  accent: '#6d28d9',
  accentSoft: '#ede9fe',
};

const cleanText = (value, fallback = '[DA COMPLETARE]') => {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized || fallback;
};

const escapeXml = (value) =>
  cleanText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');

const wrapText = (value, maxCharacters) => {
  const words = cleanText(value).split(/\s+/);
  const lines = [];
  let currentLine = '';

  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharacters || !currentLine) {
      currentLine = candidate;
      return;
    }
    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines;
};

const textBlock = ({ lines, x, y, lineHeight = 17, fontSize = 12, color, weight = 400 }) =>
  `<text x="${x}" y="${y}" font-family="Inter, Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}" fill="${color}">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`
    )
    .join('')}</text>`;

const sectionLayout = (section) => {
  const purpose = wrapText(section?.scopo, 39);
  const contents = wrapText(section?.contenuti, 39);
  const callToAction = wrapText(section?.callToAction, 39);
  const height = 78 + (purpose.length + contents.length + callToAction.length) * 17 + 30;

  return { purpose, contents, callToAction, height: Math.max(height, 188) };
};

export const getSiteStructurePages = (value) =>
  (Array.isArray(value) ? value : [])
    .map((page) => ({
      nomePagina: cleanText(page?.nomePagina),
      slugSuggerito: cleanText(page?.slugSuggerito, '/'),
      obiettivo: cleanText(page?.obiettivo),
      sezioni: Array.isArray(page?.sezioni) ? page.sezioni : [],
    }))
    .filter((page) => page.sezioni.length > 0);

export const createSiteStructureSvg = ({ pages: rawPages, azienda }) => {
  const pages = getSiteStructurePages(rawPages);
  if (!pages.length) return '';

  const padding = 36;
  const columnWidth = 304;
  const columnGap = 32;
  const pageTop = 102;
  const pageHeight = 126;
  const sectionsTop = 282;
  const sectionGap = 18;
  const pageLayouts = pages.map((page) => ({
    ...page,
    sectionLayouts: page.sezioni.map(sectionLayout),
  }));
  const contentHeights = pageLayouts.map((page) =>
    page.sectionLayouts.reduce(
      (height, section) => height + section.height + sectionGap,
      sectionsTop
    )
  );
  const width = Math.max(
    760,
    padding * 2 + pages.length * columnWidth + Math.max(0, pages.length - 1) * columnGap
  );
  const height = Math.max(620, Math.max(...contentHeights) + padding);
  const pageCenters = pages.map(
    (_, index) => padding + index * (columnWidth + columnGap) + columnWidth / 2
  );
  const firstCenter = pageCenters[0];
  const lastCenter = pageCenters[pageCenters.length - 1];
  const title = `Architettura del sito · ${cleanText(azienda, 'Progetto web')}`;

  const connectors = [
    `<line x1="${firstCenter}" y1="82" x2="${lastCenter}" y2="82" stroke="${SVG_COLORS.line}" stroke-width="2"/>`,
    ...pageCenters.map(
      (center) =>
        `<line x1="${center}" y1="82" x2="${center}" y2="${pageTop}" stroke="${SVG_COLORS.line}" stroke-width="2"/>`
    ),
  ].join('');

  const columns = pageLayouts
    .map((page, pageIndex) => {
      const x = padding + pageIndex * (columnWidth + columnGap);
      const center = x + columnWidth / 2;
      const objectiveLines = wrapText(page.obiettivo, 39).slice(0, 3);
      let currentY = sectionsTop;

      const sections = page.sezioni
        .map((section, sectionIndex) => {
          const layout = page.sectionLayouts[sectionIndex];
          const y = currentY;
          const branchY = y + 26;
          let cursorY = y + 61;
          currentY += layout.height + sectionGap;

          const purpose = textBlock({
            lines: layout.purpose,
            x: x + 18,
            y: cursorY,
            color: SVG_COLORS.text,
          });
          cursorY += layout.purpose.length * 17 + 23;
          const contents = textBlock({
            lines: layout.contents,
            x: x + 18,
            y: cursorY,
            color: SVG_COLORS.text,
          });
          cursorY += layout.contents.length * 17 + 23;
          const cta = textBlock({
            lines: layout.callToAction,
            x: x + 18,
            y: cursorY,
            color: SVG_COLORS.accent,
            weight: 600,
          });

          return `<g>
            <line x1="${center}" y1="${sectionIndex === 0 ? pageTop + pageHeight : y - sectionGap}" x2="${center}" y2="${y}" stroke="${SVG_COLORS.softLine}" stroke-width="2"/>
            <rect x="${x}" y="${y}" width="${columnWidth}" height="${layout.height}" rx="12" fill="${SVG_COLORS.surface}" stroke="${SVG_COLORS.softLine}"/>
            <circle cx="${x + 23}" cy="${branchY}" r="11" fill="${SVG_COLORS.accentSoft}"/>
            <text x="${x + 23}" y="${branchY + 4}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" font-weight="700" fill="${SVG_COLORS.accent}">${sectionIndex + 1}</text>
            ${textBlock({
              lines: wrapText(section?.nomeSezione, 33).slice(0, 2),
              x: x + 43,
              y: y + 30,
              lineHeight: 16,
              fontSize: 13,
              color: SVG_COLORS.text,
              weight: 700,
            })}
            <text x="${x + 18}" y="${y + 50}" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${SVG_COLORS.muted}">SCOPO</text>
            ${purpose}
            <text x="${x + 18}" y="${y + 50 + layout.purpose.length * 17 + 23}" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${SVG_COLORS.muted}">CONTENUTI</text>
            ${contents}
            <text x="${x + 18}" y="${y + 50 + (layout.purpose.length + layout.contents.length) * 17 + 46}" font-family="Inter, Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${SVG_COLORS.muted}">CTA</text>
            ${cta}
          </g>`;
        })
        .join('');

      return `<g>
        <rect x="${x}" y="${pageTop}" width="${columnWidth}" height="${pageHeight}" rx="14" fill="${SVG_COLORS.surface}" stroke="${SVG_COLORS.line}" stroke-width="1.5"/>
        <rect x="${x}" y="${pageTop}" width="6" height="${pageHeight}" rx="3" fill="${SVG_COLORS.accent}"/>
        ${textBlock({
          lines: [page.nomePagina],
          x: x + 22,
          y: pageTop + 31,
          fontSize: 16,
          color: SVG_COLORS.text,
          weight: 700,
        })}
        ${textBlock({
          lines: [page.slugSuggerito],
          x: x + 22,
          y: pageTop + 53,
          fontSize: 11,
          color: SVG_COLORS.accent,
          weight: 600,
        })}
        ${textBlock({
          lines: objectiveLines,
          x: x + 22,
          y: pageTop + 78,
          lineHeight: 15,
          fontSize: 11,
          color: SVG_COLORS.muted,
        })}
        ${sections}
      </g>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title description">
  <title id="title">${escapeXml(title)}</title>
  <desc id="description">Schema orizzontale delle pagine del sito e delle rispettive sezioni.</desc>
  <rect width="100%" height="100%" fill="${SVG_COLORS.background}"/>
  ${textBlock({
    lines: [title],
    x: padding,
    y: 42,
    fontSize: 20,
    color: SVG_COLORS.text,
    weight: 700,
  })}
  <text x="${padding}" y="64" font-family="Inter, Arial, sans-serif" font-size="11" fill="${SVG_COLORS.muted}">${pages.length} pagine · sezioni, contenuti e call to action</text>
  ${connectors}
  ${columns}
</svg>`;
};

export const downloadSiteStructureSvg = ({ pages, azienda, filename }) => {
  const svg = createSiteStructureSvg({ pages, azienda });
  if (!svg || typeof window === 'undefined') return false;

  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'Schema sito.svg';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};
