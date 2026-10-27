import Notifica from "@/models/Notifica";
import { Amministratore } from "@/models/User";
import { COMMERCIAL_ADMIN_EMAIL } from "@/lib/commerciale/core";
import { connectToDB } from "@/utils/database";

export async function notifyCommercialAdmin({ title, message, refId, link = "/Commerciale" }) {
  try {
    await connectToDB();
    const admin = await Amministratore.findOne({ email: COMMERCIAL_ADMIN_EMAIL }).select("_id").lean();
    if (!admin) return null;
    return Notifica.findOneAndUpdate(
      { tipo: "commerciale", refId: String(refId || ""), destinatario: admin._id },
      {
        $setOnInsert: {
          tipo: "commerciale",
          titolo: title,
          messaggio: message,
          link,
          refId: String(refId || ""),
          destinatario: admin._id,
          letta: false,
        },
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Errore notifica commerciale:", error);
    return null;
  }
}

