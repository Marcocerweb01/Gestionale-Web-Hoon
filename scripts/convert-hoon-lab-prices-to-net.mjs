import dotenv from "dotenv";
import mongoose from "mongoose";
import {
  HoonLabPriceList,
  HoonLabPriceListItem
} from "../models/HoonLab.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const apply = process.argv.includes("--apply");
const vatRate = 22;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI non configurato");
}

await mongoose.connect(process.env.MONGODB_URI, { dbName: "Webarea" });

try {
  const allPriceLists = await HoonLabPriceList.find({ active: true }).lean();
  const priceLists = allPriceLists.filter((priceList) => priceList.pricesNet !== true);
  const preview = [];

  for (const priceList of allPriceLists) {
    const itemCount = await HoonLabPriceListItem.countDocuments({ priceList: priceList._id, validTo: null });
    preview.push({
      id: String(priceList._id),
      name: priceList.name,
      itemCount,
      pricesNet: priceList.pricesNet === true,
      needsConversion: priceList.pricesNet !== true,
      convertedAt: priceList.pricesNetConvertedAt || null
    });
  }

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", vatRate, priceLists: preview }, null, 2));

  if (apply && priceLists.length) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const priceList of priceLists) {
          const now = new Date();
          const activeItems = await HoonLabPriceListItem.find({
            priceList: priceList._id,
            validTo: null
          }).session(session).lean();

          if (activeItems.length) {
            await HoonLabPriceListItem.updateMany(
              { _id: { $in: activeItems.map((item) => item._id) } },
              { $set: { validTo: now, notes: `Prezzo lordo chiuso per scorporo IVA ${vatRate}%` } },
              { session }
            );
            await HoonLabPriceListItem.insertMany(activeItems.map((item) => ({
              priceList: priceList._id,
              product: item.product,
              price: Math.round((Number(item.price || 0) / (1 + vatRate / 100)) * 100) / 100,
              validFrom: now,
              validTo: null,
              notes: `Prezzo IVA esclusa (scorporo ${vatRate}%)`
            })), { session });
          }

          await HoonLabPriceList.updateOne(
            { _id: priceList._id },
            { $set: { pricesNet: true, pricesNetConvertedAt: now } },
            { session }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  }
} finally {
  await mongoose.disconnect();
}
