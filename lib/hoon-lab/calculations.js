export function roundMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function adjustmentAmount(type, value, base) {
  if (!type || type === "none") return 0;
  if (type === "percent") return roundMoney((base * Number(value || 0)) / 100);
  return roundMoney(Number(value || 0));
}

export function calculateCommercialLine(line) {
  const quantity = Number(line.quantity || 0);
  const unitPrice = Number(line.unitPrice || 0);
  const lineSubtotal = roundMoney(quantity * unitPrice);
  const lineDiscount = adjustmentAmount(line.discountType, line.discountValue, lineSubtotal);
  const lineIncrease = adjustmentAmount(line.increaseType, line.increaseValue, lineSubtotal - lineDiscount);
  const lineTotal = roundMoney(Math.max(0, lineSubtotal - lineDiscount + lineIncrease));

  return {
    ...line,
    quantity,
    unitPrice,
    discountValue: Number(line.discountValue || 0),
    increaseValue: Number(line.increaseValue || 0),
    lineSubtotal,
    lineDiscount,
    lineIncrease,
    lineTotal
  };
}

export function calculateDocumentTotals(lines = [], options = {}) {
  const calculatedLines = lines.map(calculateCommercialLine);
  const subtotal = roundMoney(calculatedLines.reduce((sum, line) => sum + line.lineSubtotal, 0));
  const lineDiscountTotal = roundMoney(calculatedLines.reduce((sum, line) => sum + line.lineDiscount, 0));
  const increaseTotal = roundMoney(calculatedLines.reduce((sum, line) => sum + line.lineIncrease, 0));
  const documentDiscountBase = roundMoney(Math.max(0, subtotal - lineDiscountTotal + increaseTotal));
  const documentDiscountAmount = roundMoney(Math.min(
    documentDiscountBase,
    adjustmentAmount(options.quoteDiscountType, options.quoteDiscountValue, documentDiscountBase)
  ));
  const discountTotal = roundMoney(lineDiscountTotal + documentDiscountAmount);

  return {
    lines: calculatedLines,
    subtotal,
    lineDiscountTotal,
    quoteDiscountAmount: documentDiscountAmount,
    discountTotal,
    increaseTotal,
    total: roundMoney(Math.max(0, subtotal - discountTotal + increaseTotal))
  };
}
