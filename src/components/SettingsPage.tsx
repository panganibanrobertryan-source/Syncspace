import React, { useState } from 'react';
import { 
  Settings, User, HardDrive, Download, Upload, 
  Trash2, RotateCcw, Check, ShieldCheck, Sparkles 
} from 'lucide-react';
import { WorkspaceItem, UserProfile } from '../types';
import { formatBytes, downloadBlob } from '../utils';

interface SettingsPageProps {
  items: WorkspaceItem[];
  profile: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onExportWorkspace: () => void;
  onImportWorkspace: (importedItems: WorkspaceItem[]) => void;
  onResetSampleData: () => void;
  onClearWorkspace: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  items,
  profile,
  onUpdateProfile,
  onExportWorkspace,
  onImportWorkspace,
  onResetSampleData,
  onClearWorkspace,
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...profile,
      name: name.trim() || 'Workspace User',
      email: email.trim() || 'user@syncspace.local',
      avatarText: (name.trim() || 'W').charAt(0).toUpperCase(),
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportWorkspace(parsed);
          alert(`Successfully imported ${parsed.length} items to your workspace!`);
        } else if (parsed.items && Array.isArray(parsed.items)) {
          onImportWorkspace(parsed.items);
          alert(`Successfully imported ${parsed.items.length} items to your workspace!`);
        } else {
          alert('Invalid SyncSpace workspace backup format.');
        }
      } catch (err: any) {
        alert('Could not parse backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Storage breakdown
  const docsSize = items.filter(i => i.kind === 'docs').reduce((a, c) => a + (c.size || 0), 0);
  const sheetsSize = items.filter(i => i.kind === 'sheets').reduce((a, c) => a + (c.size || 0), 0);
  const slidesSize = items.filter(i => i.kind === 'slides').reduce((a, c) => a + (c.size || 0), 0);
  const filesSize = items.filter(i => i.kind === 'file').reduce((a, c) => a + (c.size || 0), 0);
  const totalSize = docsSize + sheetsSize + slidesSize + filesSize;

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold block mb-0.5">
          Workspace Preferences
        </span>
        <h1 className="text-2xl font-bold text-slate-100 font-display">
          Settings
        </h1>
        <p className="text-xs text-slate-400">
          Manage your account profile, storage limits, and workspace backups.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="p-6 rounded-3xl liquid-card space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/25 border border-indigo-400/35 flex items-center justify-center font-bold text-indigo-200 text-sm">
            {profile.avatarText}
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 font-display">
              User Profile
            </h2>
            <p className="text-xs text-slate-400">Personalize your identity in SyncSpace</p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/10 focus:border-indigo-400 rounded-xl px-3.5 py-2 text-xs text-slate-100 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              className="liquid-btn flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/20"
            >
              {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Changes Saved' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Storage & Usage Breakdown */}
      <div className="p-6 rounded-3xl liquid-card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HardDrive className="w-5 h-5 text-indigo-300" />
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-display">
                Storage Allocation
              </h2>
              <p className="text-xs text-slate-400">Browser local storage utilization</p>
            </div>
          </div>
          <span className="font-mono text-xs text-slate-200 font-semibold tabular-nums">
            {formatBytes(totalSize)} / {formatBytes(profile.storageLimitBytes)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden flex">
          <div style={{ width: `${(docsSize / (totalSize || 1)) * 100}%` }} className="bg-indigo-400 h-full" title="Docs" />
          <div style={{ width: `${(sheetsSize / (totalSize || 1)) * 100}%` }} className="bg-emerald-400 h-full" title="Sheets" />
          <div style={{ width: `${(slidesSize / (totalSize || 1)) * 100}%` }} className="bg-amber-400 h-full" title="Slides" />
          <div style={{ width: `${(filesSize / (totalSize || 1)) * 100}%` }} className="bg-sky-400 h-full" title="Files" />
        </div>

        {/* Breakdown chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[11px] text-indigo-300 block font-medium">Docs</span>
            <span className="font-mono text-slate-100">{formatBytes(docsSize)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[11px] text-emerald-300 block font-medium">Sheets</span>
            <span className="font-mono text-slate-100">{formatBytes(sheetsSize)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[11px] text-amber-300 block font-medium">Slides</span>
            <span className="font-mono text-slate-100">{formatBytes(slidesSize)}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <span className="text-[11px] text-sky-300 block font-medium">Files</span>
            <span className="font-mono text-slate-100">{formatBytes(filesSize)}</span>
          </div>
        </div>
      </div>

      {/* Backup, Restore & Data Management */}
      <div className="p-6 rounded-3xl liquid-card space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100 font-display">
            Data Portability & Backup
          </h2>
          <p className="text-xs text-slate-400">Export or restore your full workspace snapshot</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Export */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-xs text-slate-100 block mb-1">
                Export Workspace
              </span>
              <p className="text-[11px] text-slate-400 mb-3">
                Download a JSON snapshot containing all your documents, spreadsheets, slides, and files.
              </p>
            </div>
            <button
              onClick={onExportWorkspace}
              className="liquid-btn flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 text-xs font-medium rounded-xl w-full"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Backup (.json)</span>
            </button>
          </div>

          {/* Import */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
            <div>
              <span className="font-semibold text-xs text-slate-100 block mb-1">
                Restore Workspace
              </span>
              <p className="text-[11px] text-slate-400 mb-3">
                Load a previously exported SyncSpace backup file to restore your content.
              </p>
            </div>
            <label className="liquid-btn flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-100 text-xs font-medium rounded-xl cursor-pointer w-full">
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Backup File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset and Clear */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => {
              if (confirm('Reset workspace with sample starter documents, spreadsheets, and slides?')) {
                onResetSampleData();
              }
            }}
            className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-200 text-xs font-medium rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5 text-indigo-300" />
            <span>Reset to Starter Sample Data</span>
          </button>

          <button
            onClick={() => {
              if (confirm('Clear ALL local data from your workspace? This cannot be undone.')) {
                onClearWorkspace();
              }
            }}
            className="liquid-btn flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 text-rose-300 text-xs font-medium rounded-xl"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Workspace</span>
          </button>
        </div>
      </div>

    </div>
  );
};
