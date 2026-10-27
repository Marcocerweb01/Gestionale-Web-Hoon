import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { COMMERCIAL_ADMIN_EMAIL } from "@/lib/commerciale/core";

export { COMMERCIAL_ADMIN_EMAIL };

export const isCommercialAdmin = (user) =>
  user?.role === "amministratore" &&
  String(user?.email || "").trim().toLowerCase() === COMMERCIAL_ADMIN_EMAIL;

export async function requireCommercialAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Non autenticato" }, { status: 401 }),
    };
  }

  if (!isCommercialAdmin(session.user)) {
    return {
      error: NextResponse.json(
        { error: `Accesso riservato a ${COMMERCIAL_ADMIN_EMAIL}` },
        { status: 403 }
      ),
    };
  }

  return { session };
}

