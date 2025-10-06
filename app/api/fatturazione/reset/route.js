import Fatturazione from "@/models/Fatturazione";
import { connectToDB } from "@/utils/database";

export async function DELETE(req) {
  try {
    await connectToDB();

    // Elimina TUTTE le fatture
    const result = await Fatturazione.deleteMany({});

    console.log(`🗑️ Eliminate ${result.deletedCount} fatture`);

    return new Response(
      JSON.stringify({
        message: "Tutte le fatture sono state eliminate",
        fatture_eliminate: result.deletedCount
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore durante l'eliminazione delle fatture:", error);
    return new Response(
      JSON.stringify({ 
        message: "Errore interno al server",
        error: error.message 
      }),
      { status: 500 }
    );
  }
}
