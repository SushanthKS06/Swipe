import type { Confidence } from '../../types';

interface ConfidenceBadgeProps {
  level: Confidence;
}

const STYLES: Record<Confidence, { border: string; bg: string; text: string }> = {
  high: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  medium: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  low: {
    border: 'border-rose-200',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
  },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const currentStyle = STYLES[level] || STYLES.medium;
  const capitalized = level ? level.toUpperCase() : 'MEDIUM';

  return (
    <span
      id={`confidence-badge-${level}`}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${currentStyle.border} ${currentStyle.bg} ${currentStyle.text}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
      {capitalized}
    </span>
  );
}
