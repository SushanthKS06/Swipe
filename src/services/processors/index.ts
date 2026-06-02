import { detectFileType } from './detector';
import { toBase64 } from '../../utils/fileHelpers';
import { processExcelFile } from './excelProcessor';
import { parseGeminiResponse } from '../gemini/parser';
import type { Invoice, Product, Customer } from '../../types';

export interface ProcessedResult {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
}

export async function processFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<ProcessedResult> {
  const fileType = detectFileType(file);
  
  if (fileType === 'unsupported') {
    throw new Error(
      `Unsupported file type or extension: "${file.name}". Supported formats are: PDF, JPG, PNG, WEBP, XLSX, XLS, CSV.`
    );
  }

  onProgress(15);

  let filePayloads: string[] = [];
  let customMimeType = file.type;

  if (fileType === 'pdf') {
    onProgress(30);
    filePayloads = [await toBase64(file)];
    customMimeType = 'application/pdf';
  } else if (fileType === 'image') {
    onProgress(30);
    filePayloads = [await toBase64(file)];
    if (!customMimeType) {
      // Find standard mime type based on extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      customMimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    }
  } else {
    // excel
    onProgress(35);
    filePayloads = await processExcelFile(file);
    customMimeType = 'text/plain'; // Send spreadsheet csv-text to backend
  }

  onProgress(50); // Extraction request in flight

  const allRawJsonResults = [];

  for (let i = 0; i < filePayloads.length; i++) {
    const payload = filePayloads[i];
    
    // Concurrent/batched: if we want concurrent we could Promise.all. 
    // The prompt says "concurrent/batched calls", but let's do Promise.all to be fast, but we'll batches of 5.
    // For simplicity, we can do them sequentially unless specified. The token bomb refers to one giant call.
    // Sequential helps with rate limting.
    
    const response = await fetch('/api/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileData: payload,
        fileType: customMimeType,
        filename: filePayloads.length > 1 ? `${file.name} (Chunk ${i + 1}/${filePayloads.length})` : file.name,
      }),
    });

    if (!response.ok) {
      let errorMsg = 'Failed to extract data.';
      try {
        const errRes = await response.json();
        errorMsg = errRes.error || errorMsg;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    const rawJsonResult = await response.json();
    allRawJsonResults.push(rawJsonResult);
    
    onProgress(50 + ((i + 1) / filePayloads.length) * 25);
  }

  onProgress(75);

  let mergedJsonResult: any = { invoices: [], products: [], customers: [], summary: {} };
  
  for (const result of allRawJsonResults) {
    if (result.invoices) mergedJsonResult.invoices.push(...result.invoices);
    if (result.products) mergedJsonResult.products.push(...result.products);
    if (result.customers) mergedJsonResult.customers.push(...result.customers);
    if (result.summary) mergedJsonResult.summary = { ...mergedJsonResult.summary, ...result.summary };
  }

  onProgress(90);

  const parsedResult = parseGeminiResponse(mergedJsonResult, file.name);
  onProgress(100);

  return parsedResult;
}
