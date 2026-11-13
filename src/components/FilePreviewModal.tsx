import React, { useState } from 'react';
import { File, X, Download, Trash2, Calendar, HardDrive, Check, Edit2 } from 'lucide-react';
import { WorkspaceItem } from '../types';
import { formatBytes, formatDate, downloadBlob } from '../utils';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';

interface FilePreviewModalProps {
  item: WorkspaceItem;
  onSave: (updatedItem: WorkspaceItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  item,
  onSave,
  onDelete,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [name, setName] = useState(item.name);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveName = () => {
    if (!name.trim()) return;
    onSave({
      ...item,
      name: name.trim(),
      updated: Date.now(),
    });
    setIsEditingName(false);
  };

  const handleDownload = () => {
    if (item.url) {
      const a = document.createElement('a');
      a.href = item.url;
      a.download = item.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (item.content) {
      downloadBlob(item.content, item.name, item.mime || 'application/octet-stream');
    }
  };

  const isImage = item.mime?.startsWith('image/') || item.name.match(/\.(png|jpe?g|svg|webp|gif)$/i);
  const isPdf = item.mime === 'application/pdf' || item.name.endsWith('.pdf');

  return (
    <MacWindowFrame
      isMaximized={isMaximized}
      onBackdropClick={onMinimize || onClose}
      maxWidthClass="max-w-3xl"
      heightClass="max-h-[76dvh] sm:max-h-[80dvh]"
    >
        {/* Top Header */}
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
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <File className="w-4 h-4 text-sky-300" />
            </div>
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="bg-white/[0.06] border border-indigo-400 px-2.5 py-1 rounded-lg text-sm text-slate-100 outline-none w-full"
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 text-emerald-400 hover:text-emerald-300"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <span className="text-sm md:text-base font-semibold text-slate-100 truncate">
                  {item.name}
                </span>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${item.name}" from your workspace?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors"
              title="Delete File"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
              aria-label="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Stage */}
        <div className="flex-1 overflow-auto smooth-scroll p-6 bg-white/[0.02] flex items-center justify-center min-h-[300px]">
          {isImage ? (
            <div className="max-w-full max-h-[500px] flex items-center justify-center rounded-2xl overflow-hidden border border-white/15 bg-black/30 p-2">
              <img
                src={item.url || 'data:image/svg+xml;utf8,' + encodeURIComponent(item.content || '')}
                alt={item.name}
                className="max-w-full max-h-[460px] object-contain rounded-xl"
              />
            </div>
          ) : isPdf ? (
            <div className="text-center p-8 border border-white/15 rounded-2xl liquid-glass max-w-md w-full">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-400/25 text-rose-300 flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-100 mb-1">{item.name}</h3>
              <p className="text-xs text-slate-400 mb-4">Adobe PDF Document · {formatBytes(item.size)}</p>
              <button
                onClick={handleDownload}
                className="liquid-btn px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl border border-white/20"
              >
                Download PDF to View
              </button>
            </div>
          ) : (
            <div className="w-full h-full max-h-[400px] overflow-auto smooth-scroll bg-white/[0.04] border border-white/10 rounded-2xl p-4 font-mono text-xs text-slate-200">
              <pre className="whitespace-pre-wrap">{item.content || 'Binary or unformatted file content'}</pre>
            </div>
          )}
        </div>

        {/* Bottom File Metadata Strip */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/[0.03] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatBytes(item.size)}</span>
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Updated {formatDate(item.updated)}</span>
            </span>
            <span>·</span>
            <span className="text-slate-400">{item.mime || 'application/octet-stream'}</span>
          </div>
          <div>
            <span className="text-slate-400">Stored locally in SyncSpace</span>
          </div>
        </div>

    </MacWindowFrame>
  );
};
