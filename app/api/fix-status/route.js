import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 === PULIZIA STATUS COLLABORATORI ===");
    
    await connectToDB();
    console.log("✅ Database connesso");

    // 1. Trova tutti i collaboratori
    const tuttiCollaboratori = await Collaboratore.find({});
    console.log(`📊 Totale collaboratori: ${tuttiCollaboratori.length}`);

    // 2. Analizza status
    const senzaStatus = tuttiCollaboratori.filter(c => !c.status);
    const conStatusVuoto = tuttiCollaboratori.filter(c => c.status === '');
    const conStatusNull = tuttiCollaboratori.filter(c => c.status === null);
    const conStatusUndefined = tuttiCollaboratori.filter(c => c.status === undefined);
    const conStatusAttivo = tuttiCollaboratori.filter(c => c.status === 'attivo');
    const conStatusNonAttivo = tuttiCollaboratori.filter(c => c.status === 'non_attivo');

    console.log(`🔍 Senza status (falsy): ${senzaStatus.length}`);
    console.log(`🔍 Status vuoto (''): ${conStatusVuoto.length}`);
    console.log(`🔍 Status null: ${conStatusNull.length}`);
    console.log(`🔍 Status undefined: ${conStatusUndefined.length}`);
    console.log(`🟢 Status 'attivo': ${conStatusAttivo.length}`);
    console.log(`🔴 Status 'non_attivo': ${conStatusNonAttivo.length}`);

    // 3. Correggi collaboratori senza status
    if (senzaStatus.length > 0) {
      console.log(`\n🔧 Correggendo ${senzaStatus.length} collaboratori senza status...`);
      
      const risultatoCorrezione = await Collaboratore.updateMany(
        { $or: [
          { status: { $exists: false } },
          { status: null },
          { status: '' }
        ]},
        { $set: { status: 'attivo' } }
      );
      
      console.log(`✅ Corretti ${risultatoCorrezione.modifiedCount} collaboratori`);
    }

    // 4. Verifica dopo correzione
    const dopoCorrezione = await Collaboratore.find({});
    const attiviDopo = dopoCorrezione.filter(c => c.status === 'attivo').length;
    const nonAttiviDopo = dopoCorrezione.filter(c => c.status === 'non_attivo').length;
    
    console.log(`\n📊 DOPO CORREZIONE:`);
    console.log(`🟢 Attivi: ${attiviDopo}`);
    console.log(`🔴 Non attivi: ${nonAttiviDopo}`);

    // 5. Lista dettagliata
    console.log(`\n📋 LISTA DETTAGLIATA:`);
    dopoCorrezione.forEach((collab, index) => {
      console.log(`${index + 1}. ${collab.nome} ${collab.cognome} - Status: "${collab.status}" (${typeof collab.status})`);
    });

    return NextResponse.json({
      success: true,
      prima: {
        totale: tuttiCollaboratori.length,
        senzaStatus: senzaStatus.length,
        attivi: conStatusAttivo.length,
        nonAttivi: conStatusNonAttivo.length
      },
      dopo: {
        attivi: attiviDopo,
        nonAttivi: nonAttiviDopo,
        corretti: senzaStatus.length
      },
      collaboratori: dopoCorrezione.map(c => ({
        id: c._id,
        nome: c.nome + ' ' + c.cognome,
        status: c.status,
        statusType: typeof c.status
      }))
    });

  } catch (error) {
    console.error("❌ Errore pulizia status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}