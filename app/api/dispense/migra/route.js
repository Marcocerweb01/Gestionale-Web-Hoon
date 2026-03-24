import { connectToDB } from "@/utils/database";
import Dispensa from "@/models/Dispensa";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dispensaCategorie } from "@/utils/dispense-data";

export const dynamic = 'force-dynamic';

// POST - Migra i dati statici nel database (solo amministratori, esegui una sola volta)
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    // Controlla se ci sono già dati
    const count = await Dispensa.countDocuments();
    if (count > 0) {
      return NextResponse.json({ 
        message: 'I dati sono già presenti nel database',
        count 
      }, { status: 200 });
    }
    
    // Crea tutti i documenti dal file statico
    const documenti = [];
    for (const cat of dispensaCategorie) {
      cat.items.forEach((item, idx) => {
        documenti.push({
          categoria: cat.categoria,
          icona: cat.icona,
          item,
          ordine: idx,
        });
      });
    }
    
    await Dispensa.insertMany(documenti);
    
    return NextResponse.json({ 
      message: 'Migrazione completata con successo',
      categorie: dispensaCategorie.length,
      argomenti: documenti.length
    }, { status: 201 });
  } catch (error) {
    console.error("Errore migrazione dispense:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Rimuove tutti i duplicati (solo amministratori)
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
    
    await connectToDB();
    
    // Trova e rimuovi duplicati: tieni solo il primo documento per ogni combinazione categoria+item
    const duplicati = await Dispensa.aggregate([
      {
        $group: {
          _id: { categoria: '$categoria', item: '$item' },
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);
    
    let rimossi = 0;
    for (const dup of duplicati) {
      // Rimuovi tutti tranne il primo
      const idsToRemove = dup.ids.slice(1);
      await Dispensa.deleteMany({ _id: { $in: idsToRemove } });
      rimossi += idsToRemove.length;
    }
    
    return NextResponse.json({ 
      message: `Rimossi ${rimossi} duplicati`,
      duplicatiTrovati: duplicati.length,
      documentiRimossi: rimossi
    }, { status: 200 });
  } catch (error) {
    console.error("Errore pulizia duplicati:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
