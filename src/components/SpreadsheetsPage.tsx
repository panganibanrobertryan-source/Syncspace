import React from 'react';
import { Table2, Plus, Clock, Download, Trash2, Calculator } from 'lucide-react';
import { WorkspaceItem } from '../types';
import { formatBytes, formatDate } from '../utils';

interface SpreadsheetsPageProps {
  items: WorkspaceItem[];
  onOpenItem: (item: WorkspaceItem) => void;
  onCreateSheet: () => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
}

export const SpreadsheetsPage: React.FC<SpreadsheetsPageProps> = ({
  items,
  onOpenItem,
  onCreateSheet,
  onDownloadItem,
  onDeleteItem,
}) => {
  const sheets = items.filter(i => i.kind === 'sheets');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-300 font-semibold block mb-0.5">
            SyncSpace Editor
          </span>
          <h1 className="text-2xl font-bold text-slate-100 font-display">
            Spreadsheets
          </h1>
          <p className="text-xs text-slate-400">
            Build reactive numerical grids, financial budgets, and data matrices.
          </p>
        </div>

        <button
          onClick={onCreateSheet}
          className="liquid-btn flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 border border-white/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New spreadsheet</span>
        </button>
      </div>

      {sheets.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/15 rounded-2xl liquid-glass">
          <Table2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No spreadsheets yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first spreadsheet to organize tables and compute totals.
          </p>
          <button
            onClick={onCreateSheet}
            className="liquid-btn mt-4 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold rounded-xl border border-white/20"
          >
            Create spreadsheet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sheets.map(sheet => {
            let rowCount = 0;
            let colCount = 0;
            let headers: string[] = [];
            try {
              const grid = JSON.parse(sheet.content || '[]');
              rowCount = grid.length;
              colCount = grid[0]?.length || 0;
              headers = grid[0] || [];
            } catch {}

            return (
              <div
                key={sheet.id}
                className="p-5 rounded-2xl liquid-card hover:-translate-y-0.5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-300">
                      <Table2 className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {rowCount} × {colCount} grid
                    </span>
                  </div>

                  <h3 
                    onClick={() => onOpenItem(sheet)}
                    className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors cursor-pointer truncate font-display"
                  >
                    {sheet.name}
                  </h3>

                  {headers.length > 0 && (
                    <div className="mt-3 p-2 bg-white/[0.04] rounded-xl border border-white/10 text-[11px] text-slate-300/80 truncate font-mono">
                      Columns: {headers.filter(Boolean).slice(0, 3).join(', ')}...
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDate(sheet.updated)}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDownloadItem(sheet)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Download CSV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete spreadsheet "${sheet.name}"?`)) onDeleteItem(sheet.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenItem(sheet)}
                      className="liquid-btn px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-200 hover:text-white border border-emerald-400/25 rounded-lg text-xs font-medium ml-1"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
