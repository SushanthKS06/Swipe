import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../../types';

interface ProductsState {
  data: Product[];
}

const initialState: ProductsState = {
  data: [],
};

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

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    addProducts(state, action: PayloadAction<Product[]>) {
      // Append products
      state.data.push(...action.payload);
    },
    updateProduct(state, action: PayloadAction<{ id: string; updates: Partial<Product> }>) {
      const idx = state.data.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.data[idx] = {
          ...state.data[idx],
          ...action.payload.updates,
        };
        // Recompute missing fields dynamically
        state.data[idx].missingFields = computeProductMissingFields(state.data[idx]);
      }
    },
    clearAll(state) {
      state.data = [];
    },
  },
});

export const { addProducts, updateProduct, clearAll } = productsSlice.actions;

export default productsSlice.reducer;
