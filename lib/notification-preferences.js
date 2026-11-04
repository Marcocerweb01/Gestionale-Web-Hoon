import AdminNotificationPreference from "@/models/AdminNotificationPreference";
import NotificationDelivery from "@/models/NotificationDelivery";
import Notifica from "@/models/Notifica";
import { Amministratore, Collaboratore } from "@/models/User";
import { processNotificationDeliveries } from "@/lib/notification-delivery";
import {
  isAdminNotificationType,
  notificationDeliveryDedupeKey,
  normalizeAdminNotificationPreferences,
} from "@/lib/notification-preference-catalog";

export {
  ADMIN_NOTIFICATION_CATALOG,
  normalizeAdminNotificationPreferences,
  sanitizeAdminNotificationPreferences,
} from "@/lib/notification-preference-catalog";

// Gli account amministratore creati prima dell'introduzione del campo `ruolo`
// non hanno alcun valore salvato. Il login li tratta già come amministratori:
// manteniamo qui lo stesso comportamento, escludendo soltanto i ruoli espliciti
// che non devono gestire le preferenze amministrative.
const administratorAccountQuery = {
  ruolo: { $nin: ["segretaria", "hoon_lab"] },
};

export async function findAdminAccount(userId) {
  const [administrator, collaborator] = await Promise.all([
    Amministratore.findOne({ _id: userId, ...administratorAccountQuery })
      .select("_id nome cognome email")
      .lean(),
    Collaboratore.findOne({ _id: userId, isAdmin: true, status: { $ne: "non_attivo" } })
      .select("_id nome cognome email")
      .lean(),
  ]);

  if (administrator) return { ...administrator, userModel: "Amministratore" };
  if (collaborator) return { ...collaborator, userModel: "Collaboratore" };
  return null;
}

export async function listAdminAccounts() {
  const [administrators, collaborators] = await Promise.all([
    Amministratore.find(administratorAccountQuery)
      .select("_id nome cognome email")
      .lean(),
    Collaboratore.find({ isAdmin: true, status: { $ne: "non_attivo" } })
      .select("_id nome cognome email")
      .lean(),
  ]);

  return [
    ...administrators.map((user) => ({ ...user, userModel: "Amministratore" })),
    ...collaborators.map((user) => ({ ...user, userModel: "Collaboratore" })),
  ];
}

export async function getAdminPreferences(account) {
  const stored = await AdminNotificationPreference.findOne({
    userId: account._id,
    userModel: account.userModel,
  }).lean();

  return normalizeAdminNotificationPreferences(stored?.preferences);
}

async function createAdminNotification(account, payload, preferences) {
  const { tipo, titolo, messaggio, link = "", refId = "" } = payload;
  const setting = preferences[tipo];
  if (!setting) return { notification: null, delivery: null };

  let notification = null;
  if (setting.inApp) {
    const values = {
      tipo,
      titolo,
      messaggio,
      link,
      refId: String(refId || ""),
      destinatario: account._id,
      destinatarioModel: account.userModel,
      letta: false,
    };

    notification = refId
      ? await Notifica.findOneAndUpdate(
          { tipo, refId: String(refId), destinatario: account._id },
          { $setOnInsert: values },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      : await Notifica.create(values);
  }

  let delivery = null;
  if (setting.email && account.email) {
    const dedupeRef = String(refId || notification?._id || Date.now());
    delivery = await NotificationDelivery.findOneAndUpdate(
      { dedupeKey: notificationDeliveryDedupeKey({ type: tipo, refId: dedupeRef, userId: account._id, channel: "email" }) },
      {
        $setOnInsert: {
          destinatario: account._id,
          destinatarioModel: account.userModel,
          channel: "email",
          target: account.email,
          subject: titolo,
          message: messaggio,
          link,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  return { notification, delivery };
}

export async function notifyAdminAccounts(accounts, payload) {
  if (!isAdminNotificationType(payload.tipo)) {
    throw new Error(`Tipo di notifica amministratore non supportato: ${payload.tipo}`);
  }

  const results = await Promise.all(accounts.map(async (account) => {
    const preferences = await getAdminPreferences(account);
    return createAdminNotification(account, payload, preferences);
  }));

  const deliveryIds = results
    .map((result) => result.delivery?._id)
    .filter(Boolean);

  if (deliveryIds.length > 0) {
    await processNotificationDeliveries({ ids: deliveryIds }).catch((error) => {
      console.error("Errore invio immediato notifiche amministratori:", error);
    });
  }

  return results;
}

export async function notifyAdmins(payload) {
  const accounts = await listAdminAccounts();
  return notifyAdminAccounts(accounts, payload);
}
