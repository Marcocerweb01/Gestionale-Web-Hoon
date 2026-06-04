export const publicationChecklistTemplate = [
  {
    categoria: 'Sicurezza & Infrastruttura',
    items: [
      {
        nome: 'SSL attivo e redirect forzato su HTTPS',
        descrizione: 'Verifica redirect 301 da HTTP a HTTPS, mixed content assente e certificato valido.',
      },
      {
        nome: 'Aggiornamenti completi e licenze attive',
        descrizione: 'Controlla core, tema, plugin, builder, changelog critici, compatibilita e chiavi licenza.',
      },
      {
        nome: 'Sistema di backup professionale configurato',
        descrizione: 'Definisci frequenza, retention, storage esterno e test di ripristino reale.',
      },
      {
        nome: 'Sicurezza base e hardening minimo',
        descrizione: 'Login protetto, limit login attempts, XML-RPC disattivato se inutile, permessi corretti, admin non "admin".',
      },
      {
        nome: 'Sistema antispam e protezione moduli',
        descrizione: 'ReCAPTCHA v3 o equivalente, honeypot, commenti disattivati se inutili, email non esposte in chiaro.',
      },
    ],
  },
  {
    categoria: 'Tecnica & Configurazione',
    items: [
      {
        nome: 'Struttura permalink definitiva',
        descrizione: 'URL brevi, slug puliti, niente date e struttura coerente con categorie.',
      },
      {
        nome: 'Time zone, lingua e formato data',
        descrizione: 'Controlla impostazioni che impattano contenuti programmati, email, WooCommerce e log.',
      },
      {
        nome: 'Rimozione contenuti demo e pagine inutili',
        descrizione: 'Elimina Hello World, pagine test, immagini stock dimenticate e placeholder.',
      },
      {
        nome: 'Configurazione plugin SEO completa',
        descrizione: 'Sitemap attiva, file llms.txt se previsto, meta globali, Open Graph e schema base.',
      },
      {
        nome: 'Robots.txt coerente',
        descrizione: 'Nessun blocco involontario, no disallow generici errati, staging non indicizzato.',
      },
    ],
  },
  {
    categoria: 'Performance & Velocita',
    items: [
      {
        nome: 'Core Web Vitals sotto controllo',
        descrizione: 'Testa LCP, CLS, INP e TTFB con PageSpeed Insights o GTmetrix.',
      },
      {
        nome: 'Ottimizzazione immagini reale',
        descrizione: 'Formati WebP/AVIF, dimensioni corrette, lazy load attivo e alt text presenti.',
      },
      {
        nome: 'Cache e compressione attive',
        descrizione: 'Caching server, GZIP o Brotli, minificazione CSS/JS e preload font.',
      },
      {
        nome: 'Nessun plugin inutile o ridondante',
        descrizione: 'Rimuovi plugin che aggiungono peso, rischio o manutenzione senza utilita reale.',
      },
    ],
  },
  {
    categoria: 'SEO & Visibilita',
    items: [
      {
        nome: 'Sitemap inviata in Search Console',
        descrizione: 'Verifica proprieta, invio sitemap strutturata e test URL homepage.',
      },
      {
        nome: 'Meta title e description ottimizzati',
        descrizione: 'Controlla homepage, pagine strategiche, servizi e prodotti se e-commerce.',
      },
      {
        nome: 'Struttura H1-H6 coerente',
        descrizione: 'Un solo H1 per pagina, gerarchia logica e heading non usati solo per estetica.',
      },
      {
        nome: 'Schema markup minimo presente',
        descrizione: 'Organization, Breadcrumb e Product se e-commerce.',
      },
    ],
  },
  {
    categoria: 'UX, Accessibilita & Esperienza',
    items: [
      {
        nome: 'Mobile-first reale',
        descrizione: 'Tap target adeguati, font leggibili, spaziature e menu usabile con una mano.',
      },
      {
        nome: 'Navigazione chiara e logica',
        descrizione: 'Massimo 2-3 livelli menu, breadcrumb coerente e call to action evidenti.',
      },
      {
        nome: 'Accessibilita base rispettata',
        descrizione: 'Contrasto colori, alt immagini, focus visibile e form con label corrette.',
      },
      {
        nome: 'Test moduli completo',
        descrizione: 'Invio reale, email ricevuta, controllo spam, thank you page e tracciamento conversione.',
      },
      {
        nome: 'Pagina 404 personalizzata e utile',
        descrizione: 'Inserisci link homepage, link servizi e barra ricerca.',
      },
    ],
  },
  {
    categoria: 'Test, Controlli Finali & Qualita',
    items: [
      {
        nome: 'Test completo su 3 browser',
        descrizione: 'Controlla almeno Chrome, Safari ed Edge.',
      },
      {
        nome: 'Controllo ortografico e micro-copy',
        descrizione: 'Verifica errori, CTA incoerenti e testi placeholder rimasti.',
      },
      {
        nome: 'Test flusso completo utente reale',
        descrizione: 'Simula atterraggio, navigazione, contatto e acquisto se e-commerce.',
      },
      {
        nome: 'Analytics e tracciamenti attivi',
        descrizione: 'GA4, eventi conversione, Pixel Meta e consenso cookie correttamente configurato.',
      },
      {
        nome: 'Verifica blocco motori di ricerca',
        descrizione: 'Assicurati che "Scoraggia i motori di ricerca" non sia attivo.',
      },
      {
        nome: 'Controllo finale professionista',
        descrizione: 'Verifica fiducia, coerenza brand, velocita, chiarezza, responsabilita legale e scalabilita.',
      },
    ],
  },
];

export const createPublicationChecklist = () =>
  publicationChecklistTemplate.map((group) => ({
    categoria: group.categoria,
    items: group.items.map((item) => ({
      ...item,
      completata: false,
      note: '',
    })),
    note: '',
  }));
