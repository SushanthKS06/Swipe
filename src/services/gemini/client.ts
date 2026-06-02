import { GoogleGenAI, Type, Schema } from '@google/genai';

// WARNING: Exposing the Gemini API key on the client-side is a severe security risk. This violates security best practices.
// Do not do this in production unless the app is purely local or strictly protected.
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const EXTRACTION_SYSTEM_PROMPT = `
You are an expert financial data reasoning engine.
Your task is to extract relational data from Invoices, Receipts, and Summary Spreadsheets.
Normalize the data into Customers, Products, and Invoices.
MATHEMATICAL VALIDATION: Verify that quantity * unit_price roughly equals the net_amount (excluding tax/discount).
ENTITY RESOLUTION: You must act as an entity resolution engine. If you see 'Acme Corp' and 'Acme Corporation' across different rows, you MUST recognize them as the same entity and assign them the EXACT same \`customer_id\`. Do the same for slight variations in product names. The \`customer_id\` and \`product_id\` must be alphanumeric slugs (e.g., 'cust_acme_corp').
`;

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    extract_successful: { type: Type.BOOLEAN },
    summary: {
      type: Type.OBJECT,
      properties: {
        vendor_name: { type: Type.STRING },
        currency_code: { type: Type.STRING },
      }
    },
    customers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          customer_name: { type: Type.STRING },
          phone_number: { type: Type.STRING, nullable: true },
          email: { type: Type.STRING, nullable: true },
          address: { type: Type.STRING, nullable: true },
          total_purchase_amount: { type: Type.NUMBER, nullable: true }
        }
      }
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          name: { type: Type.STRING },
          quantity: { type: Type.NUMBER, nullable: true },
          unit_price: { type: Type.NUMBER, nullable: true },
          tax: { type: Type.NUMBER, nullable: true },
          tax_percentage: { type: Type.NUMBER, nullable: true },
          price_with_tax: { type: Type.NUMBER, nullable: true },
          discount: { type: Type.NUMBER, nullable: true }
        }
      }
    },
    invoices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          serial_number: { type: Type.STRING, nullable: true },
          customer_id: { type: Type.STRING, nullable: true },
          customer_name: { type: Type.STRING, nullable: true },
          product_id: { type: Type.STRING, nullable: true },
          product_name: { type: Type.STRING, nullable: true },
          quantity: { type: Type.NUMBER, nullable: true },
          unit_price: { type: Type.NUMBER, nullable: true },
          tax_amount: { type: Type.NUMBER, nullable: true },
          tax_percentage: { type: Type.NUMBER, nullable: true },
          net_amount: { type: Type.NUMBER, nullable: true },
          total_amount: { type: Type.NUMBER, nullable: true },
          date: { type: Type.STRING, nullable: true },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'low'] }
        }
      }
    }
  }
};

export async function generateWithRetry(requestConfig: any, retries = 3): Promise<any> {
  let attempt = 0;
  let baseDelay = 2000;

  while (attempt < retries) {
    try {
      return await ai.models.generateContent(requestConfig);
    } catch (error: any) {
      const isRetriable = error?.status === 503 || error?.status === 429 || error?.message?.includes("503") || error?.message?.includes("429") || error?.message?.includes("high demand") || error?.message?.includes("overloaded") || error?.message?.includes("Too Many Requests");
      
      if (isRetriable && attempt < retries - 1) {
        console.warn(`[API Retry] 429/503 detected. Retrying in ${baseDelay}ms... (Attempt ${attempt + 1} of ${retries})`);
        await new Promise(resolve => setTimeout(resolve, baseDelay));
        baseDelay *= 2; // Exponential backoff (e.g. 2s, 4s, 8s)
        attempt++;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to generate content after maximum retries.");
}

export async function extractFromDocument(base64Data: string, mimeType: string, filename: string): Promise<any> {
  let promptStr = `Please carefully analyze and extract the financial data from this file: ${filename}`;

  const requestConfig = {
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: "user",
        parts: [
          {
            text: EXTRACTION_SYSTEM_PROMPT + "\n\n" + promptStr,
          },
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType === 'text/plain' ? 'text/csv' : mimeType, // simple adjustment if needed
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: extractionSchema,
      temperature: 0.1,
    }
  };

  const response = await generateWithRetry(requestConfig);
  const textOutput = response.text;
  
  if (!textOutput) {
    throw new Error("Gemini returned an empty response.");
  }

  // Strip markdown
  const jsonStr = textOutput.substring(textOutput.indexOf('{'), textOutput.lastIndexOf('}') + 1);
  return JSON.parse(jsonStr);
}
