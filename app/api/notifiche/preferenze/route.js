import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import AdminNotificationPreference from "@/models/AdminNotificationPreference";
import {
  ADMIN_NOTIFICATION_CATALOG,
  findAdminAccount,
  getAdminPreferences,
  sanitizeAdminNotificationPreferences,
} from "@/lib/notification-preferences";

export const dynamic = "force-dynamic";

async function authenticatedAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "amministratore") return null;
  await connectToDB();
  const account = await findAdminAccount(session.user.id);
  return account ? { session, account } : null;
}

export async function GET() {
  try {
    const auth = await authenticatedAdmin();
    if (!auth) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

    const preferences = await getAdminPreferences(auth.account);
    return NextResponse.json({
      account: {
        id: auth.account._id,
        nome: [auth.account.nome, auth.account.cognome].filter(Boolean).join(" "),
        email: auth.account.email,
      },
      catalog: ADMIN_NOTIFICATION_CATALOG,
      preferences,
    });
  } catch (error) {
    console.error("Errore GET preferenze notifiche:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const auth = await authenticatedAdmin();
    if (!auth) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });

    const body = await req.json();
    if (!body?.preferences || typeof body.preferences !== "object") {
      return NextResponse.json({ error: "Preferenze non valide" }, { status: 400 });
    }

    const current = await getAdminPreferences(auth.account);
    const preferences = sanitizeAdminNotificationPreferences(body.preferences, current);
    await AdminNotificationPreference.findOneAndUpdate(
      { userId: auth.account._id, userModel: auth.account.userModel },
      { $set: { preferences } },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Errore PATCH preferenze notifiche:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
