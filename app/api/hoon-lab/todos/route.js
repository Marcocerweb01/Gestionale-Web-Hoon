import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabTodo, HOON_LAB } from "@/models/HoonLab";

export async function GET() {
  try {
    await connectToDB();
    const todos = await HoonLabTodo.find({ active: true })
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(todos);
  } catch (error) {
    console.error("Errore todo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento attivita" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const note = String(body.note || "").trim();
    const status = HOON_LAB.TODO_STATUSES.includes(body.status) ? body.status : "da_fare";
    const now = new Date();

    if (!note) {
      return NextResponse.json({ error: "Scrivi una nota per creare l'attivita" }, { status: 400 });
    }

    const todo = await HoonLabTodo.create({
      note,
      dueDate: body.dueDate || null,
      status,
      statusChangedAt: now,
      statusHistory: [{ status, at: now }]
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error) {
    console.error("Errore creazione todo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione attivita" }, { status: 500 });
  }
}
