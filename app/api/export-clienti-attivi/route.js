export const dynamic = "force-dynamic";

import ExcelJS from "exceljs";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import Collaborazione from "@/models/Collaborazioni";
import CollaborazioneSeo from "@/models/CollaborazioneSeo";
import CollaborazioneWebDesign from "@/models/Collaborazioniwebdesign";
import CollaborazioneWebDesignV2 from "@/models/CollaborazioniWebDesignV2";
import GoogleAds from "@/models/GoogleAds";
import { Azienda, Collaboratore } from "@/models/User";
import { connectToDB } from "@/utils/database";

const toId = (value) => value?.toString();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const canExport = ["amministratore", "segretaria"].includes(session?.user?.role);

    if (!canExport) {
      return NextResponse.json({ message: "Non autorizzato" }, { status: 403 });
    }

    await connectToDB();

    const [social, webDesign, webDesignV2, googleAds, seo] = await Promise.all([
      Collaborazione.find({ stato: "attiva" }).select("azienda collaboratore").lean(),
      CollaborazioneWebDesign.find({ stato: "in corso" }).select("cliente webDesigner").lean(),
      CollaborazioneWebDesignV2.find({ stato: "in corso" }).select("cliente webDesigner").lean(),
      GoogleAds.find({ campagnaTerminata: { $ne: true } }).select("cliente collaboratore").lean(),
      CollaborazioneSeo.find({ archiviata: { $ne: true } }).select("cliente seo").lean(),
    ]);

    const activeByClient = new Map();

    const addCollaboration = (clientId, collaboratorId, service) => {
      const normalizedClientId = toId(clientId);
      if (!normalizedClientId) return;

      if (!activeByClient.has(normalizedClientId)) {
        activeByClient.set(normalizedClientId, {
          count: 0,
          collaboratorIds: new Set(),
          services: new Set(),
        });
      }

      const clientData = activeByClient.get(normalizedClientId);
      clientData.count += 1;
      clientData.services.add(service);

      const normalizedCollaboratorId = toId(collaboratorId);
      if (normalizedCollaboratorId) {
        clientData.collaboratorIds.add(normalizedCollaboratorId);
      }
    };

    social.forEach((item) => addCollaboration(item.azienda, item.collaboratore, "Social"));
    webDesign.forEach((item) => addCollaboration(item.cliente, item.webDesigner, "Web Design"));
    webDesignV2.forEach((item) => addCollaboration(item.cliente, item.webDesigner, "Web Design"));
    googleAds.forEach((item) => addCollaboration(item.cliente, item.collaboratore, "Google Ads"));
    seo.forEach((item) => addCollaboration(item.cliente, item.seo, "SEO"));

    const clientIds = Array.from(activeByClient.keys());
    const collaboratorIds = Array.from(
      new Set(
        Array.from(activeByClient.values()).flatMap((item) =>
          Array.from(item.collaboratorIds)
        )
      )
    );

    const [clients, collaborators] = await Promise.all([
      Azienda.find({ _id: { $in: clientIds } })
        .select("nome cognome email partitaIva ragioneSociale etichetta indirizzo status")
        .lean(),
      Collaboratore.find({ _id: { $in: collaboratorIds } })
        .select("nome cognome")
        .lean(),
    ]);

    const collaboratorNames = new Map(
      collaborators.map((item) => [
        toId(item._id),
        `${item.nome || ""} ${item.cognome || ""}`.trim(),
      ])
    );

    const rows = clients
      .map((client) => {
        const activeData = activeByClient.get(toId(client._id));
        const contactName = `${client.nome || ""} ${client.cognome || ""}`.trim();

        return {
          client: client.etichetta || client.ragioneSociale || contactName || "Cliente senza nome",
          businessName: client.ragioneSociale || "",
          contactName,
          email: client.email || "",
          vatNumber: client.partitaIva || "",
          address: client.indirizzo || "",
          services: Array.from(activeData.services).sort().join(", "),
          collaborationCount: activeData.count,
          collaborators: Array.from(activeData.collaboratorIds)
            .map((id) => collaboratorNames.get(id))
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "it", { sensitivity: "base" }))
            .join(", "),
          accountStatus: client.status === "non_attivo" ? "Non attivo" : "Attivo",
        };
      })
      .sort((a, b) => a.client.localeCompare(b.client, "it", { sensitivity: "base" }));

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Hoon Web";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Clienti attivi", {
      views: [{ state: "frozen", ySplit: 3 }],
    });

    const titleRow = worksheet.addRow(["Clienti con collaborazioni attive"]);
    worksheet.mergeCells("A1:J1");
    titleRow.height = 28;
    titleRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 16 };
    titleRow.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF7C3AED" },
    };

    worksheet.addRow([]);

    const headerRow = worksheet.addRow([
      "Cliente",
      "Ragione sociale",
      "Referente",
      "Email",
      "Partita IVA",
      "Indirizzo",
      "Servizi attivi",
      "N. collaborazioni attive",
      "Collaboratori",
      "Stato account",
    ]);
    headerRow.height = 24;
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };

    rows.forEach((item, index) => {
      const row = worksheet.addRow([
        item.client,
        item.businessName,
        item.contactName,
        item.email,
        item.vatNumber,
        item.address,
        item.services,
        item.collaborationCount,
        item.collaborators,
        item.accountStatus,
      ]);

      row.alignment = { vertical: "top", wrapText: true };
      if (index % 2 === 1) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
    });

    worksheet.columns = [
      { width: 28 },
      { width: 28 },
      { width: 22 },
      { width: 32 },
      { width: 18 },
      { width: 36 },
      { width: 26 },
      { width: 18 },
      { width: 34 },
      { width: 15 },
    ];
    worksheet.autoFilter = { from: "A3", to: "J3" };

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 3) return;
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          left: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
          right: { style: "thin", color: { argb: "FFE2E8F0" } },
        };
      });
    });

    const excelBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="clienti_con_collaborazioni_attive_${date}.xlsx"`,
        "Content-Length": excelBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Errore export clienti con collaborazioni attive:", error);
    return NextResponse.json(
      { message: "Errore durante la generazione dell'export" },
      { status: 500 }
    );
  }
}
