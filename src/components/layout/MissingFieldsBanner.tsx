import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MissingFieldsBannerProps {
  missingCount: number;
}

export function MissingFieldsBanner({ missingCount }: MissingFieldsBannerProps) {
  if (missingCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        id="missing-fields-banner-wrapper"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="mx-6 mt-6 p-4 border border-amber-200/80 rounded-2xl bg-amber-50/50 flex flex-col sm:flex-row sm:items-center gap-3 shadow-xs"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle className="w-4.5 h-4.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-amber-900 font-sans">
            Interactive Correction Recommended
          </h4>
          <p className="text-xs text-amber-700 leading-normal font-sans mt-0.5">
            {missingCount} parsed {missingCount === 1 ? 'record has' : 'records have'} missing required attributes.
            Please double-click the highlighted cells to type values and solve these discrepancies.
          </p>
        </div>

        {/* Informative Help Badge */}
        <div className="shrink-0 flex items-center">
          <span className="inline-flex px-2.5 py-1 rounded bg-amber-100/70 text-amber-800 text-[11px] font-bold font-sans uppercase tracking-wide">
            Double-Click Cells to Fix
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
