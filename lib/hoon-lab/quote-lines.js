import {
  HoonLabPriceList,
  HoonLabPriceListItem,
  HoonLabProduct
} from "@/models/HoonLab";
import { snapshotProduct } from "@/lib/hoon-lab/documents";

export async function resolvePriceList(customer, requestedPriceList) {
  if (requestedPriceList) {
    return HoonLabPriceList.findById(requestedPriceList);
  }

  if (customer?.defaultPriceList) {
    return HoonLabPriceList.findById(customer.defaultPriceList);
  }

  return HoonLabPriceList.findOne({ active: true, customerType: customer?.type }).sort({ createdAt: -1 });
}

export async function buildQuoteLines(lines = [], priceList) {
  const productIds = lines.map((line) => line.product).filter(Boolean);
  const products = await HoonLabProduct.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((product) => [product._id.toString(), product]));

  const activePrices = priceList && productIds.length
    ? await HoonLabPriceListItem.find({
        priceList: priceList._id,
        product: { $in: productIds },
        validFrom: { $lte: new Date() },
        $or: [{ validTo: null }, { validTo: { $gte: new Date() } }]
      }).sort({ validFrom: -1 }).lean()
    : [];

  const priceMap = new Map();
  activePrices.forEach((item) => {
    const key = item.product.toString();
    if (!priceMap.has(key)) priceMap.set(key, item.price);
  });

  return lines.map((line, index) => {
    const productId = line.product ? String(line.product) : "";
    const product = productId ? productMap.get(productId) : null;
    const isCustomLine = !productId;
    const description = String(line.description || product?.name || "").trim();

    if (productId && !product) {
      throw new Error("Prodotto non trovato in una riga del preventivo");
    }
    if (isCustomLine && !description) {
      throw new Error("Inserisci la descrizione della riga personalizzata");
    }

    const listPrice = product ? priceMap.get(product._id.toString()) : undefined;
    const hasManualPrice = line.unitPrice !== undefined && line.unitPrice !== null && line.unitPrice !== "";
    if (product && !hasManualPrice && listPrice === undefined) {
      throw new Error(`Manca il prezzo di listino per il prodotto "${product.name}"`);
    }

    const referencePrice = listPrice ?? 0;
    const unitPrice = hasManualPrice ? Number(line.unitPrice) : Number(listPrice || 0);
    const pricePending = isCustomLine && (!hasManualPrice || Boolean(line.pricePending));

    return {
      product: product?._id || null,
      productSnapshot: product ? snapshotProduct(product) : {},
      description,
      quantity: Number(line.quantity || 1),
      unit: line.unit || product?.unit || "pz",
      unitPrice,
      pricePending,
      manualUnitPrice: isCustomLine || Boolean(line.manualUnitPrice || (hasManualPrice && Number(referencePrice) !== unitPrice)),
      discountType: line.discountType || "none",
      discountValue: Number(line.discountValue || 0),
      increaseType: line.increaseType || "none",
      increaseValue: Number(line.increaseValue || 0),
      notes: line.notes || "",
      sortOrder: line.sortOrder ?? index
    };
  });
}
