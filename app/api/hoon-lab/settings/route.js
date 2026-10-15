import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { DEFAULT_HOON_LAB_SETTINGS, HoonLabSettings } from "@/models/HoonLab";
import { LEGACY_DEFAULT_QUOTE_NOTES } from "@/lib/hoon-lab/quote-note.mjs";

async function getSettings() {
  const settings = await HoonLabSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default", ...DEFAULT_HOON_LAB_SETTINGS } },
    { new: true, upsert: true }
  ).lean();

  if (!LEGACY_DEFAULT_QUOTE_NOTES.includes(settings.quoteNote)) return settings;

  const updatedSettings = await HoonLabSettings.findOneAndUpdate(
    { key: "default", quoteNote: { $in: LEGACY_DEFAULT_QUOTE_NOTES } },
    { $set: { quoteNote: DEFAULT_HOON_LAB_SETTINGS.quoteNote } },
    { new: true }
  ).lean();

  return updatedSettings || settings;
}

export async function GET() {
  try {
    await connectToDB();
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Errore impostazioni Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento impostazioni" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const update = {
      companyName: String(body.companyName || "").trim() || DEFAULT_HOON_LAB_SETTINGS.companyName,
      companyHeader: String(body.companyHeader || "").trim() || DEFAULT_HOON_LAB_SETTINGS.companyHeader,
      quoteNoteTitle: String(body.quoteNoteTitle || "").trim() || DEFAULT_HOON_LAB_SETTINGS.quoteNoteTitle,
      quoteNote: String(body.quoteNote || "").trim() || DEFAULT_HOON_LAB_SETTINGS.quoteNote
    };

    const settings = await HoonLabSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { new: true, upsert: true }
    ).lean();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Errore salvataggio impostazioni Hoon Lab:", error);
    return NextResponse.json({ error: "Errore salvataggio impostazioni" }, { status: 500 });
  }
}
