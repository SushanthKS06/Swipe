import { createSlice, createEntityAdapter, PayloadAction } from '@reduxjs/toolkit';
import type { Customer } from '../../types';

export function computeCustomerMissingFields(customer: Customer): string[] {
  const fieldsToCheck: Array<keyof Customer> = [
    'customerName',
    'phoneNumber',
    'email',
    'address',
    'totalPurchaseAmount',
  ];
  return fieldsToCheck.filter(f => {
    const val = customer[f];
    return val === null || val === undefined || val === '';
  }) as string[];
}

export const customersAdapter = createEntityAdapter<Customer>();

const customersSlice = createSlice({
  name: 'customers',
  initialState: customersAdapter.getInitialState(),
  reducers: {
    addCustomers: customersAdapter.addMany,
    updateCustomer(state, action: PayloadAction<{ id: string; updates: Partial<Customer> }>) {
      customersAdapter.updateOne(state, {
        id: action.payload.id,
        changes: action.payload.updates,
      });
      // Recompute missing fields dynamically
      const customer = state.entities[action.payload.id];
      if (customer) {
        customer.missingFields = computeCustomerMissingFields(customer as Customer);
      }
    },
    clearAll: customersAdapter.removeAll,
  },
});

export const { addCustomers, updateCustomer, clearAll } = customersSlice.actions;

export default customersSlice.reducer;
