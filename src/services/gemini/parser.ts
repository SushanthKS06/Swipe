import { v4 as uuidv4 } from 'uuid';
import type { GeminiExtractionResult, Invoice, Product, Customer } from '../../types';
import { computeInvoiceMissingFields } from '../../store/slices/invoicesSlice';
import { computeProductMissingFields } from '../../store/slices/productsSlice';
import { computeCustomerMissingFields } from '../../store/slices/customersSlice';
import { validateExtractionMath } from '../validators';

const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function parseGeminiResponse(
  data: GeminiExtractionResult,
  filename: string
): { invoices: Invoice[]; products: Product[]; customers: Customer[] } {
  const confidence = data.summary?.confidence || 'medium';
  const docCurrency = data.summary?.currency_code || 'USD';

  const productUuidMap = new Map<string, string>(); // AI product_id OR slug -> UUID
  const customerUuidMap = new Map<string, string>(); // AI customer_id OR slug -> UUID
  
  const productsResultMap = new Map<string, Product>(); // UUID -> Product
  const customersResultMap = new Map<string, Customer>(); // UUID -> Customer

  const safeProducts = data.products || [];
  const safeCustomers = data.customers || [];
  const safeInvoices = data.invoices || [];

  if (Array.isArray(safeProducts)) {
    safeProducts.forEach(p => {
      const pId = p.id;
      if (!pId) return;

      const slug = p.name ? generateSlug(p.name) : pId;
      
      let uuid = productUuidMap.get(slug) || productUuidMap.get(pId);
      if (!uuid) {
        uuid = uuidv4();
        productUuidMap.set(slug, uuid);
        productUuidMap.set(pId, uuid);
      } else {
        // Ensure both keys map to same uuid
        productUuidMap.set(slug, uuid);
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
        if (productObj.name === 'General Entry' || productObj.name === 'Summary Record') {
          productObj.unitPrice = null;
        }
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
          existing.tax = Math.round(((existing.tax || 0) + p.tax) * 100) / 100;
        }
        if (p.price_with_tax !== null && p.price_with_tax !== undefined) {
          existing.priceWithTax = Math.round(((existing.priceWithTax || 0) + p.price_with_tax) * 100) / 100;
        }
        if (p.discount !== null && p.discount !== undefined) {
          existing.discount = Math.round(((existing.discount || 0) + p.discount) * 100) / 100;
        }
        if (existing.name === 'General Entry' || existing.name === 'Summary Record') {
          existing.unitPrice = null;
        }
        existing.missingFields = computeProductMissingFields(existing);
      }
    });
  }

  if (Array.isArray(safeCustomers)) {
    safeCustomers.forEach(c => {
      const cId = c.id;
      if (!cId) return;

      const slug = c.customer_name ? generateSlug(c.customer_name) : cId;

      let uuid = customerUuidMap.get(slug) || customerUuidMap.get(cId);
      if (!uuid) {
        uuid = uuidv4();
        customerUuidMap.set(slug, uuid);
        customerUuidMap.set(cId, uuid);
      } else {
        customerUuidMap.set(slug, uuid);
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
          balanceDue: c.balance_due !== undefined ? c.balance_due : null,
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
          existing.totalPurchaseAmount = Math.round(((existing.totalPurchaseAmount || 0) + c.total_purchase_amount) * 100) / 100;
        }
        if (!existing.phoneNumber && c.phone_number) existing.phoneNumber = c.phone_number;
        if (!existing.email && c.email) existing.email = c.email;
        if (!existing.address && c.address) existing.address = c.address;
        
        existing.missingFields = computeCustomerMissingFields(existing);
      }
    });
  }

  const invoices: Invoice[] = [];

  if (Array.isArray(safeInvoices)) {
    safeInvoices.forEach(inv => {
      let fCustomerUuid: string | null = null;
      let fProductUuid: string | null = null;

      const aiCustId = inv.customer_id;
      const custSlug = inv.customer_name ? generateSlug(inv.customer_name) : aiCustId;
      
      if (aiCustId || custSlug) {
        let uuid = (custSlug ? customerUuidMap.get(custSlug) : undefined) || (aiCustId ? customerUuidMap.get(aiCustId) : undefined);
        if (!uuid) {
          uuid = uuidv4();
          if (custSlug) customerUuidMap.set(custSlug, uuid);
          if (aiCustId) customerUuidMap.set(aiCustId, uuid);
          const newCustomer: Customer = {
            id: uuid,
            customerName: inv.customer_name || `Unknown Customer (${aiCustId})`,
            phoneNumber: null,
            email: null,
            address: null,
            totalPurchaseAmount: inv.total_amount || 0,
            balanceDue: null,
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
      const prodSlug = inv.product_name ? generateSlug(inv.product_name) : aiProdId;
      
      if (aiProdId || prodSlug) {
        let uuid = (prodSlug ? productUuidMap.get(prodSlug) : undefined) || (aiProdId ? productUuidMap.get(aiProdId) : undefined);
        if (!uuid) {
          uuid = uuidv4();
          if (prodSlug) productUuidMap.set(prodSlug, uuid);
          if (aiProdId) productUuidMap.set(aiProdId, uuid);
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
          if (newProduct.name === 'General Entry' || newProduct.name === 'Summary Record') {
            newProduct.unitPrice = null;
            if (inv.total_amount !== null && inv.total_amount !== undefined) {
              newProduct.priceWithTax = inv.total_amount;
            }
          }
          newProduct.missingFields = computeProductMissingFields(newProduct);
          productsResultMap.set(uuid, newProduct);
        } else {
          // Aggregate dynamically from invoice fields for summary fallback
          const existingProduct = productsResultMap.get(uuid);
          if (existingProduct && (existingProduct.name === 'General Entry' || existingProduct.name === 'Summary Record')) {
            if (inv.tax_amount !== null && inv.tax_amount !== undefined) {
              existingProduct.tax = Math.round(((existingProduct.tax || 0) + inv.tax_amount) * 100) / 100;
            }
            if (inv.total_amount !== null && inv.total_amount !== undefined) {
              existingProduct.priceWithTax = Math.round(((existingProduct.priceWithTax || 0) + inv.total_amount) * 100) / 100;
            }
            existingProduct.unitPrice = null;
            existingProduct.missingFields = computeProductMissingFields(existingProduct);
          }
        }
        fProductUuid = uuid;
      }

      let taxAmount = inv.tax_amount;
      let totalAmount = inv.total_amount;
      let netAmount = inv.net_amount;

      // Confidence-based local inferences inside parser
      if (netAmount === null && totalAmount !== null && taxAmount !== null) {
        netAmount = Math.round((totalAmount - taxAmount) * 100) / 100;
      }
      if (totalAmount === null && netAmount !== null) {
        taxAmount = taxAmount || 0;
        totalAmount = Math.round((netAmount + taxAmount) * 100) / 100;
      }

      let finalTaxPercentage = inv.tax_percentage;
      if ((finalTaxPercentage === 0 || finalTaxPercentage === null || finalTaxPercentage === undefined) && inv.tax_amount !== null && inv.tax_amount !== undefined && inv.tax_amount > 0 && inv.net_amount !== null && inv.net_amount !== undefined && inv.net_amount > 0) {
        finalTaxPercentage = Math.round((inv.tax_amount / inv.net_amount) * 10000) / 100;
      } else if (inv.tax_amount === 0) {
        finalTaxPercentage = 0;
      }

      let finalQuantity = inv.quantity !== undefined ? inv.quantity : null;
      let finalUnitPrice = inv.unit_price !== undefined ? inv.unit_price : null;

      if (inv.product_name === 'General Entry' || inv.product_name === 'Summary Record') {
        if (finalQuantity === null) {
          finalQuantity = 1;
        }
        if (finalUnitPrice === null && inv.net_amount !== undefined) {
          finalUnitPrice = inv.net_amount;
        }
      }

      const invoiceObj: Invoice = {
        id: uuidv4(),
        serialNumber: inv.serial_number ? inv.serial_number.trim() : null,
        customerId: fCustomerUuid,
        customerName: inv.customer_name ? inv.customer_name.trim() : null,
        productId: fProductUuid,
        productName: inv.product_name ? inv.product_name.trim() : null,
        quantity: finalQuantity,
        unitPrice: finalUnitPrice,
        taxAmount: taxAmount !== undefined ? taxAmount : null,
        taxPercentage: finalTaxPercentage !== undefined ? finalTaxPercentage : null,
        totalAmount: totalAmount !== undefined ? totalAmount : null,
        netAmount: netAmount !== undefined ? netAmount : null,
        date: inv.date || null,
        balanceDue: inv.balance_due !== undefined ? inv.balance_due : null,
        missingFields: [],
        confidence,
        sourceFile: filename,
        currencyCode: docCurrency,
      };

      invoiceObj.missingFields = computeInvoiceMissingFields(invoiceObj);
      invoices.push(invoiceObj);
    });
  }

  validateExtractionMath(invoices);

  return {
    invoices,
    products: Array.from(productsResultMap.values()),
    customers: Array.from(customersResultMap.values()),
  };
}
