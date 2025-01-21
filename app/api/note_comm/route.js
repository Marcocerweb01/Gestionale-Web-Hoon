import NotaComm from "@/models/Note-comm";
import { connectToDB } from "@/utils/database";

export async function POST(req) {
  try {
    await connectToDB();

    // Estrai i dati dalla richiesta
    const {
      mainCategoria,
      tipoContatto,
      comeArrivato,
      referal,
      nomeAzienda,
      luogo,
      indirizzo,
      numeroTelefono,
      referente,
      nota,
      autoreId,
      autore,
      data_appuntamento,
    } = await req.json();

    // Validazione dei dati principali
    if (!mainCategoria || !nota || !autoreId || !autore) {
      return new Response(
        JSON.stringify({ message: "Dati mancanti o non validi" }),
        { status: 400 }
      );
    }

    if (comeArrivato === "referal" && !referal) {
      return new Response(
        JSON.stringify({ message: "Il nome del referral è obbligatorio." }),
        { status: 400 }
      );
    }

    // Creazione dei dati della nuova nota
    const newNoteData = {
      mainCategoria,
      tipoContatto: mainCategoria === "contatto" ? tipoContatto : undefined,
      comeArrivato: mainCategoria === "contatto" ? comeArrivato : undefined,
      referal: comeArrivato === "referal" ? referral : undefined,
      nomeAzienda: mainCategoria === "contatto" ? nomeAzienda : undefined,
      luogo: mainCategoria === "contatto" ? luogo : undefined,
      indirizzo: mainCategoria === "contatto" ? indirizzo : undefined,
      numeroTelefono: mainCategoria === "contatto" ? numeroTelefono : undefined,
      referente: mainCategoria === "contatto" ? referente : undefined,
      nota,
      autoreId,
      autore,
      data_appuntamento:
        mainCategoria === "appuntamento" ? data_appuntamento : undefined,
    };

    // Rimuovi i campi undefined
    Object.keys(newNoteData).forEach((key) => {
      if (newNoteData[key] === undefined) {
        delete newNoteData[key];
      }
    });

    // Creazione della nuova nota
    const newNote = new NotaComm(newNoteData);
    await newNote.save();

    return new Response(
      JSON.stringify({ message: "Nota creata con successo", newNote }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
