import React, { ReactNode } from 'react';
import { Table2, ShoppingBag, Users2 } from 'lucide-react';
import { useAppSelector } from '../../store/hooks';
import { motion } from 'motion/react';

export type TabID = 'invoices' | 'products' | 'customers';

interface TabBarProps {
  activeTab: TabID;
  setActiveTab: (tab: TabID) => void;
}

export function TabBar({ activeTab, setActiveTab }: TabBarProps) {
  const invoiceCount = useAppSelector(state => state.invoices.data.length);
  const productCount = useAppSelector(state => state.products.data.length);
  const customerCount = useAppSelector(state => state.customers.data.length);

  const tabs: Array<{ id: TabID; label: string; icon: ReactNode; count: number }> = [
    {
      id: 'invoices',
      label: 'Invoices Table',
      icon: <Table2 className="w-4 h-4" />,
      count: invoiceCount,
    },
    {
      id: 'products',
      label: 'Products Catalog',
      icon: <ShoppingBag className="w-4 h-4" />,
      count: productCount,
    },
    {
      id: 'customers',
      label: 'Customers Ledger',
      icon: <Users2 className="w-4 h-4" />,
      count: customerCount,
    },
  ];

  return (
    <div
      id="app-tabbar-navigation"
      className="flex border-b border-slate-100 bg-white px-2 overflow-x-auto scrollbar-none sticky top-[73px] z-30 shadow-xs"
    >
      <div className="flex gap-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative px-5 py-3.5 flex items-center gap-2 text-sm font-medium transition-all focus:outline-none select-none shrink-0"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Icon & Label */}
              <span className={`flex items-center gap-2 ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {tab.icon}
                <span className="font-sans">{tab.label}</span>
              </span>

              {/* Numerical Badging */}
              {tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}

              {/* Slider highlight underactive state */}
              {isActive && (
                <motion.div
                  layoutId="active-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
