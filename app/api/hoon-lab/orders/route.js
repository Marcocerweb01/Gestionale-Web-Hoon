import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabOrderConfirmation } from "@/models/HoonLab";

export async function GET(req) {
  try {
    await connectToDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const customer = searchParams.get("customer");

    const orders = await HoonLabOrderConfirmation.find({
      ...(status ? { status } : {}),
      ...(customer ? { customer } : {})
    })
      .populate("customer", "name type email")
      .populate("quote", "number status")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Errore ordini Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento ordini" }, { status: 500 });
  }
}
