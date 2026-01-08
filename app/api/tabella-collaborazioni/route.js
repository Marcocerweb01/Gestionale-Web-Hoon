import Collaborazione from "@/models/Collaborazioni";
import { Collaboratore, Azienda } from "@/models/User";
import { connectToDB } from "@/utils/database";
import { NextResponse } from "next/server";

// Disabilita completamente la cache per questa route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectToDB();

    console.log("🔄 Inizio recupero dati tabella collaborazioni...");

    // Recupera tutti i collaboratori attivi (senza filtri sui ruoli)
    const collaboratori = await Collaboratore.find({ 
      $or: [
        { status: "attivo" },
        { status: { $exists: false } }, // Includi anche quelli senza status
        { status: null }
      ]
    })
    .sort({ nome: 1, cognome: 1 })
    .lean();

    console.log(`📋 Trovati ${collaboratori.length} collaboratori totali`);
    
    // Log dei ruoli per debug
    const ruoli = collaboratori.reduce((acc, c) => {
      acc[c.subRole] = (acc[c.subRole] || 0) + 1;
      return acc;
    }, {});
    console.log("👥 Distribuzione ruoli:", ruoli);

    // Per ogni collaboratore, recupera le sue collaborazioni
    const collaboratoriConCollaborazioni = await Promise.all(
      collaboratori.map(async (collaboratore) => {
        try {
          console.log(`🔍 Cerco collaborazioni per ${collaboratore.nome} ${collaboratore.cognome} (${collaboratore.subRole})`);
          
          // Trova tutte le collaborazioni del collaboratore (attive e non)
          const collaborazioni = await Collaborazione.find({ 
            collaboratore: collaboratore._id
          })
          .populate("azienda", "etichetta ragioneSociale email") // Popola solo i campi necessari
          .lean();

          console.log(`  ✅ Trovate ${collaborazioni.length} collaborazioni per ${collaboratore.nome}`);

          // Trasforma i dati per il frontend
          const collaborazioniFormatted = collaborazioni.map((collab) => {
            const aziendaNome = collab.azienda?.etichetta || 
                              collab.azienda?.ragioneSociale || 
                              collab.aziendaRagioneSociale || // Fallback al campo diretto
                              "Nome non disponibile";
            
            return {
              id: collab._id,
              aziendaNome: aziendaNome,
              aziendaEmail: collab.azienda?.email || "Email non disponibile",
              numero_appuntamenti: collab.numero_appuntamenti || 0,
              post_ig_fb: collab.post_ig_fb || 0,
              post_ig_fb_fatti: collab.post_ig_fb_fatti || 0,
              post_tiktok: collab.post_tiktok || 0,
              post_tiktok_fatti: collab.post_tiktok_fatti || 0,
              post_linkedin: collab.post_linkedin || 0,
              post_linkedin_fatti: collab.post_linkedin_fatti || 0,
              note: collab.note || "",
              stato: collab.stato || "attiva",
              createdAt: collab.createdAt,
              // Nuovi campi totali (non si azzerano mai)
              post_totali: collab.post_totali || 0,
              appuntamenti_totali: collab.appuntamenti_totali || 0,
              durata_contratto: collab.durata_contratto || null,
              data_inizio_contratto: collab.data_inizio_contratto || null,
              data_fine_contratto: collab.data_fine_contratto || null,
            };
          });

          return {
            id: collaboratore._id,
            nome: collaboratore.nome,
            cognome: collaboratore.cognome,
            email: collaboratore.email,
            subRole: collaboratore.subRole,
            status: collaboratore.status || "attivo", // Default a attivo se non specificato
            collaborazioni: collaborazioniFormatted
          };
          
        } catch (error) {
          console.error(`❌ Errore nel recupero collaborazioni per ${collaboratore.nome}:`, error);
          
          // In caso di errore, restituisci il collaboratore senza collaborazioni
          return {
            id: collaboratore._id,
            nome: collaboratore.nome,
            cognome: collaboratore.cognome,
            email: collaboratore.email,
            subRole: collaboratore.subRole,
            status: collaboratore.status || "attivo",
            collaborazioni: []
          };
        }
      })
    );

    // Statistiche finali
    const totaleCollaboratori = collaboratoriConCollaborazioni.length;
    const totaleCollaborazioni = collaboratoriConCollaborazioni.reduce((acc, c) => acc + c.collaborazioni.length, 0);
    const smms = collaboratoriConCollaborazioni.filter(c => c.subRole === "smm").length;
    
    console.log(`✅ Risultato finale:`);
    console.log(`   📊 ${totaleCollaboratori} collaboratori`);
    console.log(`   🤝 ${totaleCollaborazioni} collaborazioni`);
    console.log(`   📱 ${smms} Social Media Manager`);

    return NextResponse.json(collaboratoriConCollaborazioni, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error("❌ Errore API tabella-collaborazioni:", error);
    return NextResponse.json(
      { 
        message: "Errore interno al server",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, 
      { status: 500 }
    );
  }
}