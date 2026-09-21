import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabDeliveryNote, HoonLabOrderConfirmation } from "@/models/HoonLab";

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

    const orderIds = orders.map((order) => order._id);
    const deliveryNotes = await HoonLabDeliveryNote.find({
      orderConfirmation: { $in: orderIds },
      status: { $ne: "annullato" }
    }).select("orderConfirmation").lean();
    const ordersWithDdt = new Set(deliveryNotes.map((note) => String(note.orderConfirmation)));

    return NextResponse.json(orders.map((order) => ({
      ...order,
      hasDeliveryNote: ordersWithDdt.has(String(order._id)),
      balanceDue: order.balanceDue ?? Math.max(0, Number(order.total || 0) - Number(order.amountPaid || 0))
    })));
  } catch (error) {
    console.error("Errore ordini Hoon Lab:", error);
    return NextResponse.json({ error: "Errore caricamento ordini" }, { status: 500 });
  }
}
