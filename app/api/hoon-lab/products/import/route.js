import path from "node:path";
import { NextResponse } from "next/server";
import { connectToDB } from "@/utils/database";
import { importHoonLabProductsFromXlsx } from "@/lib/hoon-lab/product-import";

export async function POST(req) {
  try {
    await connectToDB();
    const body = await req.json().catch(() => ({}));
    const filePath = path.resolve(process.cwd(), body.filePath || "Prezzi Prodotti.xlsx");
    const result = await importHoonLabProductsFromXlsx(filePath, {
      sourceName: path.basename(filePath),
      dryRun: body.dryRun === true
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Errore import prodotti Hoon Lab:", error);
    return NextResponse.json(
      { error: error.message || "Errore import prodotti" },
      { status: 500 }
    );
  }
}
