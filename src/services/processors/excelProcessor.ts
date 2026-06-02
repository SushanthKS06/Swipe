import * as XLSX from 'xlsx';

export async function processExcelFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  // Read array buffer to workbook
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetsText: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    // Convert sheet to simple CSV string representation
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false });
    if (csv.trim().length > 0) {
      sheetsText.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }
  }

  if (sheetsText.length === 0) {
    throw new Error('Spreadsheet file is empty or has no readable sheets.');
  }

  return sheetsText.join('\n\n');
}
