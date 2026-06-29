import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabCustomer, HoonLabPriceList, HoonLabPriceListItem } from "@/models/HoonLab";

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
