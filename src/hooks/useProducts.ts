import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProduct, clearAll, productsAdapter } from '../store/slices/productsSlice';
import { cascadeProductUpdate } from '../store/slices/invoicesSlice';
import type { Product } from '../types';

export function useProducts() {
  const dispatch = useAppDispatch();
  const products = useAppSelector(state => productsAdapter.getSelectors().selectAll(state.products));

  const editProduct = useCallback((id: string, updates: Partial<Product>) => {
    // 1. Update the product entity itself
    dispatch(updateProduct({ id, updates }));

    // 2. Cascade changes to any invoices that reference it
    dispatch(
      cascadeProductUpdate({
        productId: id,
        name: updates.name,
        unitPrice: updates.unitPrice,
      })
    );
  }, [dispatch]);

  const resetAllProducts = useCallback(() => {
    dispatch(clearAll());
  }, [dispatch]);

  return {
    products,
    editProduct,
    resetAllProducts,
  };
}
