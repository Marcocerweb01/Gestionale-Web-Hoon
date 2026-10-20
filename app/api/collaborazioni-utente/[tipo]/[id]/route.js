import { connectToDB } from "@/utils/database";
import Collaborazioni from "@/models/Collaborazioni";
import Collaborazioniwebdesign from "@/models/Collaborazioniwebdesign";
import CollaborazioniWebDesignV2 from "@/models/CollaborazioniWebDesignV2";
import CollaborazioneSeo from "@/models/CollaborazioneSeo";
import WebDesignInterview from "@/models/WebDesignInterview";
import GoogleAds from "@/models/GoogleAds";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

// DELETE - Elimina una collaborazione specifica (solo admin)
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    const { id, tipo } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID collaborazione non valido' }, { status: 400 });
    }
    
    let risultato;
    
    switch (tipo) {
      case 'social':
        risultato = await Collaborazioni.findByIdAndDelete(id);
        break;
      case 'webdesign':
        risultato = await Collaborazioniwebdesign.findByIdAndDelete(id);
        if (risultato) {
          await CollaborazioneSeo.deleteMany({ sourceType: 'webdesign', sourceId: id });
        }
        break;
      case 'webdesign-v2':
        risultato = await CollaborazioniWebDesignV2.findByIdAndDelete(id);
        if (risultato) {
          await Promise.all([
            WebDesignInterview.deleteMany({ collaborazione: id }),
            CollaborazioneSeo.deleteMany({ sourceType: 'webdesign-v2', sourceId: id }),
          ]);
        }
        break;
      case 'googleads':
        risultato = await GoogleAds.findByIdAndDelete(id);
        break;
      default:
        return NextResponse.json({ error: 'Tipo di collaborazione non valido' }, { status: 400 });
    }
    
    if (!risultato) {
      return NextResponse.json({ error: 'Collaborazione non trovata' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      message: 'Collaborazione eliminata con successo',
      tipo 
    }, { status: 200 });
  } catch (error) {
    console.error("Errore eliminazione collaborazione:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
