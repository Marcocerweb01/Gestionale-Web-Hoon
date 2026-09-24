import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import { isAdmin } from "@/lib/eventi";
import { Azienda, Collaboratore } from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ message: "Non autenticato" }, { status: 401 });
  if (!isAdmin(session)) return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
  try {
    await connectToDB();
    const [collaboratori, aziende] = await Promise.all([
      Collaboratore.find({ status: { $ne: "non_attivo" } }).select("nome cognome subRoles").sort({ nome: 1, cognome: 1 }).lean(),
      Azienda.find({ status: { $ne: "non_attivo" } }).select("etichetta ragioneSociale").sort({ etichetta: 1 }).lean(),
    ]);
    return NextResponse.json({
      collaboratori: collaboratori.map((item) => ({ ...item, _id: String(item._id) })),
      aziende: aziende.map((item) => ({ ...item, _id: String(item._id) })),
    });
  } catch (error) {
    console.error("Errore opzioni eventi:", error);
    return NextResponse.json({ message: "Errore nel caricamento delle opzioni" }, { status: 500 });
  }
}
