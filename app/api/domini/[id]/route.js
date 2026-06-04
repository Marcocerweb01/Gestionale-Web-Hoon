import { NextResponse } from 'next/server';
import { connectToDB } from '@/utils/database';
import Dominio from '@/models/Dominio';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Aggiorna dominio
export async function PUT(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'amministratore' && session.user.role !== 'segretaria')) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const { id } = await params;
    const body = await req.json();

    const updateData = {};
    if (body.urlDominio !== undefined) updateData.urlDominio = body.urlDominio.trim().toLowerCase();
    if (body.dataScadenza !== undefined) updateData.dataScadenza = new Date(body.dataScadenza);
    if (body.webDesigner !== undefined) updateData.webDesigner = body.webDesigner.trim();
    if (body.isEsterno !== undefined) updateData.isEsterno = body.isEsterno;
    if (body.note !== undefined) updateData.note = body.note;
    if (body.alertInviato !== undefined) updateData.alertInviato = body.alertInviato;

    const dominio = await Dominio.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!dominio) {
      return NextResponse.json({ error: 'Dominio non trovato' }, { status: 404 });
    }

    return NextResponse.json(dominio);
  } catch (error) {
    console.error('Errore PUT dominio:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

// DELETE - Elimina dominio
export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'amministratore') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const { id } = await params;

    const dominio = await Dominio.findByIdAndDelete(id);
    if (!dominio) {
      return NextResponse.json({ error: 'Dominio non trovato' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Dominio eliminato' });
  } catch (error) {
    console.error('Errore DELETE dominio:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
