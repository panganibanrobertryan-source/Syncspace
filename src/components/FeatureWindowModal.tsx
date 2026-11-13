import React, { useRef } from 'react';
import { Folder, FileText, Table2, Presentation, Settings, Maximize2, Minimize2, X } from 'lucide-react';
import { NavPage, WorkspaceItem, ItemKind, UserProfile } from '../types';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';
import { FilesPage } from './FilesPage';
import { DocumentsPage } from './DocumentsPage';
import { SpreadsheetsPage } from './SpreadsheetsPage';
import { PresentationsPage } from './PresentationsPage';
import { SettingsPage } from './SettingsPage';
import { useSmoothScroll } from '../hooks/useSmoothScroll';

export type WindowFeaturePage = Exclude<NavPage, 'home'>;

interface FeatureWindowModalProps {
  feature: WindowFeaturePage;
  items: WorkspaceItem[];
  profile: UserProfile;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onOpenItem: (item: WorkspaceItem) => void;
  onCreateItem: (kind: ItemKind) => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleStar: (id: string) => void;
  onTriggerUpload: () => void;
  onDropFiles: (files: FileList) => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (imported: WorkspaceItem[]) => void;
  onResetSampleData: () => void;
  onClearWorkspace: () => void;
}

const FEATURE_META: Record<
  WindowFeaturePage,
  { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }>; accentClass: string }
> = {
  files: {
    title: 'My Files',
    subtitle: 'Synced workspace library',
    icon: Folder,
    accentClass: 'text-sky-300 bg-sky-500/15 border-sky-400/25',
  },
  docs: {
    title: 'Documents',
    subtitle: 'Markdown & notes',
    icon: FileText,
    accentClass: 'text-indigo-300 bg-indigo-500/15 border-indigo-400/25',
  },
  sheets: {
    title: 'Spreadsheets',
    subtitle: 'Grids & financial tables',
    icon: Table2,
    accentClass: 'text-emerald-300 bg-emerald-500/15 border-emerald-400/25',
  },
  slides: {
    title: 'Presentations',
    subtitle: 'PowerPoint Studio',
    icon: Presentation,
    accentClass: 'text-amber-300 bg-amber-500/15 border-amber-400/25',
  },
  settings: {
    title: 'Settings',
    subtitle: 'Profile, backup & storage',
    icon: Settings,
    accentClass: 'text-slate-200 bg-white/10 border-white/20',
  },
};

export const FeatureWindowModal: React.FC<FeatureWindowModalProps> = ({
  feature,
  items,
  profile,
  isMaximized,
  onToggleMaximize,
  onMinimize,
  onClose,
  onOpenItem,
  onCreateItem,
  onDownloadItem,
  onDeleteItem,
  onToggleStar,
  onTriggerUpload,
  onDropFiles,
  onUpdateProfile,
  onExportWorkspace,
  onImportWorkspace,
  onResetSampleData,
  onClearWorkspace,
}) => {
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  useSmoothScroll(scrollBodyRef);

  const meta = FEATURE_META[feature];
  const Icon = meta.icon;

  return (
    <MacWindowFrame
      isMaximized={isMaximized}
      onBackdropClick={onMinimize}
      maxWidthClass="max-w-5xl"
      heightClass="h-[72dvh] sm:h-[76dvh]"
      zIndexClass="z-40"
    >
      {/* macOS Window / Tab Top Bar with Upper-Left Controls */}
      <div
        onDoubleClick={onToggleMaximize}
        className="px-3.5 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/[0.04] flex items-center justify-between gap-3 select-none shrink-0"
      >
        {/* Upper-Left: Exit, Minimize, Maximize buttons + Active Tab Title */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <WindowControls
            onClose={onClose}
            onMinimize={onMinimize}
            onToggleMaximize={onToggleMaximize}
            isMaximized={isMaximized}
          />

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.06] border border-white/10 min-w-0">
            <span className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${meta.accentClass}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-white font-display truncate">
                {meta.title}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline whitespace-nowrap">
                · {meta.subtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Upper-Right: Quick Expand/Restore & Exit Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleMaximize}
            className="liquid-btn min-h-[34px] px-2.5 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-medium text-slate-200 hidden sm:flex items-center gap-1.5 whitespace-nowrap"
            title={isMaximized ? 'Restore compact window' : 'Maximize window'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{isMaximized ? 'Compact' : 'Maximize'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="liquid-btn min-h-[34px] min-w-[34px] px-2 sm:px-2.5 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/25 text-[11px] font-medium text-rose-200 flex items-center justify-center gap-1 whitespace-nowrap"
            title="Exit window"
            aria-label="Exit window"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Smooth-Scrolling Feature Viewport */}
      <div
        ref={scrollBodyRef}
        className="flex-1 overflow-y-auto smooth-scroll p-4 sm:p-6"
        onDragOver={(e) => {
          e.preventDefault();
          if (e.dataTransfer) {
            e.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onDropFiles(e.dataTransfer.files);
          }
        }}
      >
        {feature === 'files' && (
          <FilesPage
            items={items}
            onOpenItem={onOpenItem}
            onDownloadItem={onDownloadItem}
            onDeleteItem={onDeleteItem}
            onToggleStar={onToggleStar}
            onTriggerUpload={onTriggerUpload}
            onDropFiles={onDropFiles}
          />
        )}

        {feature === 'docs' && (
          <DocumentsPage
            items={items}
            onOpenItem={onOpenItem}
            onCreateDoc={() => onCreateItem('docs')}
            onDownloadItem={onDownloadItem}
            onDeleteItem={onDeleteItem}
          />
        )}

        {feature === 'sheets' && (
          <SpreadsheetsPage
            items={items}
            onOpenItem={onOpenItem}
            onCreateSheet={() => onCreateItem('sheets')}
            onDownloadItem={onDownloadItem}
            onDeleteItem={onDeleteItem}
          />
        )}

        {feature === 'slides' && (
          <PresentationsPage
            items={items}
            onOpenItem={onOpenItem}
            onCreateDeck={() => onCreateItem('slides')}
            onDownloadItem={onDownloadItem}
            onDeleteItem={onDeleteItem}
          />
        )}

        {feature === 'settings' && (
          <SettingsPage
            items={items}
            profile={profile}
            onUpdateProfile={onUpdateProfile}
            onExportWorkspace={onExportWorkspace}
            onImportWorkspace={onImportWorkspace}
            onResetSampleData={onResetSampleData}
            onClearWorkspace={onClearWorkspace}
          />
        )}
      </div>
    </MacWindowFrame>
  );
};
