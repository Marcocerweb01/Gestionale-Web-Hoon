import { connectToDB } from "@/utils/database";
import NotaComm from "@/models/Note-comm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDB();

    // Conta le note commerciali
    const count = await NotaComm.countDocuments();
    console.log("📊 Totale note commerciali:", count);

    if (count === 0) {
      return NextResponse.json({
        totale: 0,
        note_contatto: 0,
        note_appuntamento: 0,
        esempi: [],
        message: "Nessuna nota commerciale trovata"
      });
    }

    // Conta per categoria
    const contattoCount = await NotaComm.countDocuments({ mainCategoria: "contatto" });
    const appuntamentoCount = await NotaComm.countDocuments({ mainCategoria: "appuntamento" });

    // Prendi alcuni esempi
    const esempi = await NotaComm.find()
      .limit(10)
      .populate('autoreId', 'nome cognome email')
      .sort({ data: -1 });

    return NextResponse.json({
      totale: count,
      note_contatto: contattoCount,
      note_appuntamento: appuntamentoCount,
      esempi: esempi.map(nota => ({
        id: nota._id,
        categoria: nota.mainCategoria,
        nomeAzienda: nota.nomeAzienda || 'N/A',
        numeroTelefono: nota.numeroTelefono || 'N/A',
        referente: nota.referente || 'N/A',
        indirizzo: nota.indirizzo || 'N/A',
        nota: nota.nota.substring(0, 100) + (nota.nota.length > 100 ? '...' : ''),
        autore: nota.autore || 'N/A',
        data: nota.data,
        comeArrivato: nota.comeArrivato || 'N/A'
      }))
    });

  } catch (error) {
    console.error("Errore debug note commerciali:", error);
    return NextResponse.json(
      { error: "Errore recupero note commerciali" },
      { status: 500 }
    );
  }
}