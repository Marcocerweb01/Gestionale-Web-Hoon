import Nota from "@/models/Note";
import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";

export async function POST(req) {
  try {
    await connectToDB();

    const { nota, autoreId, autore, collaborazione, tipo, data_appuntamento } = await req.json();

    if (!nota || !autore || !collaborazione || !tipo) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }

    const newNote = new Nota({
      nota,
      autoreId,
      autore,
      collaborazione,
      tipo,
      data_appuntamento: tipo === 'appuntamento' ? data_appuntamento : null,
    });

    await newNote.save();

    // Se è un appuntamento, incrementa appuntamenti_fatti nella collaborazione
    if (tipo === 'appuntamento') {
      await Collaborazione.findByIdAndUpdate(
        collaborazione,
        { $inc: { appuntamenti_fatti: 1 } }
      );
      console.log(`✅ Incrementato appuntamenti_fatti per collaborazione ${collaborazione}`);
    }

    return new Response(JSON.stringify({ message: "Nota creata con successo", newNote }), { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
