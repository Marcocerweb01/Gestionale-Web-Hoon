import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabFinanceEntry } from "@/models/HoonLab";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const entry = await HoonLabFinanceEntry.findById(id);
    if (!entry) return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });

    ["description", "category", "notes"].forEach((field) => {
      if (body[field] !== undefined) entry[field] = String(body[field] || "").trim();
    });
    if (body.type !== undefined) entry.type = body.type;
    if (body.amount !== undefined) entry.amount = Number(body.amount);
    if (body.date !== undefined) entry.date = body.date;
    if (body.recurring !== undefined) {
      entry.recurring = Boolean(body.recurring) && entry.type === "expense";
      entry.recurrence = entry.recurring ? "monthly" : "";
    }
    if (body.recurrenceEnd !== undefined) entry.recurrenceEnd = body.recurrenceEnd || null;

    await entry.save();
    return NextResponse.json(entry);
  } catch (error) {
    console.error("Errore modifica movimento Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore modifica movimento" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const entry = await HoonLabFinanceEntry.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
    if (!entry) return NextResponse.json({ error: "Movimento non trovato" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione movimento Hoon Lab:", error);
    return NextResponse.json({ error: "Errore eliminazione movimento" }, { status: 500 });
  }
}
