import { connectToDB } from "@/utils/database";
import Nota from "@/models/Note";

export async function PUT(req) {
  try {
    await connectToDB();

    const { id, updatedData } = await req.json();

    // Aggiorna la nota
    const updatedNote = await Nota.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    if (!updatedNote) {
      return new Response(JSON.stringify({ message: "Nota non trovata" }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({ message: "Nota aggiornata", updatedNote }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Errore nell'aggiornamento della nota:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
