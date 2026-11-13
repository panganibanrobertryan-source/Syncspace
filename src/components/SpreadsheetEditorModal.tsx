import React, { useState, useEffect, useMemo } from 'react';
import { Table, X, Download, Plus, Trash2, Calculator, Check } from 'lucide-react';
import { WorkspaceItem } from '../types';
import { downloadBlob, convertSheetToCSV, convertSheetToTSV } from '../utils';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';

interface SpreadsheetEditorModalProps {
  item: WorkspaceItem;
  onSave: (updatedItem: WorkspaceItem) => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const SpreadsheetEditorModal: React.FC<SpreadsheetEditorModalProps> = ({
  item,
  onSave,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [title, setTitle] = useState(item.name || 'Untitled Spreadsheet');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Parse 2D grid matrix
  const [grid, setGrid] = useState<string[][]>(() => {
    try {
      const parsed = JSON.parse(item.content || '[]');
      if (Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])) {
        return parsed;
      }
    } catch {}
    // Default 8 rows x 6 columns
    return Array.from({ length: 8 }, () => Array(6).fill(''));
  });

  const [activeCell, setActiveCell] = useState<{ r: number; c: number }>({ r: 0, c: 0 });

  // Column letters generator (A, B, C, ... Z, AA, etc.)
  const getColHeader = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  // Auto-save debounced
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      const content = JSON.stringify(grid);
      onSave({
        ...item,
        name: title.trim() || 'Untitled Spreadsheet',
        content,
        size: new Blob([content]).size,
        updated: Date.now(),
      });
      setSaveStatus('saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [title, grid]);

  // Handle cell text change
  const handleCellChange = (r: number, c: number, value: string) => {
    setGrid(prev => {
      const updated = prev.map((row, ri) => {
        if (ri !== r) return row;
        const newRow = [...row];
        newRow[c] = value;
        return newRow;
      });
      return updated;
    });
  };

  // Row and Column modifications
  const addRow = () => {
    const colCount = grid[0]?.length || 6;
    setGrid(prev => [...prev, Array(colCount).fill('')]);
  };

  const removeRow = () => {
    if (grid.length <= 1) return;
    setGrid(prev => prev.slice(0, prev.length - 1));
    if (activeCell.r >= grid.length - 1) {
      setActiveCell(prev => ({ ...prev, r: Math.max(0, grid.length - 2) }));
    }
  };

  const addCol = () => {
    setGrid(prev => prev.map(row => [...row, '']));
  };

  const removeCol = () => {
    if ((grid[0]?.length || 0) <= 1) return;
    setGrid(prev => prev.map(row => row.slice(0, row.length - 1)));
    if (activeCell.c >= (grid[0]?.length || 1) - 1) {
      setActiveCell(prev => ({ ...prev, c: Math.max(0, (grid[0]?.length || 2) - 2) }));
    }
  };

  // Quick statistics
  const sheetStats = useMemo(() => {
    let numericCount = 0;
    let sum = 0;
    grid.forEach(row => {
      row.forEach(cell => {
        const clean = (cell || '').replace(/[^0-9.-]/g, '');
        if (clean && !isNaN(Number(clean))) {
          numericCount++;
          sum += Number(clean);
        }
      });
    });
    const avg = numericCount > 0 ? (sum / numericCount).toFixed(2) : '0';
    return {
      rowCount: grid.length,
      colCount: grid[0]?.length || 0,
      numericCount,
      sum: sum.toLocaleString(),
      avg,
    };
  }, [grid]);

  const handleDownload = (format: 'csv' | 'tsv') => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    const output = format === 'csv' ? convertSheetToCSV(grid) : convertSheetToTSV(grid);
    downloadBlob(output, filename, format === 'csv' ? 'text/csv;charset=utf-8' : 'text/tab-separated-values;charset=utf-8');
  };

  const activeValue = grid[activeCell.r]?.[activeCell.c] ?? '';
  const activeAddress = `${getColHeader(activeCell.c)}${activeCell.r + 1}`;

  return (
    <MacWindowFrame isMaximized={isMaximized} maxWidthClass="max-w-6xl" heightClass="h-[74dvh] sm:h-[78dvh]">
        {/* Top Header Bar */}
        <div
          onDoubleClick={onToggleMaximize}
          className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.03] gap-3 select-none"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <WindowControls
              onClose={onClose}
              onMinimize={onMinimize}
              onToggleMaximize={onToggleMaximize}
              isMaximized={isMaximized}
            />
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <Table className="w-4 h-4 text-emerald-300" />
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent border border-transparent hover:border-white/15 focus:border-emerald-400 focus:bg-white/[0.05] px-2.5 py-1 rounded-lg text-sm md:text-base font-semibold text-slate-100 outline-none w-full max-w-md transition-colors"
              placeholder="Spreadsheet Title"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <span>{saveStatus === 'saved' ? 'Saved' : 'Saving...'}</span>
            </div>

