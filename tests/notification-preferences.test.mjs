import test from "node:test";
import assert from "node:assert/strict";
import {
  ADMIN_NOTIFICATION_CATALOG,
  normalizeAdminNotificationPreferences,
  notificationDeliveryDedupeKey,
  resolveUserNotificationChannels,
  sanitizeAdminNotificationPreferences,
} from "../lib/notification-preference-catalog.js";

test("espone tutte le sette categorie e abilita le email per i problemi", () => {
  const preferences = normalizeAdminNotificationPreferences();
  assert.equal(ADMIN_NOTIFICATION_CATALOG.length, 7);
  assert.equal(Object.keys(preferences).length, 7);
  assert.deepEqual(preferences.nota_problema, { inApp: true, email: true });
});

test("le preferenze sono isolate per account e ignorano categorie sconosciute", () => {
  const firstAdmin = sanitizeAdminNotificationPreferences({
    nota_problema: { email: false },
  });
  const secondAdmin = normalizeAdminNotificationPreferences();
  const sanitized = sanitizeAdminNotificationPreferences({ intruso: { email: true } }, firstAdmin);

  assert.equal(firstAdmin.nota_problema.email, false);
  assert.equal(secondAdmin.nota_problema.email, true);
  assert.equal(Object.hasOwn(sanitized, "intruso"), false);
});

test("la disattivazione email sopprime solo il canale email", () => {
  const user = { email: "admin@example.test", telefono: "+393331234567" };
  assert.deepEqual(
    resolveUserNotificationChannels(user, { inApp: true, email: false }),
    [{ channel: "whatsapp", target: "+393331234567" }]
  );
  assert.deepEqual(
    resolveUserNotificationChannels(user, { inApp: true, email: true }),
    [
      { channel: "email", target: "admin@example.test" },
      { channel: "whatsapp", target: "+393331234567" },
    ]
  );
});

test("la deduplicazione separa destinatari e canali ma resta stabile sui retry", () => {
  const base = { type: "nota_problema", refId: "nota-1", userId: "admin-1" };
  const first = notificationDeliveryDedupeKey({ ...base, channel: "email" });
  assert.equal(first, notificationDeliveryDedupeKey({ ...base, channel: "email" }));
  assert.notEqual(first, notificationDeliveryDedupeKey({ ...base, userId: "admin-2", channel: "email" }));
  assert.notEqual(first, notificationDeliveryDedupeKey({ ...base, channel: "whatsapp" }));
});
