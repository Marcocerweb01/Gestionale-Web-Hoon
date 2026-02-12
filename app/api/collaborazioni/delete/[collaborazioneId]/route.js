import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";

export async function DELETE(req, { params }) {
  try {
    const resolvedParams = await params;
    await connectToDB();

    const { collaborazioneId } = resolvedParams;

    // Elimina la collaborazione dal database
    const deletedCollaborazione = await Collaborazione.findByIdAndDelete(collaborazioneId);

    if (!deletedCollaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    console.log("✅ Collaborazione eliminata");

    return new Response(JSON.stringify({ message: "Collaborazione eliminata con successo" }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'eliminazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}