            <button
              onClick={() => handleDownload('csv')}
              className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleDownload('tsv')}
              className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              <span>TSV</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
              aria-label="Close spreadsheet"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Formula Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-white/10 bg-white/[0.02] text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[280px]">
            {/* Active Cell Address */}
            <div className="px-2.5 py-1 bg-white/[0.06] border border-white/10 rounded-lg font-mono font-bold text-emerald-300 text-xs w-14 text-center shrink-0">
              {activeAddress}
            </div>
            {/* Formula / Cell Content Bar */}
            <input
              type="text"
              value={activeValue}
              onChange={e => handleCellChange(activeCell.r, activeCell.c, e.target.value)}
              placeholder="Value or label for active cell"
              className="flex-1 bg-white/[0.05] border border-white/10 px-3 py-1 rounded-lg text-slate-100 outline-none focus:border-emerald-400 text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addRow}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Row</span>
            </button>
            <button
              onClick={removeRow}
              disabled={grid.length <= 1}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Row</span>
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={addCol}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Col</span>
            </button>
            <button
              onClick={removeCol}
              disabled={(grid[0]?.length || 0) <= 1}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Col</span>
            </button>
          </div>
        </div>

        {/* Spreadsheet Grid Canvas */}
        <div className="flex-1 overflow-auto smooth-scroll bg-white/[0.02] p-4">
          <div className="inline-block min-w-full border border-white/10 rounded-2xl overflow-hidden bg-slate-950/60">
            <table className="border-collapse table-auto w-full text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                  <th className="w-12 p-2 border-r border-slate-800 text-slate-500 font-mono text-center">#</th>
                  {grid[0]?.map((_, ci) => (
                    <th 
                      key={ci} 
                      className={`p-2 border-r border-slate-800 text-slate-400 font-mono font-medium min-w-[130px] ${activeCell.c === ci ? 'bg-emerald-950/30 text-emerald-300' : ''}`}
                    >
                      {getColHeader(ci)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800/80 hover:bg-slate-800/30">
                    <td className={`p-2 border-r border-slate-800 text-slate-500 font-mono text-center select-none bg-slate-950/40 ${activeCell.r === ri ? 'bg-emerald-950/30 text-emerald-300 font-semibold' : ''}`}>
                      {ri + 1}
                    </td>
                    {row.map((cell, ci) => {
                      const isActive = activeCell.r === ri && activeCell.c === ci;
                      const isHeaderRow = ri === 0;
                      return (
                        <td
                          key={ci}
                          onClick={() => setActiveCell({ r: ri, c: ci })}
                          className={`p-0 border-r border-slate-800/80 transition-colors ${isActive ? 'ring-2 ring-emerald-500 ring-inset bg-emerald-950/20' : ''}`}
                        >
                          <input
                            type="text"
                            value={cell}
                            onChange={e => handleCellChange(ri, ci, e.target.value)}
                            onFocus={() => setActiveCell({ r: ri, c: ci })}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (ri + 1 < grid.length) {
                                  setActiveCell({ r: ri + 1, c: ci });
                                } else {
                                  addRow();
                                  setActiveCell({ r: ri + 1, c: ci });
                                }
                              } else if (e.key === 'Tab') {
                                if (ci + 1 >= (grid[0]?.length || 0)) {
                                  e.preventDefault();
                                  addCol();
                                  setActiveCell({ r: ri, c: ci + 1 });
                                }
                              }
                            }}
                            className={`w-full h-full px-3 py-2 bg-transparent outline-none font-mono text-xs tabular-nums text-slate-200 ${isHeaderRow ? 'font-semibold text-slate-100 bg-slate-900/60' : ''}`}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Status Bar with Calculated Aggregates */}
        <div className="px-4 py-2 border-t border-white/10 bg-white/[0.03] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3 tabular-nums">
            <span>{sheetStats.rowCount} rows</span>
            <span>·</span>
            <span>{sheetStats.colCount} cols</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sum: {sheetStats.sum}</span>
            </span>
            <span>·</span>
            <span>Avg: {sheetStats.avg}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Auto-calculated</span>
          </div>
        </div>

    </MacWindowFrame>
  );
};
