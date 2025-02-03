import { Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    await connectToDB();

    const aziende = await Azienda.find();

    const result = aziende.map((azienda) => ({
      id: azienda._id,
      nome: azienda.nome,
      etichetta: azienda.etichetta,
      email: azienda.email,
      partitaIva: azienda.partitaIva,
    }));

    // Imposta intestazioni no-cache
    const headers = new Headers({
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Errore durante il recupero delle aziende:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server" }),
      { status: 500 }
    );
  }
}
