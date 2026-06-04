import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPriceList, HoonLabPriceListItem, HoonLabProduct } from "@/models/HoonLab";

export async function GET(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;

    const items = await HoonLabPriceListItem.find({ priceList: id })
      .populate("product", "name sku unit category")
      .sort({ product: 1, validFrom: -1 })
      .lean();

    return NextResponse.json(items);
  } catch (error) {
    console.error("Errore prezzi listino Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento prezzi listino" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();

    if (!body.product || body.price === undefined) {
      return NextResponse.json({ error: "Prodotto e prezzo sono obbligatori" }, { status: 400 });
    }

    const [priceList, product] = await Promise.all([
      HoonLabPriceList.findById(id),
      HoonLabProduct.findById(body.product)
    ]);

    if (!priceList || !product) {
      return NextResponse.json({ error: "Listino o prodotto non trovato" }, { status: 404 });
    }

    const validFrom = body.validFrom ? new Date(body.validFrom) : new Date();

    await HoonLabPriceListItem.updateMany(
      { priceList: id, product: body.product, validTo: null },
      { $set: { validTo: validFrom } }
    );

    const item = await HoonLabPriceListItem.create({
      priceList: id,
      product: body.product,
      price: Number(body.price),
      validFrom,
      validTo: null,
      notes: body.notes || ""
    });

    const populated = await HoonLabPriceListItem.findById(item._id).populate("product", "name sku unit category").lean();
    return NextResponse.json(populated, { status: 201 });
  } catch (error) {
    console.error("Errore creazione prezzo Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione prezzo" }, { status: 500 });
  }
}
