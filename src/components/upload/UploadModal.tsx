import { X, HelpCircle, RefreshCw } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { useFileProcessor } from '../../hooks/useFileProcessor';
import { clearAll } from '../../store/slices/processingSlice';
import { FileDropzone } from './FileDropzone';
import { FileQueueList } from './FileQueueList';
import { motion, AnimatePresence } from 'motion/react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const dispatch = useAppDispatch();
  const queueFiles = useAppSelector(state => state.processing.files);
  const { uploadAndProcessFiles } = useFileProcessor();

  const handleFilesSelected = (files: File[]) => {
    uploadAndProcessFiles(files);
  };

  const handleResetQueue = () => {
    dispatch(clearAll());
  };

  // Determine if queue has active items in flight
  const hasInFlightItems = queueFiles.some(
    f => f.status !== 'complete' && f.status !== 'error'
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="upload-modal-wrapper" className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop blurring cover click-out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={hasInFlightItems ? undefined : onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          {/* Centering lock frame */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all border border-slate-100 space-y-5"
            >
              
              {/* Header section with titles and exit cross */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-sans">
                    Swipe Invoice AI Extractor
                  </h2>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Multimodal batch extraction utilizing advanced Gemini 3.5 AI
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={hasInFlightItems}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Close upload modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advanced info panel */}
              <div className="flex gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800 text-xs leading-relaxed font-sans">
                <HelpCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Drop files to trigger parsing. Files are analyzed completely on the server.
                  Private variables such as API keys are hidden securely. Multi-page invoices auto-generate several items.
                </span>
              </div>

              {/* Drag Dropzone panel */}
              <div className="space-y-4">
                <FileDropzone onFilesSelected={handleFilesSelected} />
              </div>

              {/* Active enqueued list */}
              {queueFiles.length > 0 && (
                <div className="space-y-3 pt-2">
                  <FileQueueList files={queueFiles} />
                  
                  {/* Queue Operations action panel */}
                  <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-xs text-slate-500 font-sans font-medium">
                      All records are buffered into temporary tables.
                    </span>
                    <button
                      onClick={handleResetQueue}
                      disabled={hasInFlightItems}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all font-sans"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Clear Queue Hist
                    </button>
                  </div>
                </div>
              )}

              {/* Exit block footer buttons */}
              <div className="flex justify-end gap-3.5 pt-4 border-t border-slate-100">
                <button
                  onClick={onClose}
                  disabled={hasInFlightItems}
                  className="px-4.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all font-sans"
                >
                  Close Panel
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
