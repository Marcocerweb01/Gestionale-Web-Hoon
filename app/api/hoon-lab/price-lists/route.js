import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPriceList, HoonLabPriceListItem } from "@/models/HoonLab";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const includeItems = searchParams.get("items") === "true";

    const priceLists = await HoonLabPriceList.find({ active: true }).sort({ customerType: 1, name: 1 }).lean();

    if (!includeItems) {
      return NextResponse.json(priceLists);
    }

    const items = await HoonLabPriceListItem.find({
      priceList: { $in: priceLists.map((list) => list._id) },
      validTo: null
    }).populate("product", "name sku unit category").sort({ validFrom: -1 }).lean();

    return NextResponse.json(priceLists.map((list) => ({
      ...list,
      items: items.filter((item) => item.priceList.toString() === list._id.toString())
    })));
  } catch (error) {
    console.error("Errore listini Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento listini" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Nome listino obbligatorio" }, { status: 400 });
    }

    const priceList = await HoonLabPriceList.create({
      name: body.name,
      customerType: body.customerType || "privato",
      currency: body.currency || "EUR",
      active: body.active !== false
    });

    return NextResponse.json(priceList, { status: 201 });
  } catch (error) {
    console.error("Errore creazione listino Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione listino" }, { status: 500 });
  }
}
