import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabTodo, HOON_LAB } from "@/models/HoonLab";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const todo = await HoonLabTodo.findById(id);

    if (!todo || todo.active === false) {
      return NextResponse.json({ error: "Attivita non trovata" }, { status: 404 });
    }

    if (body.note !== undefined) {
      const note = String(body.note || "").trim();
      if (!note) return NextResponse.json({ error: "La nota non puo essere vuota" }, { status: 400 });
      todo.note = note;
    }

    if (body.dueDate !== undefined) {
      todo.dueDate = body.dueDate || null;
    }

    if (body.status !== undefined) {
      if (!HOON_LAB.TODO_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Stato attivita non valido" }, { status: 400 });
      }

      if (todo.status !== body.status) {
        const now = new Date();
        todo.status = body.status;
        todo.statusChangedAt = now;
        todo.statusHistory.push({ status: body.status, at: now });
      }
    }

    await todo.save();
    return NextResponse.json(todo);
  } catch (error) {
    console.error("Errore aggiornamento todo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore aggiornamento attivita" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const todo = await HoonLabTodo.findByIdAndUpdate(
      id,
      { active: false },
      { new: true }
    );

    if (!todo) return NextResponse.json({ error: "Attivita non trovata" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore eliminazione todo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore eliminazione attivita" }, { status: 500 });
  }
}
