import { useProducts } from '../../hooks/useProducts';
import { EditableCell } from './EditableCell';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import type { Product } from '../../types';

interface ProductsTableProps {
  products: Product[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const { editProduct } = useProducts();

  return (
    <div id="products-table-container" className="w-full overflow-x-auto bg-white border border-slate-100 rounded-xl shadow-sm">
      <table className="w-full table-auto border-collapse text-left min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50/70 border-b border-slate-100">
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-64">Product Name</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-24">Quantity</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Unit Price</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Tax</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-28">Tax %</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Price with Tax</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Discount</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-32">Confidence</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-sans w-48">Source File</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {products.map((product, idx) => (
            <tr
              key={product.id}
              className={`hover:bg-slate-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/10' : 'bg-white'}`}
            >
              {/* Product Name */}
              <EditableCell
                value={product.name}
                isMissing={product.missingFields.includes('name')}
                fieldName="name"
                onSave={val => editProduct(product.id, { name: val })}
                type="text"
              />

              {/* Quantity */}
              <EditableCell
                value={product.quantity}
                isMissing={product.missingFields.includes('quantity')}
                fieldName="quantity"
                onSave={val => editProduct(product.id, { quantity: val })}
                type="number"
              />

              {/* Unit Price */}
              <EditableCell
                value={product.unitPrice}
                isMissing={product.missingFields.includes('unitPrice')}
                fieldName="unitPrice"
                onSave={val => editProduct(product.id, { unitPrice: val })}
                type="number"
                currencyCode={product.currencyCode}
              />

              {/* Tax */}
              <EditableCell
                value={product.tax}
                isMissing={product.missingFields.includes('tax')}
                fieldName="tax"
                onSave={val => editProduct(product.id, { tax: val })}
                type="number"
                currencyCode={product.currencyCode}
              />

              {/* Tax % */}
              <EditableCell
                value={product.taxPercentage}
                isMissing={product.missingFields.includes('taxPercentage')}
                fieldName="taxPercentage"
                onSave={val => editProduct(product.id, { taxPercentage: val })}
                type="number"
              />

              {/* Price with Tax */}
              <EditableCell
                value={product.priceWithTax}
                isMissing={product.missingFields.includes('priceWithTax')}
                fieldName="priceWithTax"
                onSave={val => editProduct(product.id, { priceWithTax: val })}
                type="number"
                currencyCode={product.currencyCode}
              />

              {/* Discount Amount */}
              <EditableCell
                value={product.discount}
                isMissing={product.missingFields.includes('discount')}
                fieldName="discount"
                onSave={val => editProduct(product.id, { discount: val })}
                type="number"
                currencyCode={product.currencyCode}
              />

              {/* Confidence level */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 font-sans text-sm">
                <ConfidenceBadge level={product.confidence} />
              </td>

              {/* Orgin File block */}
              <td className="px-4 py-3 align-middle border-b border-slate-100 text-slate-400 font-mono text-xs max-w-[200px] truncate" title={product.sourceFile}>
                {product.sourceFile}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
