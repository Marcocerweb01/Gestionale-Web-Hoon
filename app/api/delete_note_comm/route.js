import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";

export async function DELETE(req){
  try {
    await connectToDB();

    const { id, userRole } = await req.json();

    // Verifica che l'utente sia un amministratore
    if (userRole !== "amministratore") {
      return new Response(JSON.stringify({ message: "Non autorizzato" }), {
        status: 403,
      });
    }

    // Elimina la nota
    const deletedNote = await NotaComm.findByIdAndDelete(id);
    if (!deletedNote) {
      return new Response(JSON.stringify({ message: "Nota non trovata" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify({ message: "Nota eliminata" }), {
      status: 200,
    });
  } catch (error) {
    console.error("Errore nell'eliminazione della nota:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
