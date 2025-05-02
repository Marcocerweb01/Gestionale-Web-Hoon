import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore } from "@/models/User";

const taskTemplates = {
  "e-commerce": [
    { nome: "Consegna contenuti da parte del cliente", tempistica: "Variabile" },
    { nome: "Analisi requisiti cliente", tempistica: "2 giorni" },
    { nome: "Definizione struttura e mappa sito", tempistica: "2 giorni" },
    { nome: "Scelta e approvazione template WooCommerce", tempistica: "1 giorno" },
    { nome: "Installazione WordPress e configurazione hosting", tempistica: "1 giorno" },
    { nome: "Installazione template e plugin principali", tempistica: "1 giorno" },
    { nome: "Configurazione GDPR e Privacy Policy", tempistica: "1 giorno" },
    { nome: "Personalizzazione grafica base (colori, font, header, footer)", tempistica: "3 giorni" },
    { nome: "Configurazione WooCommerce (spedizioni, tasse, pagamenti)", tempistica: "3 giorni" },
    { nome: "Creazione categorie di prodotto", tempistica: "2 giorni" },
    { nome: "Inserimento prodotti base", tempistica: "3 giorni" },
    { nome: "Personalizzazione pagine prodotto e carrello", tempistica: "2 giorni" },
    { nome: "Ottimizzazione responsive mobile e tablet", tempistica: "2 giorni" },
    { nome: "SEO base on-page (meta title, meta description, URL)", tempistica: "2 giorni" },
    { nome: "Test completo funzionalità acquisto e consegna", tempistica: "2 giorni" }
  ],
  "sito vetrina": [
    { nome: "Analisi requisiti cliente", tempistica: "2 giorni" },
    { nome: "Consegna contenuti da parte del cliente", tempistica: "Variabile" },
    { nome: "Definizione struttura e mappa sito", tempistica: "2 giorni" },
    { nome: "Scelta e approvazione template Elementor", tempistica: "1 giorno" },
    { nome: "Installazione WordPress e configurazione hosting", tempistica: "1 giorno" },
    { nome: "Installazione template e plugin principali", tempistica: "1 giorno" },
    { nome: "Configurazione GDPR e Privacy Policy", tempistica: "1 giorno" },
    { nome: "Personalizzazione grafica base (colori, font, header, footer)", tempistica: "3 giorni" },
    { nome: "Creazione pagine principali (Home, Servizi, Chi siamo, Contatti)", tempistica: "4 giorni" },
    { nome: "Inserimento testi e immagini", tempistica: "2 giorni" },
    { nome: "Inserimento moduli contatto e GDPR compliance", tempistica: "1 giorno" },
    { nome: "Ottimizzazione responsive mobile e tablet", tempistica: "2 giorni" },
    { nome: "SEO base on-page (meta title, meta description, URL)", tempistica: "2 giorni" },
    { nome: "Test completo navigabilità", tempistica: "2 giorni" },
    { nome: "Revisione finale con il cliente e messa online", tempistica: "1 giorno" }
  ],
  "sito starter": [
    { nome: "Raccolta informazioni cliente", tempistica: "1 giorno" },
    { nome: "Consegna contenuti da parte del cliente", tempistica: "Variabile" },
    { nome: "Definizione mappa pagine essenziali", tempistica: "1 giorno" },
    { nome: "Installazione WordPress e configurazione hosting", tempistica: "1 giorno" },
    { nome: "Installazione template predefinito", tempistica: "1 giorno" },
    { nome: "Configurazione GDPR e Privacy Policy", tempistica: "1 giorno" },
    { nome: "Configurazione plugin di base (form, sicurezza, cache)", tempistica: "1 giorno" },
    { nome: "Personalizzazione minima grafica (colori e logo)", tempistica: "2 giorni" },
    { nome: "Creazione Home Page", tempistica: "3 giorni" },
    { nome: "Inserimento testi/immagini o placeholder", tempistica: "2 giorni" },
    { nome: "Creazione form contatto rapido", tempistica: "1 giorno" },
    { nome: "Ottimizzazione responsive mobile", tempistica: "2 giorni" },
    { nome: "SEO base on-page (titoli, slug, immagini)", tempistica: "2 giorni" },
    { nome: "Test navigazione e messa online", tempistica: "1 giorno" }
  ]
}
;

export async function POST(req) {
  try {
    await connectToDB();

    const { tipoProgetto, clienteId, webDesignerId, note, dataInizioContratto, dataFineContratto } = await req.json();

    if (!tipoProgetto || !clienteId || !webDesignerId || !dataInizioContratto || !dataFineContratto) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    // Recupera i dati di azienda e collaboratore
    const azienda = await Azienda.findById(clienteId);
    const collaboratore = await Collaboratore.findById(webDesignerId);

    if (!azienda || !collaboratore) {
      return new Response(JSON.stringify({ message: "Azienda o collaboratore non trovati" }), { status: 404 });
    }

    // Genera i task in base al tipo di progetto
    const tasks = taskTemplates[tipoProgetto].map((task) => ({
      nome: task.nome,
      dataInizio: null, // Imposta null
      dataFine: null,   // Imposta null
      tempistica: task.tempistica,
      completata: false,
    }));

    // Crea la nuova collaborazione
    const nuovaCollaborazione = await CollaborazioneWebDesign.create({
      tipoProgetto,
      cliente: clienteId,
      webDesigner: webDesignerId,
      aziendaRagioneSociale: azienda.ragioneSociale,
      collaboratoreNome: collaboratore.nome,
      collaboratoreCognome: collaboratore.cognome,
      tasks,
      note,
      problemi: "",
      dataInizioContratto: dataInizioContratto || null,
      dataFineContratto: dataFineContratto || null,
    });

    return new Response(JSON.stringify(nuovaCollaborazione), { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}