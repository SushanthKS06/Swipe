import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateCustomer, clearAll } from '../store/slices/customersSlice';
import { cascadeCustomerUpdate } from '../store/slices/invoicesSlice';
import type { Customer } from '../types';

export function useCustomers() {
  const dispatch = useAppDispatch();
  const customers = useAppSelector(state => state.customers.data);

  const editCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    // 1. Update the Customer entity itself
    dispatch(updateCustomer({ id, updates }));

    // 2. Cascade update to any invoices referencing this Customer
    dispatch(
      cascadeCustomerUpdate({
        customerId: id,
        customerName: updates.customerName,
      })
    );
  }, [dispatch]);

  const resetAllCustomers = useCallback(() => {
    dispatch(clearAll());
  }, [dispatch]);

  return {
    customers,
    editCustomer,
    resetAllCustomers,
  };
}
