import { notifyAdmins } from "@/lib/notification-preferences";
import { connectToDB } from "@/utils/database";

export async function notifyCommercialAdmin({ title, message, refId, link = "/Commerciale" }) {
  try {
    await connectToDB();
    const results = await notifyAdmins({
      tipo: "commerciale",
      titolo: title,
      messaggio: message,
      link,
      refId: String(refId || ""),
    });
    return results.find((result) => result.notification || result.delivery) || null;
  } catch (error) {
    console.error("Errore notifica commerciale:", error);
    return null;
  }
}

