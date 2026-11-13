import React, { useState, useRef } from 'react';
import { 
  FileText, Table2, Presentation, File, Plus, Upload, 
  ArrowRight, HardDrive, CheckCircle2, Clock, Sparkles, QrCode, ScanLine, FilePlus2 
} from 'lucide-react';
import { WorkspaceItem, ItemKind, NavPage } from '../types';
import { formatBytes, formatDate } from '../utils';

interface OverviewPageProps {
  items: WorkspaceItem[];
  onCreateItem: (kind: ItemKind) => void;
  onOpenItem: (item: WorkspaceItem) => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
  onTriggerUpload: () => void;
  onDropFiles: (files: FileList) => void;
  onNavigate: (page: NavPage) => void;
  onOpenDeviceSync: () => void;
  isMobile: boolean;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  items,
  onCreateItem,
  onOpenItem,
  onDownloadItem,
  onDeleteItem,
  onTriggerUpload,
  onDropFiles,
  onNavigate,
  onOpenDeviceSync,
  isMobile,
}) => {
  const [isBannerDragOver, setIsBannerDragOver] = useState(false);
  const bannerDragCounterRef = useRef(0);
  const docsCount = items.filter(i => i.kind === 'docs').length;
  const sheetsCount = items.filter(i => i.kind === 'sheets').length;
  const slidesCount = items.filter(i => i.kind === 'slides').length;
  const filesCount = items.filter(i => i.kind === 'file').length;

  const recentItems = [...items].sort((a, b) => b.updated - a.updated).slice(0, 6);

  const getItemIcon = (kind: ItemKind) => {
    switch (kind) {
      case 'docs':
        return <FileText className="w-4 h-4 text-indigo-400" />;
      case 'sheets':
        return <Table2 className="w-4 h-4 text-emerald-400" />;
      case 'slides':
        return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'file':
      default:
        return <File className="w-4 h-4 text-sky-400" />;
    }
  };

  const handleBannerDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bannerDragCounterRef.current += 1;
    setIsBannerDragOver(true);
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bannerDragCounterRef.current -= 1;
    if (bannerDragCounterRef.current <= 0) {
      bannerDragCounterRef.current = 0;
      setIsBannerDragOver(false);
    }
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    bannerDragCounterRef.current = 0;
    setIsBannerDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Welcome Banner & Drag-and-Drop Copy Zone */}
      <div
        onDragEnter={handleBannerDragEnter}
        onDragOver={handleBannerDragOver}
        onDragLeave={handleBannerDragLeave}
        onDrop={handleBannerDrop}
        className={`relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isBannerDragOver
            ? 'bg-indigo-500/20 backdrop-blur-2xl border-2 border-dashed border-indigo-300 ring-4 ring-indigo-500/20 scale-[1.005]'
            : 'liquid-card bg-gradient-to-br from-white/[0.07] via-slate-900/40 to-indigo-500/15'
        }`}
      >
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-indigo-300 font-semibold mb-1 block">
            SyncSpace Connected Workspace
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 font-display tracking-tight">
            {isBannerDragOver
              ? 'Bitawan ang file para i-copy dito!'
              : items.length === 0
              ? 'Fresh workspace. Start from scratch.'
              : 'Good to have you here.'}
          </h1>
          <p className="text-sm text-slate-300/80 mt-1 max-w-xl">
            {isBannerDragOver
              ? 'Awtomatikong mako-copy at masi-sync ang iyong file sa SyncSpace.'
              : items.length === 0
              ? 'Walang naka-save na files. Mag-drag ng file dito o simulan ang iyong trabaho sa ibaba.'
              : 'Everything you need in sync. Drag & drop files directly into this area to copy and sync.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 shrink-0">
          <button
            onClick={onTriggerUpload}
            className="liquid-btn min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 border border-white/20 whitespace-nowrap shrink-0"
          >
            {isBannerDragOver ? <FilePlus2 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            <span>{isBannerDragOver ? 'Drop to Copy File' : 'Upload / Drop Files'}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="p-4 rounded-2xl liquid-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300/80">Total Items</span>
            <span className="p-1.5 rounded-xl bg-indigo-400/15 border border-indigo-400/20 text-indigo-300">
              <File className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white tabular-nums">
            {items.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across all categories</div>
        </div>

        <div className="p-4 rounded-2xl liquid-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300/80">Documents</span>
            <span className="p-1.5 rounded-xl bg-indigo-400/15 border border-indigo-400/20 text-indigo-300">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white tabular-nums">
            {docsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Markdown & briefs</div>
        </div>

        <div className="p-4 rounded-2xl liquid-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300/80">Spreadsheets</span>
            <span className="p-1.5 rounded-xl bg-emerald-400/15 border border-emerald-400/20 text-emerald-300">
              <Table2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white tabular-nums">
            {sheetsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Financial & data grids</div>
        </div>

        <div className="p-4 rounded-2xl liquid-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-300/80">Presentations</span>
            <span className="p-1.5 rounded-xl bg-amber-400/15 border border-amber-400/20 text-amber-300">
              <Presentation className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-display text-white tabular-nums">
            {slidesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Interactive slide decks</div>
        </div>
      </div>

      {/* Mobile vs Laptop Device Sync Banner */}
      <div className="p-5 rounded-3xl liquid-card bg-gradient-to-r from-indigo-500/15 via-slate-900/40 to-sky-500/10 border-indigo-400/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
            {isMobile ? <ScanLine className="w-6 h-6" /> : <QrCode className="w-6 h-6" />}
          </div>
          <div>
            <div className="text-[11px] font-mono text-emerald-300 font-medium mb-0.5">
              {isMobile ? 'Mobile Scanner Mode · Cross-Device Sync' : 'Laptop Host Mode · Cross-Device Sync'}
            </div>
            <h2 className="text-sm font-bold text-slate-100 font-display">
              {isMobile
                ? 'I-scan ang QR Code ng Laptop'
                : 'I-konek ang Selpon gamit ang QR Code'}
            </h2>
            <p className="text-xs text-slate-300/80 mt-0.5">
              {isMobile
                ? 'Gamitin ang camera ng iyong selpon para kumonekta sa laptop at i-sync ang mga files.'
                : 'Ipakita ang QR code sa screen ng laptop para ma-scan ng selpon at ma-synchronize ang lahat ng files.'}
            </p>
          </div>
        </div>

        <button
          onClick={onOpenDeviceSync}
          className="liquid-btn min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-indigo-600/25 border border-white/20 whitespace-nowrap self-start sm:self-auto shrink-0"
        >
          {isMobile ? (
            <>
              <ScanLine className="w-4 h-4" />
              <span>Buksan ang QR Scanner</span>
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              <span>Ipakita ang QR Code</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Create Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-display">
              Quick create
            </h2>
            <p className="text-xs text-slate-400">Start something new in your workspace</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onCreateItem('docs')}
            className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/25 flex items-center justify-center text-indigo-300 mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm text-slate-100 font-display">
              New document
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Write notes, markdown, and outlines</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-indigo-300 group-hover:translate-x-1 transition-transform">
              <span>Create document</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => onCreateItem('sheets')}
            className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-400/25 flex items-center justify-center text-emerald-300 mb-3 group-hover:scale-105 transition-transform">
              <Table2 className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm text-slate-100 font-display">
              New spreadsheet
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Build financial models & tables</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-emerald-300 group-hover:translate-x-1 transition-transform">
              <span>Create sheet</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => onCreateItem('slides')}
            className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300 mb-3 group-hover:scale-105 transition-transform">
              <Presentation className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm text-slate-100 font-display">
              New presentation
            </div>
            <p className="text-xs text-slate-400 mt-0.5">PowerPoint themes, transitions & show</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-amber-300 group-hover:translate-x-1 transition-transform">
              <span>Create deck</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={onTriggerUpload}
            className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 text-left group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-400/25 flex items-center justify-center text-sky-300 mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="font-semibold text-sm text-slate-100 font-display">
              Upload files
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Images, PDFs, documents, & data</p>
            <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-sky-300 group-hover:translate-x-1 transition-transform">
              <span>Upload files</span>
              <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>

      {/* Recent Files Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-100 font-display">
              Recent files
            </h2>
            <p className="text-xs text-slate-400">Pick up where you left off</p>
          </div>
          <button
            onClick={() => onNavigate('files')}
            className="text-xs text-indigo-300 hover:text-indigo-200 font-medium flex items-center gap-1 transition-colors"
          >
            <span>View all files</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-white/15 rounded-2xl liquid-glass">
            <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-slate-300">No files in your workspace yet.</p>
            <button
              onClick={() => onCreateItem('docs')}
              className="liquid-btn mt-3 px-3.5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold rounded-xl border border-white/20"
            >
              Create first document
            </button>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden liquid-glass divide-y divide-white/10">
            {recentItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 hover:bg-white/[0.05] transition-colors group"
              >
                <div 
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  onClick={() => onOpenItem(item)}
                >
                  <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center shrink-0">
                    {getItemIcon(item.kind)}
                  </div>
                  <div className="truncate">
                    <div className="text-xs md:text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                      {item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="capitalize">{item.kind}</span>
                      <span>·</span>
                      <span>{formatBytes(item.size)}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(item.updated)}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenItem(item)}
                    className="liquid-btn px-2.5 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/10 text-slate-100 rounded-lg"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => onDownloadItem(item)}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors hidden sm:inline-block"
                    title="Download"
                  >
                    <ArrowRight className="w-4 h-4 -rotate-45" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
