# Technical Architecture

## 1. System Overview

The AI Document Extraction Application is a full-stack, enterprise-grade system designed to parse, normalize, and validate complex financial documents (such as invoices and summary spreadsheets) using the `@google/genai` SDK. 

The architecture follows a standard client-server request/response flow:
1. **Frontend Initiation**: The React client uploads a document (PDF, Image, or Spreadsheet) as base64-encoded strings coupled with its MIME type.
2. **Backend Processing**: An Express.js Node backend proxies the request to the Gemini API, enforcing deterministic structured output via a strongly typed JSON schema.
3. **Data Normalization Engine**: The raw JSON output is relayed to our custom parsing service (`parser.ts`), which normalizes the data into standardized `Invoice`, `Product`, and `Customer` entity arrays, applies mathematical validations, and handles data deduplication.
4. **Client Rendering**: The normalized data structures are returned to the React frontend and mapped into interactable, editable datatables managed by Redux Toolkit.

---

## 2. API Data Flow

### Resilient Inference with Exponential Backoff
To account for rate limiting, latency spikes, and transient upstream unavailability (e.g., HTTP 503 "High Demand" errors) from the AI models, the application employs a robust `generateWithRetry` wrapper around the core `generateContent` invocation. 
- It uses a configurable maximum retry limit (defaulting to 3).
- It applies dynamic, exponential backoff utilizing `setTimeout` before re-issuing failed requests.
- Irrecoverable errors are safely caught, formatted, and propagated as a 503 HTTP status to the frontend for UI surfacing exactly as they occurred, ensuring the user is not left with an opaque failure.

### Strict Schema Enforcement
We utilize `@google/genai`'s native structured outputs (`responseSchema`) to enforce a highly strict data contract. 
- Rather than relying on brittle Regex or manual JSON normalization string replacements (e.g., `.replace()`), we define the expected shapes using `Type.OBJECT` and `Type.ARRAY`.
- The parser maps directly to `result.text`, guaranteeing the shape matches our expected typings out-of-the-box.
- All fields are explicitly typed (Numbers, Strings, Arrays) and configured for nullability where appropriate, removing ambiguity during mapping.

---

## 3. Data Extraction & Transformation Engine

The transformation engine inside `parser.ts` is responsible for morphing the standardized API JSON graph into relational, cohesive TypeScript entities mapping perfectly to the `Invoice`, `Product`, and `Customer` interfaces.

### Standardized Object Generation
As results are evaluated, the script iterates over the master `invoices` array. During parsing, it reconstructs:
- **Customers**: Leveraging deterministic AI-assigned `customer_id` parameters.
- **Products**: Leveraging deterministic AI-assigned `product_id` parameters.
- **Invoices**: Relational transaction records mapping the individual lines to their respective normalized entities, injecting the `currencyCode` into every entity globally.

### Summary Data Fallback Strategy
A critical edge case in accounting systems is handling summary spreadsheets (e.g., invoice registers) that provide total financial figures but omit individual product lines (no product name, quantity, or unit price). 
To maintain downstream mathematical integrity (`quantity * unit_price = net_amount`), the engine utilizes a **Summary Data Fallback** protocol:
- Master product name is overridden to **'General Entry'** or **'Summary Record'**.
- The `quantity` is safely set to 1.
- The `unitPrice` is mathematically mapped directly to the `net_amount`.
- For the global `products` array rollup, the system dynamically sets the aggregate product's `unitPrice` to `null` to visually and mathematically distinguish it as a variable-rate item, preventing it from incorrectly rendering as a free (`$0.00`) baseline item.

### Effective Tax Rate Reverse-Engineering
When parsing summary data, the document may provide the raw `net_amount` and the calculated `tax_amount`, but omit the actual `tax_percentage`. Our normalization parser mathematically reverse-engineers this value:
- If `tax_percentage` is missing, `tax_amount > 0`, and `net_amount > 0`, the system computes the effective rate dynamically.
- `finalTaxPercentage = Math.round((inv.tax_amount / inv.net_amount) * 10000) / 100;`
- This ensures 100% mathematical alignment across the entire data catalog without requiring AI-hallucinated percentages.

---

## 4. Error Handling & Data Integrity

### Deterministic Relational ID Deduplication
Prior logic relying on lowercase string-matching (`name.toLowerCase()`) is brittle and prone to collision. The updated architecture uses AI-assigned relational IDs (`customer_id`, `product_id`) as primary keys. 
- The parser groups and deduplicates identical records traversing matching IDs. 
- Fallback UUIDs are strictly generated only if the upstream model catastrophically fails to provide an ID.

### Floating-Point Math Safety
Financial data requires extreme precision. When deduplicating and rolling up accumulative totals (such as total tax across multiple invoice rows for a single master product), JavaScript's standard floating-point addition causes leakage (e.g., `0.1 + 0.2 = 0.30000000000000004`).
- All financial aggregation logic explicitly resolves using strict rounding algorithms: 
  `existing.tax = Math.round(((existing.tax || 0) + newItem.tax) * 100) / 100;`
- This guarantees precise scalar additions for `priceWithTax`, `discount`, and `totalPurchaseAmount`.

---

## 5. Technology Stack

| Technology | Role |
| :--- | :--- |
| **React 18** | High-performance, functional component UI rendering for the client application. |
| **Redux Toolkit (RTK)** | Predictable, centralized state management isolating our complex datatable views. |
| **Node.js & Express** | Lightweight middleware relay responsible for proxying requests securely to Google's GenAI endpoint without exposing sensitive credentials to the browser. |
| **@google/genai** | The modern TypeScript SDK driving deterministic invoice and spreadsheet data extraction via the Gemini 2.5 Pro/Flash models. |
| **Tailwind CSS** | Utility-first styling handling precision layout execution and responsive table grids. |
| **Vite** | Modern, blazing-fast bundler and HMR runtime environment. |
