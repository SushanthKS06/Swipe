import { useCustomers } from '../../hooks/useCustomers';
import { EditableCell } from './EditableCell';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import type { Customer } from '../../types';

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  const { editCustomer } = useCustomers();

  return (
    <div id="customers-table-container" className="w-full overflow-x-auto bg-white border border-slate-100 rounded-xl shadow-sm">
      <table className="w-full table-auto border-collapse text-left min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-64">Customer Name</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-40">Phone Number</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-52">Email Address</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-80">Billing Address</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-40">Total Purchase</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Confidence</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-48">Source File</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer, idx) => (
            <tr
              key={customer.id}
              className={`hover:bg-slate-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/10' : 'bg-white'}`}
            >
              {/* Customer Name */}
              <EditableCell
                value={customer.customerName}
                isMissing={customer.missingFields.includes('customerName')}
                fieldName="customerName"
                onSave={val => editCustomer(customer.id, { customerName: val })}
                type="text"
              />

              {/* Phone Number */}
              <EditableCell
                value={customer.phoneNumber}
                isMissing={customer.missingFields.includes('phoneNumber')}
                fieldName="phoneNumber"
                onSave={val => editCustomer(customer.id, { phoneNumber: val })}
                type="text"
              />

              {/* Email */}
              <EditableCell
                value={customer.email}
                isMissing={customer.missingFields.includes('email')}
                fieldName="email"
                onSave={val => editCustomer(customer.id, { email: val })}
                type="text"
              />

              {/* Physical Address */}
              <EditableCell
                value={customer.address}
                isMissing={customer.missingFields.includes('address')}
                fieldName="address"
                onSave={val => editCustomer(customer.id, { address: val })}
                type="text"
              />

              {/* Total Purchase Amount */}
              <EditableCell
                value={customer.totalPurchaseAmount}
                isMissing={customer.missingFields.includes('totalPurchaseAmount')}
                fieldName="totalPurchaseAmount"
                onSave={val => editCustomer(customer.id, { totalPurchaseAmount: val })}
                type="number"
              />

              {/* ConfidenceBadge */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 font-sans text-sm">
                <ConfidenceBadge level={customer.confidence} />
              </td>

              {/* Source Files list */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 text-slate-400 font-mono text-xs max-w-[200px] truncate" title={customer.sourceFile}>
                {customer.sourceFile}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
