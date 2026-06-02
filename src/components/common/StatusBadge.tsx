import type { FileProcessingStatus } from '../../types';

interface StatusBadgeProps {
  status: FileProcessingStatus;
}

const STYLES: Record<FileProcessingStatus, { border: string; bg: string; text: string; label: string }> = {
  queued: {
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    label: 'Queued',
  },
  reading: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/70',
    text: 'text-indigo-700 animate-pulse',
    label: 'Reading File',
  },
  extracting: {
    border: 'border-sky-200',
    bg: 'bg-sky-50/70',
    text: 'text-sky-700 animate-pulse',
    label: 'Gemini Extracting',
  },
  parsing: {
    border: 'border-teal-200',
    bg: 'bg-teal-50',
    text: 'text-teal-700 animate-pulse',
    label: 'Sorting Objects',
  },
  complete: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Complete',
  },
  error: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    label: 'Failed',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const currentStyle = STYLES[status] || STYLES.queued;

  return (
    <span
      id={`status-badge-${status}`}
      className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold border ${currentStyle.border} ${currentStyle.bg} ${currentStyle.text}`}
    >
      {currentStyle.label}
    </span>
  );
}
