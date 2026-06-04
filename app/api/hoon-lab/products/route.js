import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabPriceList, HoonLabPriceListItem, HoonLabProduct } from "@/models/HoonLab";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const includeInactive = searchParams.get("inactive") === "true";

    const filter = {
      ...(includeInactive ? {} : { active: true }),
      ...(search ? { $or: [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } }
      ] } : {})
    };

    const products = await HoonLabProduct.find(filter).sort({ name: 1 }).lean();
    return NextResponse.json(products);
  } catch (error) {
    console.error("Errore prodotti Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento prodotti" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ error: "Nome prodotto obbligatorio" }, { status: 400 });
    }

    const priceListOnePrice = body.priceListOnePrice === "" || body.priceListOnePrice === undefined
      ? null
      : Number(body.priceListOnePrice);
    const priceListTwoPrice = body.priceListTwoPrice === "" || body.priceListTwoPrice === undefined
      ? null
      : Number(body.priceListTwoPrice);

    const product = await HoonLabProduct.create({
      sku: body.sku || "",
      name: body.name,
      description: body.description || "",
      basePrice: 0,
      unit: body.unit || "pz",
      category: body.category || "",
      active: body.active !== false
    });

    const priceListDefinitions = [
      {
        price: priceListOnePrice,
        priceListId: body.priceListOneId,
        fallbackName: "Listino 1",
        fallbackCustomerType: "privato"
      },
      {
        price: priceListTwoPrice,
        priceListId: body.priceListTwoId,
        fallbackName: "Listino 2",
        fallbackCustomerType: "team"
      }
    ];
    const usedPriceLists = new Set();

    for (const definition of priceListDefinitions) {
      if (definition.price === null || Number.isNaN(definition.price)) continue;

      let priceList = null;
      if (definition.priceListId) {
        priceList = await HoonLabPriceList.findById(definition.priceListId);
      }

      if (!priceList) {
        priceList = await HoonLabPriceList.findOneAndUpdate(
          { name: definition.fallbackName, active: true },
          {
            $setOnInsert: {
              name: definition.fallbackName,
              customerType: definition.fallbackCustomerType,
              currency: "EUR",
              active: true
            }
          },
          { new: true, upsert: true }
        );
      }

      const priceListKey = priceList._id.toString();
      if (usedPriceLists.has(priceListKey)) continue;
      usedPriceLists.add(priceListKey);

      await HoonLabPriceListItem.findOneAndUpdate(
        {
          priceList: priceList._id,
          product: product._id,
          validTo: null
        },
        {
          $set: {
            price: definition.price,
            validFrom: new Date(),
            notes: "Prezzo inserito in creazione prodotto"
          }
        },
        { new: true, upsert: true }
      );
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Errore creazione prodotto Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione prodotto" }, { status: 500 });
  }
}
