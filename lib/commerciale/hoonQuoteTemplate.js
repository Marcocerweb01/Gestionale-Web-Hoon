export const HOON_GENERAL_QUOTE_TEMPLATE = "Preventivo Generale Hoon";

const NAVY = "#082e50";
const CYAN = "#009aca";
const WHITE = "#ffffff";
const BLACK = "#111111";
const MUTED = "#5f6872";

const baseBlock = (id, type, x, y, width, height, options = {}) => ({
  id,
  type,
  text: options.text || "",
  imageUrl: options.imageUrl || "",
  x,
  y,
  width,
  height,
  fontSize: options.fontSize || 12,
  fontWeight: options.fontWeight || 400,
  color: options.color || BLACK,
  background: options.background || "transparent",
  align: options.align || "left",
  rotation: options.rotation || 0,
  layer: options.layer || 1,
  shapeType: options.shapeType || "rectangle",
  borderColor: options.borderColor || "transparent",
  borderWidth: options.borderWidth || 0,
  borderRadius: options.borderRadius || 0,
  opacity: options.opacity ?? 1,
});

const text = (id, value, x, y, width, height, options = {}) =>
  baseBlock(id, "text", x, y, width, height, { ...options, text: value });

const shape = (id, x, y, width, height, options = {}) =>
  baseBlock(id, "shape", x, y, width, height, options);

const footerBlocks = (prefix) => [
  shape(`${prefix}-footer-navy`, 0, 772, 595, 70, { background: NAVY, layer: 1 }),
  shape(`${prefix}-footer-cyan`, 425, 772, 170, 70, { background: CYAN, layer: 2 }),
  text(`${prefix}-footer-logo`, "HOON", 20, 783, 210, 44, { color: WHITE, fontSize: 34, fontWeight: 900, layer: 3 }),
  text(
    `${prefix}-footer-company`,
    "© HOON S.r.l.   P.IVA/C.F. 02338800564\nVia Buon Pastore, 9 BDCE - Viterbo\nwww.hoonweb.it",
    305,
    786,
    265,
    42,
    { color: WHITE, fontSize: 8, fontWeight: 700, align: "right", layer: 3 }
  ),
];

const headerBlocks = (prefix, title) => [
  text(`${prefix}-title`, title, 24, 22, 420, 104, { color: NAVY, fontSize: title.split("\n").length >= 3 ? 23 : 29, fontWeight: 900, align: "center", layer: 3 }),
  shape(`${prefix}-header-rule`, 438, 0, 4, 133, { background: NAVY, layer: 2 }),
  shape(`${prefix}-nav-navy`, 0, 133, 360, 27, { background: NAVY, layer: 1 }),
  shape(`${prefix}-nav-cyan`, 360, 133, 235, 27, { background: CYAN, layer: 1 }),
  text(`${prefix}-nav`, "CHI SIAMO | PROGETTO & COSTI | ASSISTENZA", 235, 140, 335, 13, {
    color: WHITE,
    fontSize: 8,
    fontWeight: 700,
    align: "center",
    layer: 3,
  }),
];

function offerBlocks(prefix, offers, y, gap = 76) {
  return offers.flatMap((offer, index) => {
    const top = y + index * gap;
    return [
      shape(`${prefix}-offer-${index}-check`, 29, top + 3, 17, 17, {
        background: WHITE,
        borderColor: BLACK,
        borderWidth: 1.5,
        layer: 3,
      }),
      text(`${prefix}-offer-${index}-title`, offer.title, 55, top, 510, 20, {
        fontSize: 11.5,
        fontWeight: 700,
        layer: 3,
      }),
      text(`${prefix}-offer-${index}-description`, offer.description || "", 55, top + 20, 500, 27, {
        fontSize: 9.5,
        color: MUTED,
        layer: 3,
      }),
      text(`${prefix}-offer-${index}-price`, offer.price || "", 55, top + 47, 500, 20, {
        fontSize: 11,
        fontWeight: 900,
        layer: 3,
      }),
    ];
  });
}

