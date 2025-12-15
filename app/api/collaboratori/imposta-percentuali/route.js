import { connectToDB } from "@/utils/database";
import { Collaboratore } from "@/models/User";
import { NextResponse } from "next/server";

// POST - Imposta percentuali specifiche ai collaboratori
export const POST = async (request) => {
  try {
    await connectToDB();

    // Collaboratori con percentuali specifiche
    const collaboratoriSpeciali = [
      { nome: "Marco", cognome: "Cerasa", percentuale: 70 },
      { nome: "Lorenzo", cognome: "Pietrini", percentuale: 70 },
      { nome: "Francesco", cognome: "Bizzarri", percentuale: 70 },
      { nome: "Agnese", cognome: "Furesi", percentuale: 55 }
    ];

    const risultati = {
      aggiornati: [],
      errori: [],
      tutti_a_50: 0
    };

    // Imposta tutti i collaboratori al 50% di default
    const updateAll = await Collaboratore.updateMany(
      {},
      { $set: { percentuale_hoon: 50 } }
    );
    risultati.tutti_a_50 = updateAll.modifiedCount;

    // Aggiorna i collaboratori speciali
    for (const collab of collaboratoriSpeciali) {
      try {
        const collaboratore = await Collaboratore.findOne({
          nome: { $regex: new RegExp(collab.nome, 'i') },
          cognome: { $regex: new RegExp(collab.cognome, 'i') }
        });

        if (collaboratore) {
          collaboratore.percentuale_hoon = collab.percentuale;
          await collaboratore.save();
          
          risultati.aggiornati.push({
            nome: `${collaboratore.nome} ${collaboratore.cognome}`,
            percentuale: collab.percentuale
          });
        } else {
          risultati.errori.push({
            nome: `${collab.nome} ${collab.cognome}`,
            errore: "Non trovato"
          });
        }
      } catch (error) {
        risultati.errori.push({
          nome: `${collab.nome} ${collab.cognome}`,
          errore: error.message
        });
      }
    }

    return NextResponse.json({
      message: "Percentuali impostate con successo",
      risultati
    }, { status: 200 });

  } catch (error) {
    console.error("Errore impostazione percentuali:", error);
    return NextResponse.json(
      { error: "Errore nell'impostazione delle percentuali" },
      { status: 500 }
    );
  }
};
