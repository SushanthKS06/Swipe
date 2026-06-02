import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { Invoice } from '../../types';

export function computeInvoiceMissingFields(invoice: Invoice): string[] {
  const fieldsToCheck: Array<keyof Invoice> = [
    'serialNumber',
    'customerName',
    'productName',
    'quantity',
    'unitPrice',
    'taxAmount',
    'taxPercentage',
    'totalAmount',
    'netAmount',
    'date',
  ];
  return fieldsToCheck.filter(f => {
    const val = invoice[f];
    return val === null || val === undefined || val === '';
  }) as string[];
}

export const invoicesAdapter = createEntityAdapter<Invoice>();

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState: invoicesAdapter.getInitialState(),
  reducers: {
    addInvoices: invoicesAdapter.addMany,
    updateInvoice(state, action: PayloadAction<{ id: string; updates: Partial<Invoice> }>) {
      invoicesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.updates,
      });
      // Recompute missing fields dynamically
      const invoice = state.entities[action.payload.id];
      if (invoice) {
        invoice.missingFields = computeInvoiceMissingFields(invoice as Invoice);
      }
    },
    cascadeProductUpdate(
      state,
      action: PayloadAction<{ productId: string; name?: string; unitPrice?: number }>
    ) {
      const { productId, name, unitPrice } = action.payload;
      Object.values(state.entities).forEach(invoice => {
        if (invoice && invoice.productId === productId) {
          if (name !== undefined) {
            invoice.productName = name;
          }
          if (unitPrice !== undefined) {
            invoice.unitPrice = unitPrice;
          }
          // Recompute missing fields after cascade
          invoice.missingFields = computeInvoiceMissingFields(invoice as Invoice);
        }
      });
    },
    cascadeCustomerUpdate(
      state,
      action: PayloadAction<{ customerId: string; customerName?: string }>
    ) {
      const { customerId, customerName } = action.payload;
      Object.values(state.entities).forEach(invoice => {
        if (invoice && invoice.customerId === customerId) {
          if (customerName !== undefined) {
            invoice.customerName = customerName;
          }
          // Recompute missing fields after cascade
          invoice.missingFields = computeInvoiceMissingFields(invoice as Invoice);
        }
      });
    },
    clearAll: invoicesAdapter.removeAll,
  },
});

export const {
  addInvoices,
  updateInvoice,
  cascadeProductUpdate,
  cascadeCustomerUpdate,
  clearAll,
} = invoicesSlice.actions;

export default invoicesSlice.reducer;