function servicePage({
  id,
  title,
  intro = "",
  details = "",
  offers = [],
  offersY = 455,
  offerGap = 76,
  payment = "",
  paymentY = 694,
  signature = true,
}) {
  const blocks = [
    ...headerBlocks(id, title),
    text(`${id}-intro`, intro, 28, 182, 539, 102, { fontSize: 11.5, fontWeight: 500, layer: 3 }),
    text(`${id}-details`, details, 28, 292, 539, Math.max(100, offersY - 310), { fontSize: 10.5, layer: 3 }),
    ...offerBlocks(id, offers, offersY, offerGap),
    text(`${id}-payment`, payment, 28, paymentY, 520, 45, { fontSize: 8.5, color: MUTED, layer: 3 }),
  ];

  if (signature) {
    blocks.push(
      text(`${id}-signature-label`, "Firma", 430, 724, 120, 16, { fontSize: 9, fontWeight: 700, align: "center", layer: 3 }),
      shape(`${id}-signature-line`, 430, 748, 120, 1, { background: BLACK, layer: 3 })
    );
  }

  blocks.push(...footerBlocks(id));
  return { id, name: title.replace(/\n/g, " "), background: WHITE, blocks };
}

const offers = (...items) => items.map(([title, description, price]) => ({ title, description, price }));

