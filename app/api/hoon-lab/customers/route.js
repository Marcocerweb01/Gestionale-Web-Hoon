import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabCustomer } from "@/models/HoonLab";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    const filter = {
      active: true,
      ...(type ? { type } : {}),
      ...(search ? { $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { vatNumber: { $regex: search, $options: "i" } },
        { "billingAddress.address": { $regex: search, $options: "i" } }
      ] } : {})
    };

    const customers = await HoonLabCustomer.find(filter)
      .populate("defaultPriceList", "name customerType currency")
      .sort({ name: 1 })
      .lean();

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Errore clienti Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento clienti" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json();
    const type = body.type || "privato";
    const name = String(body.name || "").trim();

    if (!name && type !== "team") {
      return NextResponse.json({ error: "Nome cliente obbligatorio" }, { status: 400 });
    }

    const customer = await HoonLabCustomer.create({
      name: name || "Team",
      type,
      email: body.email || "",
      phone: body.phone || "",
      vatNumber: body.vatNumber || "",
      taxCode: body.taxCode || "",
      billingAddress: body.billingAddress || {},
      shippingAddress: body.shippingAddress || {},
      defaultPriceList: body.defaultPriceList || null,
      notes: body.notes || "",
      active: body.active !== false
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Errore creazione cliente Hoon Lab:", error);
    return NextResponse.json({ error: "Errore creazione cliente" }, { status: 500 });
  }
}
