import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { HoonLabOrderConfirmation, HoonLabQuote } from "@/models/HoonLab";
import { getNextDocumentNumber } from "@/lib/hoon-lab/documents";

export async function POST(_req, { params }) {
  try {
    await connectToDB();
    const { id } = await params;
    const quote = await HoonLabQuote.findOne({
      _id: id,
      status: { $in: ["inviato", "accettato"] },
      convertedOrder: null
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Preventivo non trovato, non inviato/accettato o gia convertito" },
        { status: 409 }
      );
    }

    const order = await HoonLabOrderConfirmation.create({
      number: await getNextDocumentNumber("order_confirmation", new Date()),
      quote: quote._id,
      customer: quote.customer,
      customerSnapshot: quote.customerSnapshot,
      status: "confermato",
      issueDate: new Date(),
      lines: quote.lines.map((line) => line.toObject ? line.toObject() : line),
      quoteDiscountType: quote.quoteDiscountType,
      quoteDiscountValue: quote.quoteDiscountValue,
      quoteDiscountAmount: quote.quoteDiscountAmount,
      subtotal: quote.subtotal,
      discountTotal: quote.discountTotal,
      increaseTotal: quote.increaseTotal,
      total: quote.total,
      notes: quote.notes
    });

    const update = await HoonLabQuote.updateOne(
      {
        _id: quote._id,
        status: { $in: ["inviato", "accettato"] },
        convertedOrder: null
      },
      {
        $set: {
          status: "convertito",
          acceptedAt: quote.acceptedAt || new Date(),
          rejectedAt: null,
          rejectionReason: "",
          convertedOrder: order._id
        }
      }
    );

    if (update.modifiedCount !== 1) {
      await HoonLabOrderConfirmation.deleteOne({ _id: order._id });
      return NextResponse.json({ error: "Preventivo gia convertito" }, { status: 409 });
    }

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Errore conversione Hoon Lab:", error);
    return NextResponse.json({ error: error.message || "Errore conversione preventivo" }, { status: 400 });
  }
}
