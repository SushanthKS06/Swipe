import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Invoice } from '../../types';

interface InvoicesState {
  data: Invoice[];
}

const initialState: InvoicesState = {
  data: [],
};

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

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    addInvoices(state, action: PayloadAction<Invoice[]>) {
      // Append new invoices
      state.data.push(...action.payload);
    },
    updateInvoice(state, action: PayloadAction<{ id: string; updates: Partial<Invoice> }>) {
      const idx = state.data.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) {
        state.data[idx] = {
          ...state.data[idx],
          ...action.payload.updates,
        };
        // Recompute missing fields dynamically
        state.data[idx].missingFields = computeInvoiceMissingFields(state.data[idx]);
      }
    },
    cascadeProductUpdate(
      state,
      action: PayloadAction<{ productId: string; name?: string; unitPrice?: number }>
    ) {
      const { productId, name, unitPrice } = action.payload;
      state.data.forEach(invoice => {
        if (invoice.productId === productId) {
          if (name !== undefined) {
            invoice.productName = name;
          }
          if (unitPrice !== undefined) {
            invoice.unitPrice = unitPrice;
          }
          // Recompute missing fields after cascade
          invoice.missingFields = computeInvoiceMissingFields(invoice);
        }
      });
    },
    cascadeCustomerUpdate(
      state,
      action: PayloadAction<{ customerId: string; customerName?: string }>
    ) {
      const { customerId, customerName } = action.payload;
      state.data.forEach(invoice => {
        if (invoice.customerId === customerId) {
          if (customerName !== undefined) {
            invoice.customerName = customerName;
          }
          // Recompute missing fields after cascade
          invoice.missingFields = computeInvoiceMissingFields(invoice);
        }
      });
    },
    clearAll(state) {
      state.data = [];
    },
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
