import Notifica from "@/models/Notifica";
import NotificationDelivery from "@/models/NotificationDelivery";

export async function queueUserNotifications(users, { tipo, titolo, messaggio, link = "", refId }) {
  const validUsers = users.filter(Boolean);
  await Promise.all(validUsers.map(async (user) => {
    await Notifica.findOneAndUpdate(
      { tipo, refId, destinatario: user._id },
      { $setOnInsert: { titolo, messaggio, link } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const channels = [{ channel: "email", target: user.email }, { channel: "whatsapp", target: user.telefono }].filter((item) => item.target);
    await Promise.all(channels.map((item) => NotificationDelivery.findOneAndUpdate(
      { dedupeKey: `${tipo}:${refId}:${user._id}:${item.channel}` },
      { $setOnInsert: { destinatario: user._id, channel: item.channel, target: item.target, subject: titolo, message: messaggio, link } },
      { upsert: true, setDefaultsOnInsert: true }
    )));
  }));
}
