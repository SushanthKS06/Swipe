import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../types';

export function computeProductMissingFields(product: Product): string[] {
  const fieldsToCheck: Array<keyof Product> = [
    'name',
    'quantity',
    'unitPrice',
    'tax',
    'taxPercentage',
    'priceWithTax',
    'discount',
  ];
  return fieldsToCheck.filter(f => {
    const val = product[f];
    return val === null || val === undefined || val === '';
  }) as string[];
}

export const productsAdapter = createEntityAdapter<Product>();

const productsSlice = createSlice({
  name: 'products',
  initialState: productsAdapter.getInitialState(),
  reducers: {
    addProducts: productsAdapter.addMany,
    updateProduct(state, action: PayloadAction<{ id: string; updates: Partial<Product> }>) {
      productsAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.updates,
      });
      // Recompute missing fields dynamically
      const product = state.entities[action.payload.id];
      if (product) {
        product.missingFields = computeProductMissingFields(product as Product);
      }
    },
    clearAll: productsAdapter.removeAll,
  },
});

export const { addProducts, updateProduct, clearAll } = productsSlice.actions;

export default productsSlice.reducer;
