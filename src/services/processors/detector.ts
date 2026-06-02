import { getMimeType } from '../../utils/fileHelpers';

export type SupportedFileType = 'pdf' | 'image' | 'excel' | 'unsupported';

const EXCEL_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel',                                           // .xls
  'text/csv',                                                          // .csv
];

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
];

export function detectFileType(file: File): SupportedFileType {
  const mimeType = getMimeType(file);
  
  if (mimeType === 'application/pdf') return 'pdf';
  if (IMAGE_TYPES.includes(mimeType)) return 'image';
  if (EXCEL_TYPES.includes(mimeType)) return 'excel';

  // Double check extension fallback case
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp'].includes(ext || '')) return 'image';
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) return 'excel';

  return 'unsupported';
}
