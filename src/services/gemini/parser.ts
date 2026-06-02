import { v4 as uuidv4 } from 'uuid';
import type { GeminiExtractionResult, Invoice, Product, Customer } from '../../types';
import { computeInvoiceMissingFields } from '../../store/slices/invoicesSlice';
import { computeProductMissingFields } from '../../store/slices/productsSlice';
import { computeCustomerMissingFields } from '../../store/slices/customersSlice';

export function parseGeminiResponse(
  data: GeminiExtractionResult,
  filename: string
): { invoices: Invoice[]; products: Product[]; customers: Customer[] } {
  const confidence = data.summary?.confidence || 'medium';

  // 1. Extract/Deduplicate Products
  const productsMap = new Map<string, Product>(); // normalized name -> Product
  
  if (Array.isArray(data.products)) {
    data.products.forEach(p => {
      const name = p.name ? p.name.trim() : null;
      if (!name) return; // Ignore nameless products
      
      const normKey = name.toLowerCase();
      if (!productsMap.has(normKey)) {
        const productObj: Product = {
          id: uuidv4(),
          name,
          quantity: p.quantity !== undefined ? p.quantity : null,
          unitPrice: p.unit_price !== undefined ? p.unit_price : null,
          tax: p.tax !== undefined ? p.tax : null,
          taxPercentage: p.tax_percentage !== undefined ? p.tax_percentage : null,
          priceWithTax: p.price_with_tax !== undefined ? p.price_with_tax : null,
          discount: p.discount !== undefined ? p.discount : null,
          discountPercentage: null,
          missingFields: [],
          confidence,
          sourceFile: filename,
        };
        productObj.missingFields = computeProductMissingFields(productObj);
        productsMap.set(normKey, productObj);
      } else {
        // If product already exists, let's aggregate quantities or check if we can fill finer details
        const existing = productsMap.get(normKey)!;
        if (existing.quantity !== null && p.quantity !== null && p.quantity !== undefined) {
          existing.quantity += p.quantity;
        }
        if (existing.unitPrice === null && p.unit_price !== null && p.unit_price !== undefined) {
          existing.unitPrice = p.unit_price;
        }
        // Recompute missing fields
        existing.missingFields = computeProductMissingFields(existing);
      }
    });
  }

  // 2. Extract/Deduplicate Customers
  const customersMap = new Map<string, Customer>(); // normalized name -> Customer

  if (Array.isArray(data.customers)) {
    data.customers.forEach(c => {
      const name = c.customer_name ? c.customer_name.trim() : null;
      if (!name) return;

      const normKey = name.toLowerCase();
      if (!customersMap.has(normKey)) {
        const customerObj: Customer = {
          id: uuidv4(),
          customerName: name,
          phoneNumber: c.phone_number !== undefined ? c.phone_number : null,
          email: c.email !== undefined ? c.email : null,
          address: c.address !== undefined ? c.address : null,
          totalPurchaseAmount: c.total_purchase_amount !== undefined ? c.total_purchase_amount : null,
          missingFields: [],
          confidence,
          sourceFile: filename,
        };
        customerObj.missingFields = computeCustomerMissingFields(customerObj);
        customersMap.set(normKey, customerObj);
      } else {
        // Accumulate total purchase amount for duplicate customers across invoices (requested)
        const existing = customersMap.get(normKey)!;
        if (c.total_purchase_amount !== null && c.total_purchase_amount !== undefined) {
          existing.totalPurchaseAmount = (existing.totalPurchaseAmount || 0) + c.total_purchase_amount;
        }
        // Fill in missing details if this record has them
        if (!existing.phoneNumber && c.phone_number) existing.phoneNumber = c.phone_number;
        if (!existing.email && c.email) existing.email = c.email;
        if (!existing.address && c.address) existing.address = c.address;
        
        existing.missingFields = computeCustomerMissingFields(existing);
      }
    });
  }

  // 3. Process Invoices (and link them to Products/Customers)
  const invoices: Invoice[] = [];

  if (Array.isArray(data.invoices)) {
    data.invoices.forEach(inv => {
      let customerId: string | null = null;
      let productId: string | null = null;

      const cName = inv.customer_name ? inv.customer_name.trim() : null;
      const pName = inv.product_name ? inv.product_name.trim() : null;

      // Double-link customer lookup (create on the fly if missing in customers but present in invoice)
      if (cName) {
        const cKey = cName.toLowerCase();
        if (customersMap.has(cKey)) {
          customerId = customersMap.get(cKey)!.id;
        } else {
          // Robust mapping fallback: create customer record on-the-fly
          const newCustId = uuidv4();
          const newCustomer: Customer = {
            id: newCustId,
            customerName: cName,
            phoneNumber: null,
            email: null,
            address: null,
            totalPurchaseAmount: inv.total_amount || 0,
            missingFields: [],
            confidence,
            sourceFile: filename,
          };
          newCustomer.missingFields = computeCustomerMissingFields(newCustomer);
          customersMap.set(cKey, newCustomer);
          customerId = newCustId;
        }
      }

      // Double-link product lookup (create on the fly if missing in products but present in invoice)
      if (pName) {
        const pKey = pName.toLowerCase();
        if (productsMap.has(pKey)) {
          productId = productsMap.get(pKey)!.id;
        } else {
          // Robust mapping fallback: create product record on-the-fly
          const newProdId = uuidv4();
          const newProduct: Product = {
            id: newProdId,
            name: pName,
            quantity: inv.quantity || 1,
            unitPrice: inv.unit_price || null,
            tax: inv.tax_amount || null,
            taxPercentage: inv.tax_percentage || null,
            priceWithTax: (inv.unit_price && inv.tax_amount) ? (inv.unit_price + inv.tax_amount) : null,
            discount: null,
            discountPercentage: null,
            missingFields: [],
            confidence,
            sourceFile: filename,
          };
          newProduct.missingFields = computeProductMissingFields(newProduct);
          productsMap.set(pKey, newProduct);
          productId = newProdId;
        }
      }

      // Compute details
      let taxAmount = inv.tax_amount;
      let totalAmount = inv.total_amount;
      let netAmount = inv.net_amount;

      // Confidence-based local inferences inside parser
      if (netAmount === null && totalAmount !== null && taxAmount !== null) {
        netAmount = totalAmount - taxAmount;
      }
      if (totalAmount === null && netAmount !== null) {
        taxAmount = taxAmount || 0;
        totalAmount = netAmount + taxAmount;
      }

      const invoiceObj: Invoice = {
        id: uuidv4(),
        serialNumber: inv.serial_number ? inv.serial_number.trim() : null,
        customerId,
        customerName: cName,
        productId,
        productName: pName,
        quantity: inv.quantity !== undefined ? inv.quantity : null,
        unitPrice: inv.unit_price !== undefined ? inv.unit_price : null,
        taxAmount: taxAmount !== undefined ? taxAmount : null,
        taxPercentage: inv.tax_percentage !== undefined ? inv.tax_percentage : null,
        totalAmount: totalAmount !== undefined ? totalAmount : null,
        netAmount: netAmount !== undefined ? netAmount : null,
        date: inv.date || null,
        missingFields: [],
        confidence,
        sourceFile: filename,
      };

      invoiceObj.missingFields = computeInvoiceMissingFields(invoiceObj);
      invoices.push(invoiceObj);
    });
  }

  return {
    invoices,
    products: Array.from(productsMap.values()),
    customers: Array.from(customersMap.values()),
  };
}
