import { useInvoices } from '../../hooks/useInvoices';
import { EditableCell } from './EditableCell';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import type { Invoice } from '../../types';

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  const { editInvoice } = useInvoices();
  const showBalanceDue = invoices.some(inv => inv.balanceDue != null);

  return (
    <div id="invoices-table-container" className="w-full overflow-x-auto bg-white border border-slate-100 rounded-xl shadow-sm">
      <table className="w-full table-auto border-collapse text-left min-w-[1200px]">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-36">Serial Number</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-52">Customer</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-52">Product Name</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-24">Qty</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Unit Price</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Tax Amount</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-28">Tax %</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Net Amount</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Total Amount</th>
            {showBalanceDue && <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Balance Due</th>}
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-36">Date</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Confidence</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-48">Source File</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invoices.map((invoice, idx) => (
            <tr
              key={invoice.id}
              className={`hover:bg-slate-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/10' : 'bg-white'}`}
            >
              {/* Serial Number */}
              <EditableCell
                value={invoice.serialNumber}
                isMissing={invoice.missingFields.includes('serialNumber')}
                fieldName="serialNumber"
                onSave={val => editInvoice(invoice.id, { serialNumber: val })}
                type="text"
              />

              {/* Customer Link (cascaded by editing Customer, or custom override) */}
              <EditableCell
                value={invoice.customerName}
                isMissing={invoice.missingFields.includes('customerName')}
                fieldName="customerName"
                onSave={val => editInvoice(invoice.id, { customerName: val })}
                type="text"
              />

              {/* Product Link (cascaded by editing Product, or custom override) */}
              <EditableCell
                value={invoice.productName}
                isMissing={invoice.missingFields.includes('productName')}
                fieldName="productName"
                onSave={val => editInvoice(invoice.id, { productName: val })}
                type="text"
              />

              {/* Quantity */}
              <EditableCell
                value={invoice.quantity}
                isMissing={invoice.missingFields.includes('quantity')}
                fieldName="quantity"
                onSave={val => editInvoice(invoice.id, { quantity: val })}
                type="number"
              />

              {/* Unit Price */}
              <EditableCell
                value={invoice.unitPrice}
                isMissing={invoice.missingFields.includes('unitPrice')}
                fieldName="unitPrice"
                onSave={val => editInvoice(invoice.id, { unitPrice: val })}
                type="number"
                currencyCode={invoice.currencyCode}
              />

              {/* Tax Amount */}
              <EditableCell
                value={invoice.taxAmount}
                isMissing={invoice.missingFields.includes('taxAmount')}
                fieldName="taxAmount"
                onSave={val => editInvoice(invoice.id, { taxAmount: val })}
                type="number"
                currencyCode={invoice.currencyCode}
              />

              {/* Tax % */}
              <EditableCell
                value={invoice.taxPercentage}
                isMissing={invoice.missingFields.includes('taxPercentage')}
                fieldName="taxPercentage"
                onSave={val => editInvoice(invoice.id, { taxPercentage: val })}
                type="number"
              />

              {/* Net Amount */}
              <EditableCell
                value={invoice.netAmount}
                isMissing={invoice.missingFields.includes('netAmount')}
                fieldName="netAmount"
                onSave={val => editInvoice(invoice.id, { netAmount: val })}
                type="number"
                currencyCode={invoice.currencyCode}
              />

              {/* Total Amount */}
              <EditableCell
                value={invoice.totalAmount}
                isMissing={invoice.missingFields.includes('totalAmount')}
                fieldName="totalAmount"
                onSave={val => editInvoice(invoice.id, { totalAmount: val })}
                type="number"
                currencyCode={invoice.currencyCode}
              />

              {/* Balance Due */}
              {showBalanceDue && (
                <EditableCell
                  value={invoice.balanceDue}
                  isMissing={invoice.missingFields.includes('balanceDue')}
                  fieldName="balanceDue"
                  onSave={val => editInvoice(invoice.id, { balanceDue: val })}
                  type="number"
                  currencyCode={invoice.currencyCode}
                />
              )}

              {/* Date */}
              <EditableCell
                value={invoice.date}
                isMissing={invoice.missingFields.includes('date')}
                fieldName="date"
                onSave={val => editInvoice(invoice.id, { date: val })}
                type="text"
              />

              {/* Confidence Badge */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 font-sans text-sm">
                <ConfidenceBadge level={invoice.confidence} />
              </td>

              {/* Source File identifier */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 text-slate-400 font-mono text-xs max-w-[200px] truncate" title={invoice.sourceFile}>
                {invoice.sourceFile}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
