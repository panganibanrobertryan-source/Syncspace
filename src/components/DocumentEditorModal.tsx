import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  FileText, X, Download, Eye, Edit3, Columns, 
  Bold, Italic, Strikethrough, Heading1, Heading2, 
  List, ListOrdered, Code, Quote, Check, Sparkles 
} from 'lucide-react';
import { WorkspaceItem } from '../types';
import { downloadBlob } from '../utils';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';

interface DocumentEditorModalProps {
  item: WorkspaceItem;
  onSave: (updatedItem: WorkspaceItem) => void;
  onClose: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

export const DocumentEditorModal: React.FC<DocumentEditorModalProps> = ({
  item,
  onSave,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
}) => {
  const [title, setTitle] = useState(item.name || 'Untitled Document');
  const [content, setContent] = useState(item.content || '');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-save debounced
  useEffect(() => {
    setSaveStatus('saving');
    const timer = setTimeout(() => {
      onSave({
        ...item,
        name: title.trim() || 'Untitled Document',
        content,
        size: new Blob([content]).size,
        updated: Date.now(),
      });
      setSaveStatus('saved');
    }, 400);

    return () => clearTimeout(timer);
  }, [title, content]);

  // Statistics calculation
  const stats = useMemo(() => {
    const chars = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const readTimeMinutes = Math.max(1, Math.ceil(words / 200));
    return { chars, words, readTimeMinutes };
  }, [content]);

  // Formatting helpers
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousText = textarea.value;
    const selectedText = previousText.substring(start, end);

    const replacement = prefix + (selectedText || 'text') + suffix;
    const newContent = previousText.substring(0, start) + replacement + previousText.substring(end);

    setContent(newContent);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${format}`;
    downloadBlob(content, filename, format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8');
  };

  // Simple Markdown parser for instant preview without external dependency
  const renderSimpleMarkdown = (md: string) => {
    const lines = md.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return <h1 key={idx} className="text-2xl font-bold text-slate-100 mt-4 mb-2 pb-1 border-b border-slate-800 font-display">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-xl font-semibold text-slate-200 mt-3 mb-1.5 font-display">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-lg font-medium text-slate-300 mt-2 mb-1 font-display">{line.slice(4)}</h3>;
      }
      if (line.startsWith('> ')) {
        return <blockquote key={idx} className="pl-4 py-1 my-2 border-l-2 border-indigo-500 text-slate-400 italic bg-slate-900/40 rounded-r">{line.slice(2)}</blockquote>;
      }
      if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 text-slate-300 my-1">
            <span className="w-3.5 h-3.5 rounded border border-slate-600 inline-block shrink-0" />
            <span>{line.slice(6)}</span>
          </div>
        );
      }
      if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 text-slate-400 my-1 line-through">
            <span className="w-3.5 h-3.5 rounded bg-indigo-600 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 text-white" />
            </span>
            <span>{line.slice(6)}</span>
          </div>
        );
      }
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-slate-300 my-0.5">
            {line.slice(2)}
          </li>
        );
      }
      if (/^\d+\.\s/.test(line)) {
        const itemText = line.replace(/^\d+\.\s/, '');
        return (
          <li key={idx} className="ml-5 list-decimal text-slate-300 my-0.5">
            {itemText}
          </li>
        );
      }
      if (line.startsWith('---')) {
        return <hr key={idx} className="my-4 border-slate-800" />;
      }
      if (!line.trim()) {
        return <div key={idx} className="h-3" />;
      }
      return <p key={idx} className="text-slate-300 text-sm leading-relaxed my-1">{line}</p>;
    });
  };

  return (
    <MacWindowFrame isMaximized={isMaximized} maxWidthClass="max-w-5xl" heightClass="h-[74dvh] sm:h-[78dvh]">
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
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-indigo-300" />
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 focus:bg-slate-950 px-2.5 py-1 rounded text-sm md:text-base font-semibold text-slate-100 outline-none w-full max-w-md transition-colors"
              placeholder="Document Title"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 mr-2">
              <span className={`w-2 h-2 rounded-full ${saveStatus === 'saved' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span>{saveStatus === 'saved' ? 'Saved' : 'Saving...'}</span>
            </div>

            {/* View Mode Controls */}
            <div className="hidden md:flex items-center bg-white/[0.06] p-0.5 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('edit')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'edit' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Edit Only"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Edit</span>
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'split' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Split View"
              >
                <Columns className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Split</span>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'preview' ? 'bg-white/15 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                title="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="sr-only sm:not-sr-only">Preview</span>
              </button>
            </div>

            {/* Download Menu */}
            <div className="relative group">
              <button
                onClick={() => handleDownload('md')}
                className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl"
                title="Download Markdown"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors ml-1"
              aria-label="Close document editor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar (available when editing) */}
        {viewMode !== 'preview' && (
          <div className="flex items-center gap-1 px-4 py-2 border-b border-white/10 bg-white/[0.02] overflow-x-auto text-slate-300">
            <button
              onClick={() => insertFormatting('**', '**')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Bold (**text**)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('*', '*')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Italic (*text*)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('~~', '~~')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Strikethrough (~~text~~)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={() => insertFormatting('# ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('## ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-slate-800 mx-1" />
            <button
              onClick={() => insertFormatting('- ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('1. ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('```\n', '\n```')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </button>
            <button
              onClick={() => insertFormatting('> ')}
              className="p-1.5 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Editor Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Edit Pane */}
          {(viewMode === 'edit' || viewMode === 'split') && (
            <div className={`h-full overflow-hidden flex flex-col ${viewMode === 'edit' ? 'col-span-2' : ''}`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Start writing markdown content..."
                className="w-full h-full p-5 bg-transparent resize-none outline-none font-mono text-sm leading-relaxed text-slate-100 placeholder-slate-500"
              />
            </div>
          )}

          {/* Preview Pane */}
          {(viewMode === 'preview' || viewMode === 'split') && (
            <div className={`h-full overflow-y-auto smooth-scroll p-6 bg-white/[0.02] ${viewMode === 'preview' ? 'col-span-2' : ''}`}>
              <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display mb-4">
                  {title}
                </h1>
                {content.trim() ? (
                  renderSimpleMarkdown(content)
                ) : (
                  <p className="text-slate-400 italic text-sm">Preview will appear here as you type...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-4 py-2 border-t border-white/10 bg-white/[0.03] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3 tabular-nums">
            <span>{stats.words} words</span>
            <span>·</span>
            <span>{stats.chars} characters</span>
            <span>·</span>
            <span>~{stats.readTimeMinutes} min read</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Markdown enabled</span>
          </div>
        </div>

    </MacWindowFrame>
  );
};
