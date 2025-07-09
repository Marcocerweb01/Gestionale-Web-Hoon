import Pagamenti from "@/models/Pagamenti";
import Collaborazione from "@/models/Collaborazioni";
import { connectToDB } from "@/utils/database";

export async function POST() {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni attive ESCLUDENDO il collaboratore specificato
    const collaborazioni = await Collaborazione.find({
      stato: "attiva",
      collaboratore: { $ne: "686be44dc04a68e29f1770f3" },
    }).populate("azienda");

    // Primo giorno del mese corrente
    const dataFattura = new Date();
    dataFattura.setDate(1);
    dataFattura.setHours(0, 0, 0, 0);

    const pagamentiCreati = [];
    for (const collab of collaborazioni) {
      // Evita duplicati: controlla se già esiste un pagamento per questo cliente e mese
      const esiste = await Pagamenti.findOne({
        cliente: collab.azienda._id,
        data_fattura: dataFattura,
      });
      if (!esiste) {
        const pagamento = await Pagamenti.create({
          cliente: collab.azienda._id,
          data_fattura: dataFattura,
          stato: "no",
        });
        pagamentiCreati.push(pagamento);
      }
    }

    return new Response(JSON.stringify({ pagamentiCreati }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}