import NotaComm from "@/models/Note-comm";
import { connectToDB } from "@/utils/database";

export async function POST(req) {
  try {
    await connectToDB();

    const { nota, autoreId, autore, tipo, data_appuntamento } = await req.json();

    if (!nota || !autore || !tipo) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    const newNote = new NotaComm({
      nota,
      autoreId,
      autore,
      tipo,
      data_appuntamento: tipo === 'appuntamento' ? data_appuntamento : null,
    });

    await newNote.save();

    return new Response(JSON.stringify({ message: "Nota creata con successo", newNote }), { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}