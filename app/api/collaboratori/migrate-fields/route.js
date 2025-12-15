import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

// POST - Aggiunge i nuovi campi a tutti i collaboratori esistenti
export const POST = async (request) => {
  try {
    await connectToDB();

    const risultati = {
      totali: 0,
      aggiornati: 0,
      errori: [],
      dettagli: []
    };

    // Collaboratori con percentuali specifiche
    const percentualiSpeciali = {
      "Marco Cerasa": 70,
      "Lorenzo Pietrini": 70,
      "Francesco Bizzarri": 70,
      "Agnese Furesi": 55
    };

    // Ottieni TUTTI i collaboratori
    const tuttiCollaboratori = await Collaboratore.find({});
    risultati.totali = tuttiCollaboratori.length;

    for (const collab of tuttiCollaboratori) {
      try {
        const nomeCompleto = `${collab.nome} ${collab.cognome}`;
        
        // Determina percentuale
        let percentuale = 50; // default
        for (const [nome, perc] of Object.entries(percentualiSpeciali)) {
          if (nomeCompleto.toLowerCase().includes(nome.toLowerCase()) ||
              nome.toLowerCase().includes(nomeCompleto.toLowerCase())) {
            percentuale = perc;
            break;
          }
        }

        // FORZA l'aggiornamento di TUTTI i campi
        const updateResult = await Collaboratore.updateOne(
          { _id: collab._id },
          { 
            $set: {
              percentuale_hoon: percentuale,
              tot_fatturato: 0,
              guadagno_da_hoon: 0,
              totale_fatture_terzi: 0
            }
          }
        );
        
        risultati.aggiornati++;
        risultati.dettagli.push({
          nome: nomeCompleto,
          percentuale: percentuale,
          modificato: updateResult.modifiedCount > 0
        });

      } catch (error) {
        risultati.errori.push({
          nome: `${collab.nome} ${collab.cognome}`,
          errore: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Migration completata - TUTTI i collaboratori aggiornati con valori di default",
      risultati
    }, { status: 200 });

  } catch (error) {
    console.error("Errore migration:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Errore durante la migration",
        details: error.message 
      },
      { status: 500 }
    );
  }
};

// GET - Verifica lo stato dei campi sui collaboratori
export const GET = async (request) => {
  try {
    await connectToDB();

    // Trova tutti i collaboratori
    const tuttiCollaboratori = await Collaboratore.find({});
    
    // Trova collaboratori SENZA i nuovi campi
    const senzaCampi = await Collaboratore.find({
      $or: [
        { percentuale_hoon: { $exists: false } },
        { tot_fatturato: { $exists: false } },
        { guadagno_da_hoon: { $exists: false } },
        { totale_fatture_terzi: { $exists: false } }
      ]
    });

    const analisi = {
      totali: tuttiCollaboratori.length,
      con_nuovi_campi: tuttiCollaboratori.length - senzaCampi.length,
      senza_nuovi_campi: senzaCampi.length,
      dettagli: tuttiCollaboratori.map(collab => ({
        nome: `${collab.nome} ${collab.cognome}`,
        email: collab.email,
        ha_nuovi_campi: !senzaCampi.some(c => c._id.equals(collab._id)),
        percentuale_hoon: collab.percentuale_hoon,
        tot_fatturato: collab.tot_fatturato,
        guadagno_da_hoon: collab.guadagno_da_hoon,
        totale_fatture_terzi: collab.totale_fatture_terzi
      }))
    };

    return NextResponse.json(analisi, { status: 200 });

  } catch (error) {
    console.error("Errore verifica:", error);
    return NextResponse.json(
      { error: "Errore durante la verifica", details: error.message },
      { status: 500 }
    );
  }
};
