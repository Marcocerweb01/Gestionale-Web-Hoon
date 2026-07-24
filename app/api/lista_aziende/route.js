export const dynamic = "force-dynamic";

import { Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";

export async function GET(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("inactive") === "true";
    const filter = includeInactive
      ? {}
      : { $or: [{ status: "attivo" }, { status: { $exists: false } }] };

    const aziende = await Azienda.find(filter);

    const result = aziende.map((azienda) => ({
      id: azienda._id,
      nome: azienda.nome,
      etichetta: azienda.etichetta,
      email: azienda.email,
      partitaIva: azienda.partitaIva,
      status: azienda.status || "attivo",
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
