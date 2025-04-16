import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign.js";
import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore } from "@/models/User";
import mongoose from "mongoose";

const timelineECommerce = [
  { nome: "Analisi dei requisiti", completata: false },
  { nome: "Progettazione UX/UI", completata: false },
  { nome: "Sviluppo Frontend", completata: false },
  { nome: "Sviluppo Backend", completata: false },
  { nome: "Test e Debug", completata: false },
  { nome: "Consegna", completata: false },
];

const timelineSitoVetrina = [
  { nome: "Analisi dei requisiti", completata: false },
  { nome: "Progettazione UX/UI", completata: false },
  { nome: "Sviluppo", completata: false },
  { nome: "Test e Debug", completata: false },
  { nome: "Consegna", completata: false },
];

const timelineWebApp = [
  { nome: "Analisi dei requisiti", completata: false },
  { nome: "Progettazione UX/UI", completata: false },
  { nome: "Sviluppo Moduli", completata: false },
  { nome: "Integrazione API", completata: false },
  { nome: "Test e Debug", completata: false },
  { nome: "Consegna", completata: false },
];

export async function POST(req) {
  console.log("Inizio API chiamata");
  try {
    await connectToDB();
    console.log("Connessione al database riuscita");

    const { clienteId, webDesignerId, note, tipoProgetto,  } = await req.json();
    console.log("Corpo della richiesta:", { clienteId, webDesignerId, tipoProgetto, note });

    if (!tipoProgetto || !clienteId || !webDesignerId) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    // Seleziona la timeline in base al tipo di progetto
    let fasiProgetto;
    switch (tipoProgetto) {
      case "e-commerce":
        fasiProgetto = timelineECommerce;
        break;
      case "sito vetrina":
        fasiProgetto = timelineSitoVetrina;
        break;
      case "web app":
        fasiProgetto = timelineWebApp;
        break;
      default:
        return new Response(JSON.stringify({ message: "Tipo di progetto non valido" }), { status: 400 });
    }

    // Recupera i dati di azienda e collaboratore
    const azienda = await Azienda.findById(clienteId);
    const collaboratore = await Collaboratore.findById(webDesignerId);

    if (!azienda || !collaboratore) {
      return new Response(JSON.stringify({ message: "Azienda o collaboratore non trovati" }), { status: 404 });
    }

    // Crea la nuova collaborazione
    const nuovaCollaborazione = await CollaborazioneWebDesign.create({
      tipoProgetto,
      cliente: clienteId,
      webDesigner: webDesignerId,
      aziendaRagioneSociale: azienda.ragioneSociale,
      collaboratoreNome: collaboratore.nome,
      collaboratoreCognome: collaboratore.cognome,
      faseAttuale: 0,
      fasiProgetto,
      note,
    });

    return new Response(JSON.stringify(nuovaCollaborazione), { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}