import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Schema } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup high body limits for base64 file processing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const EXTRACTION_SYSTEM_PROMPT = `
You are an expert invoice data extraction AI. Your task is to analyze documents
(invoices, receipts, purchase orders, Excel spreadsheets, CSVs) and extract structured data.

CRITICAL RULES:
1. ONLY return data matching the exact schema definition provided.
2. Use null for any field that cannot be determined — NEVER omit a field from the object structure.
3. Normalize all dates to "YYYY-MM-DD" format.
4. Strip currency symbols ($, €, ₹, etc.) — numerical amounts like unit price, quantity, tax, discounts, net and total amounts must be raw numbers, NOT strings with letters or commas.
5. If multiple invoices or items exist in the document, extract ALL of them as separate items in the invoices/products/customers lists.
6. For Excel data: treat each row/record as a source for invoice line items.
7. For multi-product invoices: create one invoice record per line item, linking to the proper customer and product.
8. Infer missing values ONLY when you are highly confident (e.g. total_amount = net_amount + tax_amount, or price_with_tax = unit_price + tax).
9. NEVER invent data — null is always better than a guess.
10. RELATIONAL INTEGRITY: You must assign a unique, deterministic ID (e.g., 'cust_1', 'prod_A') to every customer and product you extract. Inside the invoices array, you MUST use these exact IDs as customer_id and product_id to link the invoice to the respective entities, rather than relying solely on string names.
11. CURRENCY DETECTION: Analyze the document to determine the primary currency used. Return the 3-letter ISO 4217 currency code (e.g., USD, INR, EUR, GBP) in the \`summary.currency_code\` field. If no currency is visible, default to 'USD'.
12. LITERAL TRANSCRIPTION: Do not alter, autocorrect, or add formatting to strings. Transcribe product names, IDs, and text fields EXACTLY as they appear in the source document. Be character-perfect.
13. STRICT METADATA SCANNING: NEVER miss explicitly labeled metadata. Actively scan the entire document specifically for keys like 'Email', 'Phone', 'Address', or 'Account'. If a labeled value exists anywhere in the document, you MUST capture it in the respective JSON field. Do not return null if the data is visible.
14. BALANCE DUE: If the document explicitly states a 'Balance Due' or 'Amount Due' that differs from the total amount, capture it. Otherwise, return null.

DEDUPLICATION: If the same customer appears multiple times, sum their total purchase amount and keep a single customer entry. Keep product list unique. Keep the structure perfect.
`;

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        file_type: { type: Type.STRING },
        total_invoices_found: { type: Type.INTEGER },
        confidence: { type: Type.STRING },
        notes: { type: Type.STRING },
        currency_code: { type: Type.STRING, description: "3-letter ISO 4217 currency code" }
      }
    },
    invoices: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          serial_number: { type: Type.STRING, nullable: true },
          customer_id: { type: Type.STRING, nullable: true },
          product_id: { type: Type.STRING, nullable: true },
          customer_name: { type: Type.STRING, nullable: true },
          product_name: { type: Type.STRING, nullable: true },
          quantity: { type: Type.NUMBER, nullable: true },
          unit_price: { type: Type.NUMBER, nullable: true },
          tax_amount: { type: Type.NUMBER, nullable: true },
          tax_percentage: { type: Type.NUMBER, nullable: true },
          total_amount: { type: Type.NUMBER, nullable: true },
          net_amount: { type: Type.NUMBER, nullable: true },
          date: { type: Type.STRING, nullable: true },
          balance_due: { type: Type.NUMBER, nullable: true }
        }
      }
    },
    products: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, nullable: true },
          name: { type: Type.STRING, nullable: true },
          quantity: { type: Type.NUMBER, nullable: true },
          unit_price: { type: Type.NUMBER, nullable: true },
          tax: { type: Type.NUMBER, nullable: true },
          tax_percentage: { type: Type.NUMBER, nullable: true },
          price_with_tax: { type: Type.NUMBER, nullable: true },
          discount: { type: Type.NUMBER, nullable: true }
        }
      }
    },
    customers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, nullable: true },
          customer_name: { type: Type.STRING, nullable: true },
          phone_number: { type: Type.STRING, nullable: true },
          email: { type: Type.STRING, nullable: true },
          address: { type: Type.STRING, nullable: true },
          total_purchase_amount: { type: Type.NUMBER, nullable: true },
          balance_due: { type: Type.NUMBER, nullable: true }
        }
      }
    }
  }
};

async function generateWithRetry(aiModel: any, requestConfig: any, retries = 3, baseDelay = 2000) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await aiModel.generateContent(requestConfig);
    } catch (error: any) {
      const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("overloaded");
      if (is503 && attempt < retries - 1) {
        console.warn(`[API Retry] 503/high demand detected. Retrying in ${baseDelay}ms... (Attempt ${attempt + 1} of ${retries})`);
        await new Promise(resolve => setTimeout(resolve, baseDelay));
        baseDelay *= 2;
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/extract", async (req, res) => {
  try {
    const { fileData, fileType, filename } = req.body;

    if (!fileData) {
      res.status(400).json({ error: "Missing fileData parameter." });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      res.status(500).json({
        error: "GEMINI_API_KEY environment variable is not configured or contains placeholder value. Please configure it in your Secrets panel in AI Studio UI."
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    let result;

    if (fileType === "application/pdf" || fileType.startsWith("image/")) {
      const inlinePart = {
        inlineData: {
          mimeType: fileType,
          data: fileData // Base64 encoding
        }
      };
      
      const instructions = `Extract the structured invoices, products, and customers from the attached file named "${filename}". Ensure that you follow the schema instructions and rules precisely.`;

      result = await generateWithRetry(ai.models, {
        model: "gemini-3.5-flash",
        contents: [
          inlinePart,
          { text: instructions }
        ],
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          temperature: 0.1
        }
      });
    } else {
      // Excel/CSV text representation
      const instructions = `Analyze the spreadsheet data below from file name "${filename}". Extract all structured invoices, products, and customers.\n\nSPREADSHEET DATA:\n${fileData}`;

      result = await generateWithRetry(ai.models, {
        model: "gemini-3.5-flash",
        contents: {
          parts: [{ text: instructions }]
        },
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          temperature: 0.1
        }
      });
    }

    const textOutput = result.text;
    if (!textOutput) {
      throw new Error("Gemini returned an empty response.");
    }

    // Verify it is actual JSON
    const parsedObj = JSON.parse(textOutput);
    res.json(parsedObj);
  } catch (error: any) {
    console.error("Extraction endpoint failed:", error);
    const is503 = error?.status === 503 || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("overloaded");
    if (is503) {
      res.status(503).json({
        error: "The AI service is currently experiencing extremely high demand. Please wait a moment and try again."
      });
      return;
    }
    res.status(500).json({
      error: error.message || "An error occurred during Gemini invoice extraction."
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