export function buildHoonGeneralQuotePages() {
  return [
    {
      id: "hoon-cover",
      name: "Copertina",
      background: NAVY,
      blocks: [
        shape("cover-cyan", 405, 0, 190, 842, { background: CYAN, layer: 1 }),
        shape("cover-orbit-1", -180, 60, 650, 650, { shapeType: "ellipse", background: "transparent", borderColor: "#5b7f9b", borderWidth: 7, opacity: 0.55, layer: 2 }),
        shape("cover-orbit-2", -75, -160, 350, 1090, { shapeType: "ellipse", background: "transparent", borderColor: "#6f8ca4", borderWidth: 7, opacity: 0.5, layer: 2 }),
        shape("cover-mark", 443, 58, 74, 74, { shapeType: "ellipse", background: "transparent", borderColor: WHITE, borderWidth: 8, layer: 3 }),
        text("cover-title", "PREVENTIVO", 38, 405, 500, 72, { color: WHITE, fontSize: 43, fontWeight: 900, layer: 4 }),
        text("cover-client", "{{azienda}}", 42, 486, 470, 54, { color: WHITE, fontSize: 22, fontWeight: 700, layer: 4 }),
        text("cover-meta", "{{data_preventivo}}  ·  {{numero_preventivo}}", 42, 544, 470, 26, { color: WHITE, fontSize: 11, layer: 4 }),
        text("cover-logo", "HOON", 36, 775, 220, 46, { color: WHITE, fontSize: 36, fontWeight: 900, layer: 4 }),
      ],
    },
    {
      id: "hoon-company",
      name: "La nostra azienda",
      background: WHITE,
      blocks: [
        ...headerBlocks("company", "LA NOSTRA AZIENDA"),
        text("company-copy", "Hoon Web è un’agenzia di comunicazione per aziende e professionisti che vogliono distinguersi nel mondo online.\n\nIl nostro servizio di marketing e comunicazione a 360° è caratterizzato da tre elementi esclusivi:", 28, 186, 535, 122, { fontSize: 12, layer: 3 }),
        text("company-pillars", "• PRESENZA in azienda con i nostri professionisti, per elaborare idee e creare contenuti a stretto contatto con il cliente.\n\n• PROFESSIONALITÀ: puntualità e serietà sono le nostre prerogative.\n\n• QUALITÀ dei contenuti grazie all’utilizzo dei migliori strumenti sul mercato per materiale fotografico e video.", 28, 330, 535, 238, { fontSize: 12, layer: 3 }),
        shape("company-mission-bg", 28, 598, 535, 105, { background: "#eef7fb", borderColor: CYAN, borderWidth: 1, borderRadius: 8, layer: 2 }),
        text("company-mission", "La nostra missione è aiutare i clienti a costruire una presenza digitale che non solo catturi l’attenzione, ma crei un’identità duratura e autentica.", 46, 620, 495, 70, { fontSize: 13, fontWeight: 700, color: NAVY, layer: 3 }),
        ...footerBlocks("company"),
      ],
    },
    servicePage({
      id: "social-analysis",
      title: "SOCIAL MEDIA\nMANAGEMENT",
      intro: "Proponiamo un servizio di gestione organica dei canali social. La prima fase del progetto dura 5 giorni e serve a verificare profili, criticità visibili e competitor.",
      details: "Nello specifico analizzeremo:\n• Studio dei follower e ricerca profili inattivi\n• Ricerca hashtag, orari e giorni di pubblicazione\n• Storie in evidenza su misura e ottimizzazione biografia\n• Inserimento Linktree\n• Incontro conoscitivo e sopralluogo\n• Creazione del calendario editoriale\n\nOgni contenuto multimediale e testuale verrà approvato dal cliente prima della pubblicazione.",
      offersY: 630,
      payment: "Il calendario editoriale programmerà le pubblicazioni dei successivi 10/15 giorni.",
      paymentY: 695,
      signature: false,
    }),
    servicePage({
      id: "social-package",
      title: "SOCIAL MEDIA\nMANAGEMENT",
      intro: "Dopo l’analisi primaria dei profili avviene la creazione del pacchetto comunicazione Hoon Web.",
      details: "Gestione o creazione delle pagine Facebook e Instagram.\n\nPost: 2/3 contenuti settimanali tra foto, reel e infografiche.\nStorie: 2/3 ricondivisioni dei post e ulteriori storie con il materiale disponibile.\nAppuntamenti: direttamente in azienda o in videochiamata per organizzare foto e video.\n\nLe infografiche sono immagini create digitalmente per pubblicizzare o spiegare attività specifiche.",
      offersY: 650,
      payment: "Le storie pubblicate dal titolare dovranno restare coerenti con la comunicazione impostata da Hoon Web.",
      paymentY: 700,
      signature: false,
    }),
    servicePage({
      id: "social-new-client",
      title: "SOCIAL MEDIA\nMANAGEMENT",
      intro: "Di seguito viene riportato il costo del pacchetto di Social Media Management proposto da Hoon Web.",
      details: "Gestione Social dedicata ai clienti che necessitano di una gestione programmata dei profili.",
      offers: offers(
        ["OFFERTA NUOVO CLIENTE", "2 appuntamenti mensili · 2/3 post e stories settimanali · prezzo bloccato per 1 mese", "COSTO 500,00 €  ·  SCONTATO 399,00 € + IVA / mese"],
        ["DAL 2° MESE", "2 appuntamenti mensili · 2/3 post e stories settimanali", "449,00 € + IVA / mese"],
        ["TIK TOK o LINKEDIN", "4 post in ricondivisione dalle altre piattaforme", "COSTO 150,00 €  ·  SCONTATO 99,00 € + IVA / mese"]
      ),
      offersY: 350,
      offerGap: 100,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 680,
    }),
    servicePage({
      id: "social-packages-399",
      title: "SOCIAL MEDIA\nMANAGEMENT",
      intro: "Gestione Social dedicata ai clienti che necessitano di una gestione programmata dei profili.",
      offers: offers(
        ["PACCHETTO 2 POST", "2 appuntamenti in azienda mensili · 2 post e stories settimanali · prezzo bloccato", "COSTO 450,00 €  ·  SCONTATO 399,00 € + IVA / mese"],
        ["PACCHETTO 3 POST", "2 appuntamenti in azienda mensili · 3 post e stories settimanali · prezzo bloccato", "COSTO 550,00 €  ·  SCONTATO 499,00 € + IVA / mese"],
        ["TIK TOK o LINKEDIN", "4 post in ricondivisione dalle altre piattaforme", "COSTO 150,00 €  ·  SCONTATO 99,00 € + IVA / mese"]
      ),
      offersY: 315,
      offerGap: 105,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 675,
    }),
    servicePage({
      id: "social-packages-449",
      title: "SOCIAL MEDIA\nMANAGEMENT",
      intro: "Gestione Social dedicata ai clienti che necessitano di una gestione programmata dei profili.",
      offers: offers(
        ["PACCHETTO 2 POST", "2 appuntamenti in azienda mensili · 2 post e stories settimanali · prezzo bloccato", "COSTO 500,00 €  ·  SCONTATO 449,00 € + IVA / mese"],
        ["PACCHETTO 3 POST", "2 appuntamenti in azienda mensili · 3 post e stories settimanali · prezzo bloccato", "COSTO 600,00 €  ·  SCONTATO 549,00 € + IVA / mese"],
        ["TIK TOK o LINKEDIN", "4 post in ricondivisione dalle altre piattaforme", "COSTO 150,00 €  ·  SCONTATO 99,00 € + IVA / mese"]
      ),
      offersY: 315,
      offerGap: 105,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 675,
    }),
    servicePage({
      id: "social-update",
      title: "AGGIORNAMENTO\nSOCIAL MEDIA",
      intro: "Creazione di contenuti come foto, reel e infografiche. Le idee vengono fornite dal cliente; Hoon modifica e consegna i materiali pronti per la pubblicazione autonoma.",
      details: "Il pacchetto comprende:\n• 4 post mensili (foto, reel e infografiche)\n• 1 appuntamento in azienda per creare foto e video\n• Consegna via e-mail o WhatsApp con tag, hashtag e descrizioni\n• Consegna di tutti i contenuti extra non utilizzati",
      offers: offers(["AGGIORNAMENTO SOCIAL", "4 contenuti mensili completi", "249,00 € + IVA"]),
      offersY: 515,
      payment: "Pagamento anticipato dell’intero importo prima dell’inizio delle riprese.",
      paymentY: 680,
    }),
    servicePage({
      id: "event-package",
      title: "PACCHETTO\nEVENTO",
      intro: "Comunicazione totale dell’evento comprensiva di sito internet, creazione e gestione delle pagine social e Brand Identity.",
      details: "Un progetto coordinato per comunicare l’evento con un’immagine unica, riconoscibile e coerente su tutti i canali.",
      offers: offers(["COMUNICAZIONE TOTALE EVENTO", "Sito web · pagine social per l’intero evento · Brand Identity", "PREZZO PIENO 6.200,00 € · SCONTATO 5.700,00 € · OFFERTA 5.500,00 € + IVA"]),
      offersY: 430,
      payment: "Pagamento in 3 rate: alla firma, dopo 60 giorni e prima dell’inizio dell’evento.",
      paymentY: 675,
    }),
    servicePage({
      id: "model-management",
      title: "MODEL\nMANAGEMENT",
      intro: "Per eventi, look book, cataloghi e campagne fotografiche mettiamo a disposizione figure professionali per realizzare scatti e video.",
      details: "Il servizio comprende:\n• Fornitura modello/a per servizio fotografico o video\n• Convocazione e coordinamento\n• Cessione diritti di abbinamento immagine per uso social\n• 1 reel con modello/a\n• 3 foto con prodotti",
      offers: offers(["SERVIZIO FOTOGRAFICO MODELLI/E", "Progetto dedicato alle aziende che necessitano di un servizio con modello/a", "COSTO 200,00 €  ·  SCONTATO 159,00 € + IVA"]),
      offersY: 500,
      payment: "Pagamento anticipato prima dell’inizio del servizio fotografico.",
      paymentY: 680,
    }),
    servicePage({
      id: "videomaking",
      title: "SERVIZIO\nVIDEOMAKING",
      intro: "Creazione di contenuti di alta qualità per prodotti, eventi, location e ogni esigenza di comunicazione visiva.",
      details: "Il servizio comprende:\n• 1 videomaker a disposizione\n• Editing dei contenuti\n• Archivio video\n• Invio di tutto il materiale realizzato",
      offers: offers(
        ["VIDEOMAKING - 1 VIDEO", "Servizio personalizzato", "COSTO 250,00 €  ·  SCONTATO 199,00 € + IVA"],
        ["VIDEOMAKING - 3 VIDEO", "Servizio personalizzato", "COSTO 750,00 €  ·  SCONTATO 499,00 € + IVA"]
      ),
      offersY: 445,
      offerGap: 92,
      payment: "Pagamento anticipato dell’intero importo prima dell’inizio delle riprese.",
      paymentY: 680,
    }),
    servicePage({
      id: "video-photo",
      title: "SERVIZIO\nVIDEO / FOTO",
      intro: "Videomaker o fotografo a disposizione, archivio del servizio, editing e invio di tutto il materiale realizzato.",
      details: "Riprese fino a 1 ora: 120,00 € - 100,00 € + IVA\nRiprese fino a 2 ore: 200,00 € - 150,00 € + IVA\nRiprese fino a 3 ore: 250,00 € - 200,00 € + IVA\nRiprese fino a 5 ore: 400,00 € - 300,00 € + IVA\n\nMontaggio di 1 video da 30/40 secondi: 30,00 € + IVA",
      offersY: 650,
      payment: "Pagamento anticipato dell’intero importo prima dell’inizio delle riprese o dello shooting.",
      paymentY: 688,
    }),
    servicePage({
      id: "photo-bnb",
      title: "SERVIZIO\nFOTOGRAFICO",
      intro: "Servizio fotografico completo dedicato a B&B e affittacamere.",
      details: "Comprende 2 fotografi, foto alla struttura, archivio fotografico, invio del materiale e 1 appartamento.\n\nTariffe in base ai mq: 0-60 mq 100 € · 61-100 mq 150 € · 101-150 mq 200 € · oltre 151 mq su misura. Drone incluso dove possibile.\n\nServizi extra: attrezzatura 360, modellini 3D, modelle/i, drone per interni e pacchetti multi-appartamento.",
      offers: offers(["SERVIZIO FOTOGRAFICO B&B", "Pacchetto completo per struttura ricettiva", "COSTO 250,00 €  ·  SCONTATO 149,00 € + IVA"]),
      offersY: 570,
      payment: "Pagamento anticipato prima dell’inizio del servizio fotografico.",
      paymentY: 690,
    }),
    servicePage({
      id: "photo-custom",
      title: "SERVIZIO\nFOTOGRAFICO",
      intro: "Shooting fotografici di alta qualità per prodotti, eventi, location e qualsiasi esigenza di comunicazione visiva.",
      details: "Il servizio comprende:\n• 1 fotografo a disposizione\n• Editing dei contenuti\n• Archivio fotografico\n• Invio di tutto il materiale realizzato",
      offers: offers(["SERVIZIO FOTOGRAFICO PERSONALIZZATO", "Foto alla struttura e contenuti online", "COSTO 400,00 €  ·  SCONTATO 349,00 € + IVA"]),
      offersY: 500,
      payment: "Pagamento anticipato dell’intero importo prima dell’inizio dello shooting.",
      paymentY: 685,
    }),
    servicePage({
      id: "posters",
      title: "LOCANDINE",
      intro: "Creazione grafica per locandine di eventi, pubblicità e menù con prezzo a partire da 15 €, in base alla complessità.",
      details: "Il costo viene definito in base ai cambiamenti strutturali e al tempo necessario per costruire la grafica. Per una locandina digitale animata il prezzo viene concordato durante l’intervista.",
      offers: offers(["PACCHETTO 4 LOCANDINE", "Creazione grafica per 4 locandine evento o pubblicità", "COSTO 200,00 €  ·  SCONTATO 129,00 € + IVA"]),
      offersY: 475,
      payment: "Pagamento dell’intero importo prima della consegna del progetto.",
      paymentY: 680,
    }),
    servicePage({
      id: "advertising",
      title: "CAMPAGNE\nPUBBLICITARIE",
      intro: "Studio e gestione di contenuti da sponsorizzare attraverso Google Ads e analisi delle parole chiave.",
      details: "Gestione e creazione di campagne pubblicitarie adattate al tipo di azienda e al pubblico di riferimento.",
      offers: offers(
        ["GESTIONE CAMPAGNA PUBBLICITARIA", "Creazione e gestione di una campagna · budget sponsorizzate escluso", "COSTO 150,00 €  ·  SCONTATO 129,00 € + IVA"],
        ["PACCHETTO 3 CAMPAGNE", "Tre campagne adattate all’azienda e al pubblico · budget escluso", "COSTO 450,00 €  ·  SCONTATO 369,00 € + IVA"]
      ),
      offersY: 420,
      offerGap: 105,
      payment: "Pagamento anticipato dell’intero importo prima dello sviluppo della campagna.",
      paymentY: 680,
    }),
    servicePage({
      id: "press-annual",
      title: "SERVIZIO\nSTAMPA",
      intro: "Il servizio stampa fa conoscere l’azienda tramite articoli su organi di informazione e testate di settore.",
      details: "Comprende comunicato di presentazione, 4 comunicati stagionali, 3 inviti stampa singoli e 1 invito stampa di gruppo con giornalisti di settore. Non include la gestione mensile dei rapporti con la stampa.",
      offers: offers(["SERVIZIO STAMPA - 1 ANNO", "Presenza online tramite servizi stampa programmati", "COSTO 1.100,00 €  ·  SCONTATO 900,00 € + IVA"]),
      offersY: 500,
      payment: "Pagamento anticipato dell’intero importo per l’inizio del progetto.",
      paymentY: 685,
    }),
    servicePage({
      id: "press-six-months",
      title: "SERVIZIO\nSTAMPA",
      intro: "Il servizio stampa fa conoscere l’azienda tramite articoli su organi di informazione e testate di settore.",
      details: "Comprende comunicato di presentazione, 2 comunicati stagionali e 3 inviti stampa singoli con giornalisti di settore. Non include la gestione mensile dei rapporti con la stampa.",
      offers: offers(["SERVIZIO STAMPA - 6 MESI", "Presenza online tramite servizi stampa programmati", "COSTO 650,00 €  ·  SCONTATO 600,00 € + IVA"]),
      offersY: 500,
      payment: "Pagamento anticipato dell’intero importo per l’inizio del progetto.",
      paymentY: 685,
    }),
    servicePage({
      id: "press-office",
      title: "UFFICIO\nSTAMPA",
      intro: "Gestione a 360° dei rapporti con la stampa per aumentare la presenza online dell’attività.",
      details: "Comprende comunicato di presentazione, 4 comunicati stagionali, 2 comunicati straordinari, creazione e-mail dedicata, 4 inviti singoli e 2 inviti di gruppo. Possibilità di organizzare eventi, guest e cene a 4 mani con preventivo dedicato.",
      offers: offers(["UFFICIO STAMPA - 1 ANNO", "Gestione continuativa da parte di un professionista del settore", "COSTO 500,00 €  ·  SCONTATO 400,00 € + IVA / mese"]),
      offersY: 530,
      payment: "Pagamento anticipato dell’intero importo per l’inizio del progetto.",
      paymentY: 685,
    }),
    servicePage({
      id: "brand-basic",
      title: "BRAND\nIDENTITY",
      intro: "Creazione della Brand Identity Basic: logo, palette colori, file vettoriali, font coordinati e moodboard.",
      details: "Una base visiva completa per costruire da zero la propria identità online.",
      offers: offers(
        ["BRAND IDENTITY BASIC", "Progetto completo di identità visiva", "COSTO 400,00 €  ·  SCONTATO 299,00 € + IVA"],
        ["VETTORIALIZZAZIONE LOGO", "File vettoriale del logo", "COSTO 70,00 €  ·  SCONTATO 49,00 € + IVA"]
      ),
      offersY: 410,
      offerGap: 105,
      payment: "Pagamento del 50% all’inizio e saldo alla consegna del progetto finito.",
      paymentY: 680,
    }),
    servicePage({
      id: "brand-pro",
      title: "BRAND\nIDENTITY",
      intro: "Brand Identity Pro con logo, palette, file vettoriali, font, moodboard e materiali coordinati.",
      details: "La grafica coordinata comprende biglietto da visita, carta intestata, cartellina e flyer.",
      offers: offers(["BRAND IDENTITY PRO", "Progetto completo per creare da zero la propria identità online", "COSTO 500,00 €  ·  SCONTATO 399,00 € + IVA"]),
      offersY: 455,
      payment: "Pagamento del 50% all’inizio e saldo alla consegna del progetto finito.",
      paymentY: 680,
    }),
    servicePage({
      id: "other-services",
      title: "ALTRI SERVIZI",
      intro: "Servizi dedicati alle strutture ricettive e alle attività che vogliono migliorare la presenza sulle piattaforme online.",
      offers: offers(
        ["TESTI PER INSERIMENTO ONLINE", "Creazione testi per B&B e affittacamere", "COSTO 100,00 €  ·  SCONTATO 49,00 € + IVA"],
        ["ACCOUNT BOOKING / AIRBNB", "Creazione account sulle piattaforme di vendita online · inserimento foto in omaggio", "COSTO 200,00 €  ·  SCONTATO 149,00 € + IVA"]
      ),
      offersY: 360,
      offerGap: 120,
      payment: "Pagamento anticipato prima dell’inizio dei servizi.",
      paymentY: 680,
    }),
    servicePage({
      id: "website-structure",
      title: "STRUTTURA\nSITO WEB",
      intro: "Il progetto di creazione del sito web viene diviso in tre fasi, approvate progressivamente dal cliente.",
      details: "1. STRUTTURAZIONE\nSviluppo homepage, scelta delle sezioni e funzionalità aggiuntive.\n\n2. PERSONALIZZAZIONE\nFont, colori, effetti, transizioni e inserimento di foto, video e testi.\n\n3. CONSEGNA\nTrasferimento e pubblicazione sul dominio, consegna delle credenziali.\n\nModifiche strutturali richieste dopo l’approvazione saranno oggetto di un nuovo preventivo.",
      offersY: 660,
      payment: "Ogni singolo passaggio viene approvato dal cliente per consentire eventuali modifiche.",
      paymentY: 690,
    }),
    servicePage({
      id: "website-starter",
      title: "CREAZIONE\nSITO WEB",
      intro: "Sito Starter di una pagina con design predefinito e responsive, plugin essenziali e SEO base.",
      details: "Struttura: Home, Gallery, Chi siamo e Contatti. Include copertina, 8/10 immagini, logo e font, Privacy e Cookie Policy. Il sito potrà essere ampliato in futuro.",
      offers: offers(["SITO WEB STARTER", "Consegna di un sito essenziale e reattivo", "COSTO 1.000,00 €  ·  SCONTATO 799,00 € + IVA"]),
      offersY: 475,
      payment: "OMAGGIO: dominio e hosting per il primo anno. 50% anticipato e saldo prima della pubblicazione.",
      paymentY: 665,
    }),
    servicePage({
      id: "website-one-page",
      title: "CREAZIONE\nSITO WEB",
      intro: "Sito One Page con design personalizzato, responsive e consegna entro 21 giorni lavorativi.",
      details: "Include Privacy e Cookie Policy, plugin necessari e SEO base: indicizzazione, ottimizzazione delle pagine principali, link building interna e architettura del sito.",
      offers: offers(["SITO WEB ONE PAGE", "Una pagina completa, personalizzata e ampliabile", "COSTO 1.700,00 €  ·  SCONTATO 1.500,00 € + IVA"]),
      offersY: 475,
      payment: "OMAGGIO: 1 mese di manutenzione, dominio e hosting per il primo anno. 50% anticipato e saldo prima della pubblicazione.",
      paymentY: 650,
    }),
    servicePage({
      id: "website-showcase",
      title: "CREAZIONE\nSITO WEB",
      intro: "Sito Vetrina da 2 a 6 pagine con design personalizzato, responsive e consegna entro 21 giorni lavorativi.",
      details: "Include Privacy e Cookie Policy, plugin necessari e SEO base: indicizzazione, ottimizzazione delle pagine principali, link building interna e architettura del sito.",
      offers: offers(["SITO WEB VETRINA", "Da 2 a 6 pagine personalizzate e ampliabili", "COSTO 2.300,00 €  ·  SCONTATO 1.800,00 € + IVA"]),
      offersY: 475,
      payment: "OMAGGIO: 1 mese di manutenzione, dominio e hosting per il primo anno. 50% anticipato e saldo prima della pubblicazione.",
      paymentY: 650,
    }),
    servicePage({
      id: "website-ecommerce",
      title: "CREAZIONE\nSITO WEB\nE-COMMERCE",
      intro: "E-commerce da 2 a 6 pagine con design personalizzato, responsive e consegna entro 30 giorni lavorativi.",
      details: "Include Privacy e Cookie Policy, plugin necessari e SEO base: indicizzazione, ottimizzazione delle pagine principali, link building interna e architettura del sito.",
      offers: offers(["SITO WEB E-COMMERCE", "Negozio online personalizzato e ampliabile", "COSTO 2.700,00 €  ·  SCONTATO 2.500,00 € + IVA"]),
      offersY: 475,
      payment: "OMAGGIO: 1 mese di manutenzione, dominio e hosting per il primo anno. 50% anticipato e saldo prima della pubblicazione.",
      paymentY: 650,
    }),
    servicePage({
      id: "website-ecommerce-pro",
      title: "CREAZIONE\nSITO WEB\nE-COMMERCE",
      intro: "E-commerce Pro da 2 a 6 pagine con filtri, wishlist, area cliente, design personalizzato e consegna entro 30 giorni.",
      details: "Include Privacy e Cookie Policy, plugin necessari e SEO base: indicizzazione, ottimizzazione delle pagine principali, link building interna e architettura del sito.",
      offers: offers(["SITO WEB E-COMMERCE PRO", "Negozio online evoluto con funzionalità dedicate", "COSTO 2.700,00 €  ·  SCONTATO 2.500,00 € + IVA"]),
      offersY: 475,
      payment: "OMAGGIO: 1 mese di manutenzione, dominio e hosting per il primo anno. 50% anticipato e saldo prima della pubblicazione.",
      paymentY: 650,
    }),
    servicePage({
      id: "ecommerce-photo",
      title: "SERVIZIO FOTO\nE-COMMERCE",
      intro: "Servizio fotografico prodotti con fotografo, set professionale, editing, archivio, invio del materiale e 3/4 foto per prodotto.",
      details: "TARIFFE 0-100 / 101-200 / oltre 201 prodotti\nCaricamento online con foto e testo cliente: 2 € / 1,50 € / 1 € cad.\nCaricamento con foto cliente e testo Hoon: 3 € / 2,50 € / 2 € cad.\nFoto Hoon: 7 € / 6,50 € / 6 € cad.\nFoto Hoon e caricamento con testo cliente: 8 € / 7,50 € / 7 € cad.\nFoto Hoon e caricamento con testo Hoon: 9 € / 8,50 € / 8 € cad.",
      offersY: 650,
      payment: "50% anticipato prima del servizio fotografico e saldo dopo 15 giorni.",
      paymentY: 690,
    }),
    servicePage({
      id: "seo-consulting",
      title: "CONSULENZA\nSEO",
      intro: "Consulenza strategica per definire una strategia di posizionamento, raggiungere un target più preciso e individuare le criticità.",
      details: "Comprende audit SEO, analisi competitor, ricerca parole chiave, criticità e opportunità, indicizzazione, ottimizzazione delle pagine principali, link building interna, architettura del sito, report finale e ottimizzazione testi.",
      offers: offers(["CONSULENZA SEO", "Analisi e strategia completa per il sito web", "COSTO 600,00 €  ·  SCONTATO 500,00 € + IVA"]),
      offersY: 510,
      payment: "Pagamento anticipato prima dell’inizio del progetto.",
      paymentY: 685,
    }),
    servicePage({
      id: "seo-management",
      title: "GESTIONE SEO",
      intro: "Gestione mensile per posizionare il sito sui motori di ricerca, attrarre traffico organico e monitorare le performance.",
      details: "Comprende audit, competitor, parole chiave, 2 ore di ottimizzazione pagine, 1 ora di Local SEO, 1 articolo blog, monitoraggio e report mensile.",
      offers: offers(["GESTIONE SEO BASE MENSILE", "Gestione continuativa da parte di Hoon", "COSTO 550,00 €  ·  SCONTATO 449,00 € + IVA / mese"]),
      offersY: 510,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 680,
    }),
    servicePage({
      id: "blog-management",
      title: "GESTIONE BLOG",
      intro: "Il servizio Blog attira traffico organico attraverso temi correlati ai servizi e ai prodotti presentati sul sito.",
      details: "Tutti i pacchetti comprendono ricerca parole chiave, articolo blog, link building interna, monitoraggio e report.",
      offers: offers(
        ["PACCHETTO BASE", "1 articolo di blog", "COSTO 200,00 €  ·  SCONTATO 150,00 € + IVA"],
        ["PACCHETTO PRO", "1 link esterno o menzione", "COSTO 300,00 €  ·  SCONTATO 250,00 € + IVA"],
        ["PACCHETTO ULTRA", "1 articolo · 1 ora AI · 2 link esterni o menzioni", "COSTO 450,00 €  ·  SCONTATO 400,00 € + IVA"]
      ),
      offersY: 360,
      offerGap: 94,
      payment: "Pagamento anticipato dell’intero importo.",
      paymentY: 680,
    }),
    servicePage({
      id: "ecommerce-management",
      title: "GESTIONE\nE-COMMERCE",
      intro: "Gestione mensile del sito e-commerce per garantirne salute, sicurezza e continuità operativa.",
      details: "Comprende correzione bug, aggiornamenti WordPress e plugin, server e hosting, responsive, database, prodotti, transazioni, controllo settimanale e report Analytics mensile. Le richieste extra vengono valutate separatamente.",
      offers: offers(["GESTIONE E-COMMERCE MENSILE", "Gestione continuativa da parte di Hoon", "COSTO 300,00 €  ·  SCONTATO 199,00 € + IVA / mese"]),
      offersY: 515,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 680,
    }),
    servicePage({
      id: "website-maintenance",
      title: "MANUTENZIONE\nSITO WEB",
      intro: "Manutenzione WordPress con correzione bug, aggiornamenti core e plugin, server e hosting, responsive, database e backup mensile.",
      offers: offers(
        ["MANUTENZIONE MENSILE", "Controllo e manutenzione del sito", "COSTO 80,00 €  ·  SCONTATO 69,00 € + IVA / mese"],
        ["MANUTENZIONE ANNUALE", "Copertura annuale del sito", "COSTO 960,00 €  ·  SCONTATO 600,00 € + IVA / anno"]
      ),
      offersY: 390,
      offerGap: 118,
      payment: "Pagamento anticipato ogni giorno 5 del mese; prima mensilità entro 5 giorni dalla firma.",
      paymentY: 680,
    }),
    servicePage({
      id: "support-costs",
      title: "ASSISTENZA",
      intro: "Costi aggiuntivi annuali a carico del cliente in base al tipo di sito web.",
      details: "• Rinnovo annuale dominio: 150/200 €\n• Privacy e Cookie Policy: 60/100 €\n\nAssistenza in orario d’ufficio:\nLunedì-Giovedì 9:00-18:30\nVenerdì 9:00-12:00\nLe richieste fuori orario saranno affrontate nella prima fascia disponibile.\n\nPer ogni cliente presentato con chiusura di contratto Hoon riconosce uno sconto di 100 € una tantum.",
      offersY: 650,
      payment: "Il presente preventivo ha validità trimestrale dal momento della consegna.\nData: {{data_preventivo}}",
      paymentY: 680,
    }),
    servicePage({
      id: "support",
      title: "ASSISTENZA",
      intro: "L’assistenza sarà svolta in orario d’ufficio.",
      details: "Da lunedì a giovedì dalle 9:00 alle 18:30.\nVenerdì dalle 9:00 alle 12:00.\nTutte le richieste fuori orario saranno affrontate nella prima fascia disponibile.\n\nPer ogni cliente presentato con chiusura di contratto Hoon riconosce uno sconto di 100 € una tantum.",
      offersY: 620,
      payment: "Il presente preventivo ha validità trimestrale dal momento della consegna.\nData: {{data_preventivo}}",
      paymentY: 675,
    }),
  ];
}
