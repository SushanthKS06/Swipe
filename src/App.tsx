import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/layout/Header';
import { TabBar, TabID } from './components/layout/TabBar';
import { MissingFieldsBanner } from './components/layout/MissingFieldsBanner';
import { TableToolbar } from './components/tables/TableToolbar';
import { EmptyState } from './components/tables/EmptyState';
import { InvoicesTable } from './components/tables/InvoicesTable';
import { ProductsTable } from './components/tables/ProductsTable';
import { CustomersTable } from './components/tables/CustomersTable';
import { UploadModal } from './components/upload/UploadModal';
import { useInvoices } from './hooks/useInvoices';
import { useProducts } from './hooks/useProducts';
import { useCustomers } from './hooks/useCustomers';

/**
 * Main logical wrapper to isolate state and connect to Redux
 */
function MainApp() {
  const [activeTab, setActiveTab] = useState<TabID>('invoices');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // States to manage full localized table filters
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Slices selectors & reset handles
  const { invoices, resetAllInvoices } = useInvoices();
  const { products, resetAllProducts } = useProducts();
  const { customers, resetAllCustomers } = useCustomers();

  // Compute the exact count of rows lacking required parameters
  const missingInvoices = invoices.filter(i => i.missingFields.length > 0);
  const missingProducts = products.filter(p => p.missingFields.length > 0);
  const missingCustomers = customers.filter(c => c.missingFields.length > 0);

  // Search logic filter routing
  const filteredInvoices = invoices.filter(item => {
    const q = invoiceSearchQuery.toLowerCase();
    return (
      !q ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(q)) ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.productName && item.productName.toLowerCase().includes(q)) ||
      (item.date && item.date.toLowerCase().includes(q)) ||
      (item.sourceFile && item.sourceFile.toLowerCase().includes(q))
    );
  });

  const filteredProducts = products.filter(item => {
    const q = productSearchQuery.toLowerCase();
    return (
      !q ||
      (item.name && item.name.toLowerCase().includes(q)) ||
      (item.sourceFile && item.sourceFile.toLowerCase().includes(q))
    );
  });

  const filteredCustomers = customers.filter(item => {
    const q = customerSearchQuery.toLowerCase();
    return (
      !q ||
      (item.customerName && item.customerName.toLowerCase().includes(q)) ||
      (item.email && item.email.toLowerCase().includes(q)) ||
      (item.phoneNumber && item.phoneNumber.toLowerCase().includes(q)) ||
      (item.address && item.address.toLowerCase().includes(q)) ||
      (item.sourceFile && item.sourceFile.toLowerCase().includes(q))
    );
  });

  // Export structure preparation matching schema
  const getExportData = () => {
    switch (activeTab) {
    case 'invoices':
      return filteredInvoices.map(i => ({
        'Serial Number': i.serialNumber || 'N/A',
        'Customer': i.customerName || 'N/A',
        'Product Reference': i.productName || 'N/A',
        'Quantity': i.quantity === null || i.quantity === undefined ? "" : i.quantity,
        'Unit Price ($)': i.unitPrice === null || i.unitPrice === undefined ? "" : i.unitPrice,
        'Tax Amount ($)': i.taxAmount === null || i.taxAmount === undefined ? "" : i.taxAmount,
        'Tax Rate (%)': i.taxPercentage === null || i.taxPercentage === undefined ? "" : i.taxPercentage,
        'Net Amount ($)': i.netAmount === null || i.netAmount === undefined ? "" : i.netAmount,
        'Total Amount ($)': i.totalAmount === null || i.totalAmount === undefined ? "" : i.totalAmount,
        'Balance Due ($)': i.balanceDue === null || i.balanceDue === undefined ? "" : i.balanceDue,
        'Invoice Date': i.date || 'N/A',
        'Extraction Confidence': i.confidence,
        'Parsed Source Filename': i.sourceFile,
      }));
    case 'products':
      return filteredProducts.map(p => ({
        'Product Name': p.name || 'N/A',
        'Cumulative Quantity': p.quantity === null || p.quantity === undefined ? "" : p.quantity,
        'Raw Unit Price ($)': p.unitPrice === null || p.unitPrice === undefined ? "" : p.unitPrice,
        'Calculated Tax ($)': p.tax === null || p.tax === undefined ? "" : p.tax,
        'Tax Rate (%)': p.taxPercentage === null || p.taxPercentage === undefined ? "" : p.taxPercentage,
        'Gross Price with Tax ($)': p.priceWithTax === null || p.priceWithTax === undefined ? "" : p.priceWithTax,
        'Extracted Discount ($)': p.discount === null || p.discount === undefined ? "" : p.discount,
        'Extraction Confidence': p.confidence,
        'Parsed Source Filename': p.sourceFile,
      }));
    case 'customers':
      return filteredCustomers.map(c => ({
        'Customer Name': c.customerName || 'N/A',
        'Phone Number': c.phoneNumber || 'N/A',
        'Email Address': c.email || 'N/A',
        'Billing Address': c.address || 'N/A',
        'Aggregate Purchases ($)': c.totalPurchaseAmount === null || c.totalPurchaseAmount === undefined ? "" : c.totalPurchaseAmount,
        'Balance Due ($)': c.balanceDue === null || c.balanceDue === undefined ? "" : c.balanceDue,
        'Extraction Confidence': c.confidence,
        'Parsed Source Filename': c.sourceFile,
      }));
      default:
        return [];
    }
  };

  const getActiveTabMeta = () => {
    switch (activeTab) {
      case 'invoices':
        return {
          totalCount: invoices.length,
          filteredCount: filteredInvoices.length,
          missingCount: missingInvoices.length,
          searchQuery: invoiceSearchQuery,
          setSearchQuery: setInvoiceSearchQuery,
          exportFilename: 'swipe-extracted-invoices',
          onResetTab: resetAllInvoices,
        };
      case 'products':
        return {
          totalCount: products.length,
          filteredCount: filteredProducts.length,
          missingCount: missingProducts.length,
          searchQuery: productSearchQuery,
          setSearchQuery: setProductSearchQuery,
          exportFilename: 'swipe-extracted-products',
          onResetTab: resetAllProducts,
        };
      case 'customers':
        return {
          totalCount: customers.length,
          filteredCount: filteredCustomers.length,
          missingCount: missingCustomers.length,
          searchQuery: customerSearchQuery,
          setSearchQuery: setCustomerSearchQuery,
          exportFilename: 'swipe-extracted-customers',
          onResetTab: resetAllCustomers,
        };
    }
  };

  const tabMeta = getActiveTabMeta();

  return (
    <div id="dynamic-dashboard-layout" className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top sticky brand header and control trigger */}
      <Header onUploadClick={() => setIsUploadModalOpen(true)} />

      {/* Tabs list with counting highlights */}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Warning correction banner for required missing properties */}
      <MissingFieldsBanner missingCount={tabMeta.missingCount} />

      {/* Central responsive workspace area */}
      <main className="flex-1 px-6 py-6 pb-20">
        {tabMeta.totalCount === 0 ? (
          /* Empty placeholder box */
          <EmptyState onUploadClick={() => setIsUploadModalOpen(true)} />
        ) : (
          /* Active Interactive Table content grid */
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <TableToolbar
              recordCount={tabMeta.totalCount}
              searchQuery={tabMeta.searchQuery}
              setSearchQuery={tabMeta.setSearchQuery}
              filteredCount={tabMeta.filteredCount}
              dataToExport={getExportData()}
              exportFilename={tabMeta.exportFilename}
              onClearAll={tabMeta.onResetTab}
            />

            {activeTab === 'invoices' && (
              <InvoicesTable invoices={filteredInvoices} />
            )}
            {activeTab === 'products' && (
              <ProductsTable products={filteredProducts} />
            )}
            {activeTab === 'customers' && (
              <CustomersTable customers={filteredCustomers} />
            )}
          </div>
        )}
      </main>

      {/* Direct concurrent uploading dialog box */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
}

/**
 * Top levels exports that provides Redux Store connection and global pop-ups hooks
 */
export default function App() {
  return (
    <Provider store={store}>
      <MainApp />
      <Toaster position="bottom-right" toastOptions={{ duration: 4000 }} />
    </Provider>
  );
}
