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
    addProducts(state, action: PayloadAction<Product[]>) {
      for (const newProduct of action.payload) {
        const existingProducts = Object.values(state.entities) as Product[];
        const newName = (newProduct.name || '').trim().toLowerCase();
        
        const match = newName ? existingProducts.find(
          p => (p.name || '').trim().toLowerCase() === newName
        ) : undefined;
        
        if (match) {
          const sumQty = ((match.quantity || 0) + (newProduct.quantity || 0));
          const sumTax = ((match.tax || 0) + (newProduct.tax || 0));
          const newPriceWithTax = match.unitPrice !== null ? match.unitPrice + sumTax : null;

          productsAdapter.updateOne(state, {
            id: match.id,
            changes: {
              quantity: Math.round(sumQty * 100) / 100,
              tax: Math.round(sumTax * 100) / 100,
              priceWithTax: newPriceWithTax !== null ? Math.round(newPriceWithTax * 100) / 100 : match.priceWithTax
            }
          });
        } else {
          productsAdapter.addOne(state, newProduct);
        }
      }
    },
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
