import Nota from "@/models/Note";
import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import { createNotifica } from "@/utils/createNotifica";

export async function POST(req) {
  try {
    await connectToDB();

    const { nota, autoreId, autore, collaborazione, tipo, data_appuntamento, feeling_emoji, feeling_note } = await req.json();

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
      feeling_emoji: tipo === 'appuntamento' ? feeling_emoji : '',
      feeling_note: tipo === 'appuntamento' ? feeling_note : '',
    });

    await newNote.save();

    // Se è un problema, crea notifica per gli amministratori
    if (tipo === 'problema') {
      const collab = await Collaborazione.findById(collaborazione).lean();
      const clienteNome = collab?.aziendaRagioneSociale || 'cliente';
      await createNotifica({
        tipo: 'nota_problema',
        titolo: `Nota problema da ${autore}`,
        messaggio: `${autore} ha segnalato un problema per ${clienteNome}: "${nota.substring(0, 80)}${nota.length > 80 ? '…' : ''}"`,
        link: `/Feed-2/${autoreId}`,
        refId: newNote._id.toString(),
      });
    }

    // Se è un appuntamento, incrementa appuntamenti_fatti, appuntamenti_totali E appuntamenti_trimestrale_fatti
    if (tipo === 'appuntamento') {
      await Collaborazione.findByIdAndUpdate(
        collaborazione,
        { $inc: { appuntamenti_fatti: 1, appuntamenti_totali: 1, appuntamenti_trimestrale_fatti: 1 } }
      );
      console.log(`✅ Incrementato appuntamenti_fatti, appuntamenti_totali e appuntamenti_trimestrale_fatti per collaborazione ${collaborazione}`);
    }

    return new Response(JSON.stringify({ message: "Nota creata con successo", newNote }), { status: 201 });
  } catch (error) {
    console.error("Errore nella creazione della nota:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}
