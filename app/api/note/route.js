import Nota from "@/models/Note";
import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";
import { createNotifica } from "@/utils/createNotifica";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["amministratore", "collaboratore"].includes(session.user.role)) {
      return new Response(JSON.stringify({ message: "Non autorizzato" }), { status: 403 });
    }

    await connectToDB();

    const { nota, collaborazione, tipo, data_appuntamento, feeling_emoji, feeling_note } = await req.json();

    if (!nota || !collaborazione || !tipo) {
      return new Response(JSON.stringify({ message: "Dati mancanti" }), { status: 400 });
    }
    if (tipo === 'appuntamento' && !feeling_emoji) {
      return new Response(JSON.stringify({ message: "L'emoji del Feeling Report è obbligatoria per gli appuntamenti" }), { status: 400 });
    }

    const sessionAuthorId = session.user.id;
    const sessionAuthorName = [session.user.nome, session.user.cognome]
      .filter(Boolean)
      .join(" ")
      .trim() || session.user.email || "Utente";

    const newNote = new Nota({
      nota,
      autoreId: sessionAuthorId,
      autore: sessionAuthorName,
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
      const collaboratoreId = collab?.collaboratore?.toString() || sessionAuthorId;
      const feedLink = `/Feed-2/${encodeURIComponent(collaboratoreId)}?collaborazioneId=${encodeURIComponent(collaborazione)}&notaId=${encodeURIComponent(newNote._id.toString())}`;
      await createNotifica({
        tipo: 'nota_problema',
        titolo: `Nota problema da ${sessionAuthorName}`,
        messaggio: `${sessionAuthorName} ha segnalato un problema per ${clienteNome}: "${nota.substring(0, 80)}${nota.length > 80 ? '…' : ''}"`,
        link: feedLink,
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
