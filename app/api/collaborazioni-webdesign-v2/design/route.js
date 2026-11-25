import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { isObjectIdOrHexString } from 'mongoose';
import { authOptions } from '@/lib/auth';
import { isWorkflowPhaseUnlocked } from '@/lib/webdesign-v2-workflow.mjs';
import { isWebDesignTaskCompleted } from '@/lib/webdesign-v2-progress.mjs';
import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { connectToDB } from '@/utils/database';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!isObjectIdOrHexString(userId)) {
      return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
    }
    const collaboratorId = new URL(request.url).searchParams.get('collaboratore') ?? userId;
    if (!isObjectIdOrHexString(collaboratorId)) {
      return NextResponse.json({ message: 'Collaboratore non valido' }, { status: 400 });
    }
    if (collaboratorId !== userId && !['amministratore', 'segretaria'].includes(session.user.role)) {
      return NextResponse.json({ message: 'Non autorizzato' }, { status: 403 });
    }

    await connectToDB();
    const projects = await CollaborazioneWebDesignV2.find({
      designCollaboratore: collaboratorId,
      webDesigner: { $ne: collaboratorId },
    })
      .select('cliente aziendaRagioneSociale stato dataAvvioOperativo fasiControllo.tipo fasiControllo.completata fasiControllo.data fasiControllo.esito fasi')
      .populate('cliente', 'etichetta')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(projects.flatMap((project) => {
      const design = project.fasi?.find((phase) => phase.nome === 'design');
      if (!design) return [];
      return [{
        id: String(project._id),
        cliente: project.cliente?.etichetta || project.aziendaRagioneSociale,
        stato: project.stato,
        faseCompletata: design.stato === 'completata',
        dataFinePrevista: design.dataFinePrevista,
        modificabile: project.stato === 'in corso' &&
          isWorkflowPhaseUnlocked('design', project.fasiControllo, Boolean(project.dataAvvioOperativo)),
        tasks: (design.tasks || []).map((task) => ({
          id: task.integrationTaskId,
          nome: task.nome,
          giorno: task.giorno,
          completata: isWebDesignTaskCompleted(task),
        })),
      }];
    }), { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Errore nel caricamento dei servizi Design:', error);
    return NextResponse.json({ message: 'Impossibile caricare i servizi Design' }, { status: 500 });
  }
}
