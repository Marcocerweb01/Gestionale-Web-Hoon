import { HoonLabDocumentSequence } from "@/models/HoonLab";

const PREFIXES = {
  quote: "PREV",
  order_confirmation: "ORD",
  delivery_note: "DDT"
};

export function snapshotCustomer(customer) {
  return {
    id: customer._id?.toString(),
    name: customer.name,
    type: customer.type,
    email: customer.email,
    phone: customer.phone,
    vatNumber: customer.vatNumber,
    taxCode: customer.taxCode,
    billingAddress: customer.billingAddress,
    shippingAddress: customer.shippingAddress,
    notes: customer.notes
  };
}

export function snapshotProduct(product) {
  if (!product) return {};
  return {
    id: product._id?.toString(),
    sku: product.sku,
    name: product.name,
    description: product.description,
    basePrice: product.basePrice,
    unit: product.unit,
    category: product.category
  };
}

export function snapshotPriceList(priceList) {
  if (!priceList) return {};
  return {
    id: priceList._id?.toString(),
    name: priceList.name,
    customerType: priceList.customerType,
    currency: priceList.currency
  };
}

export async function getNextDocumentNumber(documentType, date = new Date()) {
  const year = date.getFullYear();
  const prefix = PREFIXES[documentType] || "DOC";
  const sequence = await HoonLabDocumentSequence.findOneAndUpdate(
    { documentType, year },
    { $setOnInsert: { prefix }, $inc: { nextNumber: 1 } },
    { new: true, upsert: true }
  );

  const number = sequence.nextNumber - 1;
  return `${prefix}-${year}-${String(number).padStart(4, "0")}`;
}

export function mapQuoteLinesToDeliveryLines(lines = []) {
  return lines.map((line, index) => ({
    product: line.product || null,
    productSnapshot: line.productSnapshot || {},
    description: line.description,
    quantity: line.quantity,
    unit: line.unit || line.productSnapshot?.unit || "pz",
    notes: line.notes || "",
    sortOrder: index
  }));
}
