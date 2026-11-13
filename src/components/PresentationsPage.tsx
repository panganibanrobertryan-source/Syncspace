import React from 'react';
import { Presentation, Plus, Clock, Download, Trash2, Play } from 'lucide-react';
import { WorkspaceItem } from '../types';
import { formatDate } from '../utils';

interface PresentationsPageProps {
  items: WorkspaceItem[];
  onOpenItem: (item: WorkspaceItem) => void;
  onCreateDeck: () => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
}

const PREVIEW_THEMES: Record<string, { bg: string; text: string; accent: string }> = {
  'obsidian-glass': { bg: 'linear-gradient(135deg, #070b19 0%, #111b36 55%, #091024 100%)', text: '#f8fafc', accent: '#818cf8' },
  'midnight-aurora': { bg: 'linear-gradient(135deg, #04131c 0%, #0b2d39 55%, #061826 100%)', text: '#f0fdfa', accent: '#34d399' },
  'cupertino-blue': { bg: 'linear-gradient(135deg, #081c3a 0%, #1e40af 55%, #0f172a 100%)', text: '#ffffff', accent: '#38bdf8' },
  'arctic-white': { bg: 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 60%, #e2e8f0 100%)', text: '#0f172a', accent: '#4f46e5' },
  'warm-editorial': { bg: 'linear-gradient(135deg, #fdfbf7 0%, #f3ece0 65%, #e8dccb 100%)', text: '#1c1917', accent: '#d97706' },
  'emerald-studio': { bg: 'linear-gradient(135deg, #03221a 0%, #064e3b 55%, #021812 100%)', text: '#ecfdf5', accent: '#10b981' },
  'sunset-amber': { bg: 'linear-gradient(135deg, #1a0f0a 0%, #431407 55%, #1c100b 100%)', text: '#fff7ed', accent: '#fb923c' },
  'rose-velvet': { bg: 'linear-gradient(135deg, #1c0b18 0%, #4c0519 55%, #170812 100%)', text: '#fff1f2', accent: '#fb7185' },
};

export const PresentationsPage: React.FC<PresentationsPageProps> = ({
  items,
  onOpenItem,
  onCreateDeck,
  onDownloadItem,
  onDeleteItem,
}) => {
  const decks = items.filter(i => i.kind === 'slides');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-semibold block mb-0.5">
            SyncSpace PowerPoint Studio
          </span>
          <h1 className="text-2xl font-bold text-slate-100 font-display">
            Presentations
          </h1>
          <p className="text-xs text-slate-400">
            Design slide decks with PowerPoint themes, draggable elements, and smooth transitions.
          </p>
        </div>

        <button
          onClick={onCreateDeck}
          className="liquid-btn flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 border border-white/25 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New presentation</span>
        </button>
      </div>

      {decks.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/15 rounded-2xl liquid-glass">
          <Presentation className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No presentations yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create your first presentation deck with custom themes, shapes, and slide transitions.
          </p>
          <button
            onClick={onCreateDeck}
            className="liquid-btn mt-4 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl"
          >
            Create presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map(deck => {
            let slideCount = 1;
            let firstSlideTitle = '';
            let firstSlideSubtitle = '';
            let themeKey = 'obsidian-glass';
            let customBg = '';
            let transitionName = 'fade';
            try {
              const slides = JSON.parse(deck.content || '[]');
              slideCount = slides.length || 1;
              firstSlideTitle = slides[0]?.title || '';
              firstSlideSubtitle = slides[0]?.subtitle || '';
              themeKey = slides[0]?.themeId || 'obsidian-glass';
              customBg = slides[0]?.customBg || '';
              transitionName = slides[0]?.transition || 'fade';
            } catch {}

            const theme = PREVIEW_THEMES[themeKey] || PREVIEW_THEMES['obsidian-glass'];

            return (
              <div
                key={deck.id}
                className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 flex flex-col justify-between group"
              >
                <div>
                  {/* 16:9 Live Slide Theme Cover Preview */}
                  <div
                    onClick={() => onOpenItem(deck)}
                    className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/15 mb-3.5 cursor-pointer p-4 flex flex-col justify-center items-center text-center shadow-inner"
                    style={{
                      background: customBg || theme.bg,
                      color: theme.text,
                    }}
                  >
                    <div
                      className="w-8 h-1 rounded-full mb-2 opacity-90"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <div className="font-bold text-sm leading-snug line-clamp-2 font-display">
                      {firstSlideTitle || deck.name}
                    </div>
                    {firstSlideSubtitle && (
                      <div className="text-[10px] opacity-75 mt-1 line-clamp-1">
                        {firstSlideSubtitle}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold border border-white/25 flex items-center gap-1">
                        <Play className="w-3 h-3 fill-white" />
                        Edit in Studio
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <h3 
                      onClick={() => onOpenItem(deck)}
                      className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors cursor-pointer truncate font-display"
                    >
                      {deck.name}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                      {slideCount} {slideCount === 1 ? 'slide' : 'slides'} · {transitionName}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{formatDate(deck.updated)}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onDownloadItem(deck)}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                      title="Download Outline"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete presentation "${deck.name}"?`)) onDeleteItem(deck.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenItem(deck)}
                      className="liquid-btn px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400 text-amber-200 hover:text-slate-950 border border-amber-400/25 rounded-lg text-xs font-semibold ml-1"
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
