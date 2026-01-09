import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";

export async function POST(req) {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni
    const collaborazioni = await Collaborazione.find({});
    console.log(`📊 Trovate ${collaborazioni.length} collaborazioni`);

    // Per ogni collaborazione, conta gli appuntamenti del trimestre attuale
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Determina il primo mese del trimestre corrente (0=Gen, 3=Apr, 6=Lug, 9=Ott)
    const trimestreStart = Math.floor(currentMonth / 3) * 3;
    const primoGiornoTrimestre = new Date(currentYear, trimestreStart, 1);
    
    console.log(`📅 Trimestre: da ${primoGiornoTrimestre.toISOString()} a oggi`);

    let updated = 0;
    const results = [];

    for (const collab of collaborazioni) {
      // Conta gli appuntamenti nel trimestre
      const appuntamentiCount = await Nota.countDocuments({
        collaborazione: collab._id,
        tipo: "appuntamento",
        data_appuntamento: {
          $gte: primoGiornoTrimestre,
          $lte: today
        }
      });

      // Calcola i totali previsti nel trimestre (mesi già passati nel trimestre * app mensili)
      const mesiPassatiNelTrimestre = currentMonth - trimestreStart + 1;
      const appuntamentiTotaliTrimestre = (collab.numero_appuntamenti || 0) * mesiPassatiNelTrimestre;

      // Aggiorna la collaborazione
      await Collaborazione.findByIdAndUpdate(collab._id, {
        $set: {
          appuntamenti_trimestrale_fatti: appuntamentiCount,
          appuntamenti_trimestrale_totali: appuntamentiTotaliTrimestre
        }
      });

      results.push({
        azienda: collab.aziendaRagioneSociale,
        fatti: appuntamentiCount,
        totali: appuntamentiTotaliTrimestre
      });
      
      updated++;
    }

    console.log(`✅ Aggiornate ${updated} collaborazioni`);
    console.log('\n📋 Primi 10 risultati:');
    results.slice(0, 10).forEach(r => {
      console.log(`  ${r.azienda}: ${r.fatti}/${r.totali}`);
    });

    return new Response(
      JSON.stringify({
        message: "Sincronizzazione appuntamenti trimestrali completata",
        collaborazioniAggiornate: updated,
        trimestreInizio: primoGiornoTrimestre.toISOString(),
        esempi: results.slice(0, 10)
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nella sincronizzazione:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
