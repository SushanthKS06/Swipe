import { Search, Download, Trash2 } from 'lucide-react';
import { exportToCSV } from '../../utils/exportHelpers';

interface TableToolbarProps {
  recordCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredCount: number;
  dataToExport: Record<string, any>[];
  exportFilename: string;
  onClearAll?: () => void;
}

export function TableToolbar({
  recordCount,
  searchQuery,
  setSearchQuery,
  filteredCount,
  dataToExport,
  exportFilename,
  onClearAll,
}: TableToolbarProps) {
  
  const handleExport = () => {
    exportToCSV(dataToExport, exportFilename);
  };

  return (
    <div
      id={`table-toolbar-${exportFilename}`}
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-slate-100 bg-white"
    >
      {/* Record Counter */}
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold text-slate-800">
          {recordCount} {recordCount === 1 ? 'record' : 'records'} total
        </span>
        {searchQuery && (
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
            Found {filteredCount} matched
          </span>
        )}
      </div>

      {/* Grid actions (Search, Export, Reset) */}
      <div className="flex flex-wrap items-center gap-2.5">
        
        {/* Search Input Box */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-sm py-2 pl-9 pr-4 text-slate-900 border border-slate-200 bg-slate-50/50 rounded-lg placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all font-sans"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExport}
          disabled={dataToExport.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-slate-200 hover:border-slate-300 rounded-lg text-slate-700 bg-white shadow-sm hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Export data to comma-separated CSV file"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export CSV
        </button>

        {/* Clear Data Button */}
        {onClearAll && recordCount > 0 && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border border-red-200 hover:border-red-300 text-red-600 hover:text-red-700 rounded-lg bg-red-50/30 hover:bg-red-50/70 transition-all"
            title="Clear all parsed entities in this section"
          >
            <Trash2 className="w-4 h-4" />
            Reset Tab
          </button>
        )}
      </div>
    </div>
  );
}
