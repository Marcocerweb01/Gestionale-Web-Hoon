'use client';

import { Download } from 'lucide-react';
import {
  downloadSiteStructureSvg,
  getSiteStructurePages,
} from '@/lib/site-structure-diagram';

const Detail = ({ label, children, accent = false }) => (
  <div>
    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">{label}</div>
    <div className={`mt-1 text-xs leading-5 ${accent ? 'font-semibold text-violet-700' : 'text-gray-700'}`}>
      {children || '[DA COMPLETARE]'}
    </div>
  </div>
);

export default function SiteStructureDiagram({ pages: rawPages, azienda, filename }) {
  const pages = getSiteStructurePages(rawPages);
  if (!pages.length) return null;

  const downloadDiagram = () => {
    downloadSiteStructureSvg({ pages, azienda, filename });
  };

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-slate-50">
      <div className="flex flex-col gap-3 border-b border-gray-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-950">Schema visuale del sito</h4>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            Pagine disposte in orizzontale con sezioni, contenuti necessari e call to action.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadDiagram}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 transition hover:border-violet-300 hover:text-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:ring-offset-2"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Scarica schema SVG
        </button>
      </div>

      <div className="overflow-x-auto overscroll-x-contain px-5 py-6" tabIndex={0} aria-label="Schema orizzontale del sito">
        <div className="relative flex min-w-max items-start gap-6 pb-2">
          <div className="pointer-events-none absolute left-40 right-40 top-5 h-px bg-gray-300" aria-hidden="true" />
          {pages.map((page, pageIndex) => (
            <article key={`${page.nomePagina}-${pageIndex}`} className="relative w-80 shrink-0 pt-5">
              <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-gray-300" aria-hidden="true" />
              <header className="relative min-h-32 rounded-xl border border-gray-300 bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
                <span className="absolute inset-y-4 left-0 w-1 rounded-r bg-violet-700" aria-hidden="true" />
                <h5 className="text-base font-bold text-gray-950">{page.nomePagina}</h5>
                <div className="mt-1 text-xs font-semibold text-violet-700">{page.slugSuggerito}</div>
                <p className="mt-3 text-xs leading-5 text-gray-600">{page.obiettivo}</p>
              </header>

              <div className="relative mt-8 space-y-4 before:absolute before:-top-8 before:bottom-4 before:left-5 before:w-px before:bg-gray-300">
                {page.sezioni.map((section, sectionIndex) => (
                  <section
                    key={`${section.nomeSezione}-${sectionIndex}`}
                    className="relative ml-10 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_5px_18px_rgba(15,23,42,0.035)] before:absolute before:-left-5 before:top-5 before:h-px before:w-5 before:bg-gray-300"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[11px] font-bold text-violet-800">
                        {sectionIndex + 1}
                      </span>
                      <h6 className="pt-0.5 text-sm font-bold leading-5 text-gray-950">
                        {section.nomeSezione || '[DA COMPLETARE]'}
                      </h6>
                    </div>
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-3">
                      <Detail label="Scopo">{section.scopo}</Detail>
                      <Detail label="Contenuti">{section.contenuti}</Detail>
                      <Detail label="CTA" accent>{section.callToAction}</Detail>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
