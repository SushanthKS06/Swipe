/**
 * Safely exports array of records to a CSV file.
 * Handles escaping of special characters like nested quotes and commas.
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  
  const csvRows = [
    // Header Row
    headers.join(','),
    // Data Rows
    ...data.map(row => {
      return headers
        .map(fieldName => {
          const val = row[fieldName];
          const displayValue = (val === null || val === undefined) ? "" : val;
          
          let strValue = '';
          if (Array.isArray(displayValue)) {
            strValue = displayValue.join('; ');
          } else if (typeof displayValue === 'object') {
            strValue = JSON.stringify(displayValue);
          } else {
            strValue = String(displayValue);
          }

          // Escape inner double quotes by doubling them up, then wrap the entire cell in quotes
          const escaped = strValue.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(',');
    }),
  ];

  const csvContent = '\uFEFF' + csvRows.join('\r\n'); // Add UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
