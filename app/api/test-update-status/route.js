import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    console.log("🔄 === TEST AGGIORNAMENTO STATUS ===");
    
    const { collaboratoreId, nuovoStatus } = await req.json();
    
    if (!collaboratoreId || !nuovoStatus) {
      return NextResponse.json({ 
        error: "ID collaboratore e nuovo status richiesti" 
      }, { status: 400 });
    }
    
    await connectToDB();
    console.log("✅ Database connesso");

    // 1. Status PRIMA dell'aggiornamento
    console.log(`\n🔍 STATUS PRIMA dell'aggiornamento:`);
    const collaboratorePrima = await Collaboratore.findById(collaboratoreId);
    console.log(`📊 Status attuale: "${collaboratorePrima.status}"`);
    console.log(`📊 Nome: ${collaboratorePrima.nome} ${collaboratorePrima.cognome}`);

    // 2. Esegue l'aggiornamento
    console.log(`\n🔄 AGGIORNAMENTO a: "${nuovoStatus}"`);
    const updatedUser = await Collaboratore.findByIdAndUpdate(
      collaboratoreId, 
      { status: nuovoStatus }, 
      {
        new: true,
        runValidators: true
      }
    );
    
    console.log(`✅ Aggiornamento completato`);
    console.log(`📊 Nuovo status: "${updatedUser.status}"`);

    // 3. Verifica DOPO l'aggiornamento
    console.log(`\n🔍 VERIFICA DOPO aggiornamento:`);
    const collaboratoreDopo = await Collaboratore.findById(collaboratoreId);
    console.log(`📊 Status verificato: "${collaboratoreDopo.status}"`);
    console.log(`📊 Status === 'attivo': ${collaboratoreDopo.status === 'attivo'}`);
    console.log(`📊 Status === 'non_attivo': ${collaboratoreDopo.status === 'non_attivo'}`);

    // 4. Test filtro dashboard
    console.log(`\n🏠 TEST FILTRO DASHBOARD:`);
    const tuttiCollaboratori = await Collaboratore.find().lean();
    const collaboratoriAttivi = tuttiCollaboratori.filter(c => c.status === 'attivo');
    const nelDashboard = collaboratoriAttivi.find(c => c._id.toString() === collaboratoreId);
    console.log(`🎯 Appare nel Dashboard: ${!!nelDashboard}`);

    // 5. Test API format
    console.log(`\n🔄 TEST FORMATO API:`);
    const resultAPI = tuttiCollaboratori.map((collab) => ({
      id: collab._id,
      nome: collab.nome,
      cognome: collab.cognome,
      status: collab.status || 'attivo',
    }));
    
    const collaboratoreAPI = resultAPI.find(c => c.id.toString() === collaboratoreId);
    console.log(`📡 Status in formato API: "${collaboratoreAPI.status}"`);
    console.log(`📡 Status API === 'attivo': ${collaboratoreAPI.status === 'attivo'}`);

    return NextResponse.json({
      success: true,
      aggiornamento: {
        prima: collaboratorePrima.status,
        dopo: collaboratoreDopo.status,
        richiesto: nuovoStatus
      },
      verifiche: {
        database: collaboratoreDopo.status,
        dashboard: !!nelDashboard,
        apiFormat: collaboratoreAPI.status
      },
      collaboratore: {
        id: updatedUser._id,
        nome: updatedUser.nome,
        cognome: updatedUser.cognome,
        status: updatedUser.status
      }
    });

  } catch (error) {
    console.error("❌ Errore test aggiornamento:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}