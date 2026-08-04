import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import WebDesignInterview from '@/models/WebDesignInterview';
import { connectToDB } from '@/utils/database';

export const dynamic = 'force-dynamic';

const canAccessWebDesigner = (session, webDesignerId) => {
  const role = session?.user?.role;
  const isStaff = role === 'amministratore' || role === 'segretaria';
  return isStaff || session?.user?.id === webDesignerId;
};

const getAutoreNome = (user) =>
  [user?.nome, user?.cognome].filter(Boolean).join(' ').trim() || user?.email || 'Utente';

export async function GET(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const webDesignerId = searchParams.get('webDesignerId');

    if (!webDesignerId || !mongoose.Types.ObjectId.isValid(webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Web designer non valido' }), { status: 400 });
    }

    if (!canAccessWebDesigner(session, webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const interviste = await WebDesignInterview.find({ webDesigner: webDesignerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return new Response(JSON.stringify(interviste), { status: 200 });
  } catch (error) {
    console.error('Errore durante il recupero interviste web design:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ message: 'Non autenticato' }), { status: 401 });
    }

    const { webDesignerId, azienda, interview, risultatoTxt } = await req.json();

    if (!webDesignerId || !mongoose.Types.ObjectId.isValid(webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Web designer non valido' }), { status: 400 });
    }

    if (!interview || !risultatoTxt) {
      return new Response(JSON.stringify({ message: 'Dati intervista mancanti' }), { status: 400 });
    }

    if (!canAccessWebDesigner(session, webDesignerId)) {
      return new Response(JSON.stringify({ message: 'Non autorizzato' }), { status: 403 });
    }

    const savedInterview = await WebDesignInterview.create({
      webDesigner: webDesignerId,
      azienda: azienda || interview.azienda || '',
      interview,
      risultatoTxt,
      autoreId: session.user.id || '',
      autoreNome: getAutoreNome(session.user),
      autoreEmail: session.user.email || '',
      autoreRuolo: session.user.role || session.user.subrole || '',
    });

    return new Response(
      JSON.stringify({ message: 'Intervista salvata', intervista: savedInterview }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Errore durante il salvataggio intervista web design:', error);
    return new Response(JSON.stringify({ message: 'Errore interno al server' }), { status: 500 });
  }
}
