import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

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
1. Return ONLY valid JSON matching the exact schema below — no markdown fences like \`\`\`json, no explanation outside the JSON.
2. Use null for any field that cannot be determined — NEVER omit a field from the object structure.
3. The missing_fields array MUST list every field name from the schema that is null in that record.
   - For invoices, check: "serial_number", "customer_name", "product_name", "quantity", "unit_price", "tax_amount", "tax_percentage", "total_amount", "net_amount", "date".
   - For products, check: "name", "quantity", "unit_price", "tax", "tax_percentage", "price_with_tax", "discount".
   - For customers, check: "customer_name", "phone_number", "email", "address", "total_purchase_amount".
4. Normalize all dates to "YYYY-MM-DD" format.
5. Strip currency symbols ($, €, ₹, etc.) — numerical amounts like unit price, quantity, tax, discounts, net and total amounts must be raw numbers, NOT strings with letters or commas.
6. If multiple invoices or items exist in the document, extract ALL of them as separate items in the invoices/products/customers lists.
7. For Excel data: treat each row/record as a source for invoice line items.
8. For multi-product invoices: create one invoice record per line item, linking to the proper customer and product.
9. Infer missing values ONLY when you are highly confident (e.g. total_amount = net_amount + tax_amount, or price_with_tax = unit_price + tax).
10. NEVER invent data — null is always better than a guess.

Return this exact JSON structure:
{
  "summary": {
    "file_type": "pdf|image|excel|unknown",
    "total_invoices_found": 0,
    "confidence": "high|medium|low",
    "notes": "Brief extraction observations"
  },
  "invoices": [
    {
      "serial_number": "Nullable string",
      "customer_name": "Nullable string",
      "product_name": "Nullable string",
      "quantity": 0,
      "unit_price": 0.0,
      "tax_amount": 0.0,
      "tax_percentage": 0.0,
      "total_amount": 0.0,
      "net_amount": 0.0,
      "date": "YYYY-MM-DD",
      "missing_fields": []
    }
  ],
  "products": [
    {
      "name": "Nullable string",
      "quantity": 0,
      "unit_price": 0.0,
      "tax": 0.0,
      "tax_percentage": 0.0,
      "price_with_tax": 0.0,
      "discount": 0.0,
      "missing_fields": []
    }
  ],
  "customers": [
    {
      "customer_name": "Nullable string",
      "phone_number": "Nullable string",
      "email": "Nullable string",
      "address": "Nullable string",
      "total_purchase_amount": 0.0,
      "missing_fields": []
    }
  ]
}

DEDUPLICATION: If the same customer appears multiple times, sum their total purchase amount and keep a single customer entry. Keep product list unique. Keep the structure perfect.
`;

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

      result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          inlinePart,
          { text: instructions }
        ],
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
    } else {
      // Excel/CSV text representation
      const instructions = `Analyze the spreadsheet data below from file name "${filename}". Extract all structured invoices, products, and customers.\n\nSPREADSHEET DATA:\n${fileData}`;

      result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
          parts: [{ text: instructions }]
        },
        config: {
          systemInstruction: EXTRACTION_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
    }

    const textOutput = result.text;
    if (!textOutput) {
      throw new Error("Gemini returned an empty response.");
    }

    // Attempt to sanitize/validate JSON output in case Markdown fences were appended despite json config (safety)
    let cleanedOutput = textOutput.trim();
    if (cleanedOutput.startsWith("```")) {
      cleanedOutput = cleanedOutput.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    }

    // Verify it is actual JSON
    const parsedObj = JSON.parse(cleanedOutput);
    res.json(parsedObj);
  } catch (error: any) {
    console.error("Extraction endpoint failed:", error);
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
