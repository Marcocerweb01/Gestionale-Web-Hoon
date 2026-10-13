'use client';

import { ExternalLink } from 'lucide-react';

const listValue = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const CopyLabel = ({ children }) => (
  <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">{children}</div>
);

export function ExistingWebsiteAnalysis({ analysis }) {
  if (!analysis?.urlAnalizzato) return null;

  const preserved = listValue(analysis.contenutiDaConservare);
  const issues = listValue(analysis.criticita);
  const pages = listValue(analysis.pagineRilevate);
  const sources = listValue(analysis.fontiConsultate);
  const unavailable = analysis.stato === 'non_disponibile';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-bold text-gray-950">Analisi del sito precedente</h4>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">
            {analysis.sintesi || (unavailable
              ? 'Il sito indicato non è risultato consultabile.'
              : '[DA COMPLETARE]')}
          </p>
        </div>
        <a
          href={analysis.urlAnalizzato}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 text-xs font-bold text-violet-700 underline decoration-violet-300 underline-offset-4 hover:text-violet-900"
        >
          Apri il sito
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      {!unavailable && (
        <div className="mt-5 grid gap-5 border-t border-gray-100 pt-5 lg:grid-cols-3">
          <div>
            <CopyLabel>Da conservare</CopyLabel>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-gray-700">
              {(preserved.length ? preserved : ['Nessun contenuto identificato.']).map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <CopyLabel>Criticità rilevate</CopyLabel>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-gray-700">
              {(issues.length ? issues : ['Nessuna criticità identificata.']).map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <CopyLabel>Pagine consultate</CopyLabel>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-gray-700">
              {(pages.length ? pages : ['Nessuna pagina rilevata.']).map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <CopyLabel>Fonti consultate</CopyLabel>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {sources.map((source, index) => (
              <a
                key={`${source.url}-${index}`}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 underline decoration-violet-200 underline-offset-4 hover:text-violet-900"
              >
                {source.titolo || source.url}
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function WebsiteCopyPreview({ pages: rawPages }) {
  const pages = Array.isArray(rawPages) ? rawPages : [];
  if (!pages.length) return null;

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
      <h4 className="text-sm font-bold text-gray-950">Testi completi di tutte le pagine</h4>
      <p className="mt-1 text-sm leading-6 text-gray-600">
        Titoli, testi, CTA e indicazioni SEO pronti per la prima realizzazione.
      </p>

      <div className="mt-4 divide-y divide-gray-200 border-y border-gray-200">
        {pages.map((page, pageIndex) => (
          <details key={`${page.nomePagina}-${pageIndex}`} className="group py-1" open={pageIndex === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-bold text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
              <span>{page.nomePagina || '[DA COMPLETARE]'}</span>
              <span className="text-xs font-semibold text-violet-700 group-open:hidden">Mostra testi</span>
              <span className="hidden text-xs font-semibold text-violet-700 group-open:inline">Nascondi</span>
            </summary>
            <div className="pb-5">
              <div className="grid gap-4 bg-slate-50 p-4 lg:grid-cols-2">
                <div>
                  <CopyLabel>Titolo SEO</CopyLabel>
                  <p className="mt-1 text-xs leading-5 text-gray-700">{page.titoloSeo || '[DA COMPLETARE]'}</p>
                </div>
                <div>
                  <CopyLabel>Meta description</CopyLabel>
                  <p className="mt-1 text-xs leading-5 text-gray-700">{page.metaDescription || '[DA COMPLETARE]'}</p>
                </div>
              </div>

              <div className="mt-4 divide-y divide-gray-100">
                {(page.sezioni || []).map((section, sectionIndex) => (
                  <section key={`${section.nomeSezione}-${sectionIndex}`} className="py-5 first:pt-0 last:pb-0">
                    <div className="text-xs font-semibold text-violet-700">
                      {section.nomeSezione || `Sezione ${sectionIndex + 1}`}
                    </div>
                    <h5 className="mt-1 text-base font-bold text-gray-950">
                      {section.titoloCopy || '[DA COMPLETARE]'}
                    </h5>
                    <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-6 text-gray-700">
                      {section.testoCopy || '[DA COMPLETARE]'}
                    </p>
                    <div className="mt-3 text-xs font-bold text-violet-700">
                      CTA: {section.testoCallToAction || '[DA COMPLETARE]'}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
