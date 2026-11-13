import React, { useState } from 'react';
import { 
  Home, Folder, FileText, Table2, Presentation, Settings, 
  Plus, Cloud, HardDrive, LogOut, ChevronDown, Upload, X, Shield, 
  QrCode, ScanLine 
} from 'lucide-react';
import { NavPage, ItemKind, WorkspaceItem, UserProfile } from '../types';
import { formatBytes } from '../utils';

interface SidebarProps {
  currentPage: NavPage;
  onNavigate: (page: NavPage) => void;
  items: WorkspaceItem[];
  onCreateItem: (kind: ItemKind) => void;
  onTriggerUpload: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  profile: UserProfile;
  onOpenDeviceSync: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  items,
  onCreateItem,
  onTriggerUpload,
  isOpenMobile,
  onCloseMobile,
  profile,
  onOpenDeviceSync,
  isMobile,
}) => {
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  // Compute counts
  const docsCount = items.filter(i => i.kind === 'docs').length;
  const sheetsCount = items.filter(i => i.kind === 'sheets').length;
  const slidesCount = items.filter(i => i.kind === 'slides').length;
  const filesCount = items.filter(i => i.kind === 'file').length;

  // Compute total storage used
  const totalBytesUsed = items.reduce((acc, curr) => acc + (curr.size || 0), 0);
  const percentStorage = Math.min(100, Math.round((totalBytesUsed / profile.storageLimitBytes) * 100));

  const navItems = [
    { id: 'home' as NavPage, label: 'Overview', icon: Home, count: items.length },
    { id: 'files' as NavPage, label: 'My Files', icon: Folder, count: filesCount },
    { id: 'docs' as NavPage, label: 'Documents', icon: FileText, count: docsCount },
    { id: 'sheets' as NavPage, label: 'Spreadsheets', icon: Table2, count: sheetsCount },
    { id: 'slides' as NavPage, label: 'Presentations', icon: Presentation, count: slidesCount },
    { id: 'settings' as NavPage, label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: NavPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/75 z-40 md:hidden backdrop-blur-md transition-opacity"
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 liquid-glass border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Top Section */}
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-500 to-sky-400 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/25 text-sm font-display ring-1 ring-white/25">
                S
              </div>
              <div>
                <span className="font-bold text-base text-slate-100 font-display tracking-tight">
                  SyncSpace
                </span>
                <span className="text-[10px] text-indigo-300/90 font-mono block leading-none mt-0.5">
                  WORKSPACE
                </span>
              </div>
            </div>

            <button 
              onClick={onCloseMobile} 
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg md:hidden transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Create Button & Dropdown */}
          <div className="p-3 relative">
            <button
              onClick={() => setShowCreateMenu(!showCreateMenu)}
              className="liquid-btn w-full flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/15"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Create New</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showCreateMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showCreateMenu && (
              <div className="absolute top-14 left-3 right-3 liquid-glass-elevated rounded-2xl py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  onClick={() => {
                    onCreateItem('docs');
                    setShowCreateMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition-colors text-left"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Document (.md)</span>
                </button>
                <button
                  onClick={() => {
                    onCreateItem('sheets');
                    setShowCreateMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition-colors text-left"
                >
                  <Table2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Spreadsheet (.csv)</span>
                </button>
                <button
                  onClick={() => {
                    onCreateItem('slides');
                    setShowCreateMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition-colors text-left"
                >
                  <Presentation className="w-3.5 h-3.5 text-amber-400" />
                  <span>Presentation Deck</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    onTriggerUpload();
                    setShowCreateMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition-colors text-left"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload Files...</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-1 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`liquid-btn w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
                    isActive
                      ? 'bg-white/12 text-white font-semibold border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-indigo-300' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span className={`text-[11px] font-mono tabular-nums ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* QR Mobile Sync / Scanner Button */}
          <div className="pt-2 px-3">
            <button
              onClick={() => {
                onOpenDeviceSync();
                onCloseMobile();
              }}
              className="liquid-btn w-full min-h-[44px] flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/25 text-indigo-200 hover:text-white text-xs font-semibold group shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
              title={
                isMobile
                  ? 'Buksan ang QR Scanner para mag-connect sa laptop'
                  : 'Ipakita ang QR Code para i-scan ng selpon'
              }
            >
              <div className="flex items-center gap-2">
                {isMobile ? (
                  <ScanLine className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                ) : (
                  <QrCode className="w-4 h-4 text-indigo-300 group-hover:scale-110 transition-transform" />
                )}
                <span>{isMobile ? 'Scan QR ng Laptop' : 'QR Mobile Connect'}</span>
              </div>
              <span className="text-[10px] bg-indigo-400/20 text-indigo-200 px-1.5 py-0.5 rounded-md font-mono border border-indigo-400/20">
                {isMobile ? 'SCAN' : 'SYNC'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Section: Storage & Profile */}
        <div className="p-3 border-t border-white/10 space-y-3">
          
          {/* Storage Meter Card */}
          <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                <span>Storage</span>
              </span>
              <span className="font-mono text-[11px] text-slate-300">
                {formatBytes(totalBytesUsed)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-400 to-sky-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, percentStorage)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
              <span>Local Storage</span>
              <span>{percentStorage}% used</span>
            </div>
          </div>

          {/* User Profile Strip */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.04] border border-white/10">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-7 h-7 rounded-full bg-indigo-500/25 border border-indigo-400/35 flex items-center justify-center font-bold text-indigo-200 text-xs">
                {profile.avatarText}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-slate-100 truncate font-display">
                  {profile.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  <span>{profile.isDemo ? 'Local Session' : profile.email}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate('settings')}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded-lg transition-colors"
              title="Workspace Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </aside>
    </>
  );
};
