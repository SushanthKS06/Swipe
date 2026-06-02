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

  let filePayload: string;
  let customMimeType = file.type;

  if (fileType === 'pdf') {
    onProgress(30);
    filePayload = await toBase64(file);
    customMimeType = 'application/pdf';
  } else if (fileType === 'image') {
    onProgress(30);
    filePayload = await toBase64(file);
    if (!customMimeType) {
      // Find standard mime type based on extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      customMimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
    }
  } else {
    // excel
    onProgress(35);
    filePayload = await processExcelFile(file);
    customMimeType = 'text/plain'; // Send spreadsheet csv-text to backend
  }

  onProgress(50); // Extraction request in flight

  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fileData: filePayload,
      fileType: customMimeType,
      filename: file.name,
    }),
  });

  onProgress(75);

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
  onProgress(90);

  const parsedResult = parseGeminiResponse(rawJsonResult, file.name);
  onProgress(100);

  return parsedResult;
}
