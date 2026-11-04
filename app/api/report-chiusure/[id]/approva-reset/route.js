import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { requireAdminSession } from "@/lib/adminAuth";
import ReportChiusura from "@/models/ReportChiusura";
import Collaborazione from "@/models/Collaborazioni";
import { createNotifica } from "@/utils/createNotifica";

export async function POST(req, { params }) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  await connectToDB();
  const { id } = await params;

  const claimed = await ReportChiusura.findOneAndUpdate(
    { _id: id, stato: "da_visionare", visionatoAt: { $ne: null } },
    { $set: { stato: "reset_in_corso", approvatoAt: new Date(), approvatoDa: auth.session.user.id } },
    { new: true }
  );
  if (!claimed) {
    return NextResponse.json({ error: "Il report deve essere visionato oppure il reset è già stato eseguito" }, { status: 409 });
  }

  try {
    if (claimed.tipo === "trimestrale") {
      const end = new Date(claimed.periodoFine);
      const monthlyKey = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
      const monthlyClosed = await ReportChiusura.exists({ tipo: "mensile", periodoKey: monthlyKey, stato: "completato" });
      if (!monthlyClosed) {
        claimed.stato = "da_visionare";
        claimed.approvatoAt = null;
        claimed.approvatoDa = null;
        await claimed.save();
        return NextResponse.json({ error: "Prima approva il report mensile dello stesso periodo; poi potrai chiudere il trimestre." }, { status: 409 });
      }
    }
    const ids = claimed.collaborazioniSnapshot.map((row) => row.collaborazioneId);
    let result;
    if (claimed.tipo === "mensile") {
      const ops = claimed.collaborazioniSnapshot.map((row) => ({
        updateOne: {
          filter: { _id: row.collaborazioneId },
          update: {
            $inc: {
              valutazione_trimestrale_totali: row.instagramMensili + row.tiktokMensili + row.linkedinMensili,
              appuntamenti_trimestrale_totali: row.appuntamentiMensili,
              instagram_trim_totali: row.instagramMensili,
              tiktok_trim_totali: row.tiktokMensili,
              linkedin_trim_totali: row.linkedinMensili,
            },
            $set: { post_ig_fb_fatti: 0, post_tiktok_fatti: 0, post_linkedin_fatti: 0, appuntamenti_fatti: 0 },
          },
        },
      }));
      result = ops.length ? await Collaborazione.bulkWrite(ops) : { modifiedCount: 0 };
    } else {
      result = await Collaborazione.updateMany(
        { _id: { $in: ids }, escludi_reset_trimestrale: { $ne: true } },
        { $set: {
          valutazione_trimestrale_fatti: 0, valutazione_trimestrale_totali: 0,
          appuntamenti_trimestrale_fatti: 0, appuntamenti_trimestrale_totali: 0,
          instagram_trim_fatti: 0, instagram_trim_totali: 0,
          tiktok_trim_fatti: 0, tiktok_trim_totali: 0,
          linkedin_trim_fatti: 0, linkedin_trim_totali: 0,
        } }
      );
    }
    claimed.stato = "completato";
    claimed.resetRisultato = { modifiedCount: result.modifiedCount || 0, completedAt: new Date() };
    await claimed.save();
    await createNotifica({
      tipo: "report_chiusura",
      titolo: `Reset completato: ${claimed.titolo}`,
      messaggio: `Reset approvato ed eseguito. Collaborazioni aggiornate: ${result.modifiedCount || 0}. Il file originale resta disponibile nello storico.`,
      link: "/Report-chiusure",
      refId: `reset:${claimed.tipo}:${claimed.periodoKey}`,
    });
    return NextResponse.json({ success: true, modifiedCount: result.modifiedCount || 0 });
  } catch (error) {
    claimed.stato = "da_visionare";
    claimed.errore = error.message;
    claimed.approvatoAt = null;
    claimed.approvatoDa = null;
    await claimed.save();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
