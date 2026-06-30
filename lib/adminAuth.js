import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      error: NextResponse.json({ error: "Non autenticato" }, { status: 401 })
    };
  }

  if (session.user?.role !== "amministratore") {
    return {
      error: NextResponse.json({ error: "Accesso consentito solo agli amministratori" }, { status: 403 })
    };
  }

  return { session };
};
