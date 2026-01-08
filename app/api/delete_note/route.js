import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";
import Collaborazione from "@/models/Collaborazioni";

export async function DELETE(req) {
  try {
    await connectToDB();

    const { id } = await req.json();

    // Prima recupera la nota per sapere il tipo
    const nota = await Nota.findById(id);
    
    if (!nota) {
      return new Response(
        JSON.stringify({ message: "Nota non trovata" }),
        { status: 404 }
      );
    }

    // Se è un appuntamento, decrementa i contatori
    if (nota.tipo === 'appuntamento') {
      await Collaborazione.findByIdAndUpdate(
        nota.collaborazione,
        { $inc: { appuntamenti_fatti: -1, appuntamenti_totali: -1, appuntamenti_trimestrale_fatti: -1 } }
      );
      console.log(`✅ Decrementato appuntamenti_fatti, appuntamenti_totali e appuntamenti_trimestrale_fatti per collaborazione ${nota.collaborazione}`);
    }

    // Elimina la nota
    await Nota.findByIdAndDelete(id);

    return new Response(
      JSON.stringify({ message: "Nota eliminata", deletedNote: nota }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nella cancellazione della nota:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
