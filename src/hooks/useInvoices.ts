import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateInvoice, clearAll } from '../store/slices/invoicesSlice';
import type { Invoice } from '../types';

export function useInvoices() {
  const dispatch = useAppDispatch();
  const invoices = useAppSelector(state => state.invoices.data);

  const editInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    dispatch(updateInvoice({ id, updates }));
  }, [dispatch]);

  const resetAllInvoices = useCallback(() => {
    dispatch(clearAll());
  }, [dispatch]);

  return {
    invoices,
    editInvoice,
    resetAllInvoices,
  };
}
