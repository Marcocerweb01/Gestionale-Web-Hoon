import { connectToDB } from "@/utils/database";
import Collaborazioni from "@/models/Collaborazioni";
import Collaborazioniwebdesign from "@/models/Collaborazioniwebdesign";
import GoogleAds from "@/models/GoogleAds";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    
    let risultato;
    
    switch (tipo) {
      case 'social':
        risultato = await Collaborazioni.findByIdAndDelete(id);
        break;
      case 'webdesign':
        risultato = await Collaborazioniwebdesign.findByIdAndDelete(id);
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
