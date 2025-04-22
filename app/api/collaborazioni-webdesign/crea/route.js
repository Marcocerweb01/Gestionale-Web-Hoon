import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore } from "@/models/User";

const taskTemplates = {
  "e-commerce": [
    { nome: "Analisi dei requisiti", tempistica: "5 giorni" },
    { nome: "Progettazione UX/UI", tempistica: "10 giorni" },
    { nome: "Sviluppo Frontend", tempistica: "15 giorni" },
    { nome: "Sviluppo Backend", tempistica: "20 giorni" },
    { nome: "Test e Debug", tempistica: "7 giorni" },
    { nome: "Consegna", tempistica: "2 giorni" },
  ],
  "sito vetrina": [
    { nome: "Analisi dei requisiti", tempistica: "3 giorni" },
    { nome: "Progettazione UX/UI", tempistica: "7 giorni" },
    { nome: "Sviluppo", tempistica: "10 giorni" },
    { nome: "Test e Debug", tempistica: "5 giorni" },
    { nome: "Consegna", tempistica: "2 giorni" },
  ],
  "web app": [
    { nome: "Analisi dei requisiti", tempistica: "7 giorni" },
    { nome: "Progettazione UX/UI", tempistica: "12 giorni" },
    { nome: "Sviluppo Moduli", tempistica: "20 giorni" },
    { nome: "Integrazione API", tempistica: "15 giorni" },
    { nome: "Test e Debug", tempistica: "10 giorni" },
    { nome: "Consegna", tempistica: "3 giorni" },
  ],
};

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
      dataInizio: new Date(dataInizioContratto), // Puoi calcolare date specifiche se necessario
      dataFine: new Date(dataInizioContratto), // Placeholder, da calcolare
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
      dataInizioContratto,
      dataFineContratto,
    });

    return new Response(JSON.stringify(nuovaCollaborazione), { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: error}), { status: 500 });
  }
}