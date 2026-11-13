import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Folder,
  FileText,
  Table2,
  Presentation,
  Settings,
  QrCode,
  ScanLine,
  File,
} from 'lucide-react';
import { NavPage, WorkspaceItem } from '../types';
import { WindowFeaturePage } from './FeatureWindowModal';

interface MacDockProps {
  activeFeatureWindow: WindowFeaturePage | null;
  minimizedFeatures: WindowFeaturePage[];
  onLaunchDockFeature: (page: NavPage) => void;
  onRestoreFeatureWindow: (feature: WindowFeaturePage) => void;
  onOpenDeviceSync: () => void;
  isMobile: boolean;
  isSyncOpen: boolean;
  isSyncMinimized: boolean;
  minimizedItems: WorkspaceItem[];
  activeEditingItem: WorkspaceItem | null;
  activePreviewItem: WorkspaceItem | null;
  onRestoreItem: (item: WorkspaceItem) => void;
  onRestoreSync: () => void;
}

const FEATURE_META: Record<
  WindowFeaturePage,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; bg: string }
> = {
  files: { label: 'My Files', shortLabel: 'Files', icon: Folder, bg: 'from-sky-400/85 to-blue-600/85' },
  docs: { label: 'Documents', shortLabel: 'Docs', icon: FileText, bg: 'from-violet-500/85 to-indigo-600/85' },
  sheets: { label: 'Sheets', shortLabel: 'Sheets', icon: Table2, bg: 'from-emerald-400/85 to-teal-600/85' },
  slides: { label: 'Slides', shortLabel: 'Slides', icon: Presentation, bg: 'from-amber-400/85 to-orange-500/85' },
  settings: { label: 'Settings', shortLabel: 'Config', icon: Settings, bg: 'from-slate-500/85 to-slate-700/85' },
};

