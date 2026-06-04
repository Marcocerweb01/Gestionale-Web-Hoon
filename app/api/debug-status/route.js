import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("🔍 === DEBUG STATUS COLLABORATORE ===");
    
    const { collaboratoreId } = await req.json();
    
    if (!collaboratoreId) {
      return NextResponse.json({ error: "ID collaboratore richiesto" }, { status: 400 });
    }
    
    await connectToDB();
    console.log("✅ Database connesso");

    // 1. Recupera il collaboratore direttamente dal database
    console.log(`🔍 Cercando collaboratore con ID: ${collaboratoreId}`);
    const collaboratore = await Collaboratore.findById(collaboratoreId);
    
    if (!collaboratore) {
      console.log("❌ Collaboratore non trovato");
      return NextResponse.json({ error: "Collaboratore non trovato" }, { status: 404 });
    }
    
    console.log(`📊 Collaboratore trovato: ${collaboratore.nome} ${collaboratore.cognome}`);
    console.log(`📊 Status nel DB: "${collaboratore.status}"`);
    console.log(`📊 Status type: ${typeof collaboratore.status}`);
    console.log(`📊 Status === 'attivo': ${collaboratore.status === 'attivo'}`);
    console.log(`📊 Status === 'non_attivo': ${collaboratore.status === 'non_attivo'}`);

    // 2. Testa la query dell'API lista_collaboratori
    console.log("\n🌐 Test query API lista_collaboratori...");
    const tuttiCollaboratori = await Collaboratore.find().lean();
    const collaboratoreInLista = tuttiCollaboratori.find(c => c._id.toString() === collaboratoreId);
    
    if (collaboratoreInLista) {
      console.log(`📋 Status in lista: "${collaboratoreInLista.status}"`);
      console.log(`📋 Status in lista type: ${typeof collaboratoreInLista.status}`);
      console.log(`📋 Status in lista === 'attivo': ${collaboratoreInLista.status === 'attivo'}`);
    }

    // 3. Testa il filtro del Dashboard
    console.log("\n🏠 Test filtro Dashboard...");
    const collaboratoriAttivi = tuttiCollaboratori.filter(c => c.status === 'attivo');
    const collaboratoreAttivoNelDashboard = collaboratoriAttivi.find(c => c._id.toString() === collaboratoreId);
    console.log(`🎯 Collaboratore appare nel Dashboard: ${!!collaboratoreAttivoNelDashboard}`);

    // 4. Testa il filtro Lista-collaboratori 
    console.log("\n📋 Test filtro Lista-collaboratori...");
    const webDesignersAttivi = tuttiCollaboratori.filter(c => c.subRole === "web designer" && c.status === "attivo");
    const smmsAttivi = tuttiCollaboratori.filter(c => c.subRole === "smm" && c.status === "attivo");
    const commercialiAttivi = tuttiCollaboratori.filter(c => c.subRole === "commerciale" && c.status === "attivo");
    
    const inWebDesigner = webDesignersAttivi.find(c => c._id.toString() === collaboratoreId);
    const inSmm = smmsAttivi.find(c => c._id.toString() === collaboratoreId);
    const inCommerciale = commercialiAttivi.find(c => c._id.toString() === collaboratoreId);
    
    console.log(`💻 Appare in Web Designer attivi: ${!!inWebDesigner}`);
    console.log(`📱 Appare in SMM attivi: ${!!inSmm}`);
    console.log(`💼 Appare in Commerciale attivi: ${!!inCommerciale}`);

    // 5. Test del mapping API
    console.log("\n🔄 Test mapping API result...");
    const resultAPI = tuttiCollaboratori.map((collab) => ({
      id: collab._id,
      nome: collab.nome,
      cognome: collab.cognome,
      email: collab.email,
      subRole: collab.subRole,
      partitaIva: collab.partitaIva,
      status: collab.status || 'attivo', // ✨ Questa è la logica dell'API
    }));
    
    const collaboratoreAPI = resultAPI.find(c => c.id.toString() === collaboratoreId);
    if (collaboratoreAPI) {
      console.log(`🔄 Status dopo mapping API: "${collaboratoreAPI.status}"`);
      console.log(`🔄 Status dopo mapping === 'attivo': ${collaboratoreAPI.status === 'attivo'}`);
    }

    return NextResponse.json({
      success: true,
      collaboratore: {
        id: collaboratore._id,
        nome: collaboratore.nome,
        cognome: collaboratore.cognome,
        statusRaw: collaboratore.status,
        statusType: typeof collaboratore.status,
        statusAttivo: collaboratore.status === 'attivo'
      },
      dashboard: !!collaboratoreAttivoNelDashboard,
      listaCollaboratori: {
        webDesigner: !!inWebDesigner,
        smm: !!inSmm,
        commerciale: !!inCommerciale
      },
      apiMapping: collaboratoreAPI
    });

  } catch (error) {
    console.error("❌ Errore debug status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}