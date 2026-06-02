import { FileSpreadsheet, Plus, Table2, Users2, ShoppingBag } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';

interface HeaderProps {
  onUploadClick: () => void;
}

export function Header({ onUploadClick }: HeaderProps) {
  // Pull database statistics from store state
  const invoiceCount = useAppSelector(state => state.invoices.ids.length);
  const productCount = useAppSelector(state => state.products.ids.length);
  const customerCount = useAppSelector(state => state.customers.ids.length);

  return (
    <header
      id="app-header-navigation"
      className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      {/* Logos and Brands */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-950 text-white font-black hover:scale-105 transition-all">
          S
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-950 font-sans tracking-tight">
              Swipe
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-500 text-white font-mono uppercase tracking-wide">
              AI Extractor
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            YC S21 • TOP SUBMISSION EDITION
          </span>
        </div>
      </div>

      {/* Metrics counters summary row */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-sans text-slate-500">
        
        {/* Total Invoices metrics */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
          <Table2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{invoiceCount}</span>
          <span>Invoices</span>
        </div>

        {/* Unique Products metrics */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{productCount}</span>
          <span>Products</span>
        </div>

        {/* Deduplicated Customers metrics */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
          <Users2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">{customerCount}</span>
          <span>Customers</span>
        </div>
      </div>

      {/* Primary Modal Action Trigger */}
      <div className="flex-shrink-0">
        <button
          onClick={onUploadClick}
          className="inline-flex items-center gap-1.5 px-4.5 py-2.5 text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-850 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 active:scale-98 font-sans"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          Upload Documents...
        </button>
      </div>
    </header>
  );
}
