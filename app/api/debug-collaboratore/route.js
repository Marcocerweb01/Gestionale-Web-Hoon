import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    console.log("🔍 === DEBUG COLLABORATORE SPECIFICO ===");
    
    const { searchParams } = new URL(req.url);
    const collaboratoreId = searchParams.get('id') || "68d2adb877148cdfdc2540e8";
    
    await connectToDB();
    console.log("✅ Database connesso");
    console.log(`🔍 Cercando collaboratore: ${collaboratoreId}`);

    // 1. Trova il collaboratore
    const collaboratore = await Collaboratore.findById(collaboratoreId);
    
    if (!collaboratore) {
      console.log("❌ Collaboratore non trovato");
      return NextResponse.json({ error: "Collaboratore non trovato" }, { status: 404 });
    }
    
    console.log(`📊 Collaboratore: ${collaboratore.nome} ${collaboratore.cognome}`);
    console.log(`📊 Status: "${collaboratore.status}" (${typeof collaboratore.status})`);
    console.log(`📊 SubRole: "${collaboratore.subRole}"`);
    console.log(`📊 Status === 'attivo': ${collaboratore.status === 'attivo'}`);
    console.log(`📊 Status === 'non_attivo': ${collaboratore.status === 'non_attivo'}`);

    // 2. Test filtri come nel codice reale
    const isStatusAttivo = collaboratore.status === 'attivo';
    const isSubRoleValido = ['web designer', 'smm', 'commerciale'].includes(collaboratore.subRole);
    
    console.log(`🎯 Passa filtro status attivo: ${isStatusAttivo}`);
    console.log(`🎯 Passa filtro subrole: ${isSubRoleValido}`);

    // 3. Test API lista_collaboratori
    const tutti = await Collaboratore.find().lean();
    const mappedAPI = tutti.map((collab) => ({
      id: collab._id,
      nome: collab.nome,
      cognome: collab.cognome,
      email: collab.email,
      subRole: collab.subRole,
      partitaIva: collab.partitaIva,
      status: collab.status || 'attivo', // ⚠️ Questa logica potrebbe causare problemi
    }));
    
    const collaboratoreAPI = mappedAPI.find(c => c.id.toString() === collaboratoreId);
    console.log(`📡 Status API mapping: "${collaboratoreAPI.status}"`);
    
    // 4. Test filtri Dashboard
    const collaboratoriAttivi = mappedAPI.filter(collab => collab.status === 'attivo');
    const nelDashboard = collaboratoriAttivi.find(c => c.id.toString() === collaboratoreId);
    console.log(`🏠 Appare nel Dashboard: ${!!nelDashboard}`);

    // 5. Test filtri Lista-collaboratori
    const webDesignersAttivi = mappedAPI.filter(c => c.subRole === "web designer" && c.status === "attivo");
    const smmsAttivi = mappedAPI.filter(c => c.subRole === "smm" && c.status === "attivo");
    const commercialiAttivi = mappedAPI.filter(c => c.subRole === "commerciale" && c.status === "attivo");
    
    const inWebDesigner = webDesignersAttivi.find(c => c.id.toString() === collaboratoreId);
    const inSmm = smmsAttivi.find(c => c.id.toString() === collaboratoreId);
    const inCommerciale = commercialiAttivi.find(c => c.id.toString() === collaboratoreId);
    
    console.log(`💻 In Web Designer attivi: ${!!inWebDesigner}`);
    console.log(`📱 In SMM attivi: ${!!inSmm}`);
    console.log(`💼 In Commerciali attivi: ${!!inCommerciale}`);

    return NextResponse.json({
      collaboratore: {
        id: collaboratore._id,
        nome: collaboratore.nome,
        cognome: collaboratore.cognome,
        statusRaw: collaboratore.status,
        statusType: typeof collaboratore.status,
        subRole: collaboratore.subRole
      },
      verifiche: {
        statusAttivo: isStatusAttivo,
        subRoleValido: isSubRoleValido,
        apiMapping: collaboratoreAPI.status,
        dashboard: !!nelDashboard,
        listaCollaboratori: {
          webDesigner: !!inWebDesigner,
          smm: !!inSmm,
          commerciale: !!inCommerciale
        }
      },
      conteggi: {
        totaliDB: tutti.length,
        totaliAPI: mappedAPI.length,
        attiviAPI: collaboratoriAttivi.length,
        webDesignersAttivi: webDesignersAttivi.length,
        smmsAttivi: smmsAttivi.length,
        commercialiAttivi: commercialiAttivi.length
      }
    });

  } catch (error) {
    console.error("❌ Errore debug:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}