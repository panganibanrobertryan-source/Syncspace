import React from 'react';
import { Menu, Search, Upload, QrCode, ScanLine } from 'lucide-react';
import { NavPage } from '../types';

interface HeaderProps {
  currentPage: NavPage;
  onOpenCommandPalette: () => void;
  onTriggerUpload: () => void;
  onToggleMobileMenu: () => void;
  onOpenDeviceSync: () => void;
  isMobile: boolean;
  pairedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onOpenCommandPalette,
  onTriggerUpload,
  onToggleMobileMenu,
  onOpenDeviceSync,
  isMobile,
  pairedCount,
}) => {
  const getPageTitle = (page: NavPage) => {
    switch (page) {
      case 'home':
        return 'Overview';
      case 'files':
        return 'My Files';
      case 'docs':
        return 'Documents';
      case 'sheets':
        return 'Spreadsheets';
      case 'slides':
        return 'Presentations';
      case 'settings':
        return 'Settings';
      default:
        return 'Workspace';
    }
  };

  return (
    <header className="h-14 border-b border-white/10 liquid-glass px-4 flex items-center justify-between gap-4 sticky top-0 z-30">
      
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleMobileMenu}
          className="liquid-btn min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs md:text-sm min-w-0">
          <span className="text-slate-400 font-medium hidden sm:inline">Workspace</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <span className="text-slate-100 font-semibold font-display truncate">
            {getPageTitle(currentPage)}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="liquid-btn flex-1 max-w-sm hidden sm:flex items-center justify-between px-3.5 py-1.5 bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 rounded-xl text-xs text-slate-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick search files or commands...</span>
        </div>
        <kbd className="px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/15 rounded text-slate-300 font-mono">
          ⌘K
        </kbd>
      </button>

      {/* Right: QR Connect / Scanner & Quick Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className="liquid-btn min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 rounded-xl sm:hidden"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Distinct button for Mobile (Scanner) vs Laptop (QR Code) */}
        <button
          onClick={onOpenDeviceSync}
          className="liquid-btn min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/35 text-indigo-200 hover:text-white border border-indigo-400/30 rounded-xl text-xs font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] whitespace-nowrap shrink-0"
          title={
            isMobile
              ? 'Buksan ang QR Scanner para mag-connect sa laptop'
              : 'Ipakita ang QR Code para i-scan ng selpon'
          }
        >
          {isMobile ? (
            <>
              <ScanLine className="w-4 h-4 text-indigo-300 shrink-0" />
              <span>Scan QR</span>
            </>
          ) : (
            <>
              <QrCode className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
              <span>QR Mobile Connect</span>
            </>
          )}
          {pairedCount > 1 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded bg-emerald-400/20 text-emerald-200 text-[10px] font-mono tabular-nums">
              {pairedCount}
            </span>
          )}
        </button>

        {/* Upload Button */}
        <button
          onClick={onTriggerUpload}
          className="liquid-btn min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] whitespace-nowrap shrink-0"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Upload Files</span>
          <span className="sm:hidden">Upload</span>
        </button>
      </div>

    </header>
  );
};
