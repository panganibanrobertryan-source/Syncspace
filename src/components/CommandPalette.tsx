import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Table, Presentation, File, Plus, X, ArrowRight } from 'lucide-react';
import { WorkspaceItem, ItemKind } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkspaceItem[];
  onOpenItem: (item: WorkspaceItem) => void;
  onCreateItem: (kind: ItemKind) => void;
  onNavigate: (page: any) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  items,
  onOpenItem,
  onCreateItem,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    const q = query.toLowerCase();
    return items.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.kind.toLowerCase().includes(q) ||
        item.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [items, query]);

  if (!isOpen) return null;

  const getItemIcon = (kind: ItemKind) => {
    switch (kind) {
      case 'docs':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'sheets':
        return <Table className="w-4 h-4 text-emerald-400" />;
      case 'slides':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'file':
      default:
        return <File className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl liquid-glass-elevated rounded-3xl overflow-hidden flex flex-col text-slate-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-5 h-5 text-slate-300 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search files, documents, or type a command..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-none text-slate-100 placeholder-slate-400 text-sm"
          />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors p-1.5 rounded-xl"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto smooth-scroll p-2 divide-y divide-white/10">
          {/* Quick Actions */}
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Quick Actions
            </div>
            <button
              onClick={() => {
                onCreateItem('docs');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-indigo-300" />
                <span>Create New Document</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-slate-200">Doc</span>
            </button>
            <button
              onClick={() => {
                onCreateItem('sheets');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-emerald-300" />
                <span>Create New Spreadsheet</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-slate-200">Sheet</span>
            </button>
            <button
              onClick={() => {
                onCreateItem('slides');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-200 hover:bg-white/10 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Create New Presentation</span>
              </div>
              <span className="text-xs text-slate-400 group-hover:text-slate-200">Deck</span>
            </button>
          </div>

          {/* Files List */}
          <div className="py-1">
            <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Files & Documents
            </div>
            {filteredItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-slate-400">
                No matching files found for "{query}"
              </div>
            ) : (
              filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    onOpenItem(item);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-100 hover:bg-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {getItemIcon(item.kind)}
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                    <span className="capitalize">{item.kind}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="px-4 py-2.5 border-t border-white/10 bg-white/[0.03] flex items-center justify-between text-xs text-slate-400">
          <span>Navigate with mouse or keyboard</span>
          <span>ESC to close</span>
        </div>
      </div>
    </div>
  );
};
