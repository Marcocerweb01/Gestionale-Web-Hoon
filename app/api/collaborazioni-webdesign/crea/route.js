import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign.js";
import { connectToDB } from "@/utils/database";
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
    console.log("api chiamata")
  try {
    await connectToDB();

    const { clienteId, webDesignerId, tipoProgetto, note } = await req.json();
    console.log("Da api", tipoProgetto, clienteId, webDesignerId )
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

    const nuovaCollaborazione = await CollaborazioneWebDesign.create({
      tipoProgetto,
      cliente: clienteId,
      webDesigner: webDesignerId,
      aziendaRagioneSociale: clienteId,
      collaboratoreNome: webDesignerId,
      collaboratoreCognome: webDesignerId,
      faseAttuale: 0,
      fasiProgetto,
      note,
      fasiProgettoCompletate: 0,
    });

    return new Response(JSON.stringify(nuovaCollaborazione), { status: 201 });
  } catch (error) {
    console.error("Errore durante la creazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}