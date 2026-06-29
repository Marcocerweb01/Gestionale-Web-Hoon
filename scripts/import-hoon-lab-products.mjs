import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectToDB } from "../utils/database.js";
import { importHoonLabProductsFromXlsx } from "../lib/hoon-lab/product-import.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(rootDir, ".env.local") });
dotenv.config({ path: path.join(rootDir, ".env") });

const dryRun = process.argv.includes("--dry-run");
const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
const filePath = path.resolve(rootDir, fileArg ? fileArg.slice("--file=".length) : "Prezzi Prodotti.xlsx");

try {
  if (!dryRun) await connectToDB();
  const result = await importHoonLabProductsFromXlsx(filePath, {
    sourceName: path.basename(filePath),
    dryRun
  });

  console.log(JSON.stringify(result, null, 2));
} finally {
  if (!dryRun) await mongoose.disconnect();
}
