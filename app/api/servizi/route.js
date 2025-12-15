import { connectToDB } from "@/utils/database";
import { Servizio } from "@/models/PagamentiNuovi";
import { NextResponse } from "next/server";

// Servizi default
const SERVIZI_DEFAULT = [
  "Sito Web",
  "Social Media",
  "Brand Identity",
  "Gestione Sito",
  "Dominio e Hosting",
  "Evento",
  "Gestionale",
  "Video Making",
  "Servizio Fotografico"
];

// GET - Recupera tutti i servizi
export const GET = async (request) => {
  try {
    await connectToDB();

    let servizi = await Servizio.find({ attivo: true }).sort({ nome: 1 });

    // Se non ci sono servizi, crea quelli default
    if (servizi.length === 0) {
      const serviziDefault = SERVIZI_DEFAULT.map(nome => ({
        nome,
        attivo: true
      }));
      
      await Servizio.insertMany(serviziDefault);
      servizi = await Servizio.find({ attivo: true }).sort({ nome: 1 });
    }

    return NextResponse.json(servizi, { status: 200 });
  } catch (error) {
    console.error("Errore GET servizi:", error);
    return NextResponse.json(
      { error: "Errore nel recupero dei servizi" },
      { status: 500 }
    );
  }
};

// POST - Aggiungi nuovo servizio
export const POST = async (request) => {
  try {
    await connectToDB();

    const { nome } = await request.json();

    if (!nome) {
      return NextResponse.json(
        { error: "Nome servizio richiesto" },
        { status: 400 }
      );
    }

    // Verifica se esiste già
    const esistente = await Servizio.findOne({ nome });
    if (esistente) {
      return NextResponse.json(
        { error: "Servizio già esistente" },
        { status: 400 }
      );
    }

    const nuovoServizio = new Servizio({
      nome,
      attivo: true
    });

    await nuovoServizio.save();

    return NextResponse.json(nuovoServizio, { status: 201 });
  } catch (error) {
    console.error("Errore POST servizio:", error);
    return NextResponse.json(
      { error: "Errore nella creazione del servizio" },
      { status: 500 }
    );
  }
};
