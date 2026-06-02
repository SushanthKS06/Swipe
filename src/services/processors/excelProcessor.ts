import * as XLSX from 'xlsx';

export async function processExcelFile(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  // Read array buffer to workbook
  const workbook = XLSX.read(buffer, { type: 'array' });

  const MAX_ROWS = 50;
  const chunks: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Read as 2D array to preserve structure and allow correct chunking without splitting quoted newlines
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
    
    if (rows.length === 0) continue;

    // Use the first row as the header
    const headerRow = rows[0];
    
    // Chunk the remaining rows
    const dataRows = rows.slice(1);
    
    if (dataRows.length === 0) {
       // if there are headers but no data, just send it once
       chunks.push(`=== Sheet: ${sheetName} ===\n${headerRow.map(String).join(',')}`);
       continue;
    }

    for (let i = 0; i < dataRows.length; i += MAX_ROWS) {
      const chunkRows = dataRows.slice(i, i + MAX_ROWS);
      // Combine header + chunk data
      const allRows = [headerRow, ...chunkRows];
      
      // Convert back to CSV manually or via xlsx utilities (creating a temporary sheet)
      const tempSheet = XLSX.utils.aoa_to_sheet(allRows);
      const csvChunk = XLSX.utils.sheet_to_csv(tempSheet, { blankrows: false });
      
      chunks.push(`=== Sheet: ${sheetName} ===\n${csvChunk}`);
    }
  }

  if (chunks.length === 0) {
    throw new Error('Spreadsheet file is empty or has no readable sheets.');
  }

  return chunks;
}
