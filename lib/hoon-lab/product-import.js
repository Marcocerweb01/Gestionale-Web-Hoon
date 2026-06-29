import ExcelJS from "exceljs";
import {
  HoonLabPdfTemplate,
  HoonLabPriceList,
  HoonLabPriceListItem,
  HoonLabProduct
} from "../../models/HoonLab.js";
import { DEFAULT_PDF_CSS, DEFAULT_PDF_TEMPLATES } from "./templates.js";

const DEFAULT_BLOCK_CATEGORIES = [
  "Kit moto",
  "Kit MTB e bici",
  "Grafica",
  "Adesivi e kit vari",
  "Abbigliamento - maglie e camicie",
  "Abbigliamento - pantaloni",
  "Abbigliamento - felpe",
  "Abbigliamento - soft shell",
  "Accessori e calzature",
  "Alta visibilita"
];

function cellText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    return value.text || value.result || value.richText?.map((item) => item.text).join("") || "";
  }
  return String(value);
}

function cellNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") return cellNumber(value.result ?? value.text);
  const normalized = String(value).replace(/[^\d,.-]/g, "").replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function normalizeName(value) {
  return cellText(value).replace(/\s+/g, " ").trim();
}

function skuFromRow(rowNumber) {
  return `HLAB-${String(rowNumber).padStart(3, "0")}`;
}

function readRows(worksheet) {
  const rows = [];
  let blockIndex = -1;
  let previousWasBlank = true;

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const name = normalizeName(row.getCell(1).value);
    const publicPrice = cellNumber(row.getCell(2).value);
    const teamPrice = cellNumber(row.getCell(3).value);

    if (!name) {
      previousWasBlank = true;
      continue;
    }

    if (previousWasBlank) blockIndex += 1;
    previousWasBlank = false;

    rows.push({
      rowNumber,
      sku: skuFromRow(rowNumber),
      name,
      publicPrice,
      teamPrice: teamPrice ?? publicPrice,
      category: DEFAULT_BLOCK_CATEGORIES[blockIndex] || "Prodotti",
      unit: "pz"
    });
  }

  return rows.filter((row) => row.publicPrice !== null || row.teamPrice !== null);
}

async function upsertPriceList({ name, customerType }) {
  return HoonLabPriceList.findOneAndUpdate(
    { name },
    {
      $set: {
        customerType,
        currency: "EUR",
        active: true
      }
    },
    { new: true, upsert: true }
  );
}

async function upsertPrice({ priceList, product, price, sourceName }) {
  if (price === null || price === undefined || Number.isNaN(Number(price))) return false;

  await HoonLabPriceListItem.findOneAndUpdate(
    {
      priceList: priceList._id,
      product: product._id,
      validTo: null
    },
    {
      $set: {
        price: Number(price),
        validFrom: new Date(),
        notes: `Importato da ${sourceName}`
      }
    },
    { new: true, upsert: true }
  );

  return true;
}

async function upsertDefaultQuoteTemplate() {
  const base = DEFAULT_PDF_TEMPLATES.quote;
  const template = await HoonLabPdfTemplate.findOneAndUpdate(
    { type: "quote", name: base.name },
    {
      $set: {
        type: "quote",
        name: base.name,
        html: base.html,
        css: DEFAULT_PDF_CSS,
        active: true
      }
    },
    { new: true, upsert: true }
  );

  return template.name;
}

export async function parseHoonLabProductWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) throw new Error("Il file Excel non contiene fogli");

  return readRows(worksheet);
}

export async function importHoonLabProductsFromXlsx(filePath, options = {}) {
  const rows = await parseHoonLabProductWorkbook(filePath);
  const sourceName = options.sourceName || "Prezzi Prodotti.xlsx";

  if (options.dryRun) {
    return {
      dryRun: true,
      products: rows.length,
      rows
    };
  }

  const [publicList, teamList] = await Promise.all([
    upsertPriceList({ name: "Prezzo Pubblico", customerType: "privato" }),
    upsertPriceList({ name: "Prezzo Team", customerType: "team" })
  ]);
  const quoteTemplate = await upsertDefaultQuoteTemplate();

  let created = 0;
  let updated = 0;
  let prices = 0;

  for (const row of rows) {
    const existing = await HoonLabProduct.findOne({ sku: row.sku });
    const product = await HoonLabProduct.findOneAndUpdate(
      { sku: row.sku },
      {
        $set: {
          sku: row.sku,
          name: row.name,
          description: "",
          basePrice: row.publicPrice ?? row.teamPrice ?? 0,
          unit: row.unit,
          category: row.category,
          active: true
        }
      },
      { new: true, upsert: true }
    );

    if (existing) updated += 1;
    else created += 1;

    if (await upsertPrice({ priceList: publicList, product, price: row.publicPrice, sourceName })) prices += 1;
    if (await upsertPrice({ priceList: teamList, product, price: row.teamPrice, sourceName })) prices += 1;
  }

  return {
    dryRun: false,
    products: rows.length,
    created,
    updated,
    prices,
    priceLists: [publicList.name, teamList.name],
    quoteTemplate
  };
}
