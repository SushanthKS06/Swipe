import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Customer } from '../../types';

interface CustomersState {
  data: Customer[];
}

const initialState: CustomersState = {
  data: [],
};

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

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    addCustomers(state, action: PayloadAction<Customer[]>) {
      // Append customers
      state.data.push(...action.payload);
    },
    updateCustomer(state, action: PayloadAction<{ id: string; updates: Partial<Customer> }>) {
      const idx = state.data.findIndex(c => c.id === action.payload.id);
      if (idx !== -1) {
        state.data[idx] = {
          ...state.data[idx],
          ...action.payload.updates,
        };
        // Recompute missing fields dynamically
        state.data[idx].missingFields = computeCustomerMissingFields(state.data[idx]);
      }
    },
    clearAll(state) {
      state.data = [];
    },
  },
});

export const { addCustomers, updateCustomer, clearAll } = customersSlice.actions;

export default customersSlice.reducer;
