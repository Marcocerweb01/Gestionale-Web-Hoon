import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPriceListItem, HoonLabProduct } from "@/models/HoonLab";

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
