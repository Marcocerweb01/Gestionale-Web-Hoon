import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import { Azienda, Collaboratore } from "@/models/User";
import Collaborazione from "@/models/Collaborazioni";
import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import CollaborazioneWebDesignV2 from "@/models/CollaborazioniWebDesignV2";
import GoogleAds from "@/models/GoogleAds";

export const dynamic = "force-dynamic";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fullName = (user) =>
  [user?.nome, user?.cognome].filter(Boolean).join(" ").trim();

const toId = (value) => value?._id?.toString?.() || value?.toString?.() || "";

const uniqBy = (items, keyFn) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ results: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await connectToDB();

    const regex = new RegExp(escapeRegex(query), "i");
    const limit = 8;

    const [
      clienti,
      collaboratori,
      collaborazioniSocial,
      collaborazioniWeb,
      collaborazioniWebV2,
      campagneGoogleAds,
    ] = await Promise.all([
      Azienda.find({
        $or: [
          { etichetta: regex },
          { ragioneSociale: regex },
          { nome: regex },
          { cognome: regex },
          { email: regex },
        ],
      })
        .select("_id etichetta ragioneSociale nome cognome email")
        .limit(limit)
        .lean(),
      Collaboratore.find({
        $or: [
          { nome: regex },
          { cognome: regex },
          { email: regex },
          { subRoles: regex },
        ],
      })
        .select("_id nome cognome email subRoles subRole status")
        .limit(limit)
        .lean(),
      Collaborazione.find({
        $or: [
          { aziendaRagioneSociale: regex },
          { collaboratoreNome: regex },
          { collaboratoreCognome: regex },
          { stato: regex },
        ],
      })
        .populate("azienda", "etichetta ragioneSociale email")
        .populate("collaboratore", "nome cognome email")
        .limit(limit)
        .lean(),
      CollaborazioneWebDesign.find({
        $or: [
          { aziendaRagioneSociale: regex },
          { collaboratoreNome: regex },
          { collaboratoreCognome: regex },
          { tipoProgetto: regex },
          { stato: regex },
        ],
      })
        .populate("cliente", "etichetta ragioneSociale email")
        .populate("webDesigner", "nome cognome email")
        .limit(limit)
        .lean(),
      CollaborazioneWebDesignV2.find({
        $or: [
          { aziendaRagioneSociale: regex },
          { collaboratoreNome: regex },
          { collaboratoreCognome: regex },
          { tipoProgetto: regex },
          { stato: regex },
        ],
      })
        .populate("cliente", "etichetta ragioneSociale email")
        .populate("webDesigner", "nome cognome email")
        .limit(limit)
        .lean(),
      GoogleAds.find({
        $or: [
          { clienteEtichetta: regex },
          { collaboratoreNome: regex },
          { collaboratoreCognome: regex },
          { note: regex },
        ],
      })
        .populate("cliente", "etichetta ragioneSociale email")
        .populate("collaboratore", "nome cognome email")
        .limit(limit)
        .lean(),
    ]);

    const results = [
      ...clienti.map((cliente) => ({
        id: toId(cliente),
        type: "cliente",
        icon: "🏢",
        label: "Cliente",
        title:
          cliente.etichetta ||
          cliente.ragioneSociale ||
          fullName(cliente) ||
          cliente.email ||
          "Cliente senza nome",
        subtitle: cliente.email || cliente.ragioneSociale || "",
        href: `/User/${toId(cliente)}`,
      })),
      ...collaboratori.map((collaboratore) => ({
        id: toId(collaboratore),
        type: "collaboratore",
        icon: "👤",
        label: "Collaboratore",
        title: fullName(collaboratore) || collaboratore.email || "Collaboratore senza nome",
        subtitle: (collaboratore.subRoles || [collaboratore.subRole]).filter(Boolean).join(", "),
        href: `/User/${toId(collaboratore)}`,
      })),
      ...collaborazioniSocial.map((collab) => ({
        id: toId(collab),
        type: "collaborazione-social",
        icon: "📱",
        label: "Collaborazione Social",
        title:
          collab.azienda?.etichetta ||
          collab.azienda?.ragioneSociale ||
          collab.aziendaRagioneSociale ||
          "Cliente senza nome",
        subtitle: fullName(collab.collaboratore) || `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`,
        href: `/Feed-2/${toId(collab.collaboratore)}?collaborazioneId=${toId(collab)}`,
      })),
      ...collaborazioniWeb.map((collab) => ({
        id: toId(collab),
        type: "collaborazione-web",
        icon: "💻",
        label: "Collaborazione Web Design",
        title:
          collab.cliente?.etichetta ||
          collab.cliente?.ragioneSociale ||
          collab.aziendaRagioneSociale ||
          "Cliente senza nome",
        subtitle: `Classica · ${fullName(collab.webDesigner) || `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`}`,
        href: `/Lista_clienti_webdesigner/${toId(collab.webDesigner)}`,
      })),
      ...collaborazioniWebV2.map((collab) => ({
        id: toId(collab),
        type: "collaborazione-web-v2",
        icon: "🚀",
        label: "Collaborazione Web Design V2",
        title:
          collab.cliente?.etichetta ||
          collab.cliente?.ragioneSociale ||
          collab.aziendaRagioneSociale ||
          "Cliente senza nome",
        subtitle: `${collab.tipoProgetto || "Progetto"} · ${fullName(collab.webDesigner) || `${collab.collaboratoreNome} ${collab.collaboratoreCognome}`}`,
        href: `/Lista_clienti_webdesigner/${toId(collab.webDesigner)}`,
      })),
      ...campagneGoogleAds.map((campagna) => ({
        id: toId(campagna),
        type: "collaborazione-google-ads",
        icon: "🎯",
        label: "Campagna Google Ads",
        title:
          campagna.cliente?.etichetta ||
          campagna.clienteEtichetta ||
          campagna.cliente?.ragioneSociale ||
          "Cliente senza nome",
        subtitle: fullName(campagna.collaboratore) || `${campagna.collaboratoreNome} ${campagna.collaboratoreCognome}`,
        href: "/Lista-Marketing/google-ads",
      })),
    ];

    return NextResponse.json({
      results: uniqBy(results, (item) => `${item.type}-${item.id}`).slice(0, 12),
    });
  } catch (error) {
    console.error("Errore ricerca globale:", error);
    return NextResponse.json({ error: "Errore interno al server" }, { status: 500 });
  }
}
