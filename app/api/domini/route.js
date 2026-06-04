import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Dominio from '@/models/Dominio';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Recupera tutti i domini standalone
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'amministratore' && session.user.role !== 'segretaria')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const oggi = new Date();
    const domini = await Dominio.find().sort({ dataScadenza: 1 });

    const result = domini.map(d => {
      const dataScadenza = new Date(d.dataScadenza);
      const giorniMancanti = Math.ceil((dataScadenza - oggi) / (1000 * 60 * 60 * 24));
      return {
        _id: d._id,
        urlDominio: d.urlDominio,
        dataScadenza: d.dataScadenza,
        webDesigner: d.webDesigner,
        isEsterno: d.isEsterno,
        note: d.note,
        giorniMancanti,
        scaduto: giorniMancanti < 0,
        inScadenza: giorniMancanti >= 0 && giorniMancanti <= 60,
        fonte: 'standalone',
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Errore GET domini:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// POST - Crea nuovo dominio
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'amministratore' && session.user.role !== 'segretaria')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();

    const body = await req.json();
    const { urlDominio, dataScadenza, webDesigner, isEsterno, note } = body;

    if (!urlDominio || !dataScadenza || !webDesigner) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 });
    }

    const dominio = await Dominio.create({
      urlDominio: urlDominio.trim().toLowerCase(),
      dataScadenza: new Date(dataScadenza),
      webDesigner: webDesigner.trim(),
      isEsterno: !!isEsterno,
      note: note || '',
    });

    return NextResponse.json(dominio, { status: 201 });
  } catch (error) {
    console.error('Errore POST dominio:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
