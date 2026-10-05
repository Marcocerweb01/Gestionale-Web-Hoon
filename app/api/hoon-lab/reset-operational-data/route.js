import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDB } from "@/utils/database";
import {
  HoonLabCustomer,
  HoonLabDeliveryNote,
  HoonLabDocumentSequence,
  HoonLabFinanceEntry,
  HoonLabOrderConfirmation,
  HoonLabQuote,
  HoonLabTodo
} from "@/models/HoonLab";

const CONFIRMATION = "CANCELLA DATI HOON LAB";

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["amministratore", "hoon_lab"].includes(session.user?.role)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
    }

    const body = await req.json();
    if (body.confirmation !== CONFIRMATION) {
      return NextResponse.json({ error: "Conferma non valida" }, { status: 400 });
    }

    await connectToDB();

    const [deliveryNotes, orders, quotes, customers, todos, sequences, financeEntries] = await Promise.all([
      HoonLabDeliveryNote.deleteMany({}),
      HoonLabOrderConfirmation.deleteMany({}),
      HoonLabQuote.deleteMany({}),
      HoonLabCustomer.deleteMany({}),
      HoonLabTodo.deleteMany({}),
      HoonLabDocumentSequence.deleteMany({}),
      HoonLabFinanceEntry.deleteMany({})
    ]);

    return NextResponse.json({
      message: "Dati operativi Hoon Lab eliminati",
      deleted: {
        deliveryNotes: deliveryNotes.deletedCount,
        orders: orders.deletedCount,
        quotes: quotes.deletedCount,
        customers: customers.deletedCount,
        todos: todos.deletedCount,
        sequences: sequences.deletedCount,
        financeEntries: financeEntries.deletedCount
      },
      preserved: ["products", "priceLists", "priceListItems", "pdfTemplates", "settings"]
    });
  } catch (error) {
    console.error("Errore reset dati operativi Hoon Lab:", error);
    return NextResponse.json({ error: "Errore durante la cancellazione" }, { status: 500 });
  }
}
