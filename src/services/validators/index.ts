import { Invoice } from '../../types';

export function validateExtractionMath(invoices: Invoice[]): void {
  for (const inv of invoices) {
    let mathFailed = false;

    // Check 1: quantity * unitPrice == netAmount
    if (inv.quantity !== null && inv.unitPrice !== null && inv.netAmount !== null) {
      const expectedNet = inv.quantity * inv.unitPrice;
      if (Math.abs(expectedNet - inv.netAmount) > 0.05) {
        mathFailed = true;
      }
    }

    // Check 2: netAmount + taxAmount == totalAmount
    if (inv.netAmount !== null && inv.taxAmount !== null && inv.totalAmount !== null) {
      const expectedTotal = inv.netAmount + inv.taxAmount;
      if (Math.abs(expectedTotal - inv.totalAmount) > 0.05) {
        mathFailed = true;
      }
    }

    if (mathFailed) {
      inv.confidence = 'low';
    }
  }
}