export const MacDock: React.FC<MacDockProps> = ({
  activeFeatureWindow,
  minimizedFeatures,
  onLaunchDockFeature,
  onRestoreFeatureWindow,
  onOpenDeviceSync,
  isMobile,
  isSyncOpen,
  isSyncMinimized,
  minimizedItems,
  activeEditingItem,
  activePreviewItem,
  onRestoreItem,
  onRestoreSync,
}) => {
  const isOverviewActive =
    !activeFeatureWindow && !activeEditingItem && !activePreviewItem && !isSyncOpen;

  const dockApps: {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    gradient: string;
    isActive: boolean;
    isMinimized: boolean;
    onClick: () => void;
  }[] = [
    {
      id: 'home',
      label: 'Overview',
      icon: Home,
      gradient: 'from-indigo-500 to-blue-600',
      isActive: isOverviewActive,
      isMinimized: false,
      onClick: () => onLaunchDockFeature('home'),
    },
    {
      id: 'files',
      label: 'My Files',
      icon: Folder,
      gradient: 'from-sky-400 to-blue-500',
      isActive: activeFeatureWindow === 'files',
      isMinimized: minimizedFeatures.includes('files'),
      onClick: () => onLaunchDockFeature('files'),
    },
    {
      id: 'docs',
      label: 'Documents',
      icon: FileText,
      gradient: 'from-violet-500 to-indigo-600',
      isActive: activeFeatureWindow === 'docs' || activeEditingItem?.kind === 'docs',
      isMinimized: minimizedFeatures.includes('docs'),
      onClick: () => onLaunchDockFeature('docs'),
    },
    {
      id: 'sheets',
      label: 'Sheets',
      icon: Table2,
      gradient: 'from-emerald-400 to-teal-600',
      isActive: activeFeatureWindow === 'sheets' || activeEditingItem?.kind === 'sheets',
      isMinimized: minimizedFeatures.includes('sheets'),
      onClick: () => onLaunchDockFeature('sheets'),
    },
    {
      id: 'slides',
      label: 'Slides',
      icon: Presentation,
      gradient: 'from-amber-400 to-orange-500',
      isActive: activeFeatureWindow === 'slides' || activeEditingItem?.kind === 'slides',
      isMinimized: minimizedFeatures.includes('slides'),
      onClick: () => onLaunchDockFeature('slides'),
    },
    {
      id: 'sync',
      label: isMobile ? 'Scan QR' : 'QR Connect',
      icon: isMobile ? ScanLine : QrCode,
      gradient: 'from-cyan-400 to-indigo-500',
      isActive: isSyncOpen,
      isMinimized: isSyncMinimized,
      onClick: () => {
        if (isSyncMinimized) onRestoreSync();
        else onOpenDeviceSync();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      gradient: 'from-slate-500 to-slate-700',
      isActive: activeFeatureWindow === 'settings',
      isMinimized: minimizedFeatures.includes('settings'),
      onClick: () => onLaunchDockFeature('settings'),
    },
  ];

  const hasMinimizedWindows =
    minimizedFeatures.length > 0 || minimizedItems.length > 0 || isSyncMinimized;

  const getMinimizedIcon = (kind: WorkspaceItem['kind']) => {
    switch (kind) {
      case 'docs':
        return { Icon: FileText, bg: 'from-violet-500/85 to-indigo-600/85' };
      case 'sheets':
        return { Icon: Table2, bg: 'from-emerald-400/85 to-teal-600/85' };
      case 'slides':
        return { Icon: Presentation, bg: 'from-amber-400/85 to-orange-500/85' };
      default:
        return { Icon: File, bg: 'from-sky-400/85 to-blue-500/85' };
    }
  };

  return (
    <div
      className="fixed bottom-2.5 sm:bottom-4 left-0 right-0 z-[45] flex justify-center px-2 pointer-events-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <nav
        aria-label="Workspace Dock"
        className="pointer-events-auto liquid-dock rounded-2xl sm:rounded-[22px] px-2 sm:px-3 py-1.5 sm:py-2 max-w-[calc(100vw-16px)] flex items-end gap-1 sm:gap-2 overflow-x-auto no-scrollbar"
      >
        {dockApps.map((app) => {
          const Icon = app.icon;
          return (
            <motion.button
              key={app.id}
              type="button"
              onClick={app.onClick}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 460, damping: 28 }}
              className="group relative flex flex-col items-center justify-center shrink-0 focus:outline-none px-0.5 py-0.5"
              aria-label={app.label}
            >
              {/* Floating MacBook tooltip (desktop hover only) */}
              {!isMobile && (
                <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg liquid-glass-elevated text-[11px] font-medium text-white whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
                  {app.label}
                </span>
              )}

              <div
                className={`dock-icon-spring relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white shadow-lg border ${
                  app.isActive ? 'border-white/55 ring-2 ring-white/25' : 'border-white/25'
                } ${isMobile ? '' : 'group-hover:-translate-y-2 group-hover:scale-[1.15]'}`}
              >
                <Icon className="w-[18px] h-[18px] sm:w-[22px] sm:h-[22px] drop-shadow" />
                {app.isMinimized && !app.isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900 shadow" />
                )}
              </div>

              {/* Mobile micro label or desktop active indicator dot */}
              {isMobile ? (
                <span
                  className={`text-[9px] leading-none mt-1 font-medium truncate max-w-[44px] ${
                    app.isActive ? 'text-white' : 'text-slate-300/80'
                  }`}
                >
                  {app.label}
                </span>
              ) : (
                <span
                  className={`w-1.5 h-1 rounded-full mt-1 transition-transform duration-200 ${
                    app.isActive
                      ? 'bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] scale-100'
                      : app.isMinimized
                      ? 'bg-amber-400 scale-100'
                      : 'bg-transparent scale-0'
                  }`}
                />
              )}
            </motion.button>
          );
        })}

        {/* Divider & Minimized Windows Tray */}
        <AnimatePresence>
          {hasMinimizedWindows && (
            <motion.div
              key="dock-minimized-tray"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="flex items-end gap-1 sm:gap-2 shrink-0"
            >
              <div className="w-px h-8 sm:h-9 bg-white/20 mx-0.5 sm:mx-1 self-center shrink-0" />

              {minimizedFeatures.map((feature) => {
                const meta = FEATURE_META[feature];
                const Icon = meta.icon;
                return (
                  <motion.button
                    key={`min-feature-${feature}`}
                    type="button"
                    initial={{ opacity: 0, scale: 0.45, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.45, y: 14 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    onClick={() => onRestoreFeatureWindow(feature)}
                    className="group relative flex flex-col items-center justify-center shrink-0 focus:outline-none px-0.5 py-0.5"
                    title={`Restore ${meta.label}`}
                  >
                    {!isMobile && (
                      <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg liquid-glass-elevated text-[11px] font-medium text-white whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
                        {meta.label}
                      </span>
                    )}
                    <div
                      className={`dock-icon-spring relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${meta.bg} flex items-center justify-center text-white shadow-lg border border-white/30 ${
                        isMobile ? '' : 'group-hover:-translate-y-2 group-hover:scale-[1.15]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                    </div>
                    {isMobile ? (
                      <span className="text-[9px] leading-none mt-1 text-amber-200 font-medium truncate max-w-[42px]">
                        {meta.shortLabel}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1" />
                    )}
                  </motion.button>
                );
              })}

              {isSyncMinimized && (
                <motion.button
                  key="min-sync"
                  type="button"
                  initial={{ opacity: 0, scale: 0.45, y: 14 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.45, y: 14 }}
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  onClick={onRestoreSync}
                  className="group relative flex flex-col items-center justify-center shrink-0 focus:outline-none px-0.5 py-0.5"
                  title="Restore Device Sync"
                >
                  {!isMobile && (
                    <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg liquid-glass-elevated text-[11px] font-medium text-white whitespace-nowrap opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
                      Restore Sync
                    </span>
                  )}
                  <div
                    className={`dock-icon-spring relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500/75 to-sky-600/75 flex items-center justify-center text-white shadow-lg border border-white/30 ${
                      isMobile ? '' : 'group-hover:-translate-y-2 group-hover:scale-[1.15]'
                    }`}
                  >
                    {isMobile ? <ScanLine className="w-4 h-4" /> : <QrCode className="w-4 h-4" />}
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                  </div>
                  {isMobile ? (
                    <span className="text-[9px] leading-none mt-1 text-amber-200 font-medium">
                      Sync
                    </span>
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-amber-400 mt-1" />
                  )}
                </motion.button>
              )}

              {minimizedItems.map((item) => {
                const { Icon, bg } = getMinimizedIcon(item.kind);
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    initial={{ opacity: 0, scale: 0.45, y: 14 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.45, y: 14 }}
                    whileTap={{ scale: 0.88 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    onClick={() => onRestoreItem(item)}
                    className="group relative flex flex-col items-center justify-center shrink-0 focus:outline-none px-0.5 py-0.5"
                    title={`Restore ${item.name}`}
                  >
                    {!isMobile && (
                      <span className="pointer-events-none absolute -top-9 px-2.5 py-1 rounded-lg liquid-glass-elevated text-[11px] font-medium text-white whitespace-nowrap max-w-[180px] truncate opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-150">
                        {item.name}
                      </span>
                    )}
                    <div
                      className={`dock-icon-spring relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center text-white shadow-lg border border-white/30 ${
                        isMobile ? '' : 'group-hover:-translate-y-2 group-hover:scale-[1.15]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
                    </div>
                    {isMobile ? (
                      <span className="text-[9px] leading-none mt-1 text-amber-200 font-medium truncate max-w-[42px]">
                        {item.name}
                      </span>
                    ) : (
                      <span className="w-1 h-1 rounded-full bg-amber-400 mt-1" />
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};
