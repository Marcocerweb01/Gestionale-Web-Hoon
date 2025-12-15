import { connectToDB } from "@/utils/database";
import { PagamentoNuovo } from "@/models/PagamentiNuovi";
import { Collaboratore, Azienda } from "@/models/User";
import { NextResponse } from "next/server";

// GET - Recupera tutti i pagamenti con filtri
export const GET = async (request) => {
  try {
    await connectToDB();

    const { searchParams } = new URL(request.url);
    
    // Filtri
    const mese = searchParams.get("mese");
    const anno = searchParams.get("anno");
    const azienda = searchParams.get("azienda"); // id o nome
    const servizio = searchParams.get("servizio");
    const collaboratore = searchParams.get("collaboratore"); // id
    const stato = searchParams.get("stato");
    const tipo = searchParams.get("tipo"); // entrata o uscita
    const ordinamento = searchParams.get("sort") || "data_desc";

    let query = {};

    // Applica filtri
    if (tipo) query.tipo = tipo;
    if (mese) query.mese = parseInt(mese);
    if (anno) query.anno = parseInt(anno);
    if (stato) query.stato_pagamento = stato;
    if (servizio) query.servizio = servizio;
    
    if (azienda) {
      query.$or = [
        { "chi_paga.cliente_id": azienda },
        { "chi_paga.etichetta": { $regex: azienda, $options: "i" } },
        { "chi_paga.ragione_sociale": { $regex: azienda, $options: "i" } }
      ];
    }

    if (collaboratore) {
      query["collaboratori.collaboratore_id"] = collaboratore;
    }

    // Ordinamento
    let sort = {};
    switch (ordinamento) {
      case "data_desc":
        sort = { createdAt: -1 };
        break;
      case "data_asc":
        sort = { createdAt: 1 };
        break;
      case "importo_desc":
        sort = { importo: -1 };
        break;
      case "importo_asc":
        sort = { importo: 1 };
        break;
      case "entrate":
        query.tipo = "entrata";
        sort = { createdAt: -1 };
        break;
      case "uscite":
        query.tipo = "uscita";
        sort = { createdAt: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const pagamenti = await PagamentoNuovo.find(query).sort(sort);

    return NextResponse.json(pagamenti, { status: 200 });
  } catch (error) {
    console.error("Errore GET pagamenti:", error);
    return NextResponse.json(
      { error: "Errore nel recupero dei pagamenti" },
      { status: 500 }
    );
  }
};

// POST - Crea nuovo pagamento (entrata o uscita)
export const POST = async (request) => {
  try {
    await connectToDB();

    const body = await request.json();
    const { tipo } = body;

    if (tipo === "entrata") {
      // Creazione ENTRATA
      const {
        chi_paga,
        importo,
        destinatario_entrata,
        servizio,
        collaboratori,
        stato_pagamento,
        data_pagamento,
        note
      } = body;

      // Calcola importi per ogni collaboratore
      const collaboratoriCalcolati = await Promise.all(
        collaboratori.map(async (collab) => {
          const collaboratoreDB = await Collaboratore.findById(collab.collaboratore_id);
          
          let importo_calcolato = 0;
          if (collab.usa_percentuale) {
            const perc = collab.percentuale || collaboratoreDB.percentuale_hoon;
            importo_calcolato = (importo * perc) / 100;
          } else {
            importo_calcolato = collab.cifra_fissa;
          }

          return {
            ...collab,
            nome_collaboratore: `${collaboratoreDB.nome} ${collaboratoreDB.cognome}`,
            percentuale: collab.usa_percentuale ? (collab.percentuale || collaboratoreDB.percentuale_hoon) : null,
            importo_calcolato
          };
        })
      );

      // Data corrente
      const data = data_pagamento ? new Date(data_pagamento) : new Date();
      
      // Crea entrata
      const nuovaEntrata = new PagamentoNuovo({
        tipo: "entrata",
        importo,
        chi_paga,
        destinatario_entrata,
        servizio,
        collaboratori: collaboratoriCalcolati,
        stato_pagamento: stato_pagamento || "non_pagato",
        data_pagamento: data,
        mese: data.getMonth() + 1,
        anno: data.getFullYear(),
        note
      });

      const entrataSalvata = await nuovaEntrata.save();

      // GENERA AUTOMATICAMENTE LE USCITE verso i collaboratori
      const usciteGenerate = [];
      
      for (const collab of collaboratoriCalcolati) {
        const nuovaUscita = new PagamentoNuovo({
          tipo: "uscita",
          importo: collab.importo_calcolato,
          destinatario_tipo: "collaboratore",
          destinatario_id: collab.collaboratore_id,
          nome_destinatario: collab.nome_collaboratore,
          stato_pagamento: "ragazzi", // Default per uscite auto-generate
          data_pagamento: data,
          mese: data.getMonth() + 1,
          anno: data.getFullYear(),
          note: `Uscita auto-generata da entrata ${entrataSalvata._id}`,
          generata_da_entrata: true,
          entrata_riferimento_id: entrataSalvata._id
        });

        const uscitaSalvata = await nuovaUscita.save();
        usciteGenerate.push(uscitaSalvata._id);

        // Aggiorna totali collaboratore
        await Collaboratore.findByIdAndUpdate(
          collab.collaboratore_id,
          {
            $inc: {
              guadagno_da_hoon: collab.importo_calcolato,
              tot_fatturato: collab.importo_calcolato
            }
          }
        );
      }

      // Aggiorna entrata con IDs uscite generate
      entrataSalvata.uscite_generate_ids = usciteGenerate;
      await entrataSalvata.save();

      return NextResponse.json({
        entrata: entrataSalvata,
        uscite_generate: usciteGenerate
      }, { status: 201 });

    } else if (tipo === "uscita") {
      // Creazione USCITA manuale
      const {
        importo,
        destinatario_tipo,
        destinatario_id,
        nome_destinatario,
        stato_pagamento,
        data_pagamento,
        note
      } = body;

      const data = data_pagamento ? new Date(data_pagamento) : new Date();

      const nuovaUscita = new PagamentoNuovo({
        tipo: "uscita",
        importo,
        destinatario_tipo,
        destinatario_id,
        nome_destinatario,
        stato_pagamento: stato_pagamento || "non_pagato",
        data_pagamento: data,
        mese: data.getMonth() + 1,
        anno: data.getFullYear(),
        note,
        generata_da_entrata: false
      });

      const uscitaSalvata = await nuovaUscita.save();

      // Se è verso un collaboratore, aggiorna totali
      if (destinatario_tipo === "collaboratore") {
        await Collaboratore.findByIdAndUpdate(
          destinatario_id,
          {
            $inc: {
              totale_fatture_terzi: importo,
              tot_fatturato: importo
            }
          }
        );
      }

      return NextResponse.json(uscitaSalvata, { status: 201 });
    }

    return NextResponse.json(
      { error: "Tipo pagamento non valido" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Errore POST pagamento:", error);
    return NextResponse.json(
      { error: "Errore nella creazione del pagamento" },
      { status: 500 }
    );
  }
};
