import { connectToDB } from "@/utils/database";
import { updateSnapshot } from "@/utils/snapshotManager";
import Collaborazione from "@/models/Collaborazioni";

export async function DELETE(req, { params }) {
  try {
    await connectToDB();

    const { collaborazioneId } = params;

    // Elimina la collaborazione dal database
    const deletedCollaborazione = await Collaborazione.findByIdAndDelete(collaborazioneId);

    if (!deletedCollaborazione) {
      return new Response(JSON.stringify({ message: "Collaborazione non trovata" }), { status: 404 });
    }

    // Aggiorna automaticamente lo snapshot dopo l'eliminazione
    try {
      await updateSnapshot();
      console.log("Snapshot aggiornato dopo eliminazione collaborazione");
    } catch (snapshotError) {
      console.error("Errore aggiornamento snapshot:", snapshotError);
      // Non interrompiamo l'operazione se lo snapshot fallisce
    }

    return new Response(JSON.stringify({ message: "Collaborazione eliminata con successo" }), { status: 200 });
  } catch (error) {
    console.error("Errore durante l'eliminazione della collaborazione:", error);
    return new Response(JSON.stringify({ message: "Errore interno al server" }), { status: 500 });
  }
}