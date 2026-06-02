import { FileQueueItem } from './FileQueueItem';
import type { ProcessingFile } from '../../types';

interface FileQueueListProps {
  files: ProcessingFile[];
}

export function FileQueueList({ files }: FileQueueListProps) {
  if (files.length === 0) return null;

  return (
    <div id="file-queue-viewport" className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1.5 scrollbar-thin">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
          Extraction Queue ({files.length} {files.length === 1 ? 'file' : 'files'})
        </h3>
      </div>
      <div className="space-y-3">
        {files.map(file => (
          <FileQueueItem key={file.id} file={file} />
        ))}
      </div>
    </div>
  );
}
