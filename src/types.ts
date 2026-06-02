export type Nullable<T> = T | null;

export type Confidence = 'high' | 'medium' | 'low';

export type FileProcessingStatus =
  | 'queued'
  | 'reading'
  | 'extracting'
  | 'parsing'
  | 'complete'
  | 'error';

export interface Invoice {
  id: string;
  serialNumber: Nullable<string>;
  customerId: Nullable<string>;     // FK to Customer
  customerName: Nullable<string>;   // For convenient display / double linking
  productId: Nullable<string>;      // FK to Product
  productName: Nullable<string>;    // For convenient display / double linking
  quantity: Nullable<number>;
  unitPrice: Nullable<number>;
  taxAmount: Nullable<number>;
  taxPercentage: Nullable<number>;
  totalAmount: Nullable<number>;
  netAmount: Nullable<number>;
  date: Nullable<string>;           // ISO date string YYYY-MM-DD
  missingFields: string[];          // List of fields that are null/missing
  confidence: Confidence;
  sourceFile: string;               // Original uploaded filename
}

export interface Product {
  id: string;
  name: Nullable<string>;
  quantity: Nullable<number>;
  unitPrice: Nullable<number>;
  tax: Nullable<number>;
  taxPercentage: Nullable<number>;
  priceWithTax: Nullable<Nullable<number>>; // Can be calculated or extracted
  discount: Nullable<number>;
  discountPercentage: Nullable<number>;
  missingFields: string[];
  confidence: Confidence;
  sourceFile: string;
}

export interface Customer {
  id: string;
  customerName: Nullable<string>;
  phoneNumber: Nullable<string>;
  email: Nullable<string>;
  address: Nullable<string>;
  totalPurchaseAmount: Nullable<number>;
  missingFields: string[];
  confidence: Confidence;
  sourceFile: string;
}

export interface ProcessingFile {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  status: FileProcessingStatus;
  progress: number;
  error: Nullable<string>;
  extractedInvoiceIds: string[];
  extractedProductIds: string[];
  extractedCustomerIds: string[];
}

export interface GeminiExtractionResult {
  summary: {
    file_type: string;
    total_invoices_found: number;
    confidence: Confidence;
    notes: string;
  };
  invoices: Array<{
    serial_number: Nullable<string>;
    customer_name: Nullable<string>;
    product_name: Nullable<string>;
    quantity: Nullable<number>;
    unit_price: Nullable<number>;
    tax_amount: Nullable<number>;
    tax_percentage: Nullable<number>;
    total_amount: Nullable<number>;
    net_amount: Nullable<number>;
    date: Nullable<string>;
    missing_fields: string[];
  }>;
  products: Array<{
    name: Nullable<string>;
    quantity: Nullable<number>;
    unit_price: Nullable<number>;
    tax: Nullable<number>;
    tax_percentage: Nullable<number>;
    price_with_tax: Nullable<number>;
    discount: Nullable<number>;
    missing_fields: string[];
  }>;
  customers: Array<{
    customer_name: Nullable<string>;
    phone_number: Nullable<string>;
    email: Nullable<string>;
    address: Nullable<string>;
    total_purchase_amount: Nullable<number>;
    missing_fields: string[];
  }>;
}
