import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPriceListItem, HoonLabProduct } from "@/models/HoonLab";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const updates = {};

    ["name", "sku", "description", "unit", "category"].forEach((field) => {
      if (body[field] !== undefined) updates[field] = String(body[field] || "").trim();
    });

    if (body.active !== undefined) updates.active = Boolean(body.active);
    if (updates.name !== undefined && !updates.name) {
      return NextResponse.json({ error: "Nome prodotto obbligatorio" }, { status: 400 });
    }

    const product = await HoonLabProduct.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!product) return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error("Errore modifica prodotto Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore modifica prodotto" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;

    const product = await HoonLabProduct.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );

    if (!product) {
      return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
    }

    await HoonLabPriceListItem.updateMany(
      { product: id, validTo: null },
      { $set: { validTo: new Date(), notes: "Prodotto eliminato dal gestionale" } }
    );

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Errore eliminazione prodotto Hoon Lab:", error);
    return NextResponse.json({ error: "Errore eliminazione prodotto" }, { status: 500 });
  }
}
