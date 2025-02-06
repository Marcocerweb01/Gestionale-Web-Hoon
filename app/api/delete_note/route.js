import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";

export async function DELETE(req) {
  try {
    await connectToDB();

    const { id } = await req.json();

    // Elimina la nota
    const deletedNote = await Nota.findByIdAndDelete(id);

    if (!deletedNote) {
      return new Response(
        JSON.stringify({ message: "Nota non trovata" }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: "Nota eliminata", deletedNote }),
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
