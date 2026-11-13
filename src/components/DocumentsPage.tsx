import React from 'react';
import { FileText, Plus, Clock, Download, Trash2, ArrowRight } from 'lucide-react';
import { WorkspaceItem } from '../types';
import { formatBytes, formatDate } from '../utils';

interface DocumentsPageProps {
  items: WorkspaceItem[];
  onOpenItem: (item: WorkspaceItem) => void;
  onCreateDoc: () => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({
  items,
  onOpenItem,
  onCreateDoc,
  onDownloadItem,
  onDeleteItem,
}) => {
  const docs = items.filter(i => i.kind === 'docs');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 font-semibold block mb-0.5">
            SyncSpace Editor
          </span>
          <h1 className="text-2xl font-bold text-slate-100 font-display">
            Documents
          </h1>
          <p className="text-xs text-slate-400">
            Create, format, and review rich markdown documents and notes.
          </p>
        </div>

        <button
          onClick={onCreateDoc}
          className="liquid-btn flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New document</span>
        </button>
      </div>

      {docs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/15 rounded-2xl liquid-glass">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No documents yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first document to draft notes, agendas, or strategy roadmaps.
          </p>
          <button
            onClick={onCreateDoc}
            className="liquid-btn mt-4 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl border border-white/20"
          >
            Create document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => {
            const words = doc.content ? doc.content.trim().split(/\s+/).length : 0;
            const snippet = doc.content ? doc.content.replace(/[#*`_>-]/g, '').slice(0, 140) : '';

            return (
              <div
                key={doc.id}
                className="p-5 rounded-2xl liquid-card hover:-translate-y-0.5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                      {words} words
                    </span>
                  </div>

                  <h3 
                    onClick={() => onOpenItem(doc)}
                    className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer truncate font-display"
                  >
                    {doc.name}
                  </h3>

                  <p className="text-xs text-slate-300/80 line-clamp-3 mt-2 font-normal leading-relaxed">
                    {snippet || 'Empty document'}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDate(doc.updated)}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDownloadItem(doc)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Download Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete document "${doc.name}"?`)) onDeleteItem(doc.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenItem(doc)}
                      className="liquid-btn px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-200 hover:text-white border border-indigo-400/25 rounded-lg text-xs font-medium ml-1"
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
