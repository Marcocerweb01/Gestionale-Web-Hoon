import { connectToDB } from "@/utils/database";
import { Contatto } from "@/models/User";
import LeadCommerciale from "@/models/LeadCommerciale";
import { NextResponse } from "next/server";

// POST - Migra contatti esistenti a nuovi lead
export async function POST(req) {
  try {
    await connectToDB();

    const { searchParams } = new URL(req.url);
    const commercialeId = searchParams.get('commerciale');

    if (!commercialeId) {
      return NextResponse.json(
        { error: "ID commerciale mancante per assegnare i lead" },
        { status: 400 }
      );
    }

    // Recupera tutti i contatti
    const contatti = await Contatto.find({});
    
    console.log(`📊 Trovati ${contatti.length} contatti da migrare`);

    const leadCreati = [];
    const errori = [];

    for (const contatto of contatti) {
      try {
        // Verifica se esiste già un lead con lo stesso numero
        const leadEsistente = await LeadCommerciale.findOne({
          numero_telefono: contatto.numero
        });

        if (leadEsistente) {
          console.log(`⚠️ Lead già esistente per ${contatto.ragioneSociale || contatto.referente}`);
          continue;
        }

        // Crea nuovo lead dal contatto
        const nuovoLead = new LeadCommerciale({
          nome_attivita: contatto.ragioneSociale || contatto.referente || "Attività senza nome",
          numero_telefono: contatto.numero,
          referente: contatto.referente || "",
          indirizzo: contatto.indirizzo || "",
          email: contatto.email || "",
          commerciale: commercialeId,
          nota_generale: contatto.notes || "",
          stato_attuale: "nuovo"
        });

        await nuovoLead.save();
        leadCreati.push(nuovoLead);
        
        console.log(`✅ Lead creato: ${nuovoLead.nome_attivita}`);

      } catch (error) {
        console.error(`❌ Errore migrazione contatto ${contatto.referente}:`, error);
        errori.push({
          contatto: contatto.referente,
          errore: error.message
        });
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Migrazione completata",
        lead_creati: leadCreati.length,
        errori: errori.length,
        dettagli_errori: errori
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Errore migrazione:", error);
    return NextResponse.json(
      { error: "Errore durante la migrazione" },
      { status: 500 }
    );
  }
}

// GET - Info sulla migrazione
export async function GET(req) {
  try {
    await connectToDB();

    const contattiCount = await Contatto.countDocuments();
    const leadsCount = await LeadCommerciale.countDocuments();

    return NextResponse.json({
      contatti_esistenti: contattiCount,
      leads_esistenti: leadsCount,
      info: "Usa POST con parametro ?commerciale=ID per migrare i contatti"
    });

  } catch (error) {
    console.error("Errore:", error);
    return NextResponse.json(
      { error: "Errore recupero info" },
      { status: 500 }
    );
  }
}
