import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { isObjectIdOrHexString } from 'mongoose';
import { authOptions } from '@/lib/auth';
import { isWorkflowPhaseUnlocked } from '@/lib/webdesign-v2-workflow.mjs';
import { isWebDesignTaskCompleted } from '@/lib/webdesign-v2-progress.mjs';
import CollaborazioneWebDesignV2 from '@/models/CollaborazioniWebDesignV2';
import { connectToDB } from '@/utils/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    if (!isObjectIdOrHexString(userId)) {
      return NextResponse.json({ message: 'Non autenticato' }, { status: 401 });
    }

    await connectToDB();
    const projects = await CollaborazioneWebDesignV2.find({
      designCollaboratore: userId,
      webDesigner: { $ne: userId },
    })
      .select('aziendaRagioneSociale stato dataAvvioOperativo fasiControllo.tipo fasiControllo.completata fasiControllo.data fasiControllo.esito fasi')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(projects.flatMap((project) => {
      const design = project.fasi?.find((phase) => phase.nome === 'design');
      if (!design) return [];
      return [{
        id: String(project._id),
        cliente: project.aziendaRagioneSociale,
        stato: project.stato,
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
