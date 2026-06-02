import React from 'react';
import { FileText, FileSpreadsheet, Image as ImageIcon, File, AlertCircle, CheckCircle } from 'lucide-react';
import type { ProcessingFile } from '../../types';
import { formatFileSize } from '../../utils/fileHelpers';
import { StatusBadge } from '../common/StatusBadge';

interface FileQueueItemProps {
  key?: string;
  file: ProcessingFile;
}

export function FileQueueItem({ file }: FileQueueItemProps) {
  
  // Icon picker based on filename/mimeType
  const getFileIcon = () => {
    const mime = file.mimeType.toLowerCase();
    const name = file.name.toLowerCase();
    
    if (mime === 'application/pdf' || name.endsWith('.pdf')) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      mime.includes('csv') ||
      name.endsWith('.xlsx') ||
      name.endsWith('.xls') ||
      name.endsWith('.csv')
    ) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mime.startsWith('image/') || name.match(/\.(png|jpe?g|webp|bmp)$/)) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-slate-400" />;
  };

  return (
    <div
      id={`file-queue-item-${file.id}`}
      className="flex flex-col gap-2 p-3 border border-slate-100 bg-slate-50/20 rounded-xl transition-all"
    >
      <div className="flex items-center justify-between gap-3">
        
        {/* Name and size details */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="flex-shrink-0">
            {getFileIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-medium text-slate-800 truncate font-sans" title={file.name}>
              {file.name}
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        {/* Pipeline Status Indicator */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {file.status === 'complete' && (
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          )}
          {file.status === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          <StatusBadge status={file.status} />
        </div>
      </div>

      {/* Upload/Extract process indicator slider */}
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>PIPELINE PROGRESS</span>
          <span>{file.progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              file.status === 'error'
                ? 'bg-rose-500'
                : file.status === 'complete'
                ? 'bg-emerald-500'
                : 'bg-slate-900 animate-pulse'
            }`}
            style={{ width: `${file.progress}%` }}
          />
        </div>
      </div>

      {/* Segment to print any error outputs */}
      {file.status === 'error' && file.error && (
        <div className="mt-2 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-sans shadow-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600" />
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-red-800">Extraction Failed</span>
            <span className="leading-relaxed break-words">{file.error}</span>
          </div>
        </div>
      )}

      {/* Summary report metrics of parsed items */}
      {file.status === 'complete' && (
        <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-500 font-sans">
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">
            📄 {file.extractedInvoiceIds.length} invoices
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">
            🛍️ {file.extractedProductIds.length} products
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-md">
            👥 {file.extractedCustomerIds.length} customers
          </span>
        </div>
      )}
    </div>
  );
}
