import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabCustomer, HoonLabPriceList, HoonLabPriceListItem } from "@/models/HoonLab";

export async function PATCH(req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const body = await req.json();
    const priceList = await HoonLabPriceList.findById(id);

    if (!priceList) return NextResponse.json({ error: "Listino non trovato" }, { status: 404 });

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) return NextResponse.json({ error: "Nome listino obbligatorio" }, { status: 400 });
      priceList.name = name;
    }
    if (body.customerType !== undefined) priceList.customerType = body.customerType;

    let convertedPrices = 0;
    if (body.convertPricesToNet) {
      if (priceList.pricesNet) {
        return NextResponse.json({ error: "Questo listino e gia configurato con prezzi IVA esclusa" }, { status: 409 });
      }
      const vatRate = Number(body.vatRate ?? 22);
      if (!Number.isFinite(vatRate) || vatRate <= 0 || vatRate >= 100) {
        return NextResponse.json({ error: "Aliquota IVA non valida" }, { status: 400 });
      }

      const now = new Date();
      const activeItems = await HoonLabPriceListItem.find({ priceList: id, validTo: null }).lean();
      if (activeItems.length) {
        await HoonLabPriceListItem.updateMany(
          { _id: { $in: activeItems.map((item) => item._id) } },
          { $set: { validTo: now, notes: `Prezzo lordo chiuso per scorporo IVA ${vatRate}%` } }
        );
        await HoonLabPriceListItem.insertMany(activeItems.map((item) => ({
          priceList: id,
          product: item.product,
          price: Math.round((Number(item.price || 0) / (1 + vatRate / 100)) * 100) / 100,
          validFrom: now,
          validTo: null,
          notes: `Prezzo IVA esclusa (scorporo ${vatRate}%)`
        })));
        convertedPrices = activeItems.length;
      }
      priceList.pricesNet = true;
      priceList.pricesNetConvertedAt = now;
    }

    await priceList.save();
    return NextResponse.json({ priceList, convertedPrices });
  } catch (error) {
    console.error("Errore modifica listino Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore modifica listino" }, { status: 500 });
  }
}

export async function DELETE(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;

    const priceList = await HoonLabPriceList.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    );

    if (!priceList) {
      return NextResponse.json({ error: "Listino non trovato" }, { status: 404 });
    }

    await Promise.all([
      HoonLabPriceListItem.updateMany(
        { priceList: id, validTo: null },
        { $set: { validTo: new Date(), notes: "Listino eliminato dal gestionale" } }
      ),
      HoonLabCustomer.updateMany(
        { defaultPriceList: id },
        { $set: { defaultPriceList: null } }
      )
    ]);

    return NextResponse.json({ success: true, priceList });
  } catch (error) {
    console.error("Errore eliminazione listino Hoon Lab:", error);
    return NextResponse.json({ error: "Errore eliminazione listino" }, { status: 500 });
  }
}
