import Notifica from "@/models/Notifica";
import NotificationDelivery from "@/models/NotificationDelivery";
import { getAdminPreferences } from "@/lib/notification-preferences";
import {
  notificationDeliveryDedupeKey,
  resolveUserNotificationChannels,
} from "@/lib/notification-preference-catalog";

export async function queueUserNotifications(users, { tipo, titolo, messaggio, link = "", refId }) {
  const validUsers = users.filter(Boolean);
  await Promise.all(validUsers.map(async (user) => {
    const preferences = user.isAdmin
      ? await getAdminPreferences({ _id: user._id, userModel: "Collaboratore" })
      : null;
    const setting = preferences?.[tipo];

    if (!setting || setting.inApp) {
      await Notifica.findOneAndUpdate(
        { tipo, refId, destinatario: user._id },
        { $setOnInsert: { titolo, messaggio, link, destinatarioModel: "Collaboratore" } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const channels = resolveUserNotificationChannels(user, setting);
    await Promise.all(channels.map((item) => NotificationDelivery.findOneAndUpdate(
      { dedupeKey: notificationDeliveryDedupeKey({ type: tipo, refId, userId: user._id, channel: item.channel }) },
      { $setOnInsert: { destinatario: user._id, destinatarioModel: "Collaboratore", channel: item.channel, target: item.target, subject: titolo, message: messaggio, link } },
      { upsert: true, setDefaultsOnInsert: true }
    )));
  }));
}
