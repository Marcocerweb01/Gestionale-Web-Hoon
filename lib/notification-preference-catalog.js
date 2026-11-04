export const ADMIN_NOTIFICATION_CATALOG = [
  {
    type: "report_chiusura",
    label: "Report mensili e trimestrali",
    description: "Creazione, disponibilità e completamento dei report di chiusura.",
    group: "Report e chiusure",
    defaults: { inApp: true, email: true },
  },
  {
    type: "nota_problema",
    label: "Problemi segnalati",
    description: "Una nota di tipo problema viene inserita in una collaborazione.",
    group: "Critiche",
    defaults: { inApp: true, email: true },
  },
  {
    type: "dominio_scadenza",
    label: "Domini in scadenza",
    description: "Un dominio raggiunge una delle soglie di scadenza configurate.",
    group: "Scadenze",
    defaults: { inApp: true, email: false },
  },
  {
    type: "fine_mese",
    label: "Promemoria di fine mese",
    description: "Mancano pochi giorni alla chiusura mensile e ai relativi controlli.",
    group: "Scadenze",
    defaults: { inApp: true, email: false },
  },
  {
    type: "commerciale",
    label: "Attività commerciale",
    description: "Preventivi, pagamenti o attività commerciali richiedono attenzione.",
    group: "Operative",
    defaults: { inApp: true, email: false },
  },
  {
    type: "evento_disponibilita",
    label: "Disponibilità eventi",
    description: "Viene pubblicato un nuovo evento per cui indicare la disponibilità.",
    group: "Operative",
    defaults: { inApp: true, email: true },
  },
  {
    type: "shooting_disponibilita",
    label: "Disponibilità shooting",
    description: "Viene pubblicato un nuovo shooting per cui indicare la disponibilità.",
    group: "Operative",
    defaults: { inApp: true, email: true },
  },
  {
    type: "seo_assegnazione",
    label: "Assegnazioni SEO",
    description: "Un nuovo servizio SEO viene assegnato al tuo account operativo.",
    group: "Operative",
    defaults: { inApp: true, email: true },
  },
];

const catalogByType = new Map(ADMIN_NOTIFICATION_CATALOG.map((item) => [item.type, item]));

export function isAdminNotificationType(type) {
  return catalogByType.has(type);
}

export function normalizeAdminNotificationPreferences(storedPreferences = {}) {
  const source = storedPreferences instanceof Map
    ? Object.fromEntries(storedPreferences)
    : storedPreferences || {};

  return Object.fromEntries(
    ADMIN_NOTIFICATION_CATALOG.map((item) => {
      const saved = source[item.type] || {};
      return [item.type, {
        inApp: typeof saved.inApp === "boolean" ? saved.inApp : item.defaults.inApp,
        email: typeof saved.email === "boolean" ? saved.email : item.defaults.email,
      }];
    })
  );
}

export function sanitizeAdminNotificationPreferences(input = {}, current = {}) {
  const next = normalizeAdminNotificationPreferences(current);

  for (const [type, value] of Object.entries(input || {})) {
    if (!catalogByType.has(type) || !value || typeof value !== "object") continue;
    if (typeof value.inApp === "boolean") next[type].inApp = value.inApp;
    if (typeof value.email === "boolean") next[type].email = value.email;
  }

  return next;
}

export function resolveUserNotificationChannels(user, setting = null) {
  return [
    ...(setting?.email === false ? [] : [{ channel: "email", target: user.email }]),
    { channel: "whatsapp", target: user.telefono },
  ].filter((item) => item.target);
}

export function notificationDeliveryDedupeKey({ type, refId, userId, channel }) {
  return `${type}:${refId}:${userId}:${channel}`;
}
