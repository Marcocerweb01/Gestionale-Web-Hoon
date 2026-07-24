export const USER_TYPES = [
  "agenzia",
  "amministrazione",
  "segretaria",
  "collaboratore",
  "azienda",
];

export const COLLABORATOR_SUB_ROLES = [
  "smm",
  "web_designer",
  "seo",
  "google_ads",
  "meta_ads",
  "commerciale",
];

export const COLLABORATION_TYPES = [
  "smm",
  "web_design",
  "seo",
  "google_ads",
  "meta_ads",
  "commerciale",
  "mista",
];

export const PERMISSIONS = [
  "agency.manage",
  "users.manage",
  "admins.delete",
  "companies.manage",
  "collaborations.manage",
  "collaborations.assign",
  "collaborations.export",
  "collaborations.reset_monthly",
  "collaborations.reset_quarterly",
  "evaluations.manage",
  "payments.manage",
  "invoices.manage",
  "domains.manage",
  "credentials.view",
  "credentials.manage",
  "tickets.manage",
  "chat.use",
  "knowledge.manage",
  "operations.use",
  "notifications.manage",
];

export const ROLE_PERMISSION_PRESETS = {
  agenzia: PERMISSIONS,
  amministrazione: PERMISSIONS.filter((permission) => permission !== "agency.manage"),
  segretaria: [
    "companies.manage",
    "collaborations.manage",
    "collaborations.assign",
    "collaborations.export",
    "invoices.manage",
    "domains.manage",
    "tickets.manage",
    "chat.use",
    "knowledge.manage",
    "operations.use",
    "notifications.manage",
  ],
  collaboratore: [
    "chat.use",
    "tickets.manage",
    "operations.use",
  ],
  azienda: [
    "chat.use",
    "tickets.manage",
  ],
};
