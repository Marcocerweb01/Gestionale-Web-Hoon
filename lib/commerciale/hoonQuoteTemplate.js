export const HOON_GENERAL_QUOTE_TEMPLATE = "Preventivo Generale Hoon";
export const HOON_TEMPLATE_SOURCE_VERSION = 2;

export const HOON_QUOTE_SERVICE_CATALOG = [
  { key: "social-media-management", label: "Social Media Management", description: "Analisi, gestione e pacchetti social", pageNumbers: [3, 4, 5, 6, 7] },
  { key: "aggiornamento-social", label: "Aggiornamento Social Media", description: "Creazione contenuti per pubblicazione autonoma", pageNumbers: [8] },
  { key: "evento", label: "Pacchetto Evento", description: "Comunicazione completa dell'evento", pageNumbers: [9] },
  { key: "model-management", label: "Model Management", description: "Modelli per shooting, video ed eventi", pageNumbers: [10] },
  { key: "videomaking", label: "Servizio Videomaking", description: "Produzione e montaggio video", pageNumbers: [11] },
  { key: "video-foto", label: "Servizio Video / Foto", description: "Riprese video e fotografiche a ore", pageNumbers: [12] },
  { key: "fotografia", label: "Servizio Fotografico", description: "B&B, strutture e shooting personalizzati", pageNumbers: [13, 14] },
  { key: "locandine", label: "Locandine", description: "Grafica digitale e animata", pageNumbers: [15] },
  { key: "campagne-pubblicitarie", label: "Campagne Pubblicitarie", description: "Google Ads e campagne sponsorizzate", pageNumbers: [16] },
  { key: "stampa", label: "Servizio e Ufficio Stampa", description: "Servizio stampa semestrale, annuale e ufficio stampa", pageNumbers: [17, 18, 19] },
  { key: "brand-identity", label: "Brand Identity", description: "Brand Identity Basic e Pro", pageNumbers: [20, 21] },
  { key: "altri-servizi", label: "Altri servizi", description: "Testi e account Booking / Airbnb", pageNumbers: [22] },
  { key: "sito-starter", label: "Sito Web Starter", description: "Sito essenziale di una pagina", pageNumbers: [23, 24] },
  { key: "sito-one-page", label: "Sito Web One Page", description: "One page personalizzata", pageNumbers: [23, 25] },
  { key: "sito-vetrina", label: "Sito Web Vetrina", description: "Sito vetrina da 2 a 6 pagine", pageNumbers: [23, 26] },
  { key: "sito-ecommerce", label: "Sito Web E-commerce", description: "Negozio online personalizzato", pageNumbers: [23, 27] },
  { key: "sito-ecommerce-pro", label: "Sito Web E-commerce Pro", description: "Negozio online evoluto", pageNumbers: [23, 28] },
  { key: "foto-ecommerce", label: "Servizio Foto E-commerce", description: "Foto e caricamento prodotti", pageNumbers: [29] },
  { key: "seo", label: "SEO", description: "Consulenza e gestione SEO", pageNumbers: [30, 31] },
  { key: "blog", label: "Gestione Blog", description: "Articoli e link building", pageNumbers: [32] },
  { key: "gestione-ecommerce", label: "Gestione E-commerce", description: "Gestione mensile del negozio online", pageNumbers: [33] },
  { key: "manutenzione-sito", label: "Manutenzione Sito Web", description: "Manutenzione mensile o annuale", pageNumbers: [34] },
].map((service) => ({ ...service, defaultPrice: 0, vatRate: 22 }));

const PAGE_NAMES = [
  "Copertina", "La nostra azienda", "Social Media Management - analisi", "Social Media Management - pacchetto",
  "Social Media Management - nuovo cliente", "Social Media Management - pacchetti 1", "Social Media Management - pacchetti 2",
  "Aggiornamento Social Media", "Pacchetto Evento", "Model Management", "Servizio Videomaking", "Servizio Video / Foto",
  "Servizio Fotografico B&B", "Servizio Fotografico personalizzato", "Locandine", "Campagne Pubblicitarie",
  "Servizio Stampa annuale", "Servizio Stampa semestrale", "Ufficio Stampa", "Brand Identity Basic", "Brand Identity Pro",
  "Altri servizi", "Struttura Sito Web", "Sito Web Starter", "Sito Web One Page", "Sito Web Vetrina", "Sito Web E-commerce",
  "Sito Web E-commerce Pro", "Servizio Foto E-commerce", "Consulenza SEO", "Gestione SEO", "Gestione Blog",
  "Gestione E-commerce", "Manutenzione Sito Web", "Assistenza - costi", "Assistenza - orari",
];

const ALWAYS_INCLUDED_PAGES = new Set([1, 2, 35, 36]);

export function buildHoonGeneralQuotePages() {
  return PAGE_NAMES.map((name, index) => {
    const pageNumber = index + 1;
    return {
      id: `hoon-source-${String(pageNumber).padStart(2, "0")}`,
      name,
      background: "#ffffff",
      backgroundImage: `/commerciale/hoon-template/page-${String(pageNumber).padStart(2, "0")}.jpg`,
      backgroundImageOpacity: 1,
      includedByDefault: ALWAYS_INCLUDED_PAGES.has(pageNumber),
      sourcePage: pageNumber,
      serviceKeys: HOON_QUOTE_SERVICE_CATALOG.filter((service) => service.pageNumbers.includes(pageNumber)).map((service) => service.key),
      blocks: [],
    };
  });
}

export function selectQuoteTemplatePages(pages = [], serviceKeys = []) {
  const selected = new Set(serviceKeys);
  return pages
    .filter((page) => page.includedByDefault || (page.serviceKeys || []).some((key) => selected.has(key)))
    .map((page) => ({ ...page, blocks: (page.blocks || []).map((block) => ({ ...block })) }));
}
