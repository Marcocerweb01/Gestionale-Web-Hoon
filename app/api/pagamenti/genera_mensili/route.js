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

    // Calcola inizio e fine del mese corrente
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Data fattura: primo giorno del mese corrente
    const dataFattura = new Date();
    dataFattura.setDate(1);
    dataFattura.setHours(0, 0, 0, 0);

    const pagamentiCreati = [];
    for (const collab of collaborazioni) {
      // Controlla se esiste GIÀ un pagamento per questo cliente nel mese corrente
      const esiste = await Pagamenti.findOne({
        cliente: collab.azienda._id,
        data_fattura: { $gte: startOfMonth, $lte: endOfMonth },
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

    return new Response(JSON.stringify({ 
      message: `Creati ${pagamentiCreati.length} nuovi pagamenti`,
      pagamentiCreati 
    }), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
}