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
  const docCurrency = data.summary?.currency_code || 'USD';

  const productUuidMap = new Map<string, string>(); // AI product_id -> UUID
  const customerUuidMap = new Map<string, string>(); // AI customer_id -> UUID
  
  const productsResultMap = new Map<string, Product>(); // UUID -> Product
  const customersResultMap = new Map<string, Customer>(); // UUID -> Customer

  if (Array.isArray(data.products)) {
    data.products.forEach(p => {
      // Need ID to track relational mapping
      const pId = p.id;
      if (!pId) return;

      let uuid = productUuidMap.get(pId);
      if (!uuid) {
        uuid = uuidv4();
        productUuidMap.set(pId, uuid);
      }

      if (!productsResultMap.has(uuid)) {
        const productObj: Product = {
          id: uuid,
          name: p.name !== undefined ? p.name : null,
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
          currencyCode: docCurrency,
        };
        productObj.missingFields = computeProductMissingFields(productObj);
        productsResultMap.set(uuid, productObj);
      } else {
        const existing = productsResultMap.get(uuid)!;
        if (existing.quantity !== null && p.quantity !== null && p.quantity !== undefined) {
          existing.quantity += p.quantity;
        }
        if (existing.unitPrice === null && p.unit_price !== null && p.unit_price !== undefined) {
          existing.unitPrice = p.unit_price;
        }
        if (existing.taxPercentage === null && p.tax_percentage !== null && p.tax_percentage !== undefined) {
          existing.taxPercentage = p.tax_percentage;
        }
        if (p.tax !== null && p.tax !== undefined) {
          existing.tax = (existing.tax || 0) + p.tax;
        }
        if (p.price_with_tax !== null && p.price_with_tax !== undefined) {
          existing.priceWithTax = (existing.priceWithTax || 0) + p.price_with_tax;
        }
        if (p.discount !== null && p.discount !== undefined) {
          existing.discount = (existing.discount || 0) + p.discount;
        }
        existing.missingFields = computeProductMissingFields(existing);
      }
    });
  }

  if (Array.isArray(data.customers)) {
    data.customers.forEach(c => {
      const cId = c.id;
      if (!cId) return;

      let uuid = customerUuidMap.get(cId);
      if (!uuid) {
        uuid = uuidv4();
        customerUuidMap.set(cId, uuid);
      }

      if (!customersResultMap.has(uuid)) {
        const customerObj: Customer = {
          id: uuid,
          customerName: c.customer_name !== undefined ? c.customer_name : null,
          phoneNumber: c.phone_number !== undefined ? c.phone_number : null,
          email: c.email !== undefined ? c.email : null,
          address: c.address !== undefined ? c.address : null,
          totalPurchaseAmount: c.total_purchase_amount !== undefined ? c.total_purchase_amount : null,
          missingFields: [],
          confidence,
          sourceFile: filename,
          currencyCode: docCurrency,
        };
        customerObj.missingFields = computeCustomerMissingFields(customerObj);
        customersResultMap.set(uuid, customerObj);
      } else {
        const existing = customersResultMap.get(uuid)!;
        if (c.total_purchase_amount !== null && c.total_purchase_amount !== undefined) {
          existing.totalPurchaseAmount = (existing.totalPurchaseAmount || 0) + c.total_purchase_amount;
        }
        if (!existing.phoneNumber && c.phone_number) existing.phoneNumber = c.phone_number;
        if (!existing.email && c.email) existing.email = c.email;
        if (!existing.address && c.address) existing.address = c.address;
        
        existing.missingFields = computeCustomerMissingFields(existing);
      }
    });
  }

  const invoices: Invoice[] = [];

  if (Array.isArray(data.invoices)) {
    data.invoices.forEach(inv => {
      let fCustomerUuid: string | null = null;
      let fProductUuid: string | null = null;

      const aiCustId = inv.customer_id;
      if (aiCustId) {
        let uuid = customerUuidMap.get(aiCustId);
        if (!uuid) {
          // Robust mapping fallback: create customer record on-the-fly
          uuid = uuidv4();
          customerUuidMap.set(aiCustId, uuid);
          const newCustomer: Customer = {
            id: uuid,
            customerName: inv.customer_name || `Unknown Customer (${aiCustId})`,
            phoneNumber: null,
            email: null,
            address: null,
            totalPurchaseAmount: inv.total_amount || 0,
            missingFields: [],
            confidence,
            sourceFile: filename,
            currencyCode: docCurrency,
          };
          newCustomer.missingFields = computeCustomerMissingFields(newCustomer);
          customersResultMap.set(uuid, newCustomer);
        }
        fCustomerUuid = uuid;
      }

      const aiProdId = inv.product_id;
      if (aiProdId) {
        let uuid = productUuidMap.get(aiProdId);
        if (!uuid) {
          // Robust mapping fallback: create product record on-the-fly
          uuid = uuidv4();
          productUuidMap.set(aiProdId, uuid);
          const newProduct: Product = {
            id: uuid,
            name: inv.product_name || `Unknown Product (${aiProdId})`,
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
            currencyCode: docCurrency,
          };
          newProduct.missingFields = computeProductMissingFields(newProduct);
          productsResultMap.set(uuid, newProduct);
        }
        fProductUuid = uuid;
      }

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
        customerId: fCustomerUuid,
        customerName: inv.customer_name ? inv.customer_name.trim() : null,
        productId: fProductUuid,
        productName: inv.product_name ? inv.product_name.trim() : null,
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
        currencyCode: docCurrency,
      };

      invoiceObj.missingFields = computeInvoiceMissingFields(invoiceObj);
      invoices.push(invoiceObj);
    });
  }

  return {
    invoices,
    products: Array.from(productsResultMap.values()),
    customers: Array.from(customersResultMap.values()),
  };
}
