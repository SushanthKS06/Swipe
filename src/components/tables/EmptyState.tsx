import { FileSpreadsheet, FileUp } from 'lucide-react';

interface EmptyStateProps {
  onUploadClick: () => void;
  title?: string;
  description?: string;
}

export function EmptyState({
  onUploadClick,
  title = 'No invoice data parsed yet',
  description = 'Upload one or multiple PDF files, receipts, pictures, or Excel sheets to trigger automatic Gemini AI invoice extraction.',
}: EmptyStateProps) {
  return (
    <div
      id="empty-state-container"
      className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200/80 rounded-2xl bg-white shadow-sm max-w-xl mx-auto my-12"
    >
      {/* Visual illustration wrapper */}
      <div className="relative mb-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 border border-slate-100 shadow-sm text-slate-500">
          <FileSpreadsheet className="w-8 h-8 stroke-[1.5]" />
        </div>
        <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-white text-white shadow-md animate-bounce">
          <FileUp className="w-3.5 h-3.5" />
        </div>
      </div>

      <h3 className="text-base font-semibold text-slate-900 mb-2 font-sans">
        {title}
      </h3>
      <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-6 font-sans">
        {description}
      </p>

      {/* Primary Trigger Button */}
      <button
        onClick={onUploadClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 shadow transition-all font-sans"
      >
        <FileUp className="w-4 h-4" />
        Upload Documents...
      </button>
    </div>
  );
}
