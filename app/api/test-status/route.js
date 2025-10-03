import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("🔍 === TEST STATUS COLLABORATORI ===");
    
    await connectToDB();
    console.log("✅ Database connesso");

    // Test 1: Recupera tutti i collaboratori e verifica status
    const tuttiCollaboratori = await Collaboratore.find({}).select('nome cognome email status');
    console.log(`📊 Totale collaboratori nel database: ${tuttiCollaboratori.length}`);

    // Conta per status
    const attivi = tuttiCollaboratori.filter(c => c.status === 'attivo');
    const nonAttivi = tuttiCollaboratori.filter(c => c.status === 'non_attivo');
    const senzaStatus = tuttiCollaboratori.filter(c => !c.status);
    
    console.log(`🟢 Collaboratori attivi: ${attivi.length}`);
    console.log(`🔴 Collaboratori non attivi: ${nonAttivi.length}`);
    console.log(`⚪ Collaboratori senza status: ${senzaStatus.length}`);

    // Test 2: Mostra alcuni esempi
    console.log("\n📋 Esempi di collaboratori:");
    tuttiCollaboratori.slice(0, 5).forEach((collab, index) => {
      console.log(`${index + 1}. ${collab.nome} ${collab.cognome} - Status: ${collab.status || 'UNDEFINED'}`);
    });

    // Test 3: Simula il filtro della Lista-collaboratori
    const webDesigners = tuttiCollaboratori.filter(c => c.subRole === "web designer" && c.status === "attivo");
    const smms = tuttiCollaboratori.filter(c => c.subRole === "smm" && c.status === "attivo");
    const commercials = tuttiCollaboratori.filter(c => c.subRole === "commerciale" && c.status === "attivo");

    console.log("\n🎯 Filtro Lista-collaboratori:");
    console.log(`💻 Web Designers attivi: ${webDesigners.length}`);
    console.log(`📱 SMM attivi: ${smms.length}`);
    console.log(`💼 Commerciali attivi: ${commercials.length}`);

    // Test 4: Verifica API lista_collaboratori
    console.log("\n🌐 Test API lista_collaboratori...");
    const collaboratoriAPI = await Collaboratore.find().lean();
    const resultAPI = collaboratoriAPI.map((collaboratore) => ({
      id: collaboratore._id,
      nome: collaboratore.nome,
      cognome: collaboratore.cognome,
      email: collaboratore.email,
      subRole: collaboratore.subRole,
      partitaIva: collaboratore.partitaIva,
      status: collaboratore.status || 'attivo',
    }));
    
    console.log(`📡 API risultato: ${resultAPI.length} collaboratori`);
    console.log(`📡 API attivi: ${resultAPI.filter(c => c.status === 'attivo').length}`);

    return NextResponse.json({
      totaleCollaboratori: tuttiCollaboratori.length,
      attivi: attivi.length,
      nonAttivi: nonAttivi.length,
      senzaStatus: senzaStatus.length,
      webDesignersAttivi: webDesigners.length,
      smmsAttivi: smms.length,
      commercialiAttivi: commercials.length,
      tuttiCollaboratori: tuttiCollaboratori,
      resultAPI: resultAPI,
      message: "Test status completato"
    });

  } catch (error) {
    console.error("❌ Errore test status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}