import { connectToDB } from "@/utils/database";
import Collaborazione from "@/models/Collaborazioni";
import Nota from "@/models/Note";

export async function POST(req) {
  try {
    await connectToDB();

    // Recupera tutte le collaborazioni
    const collaborazioni = await Collaborazione.find({});
    console.log(`📊 Trovate ${collaborazioni.length} collaborazioni`);

    let migrated = 0;
    const results = [];

    for (const collab of collaborazioni) {
      // I vecchi post_totali e appuntamenti_totali erano i PREVISTI
      // Li spostiamo nei nuovi campi _previsti
      const postTotaliPrevisti = collab.post_totali || 0;
      const appuntamentiTotaliPrevisti = collab.appuntamenti_totali || 0;

      // Calcoliamo i FATTI contando effettivamente dal database
      // Per i post: somma di tutti i post_*_fatti attuali (che non sono mai stati azzerati nel vecchio sistema)
      // Per ora usiamo i valori mensili come base (potrebbero non essere accurati)
      const postFatti = (collab.post_ig_fb_fatti || 0) + (collab.post_tiktok_fatti || 0) + (collab.post_linkedin_fatti || 0);
      
      // Per gli appuntamenti: contiamo tutte le note di tipo appuntamento per questa collaborazione
      const appuntamentiFatti = await Nota.countDocuments({
        collaborazione: collab._id,
        tipo: "appuntamento"
      });

      // Aggiorna la collaborazione
      await Collaborazione.findByIdAndUpdate(collab._id, {
        $set: {
          // Sposta i vecchi totali come previsti
          post_totali_previsti: postTotaliPrevisti,
          appuntamenti_totali_previsti: appuntamentiTotaliPrevisti,
          // Imposta i fatti calcolati
          post_totali: postFatti,
          appuntamenti_totali: appuntamentiFatti
        }
      });

      results.push({
        azienda: collab.aziendaRagioneSociale,
        post_fatti: postFatti,
        post_previsti: postTotaliPrevisti,
        app_fatti: appuntamentiFatti,
        app_previsti: appuntamentiTotaliPrevisti
      });
      
      migrated++;
    }

    console.log(`✅ Migrate ${migrated} collaborazioni`);
    console.log('\n📋 Primi 10 risultati:');
    results.slice(0, 10).forEach(r => {
      console.log(`  ${r.azienda}: Post ${r.post_fatti}/${r.post_previsti}, App ${r.app_fatti}/${r.app_previsti}`);
    });

    return new Response(
      JSON.stringify({
        message: "Migrazione totali completata",
        collaborazioniMigrate: migrated,
        note: "I vecchi post_totali/appuntamenti_totali sono stati spostati in _previsti, i nuovi _totali contengono i fatti effettivi",
        esempi: results.slice(0, 10)
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Errore nella migrazione:", error);
    return new Response(
      JSON.stringify({ message: "Errore interno al server", error: error.message }),
      { status: 500 }
    );
  }
}
