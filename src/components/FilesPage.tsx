import React, { useState, useMemo } from 'react';
import { 
  FileText, Table2, Presentation, File, Search, Upload, 
  Trash2, Download, Star, Filter, LayoutGrid, List as ListIcon, 
  ArrowUpDown, ExternalLink 
} from 'lucide-react';
import { WorkspaceItem, ItemKind } from '../types';
import { formatBytes, formatDate } from '../utils';

interface FilesPageProps {
  items: WorkspaceItem[];
  onOpenItem: (item: WorkspaceItem) => void;
  onDownloadItem: (item: WorkspaceItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleStar: (id: string) => void;
  onTriggerUpload: () => void;
  onDropFiles: (files: FileList) => void;
}

export const FilesPage: React.FC<FilesPageProps> = ({
  items,
  onOpenItem,
  onDownloadItem,
  onDeleteItem,
  onToggleStar,
  onTriggerUpload,
  onDropFiles,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'size'>('updated');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isDragOver, setIsDragOver] = useState(false);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        // Query search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchKind = item.kind.toLowerCase().includes(q);
          if (!matchName && !matchKind) return false;
        }

        // Category Filter
        if (activeFilter === 'all') return true;
        if (activeFilter === 'starred') return item.starred;
        if (activeFilter === 'docs') return item.kind === 'docs';
        if (activeFilter === 'sheets') return item.kind === 'sheets';
        if (activeFilter === 'slides') return item.kind === 'slides';
        if (activeFilter === 'images') return item.mime?.startsWith('image/') || item.name.match(/\.(png|jpe?g|svg|webp)$/i);
        if (activeFilter === 'pdf') return item.mime === 'application/pdf' || item.name.endsWith('.pdf');
        if (activeFilter === 'other') return item.kind === 'file' && !item.mime?.startsWith('image/') && item.mime !== 'application/pdf';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'updated') return b.updated - a.updated;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'size') return (b.size || 0) - (a.size || 0);
        return 0;
      });
  }, [items, searchQuery, activeFilter, sortBy]);

  const getItemIcon = (item: WorkspaceItem) => {
    if (item.kind === 'docs') return <FileText className="w-4 h-4 text-indigo-400" />;
    if (item.kind === 'sheets') return <Table2 className="w-4 h-4 text-emerald-400" />;
    if (item.kind === 'slides') return <Presentation className="w-4 h-4 text-amber-400" />;
    if (item.mime?.startsWith('image/')) return <File className="w-4 h-4 text-pink-400" />;
    if (item.mime === 'application/pdf') return <File className="w-4 h-4 text-rose-400" />;
    return <File className="w-4 h-4 text-sky-400" />;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  return (
    <div 
      className="space-y-6 animate-in fade-in duration-200"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 font-semibold block mb-0.5">
            File Storage & Repository
          </span>
          <h1 className="text-2xl font-bold text-slate-100 font-display">
            My files
          </h1>
          <p className="text-xs text-slate-400">
            Upload, organize, preview, and download documents across your devices.
          </p>
        </div>

        <button
          onClick={onTriggerUpload}
          className="liquid-btn flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/20 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload files</span>
        </button>
      </div>

      {/* Drag & Drop Notice Banner */}
      <div 
        onClick={onTriggerUpload}
        className={`p-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${isDragOver ? 'border-indigo-400 bg-indigo-500/15 backdrop-blur-xl scale-[1.005]' : 'border-white/15 hover:border-white/25 liquid-glass'}`}
      >
        <Upload className={`w-5 h-5 ${isDragOver ? 'text-indigo-300' : 'text-slate-400'}`} />
        <span className="text-xs text-slate-200">
          Drag and drop files here to store in SyncSpace, or <strong className="text-indigo-300 underline underline-offset-2">browse files</strong>
        </span>
      </div>

      {/* Toolbar: Search, Filters, Sort, View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 liquid-glass rounded-2xl">
        
        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-xl flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="bg-transparent border-0 outline-none text-xs text-slate-100 placeholder-slate-400 w-full"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'starred', label: 'Starred' },
            { id: 'docs', label: 'Docs' },
            { id: 'sheets', label: 'Sheets' },
            { id: 'slides', label: 'Slides' },
            { id: 'images', label: 'Images' },
            { id: 'pdf', label: 'PDFs' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`liquid-btn px-2.5 py-1 text-xs rounded-lg whitespace-nowrap ${activeFilter === f.id ? 'bg-indigo-500 text-white font-semibold shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/10'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort & View Toggle */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-white/[0.06] border border-white/10 rounded-xl px-2.5 py-1 text-xs text-slate-200 outline-none"
          >
            <option value="updated" className="bg-slate-900">Recently Updated</option>
            <option value="name" className="bg-slate-900">Name (A-Z)</option>
            <option value="size" className="bg-slate-900">Size (Largest)</option>
          </select>

          <div className="flex items-center bg-white/[0.05] p-0.5 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Table View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Files Display */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-white/15 rounded-2xl liquid-glass">
          <File className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No matching files found</h3>
          <p className="text-xs text-slate-400 mt-1">Try clearing filters or search query.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table / List View */
        <div className="rounded-2xl overflow-hidden liquid-glass">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-slate-300 font-medium">
                <th className="py-2.5 px-4 w-10"></th>
                <th className="py-2.5 px-4">Name</th>
                <th className="py-2.5 px-4 hidden md:table-cell">Kind</th>
                <th className="py-2.5 px-4 hidden sm:table-cell">Size</th>
                <th className="py-2.5 px-4 hidden lg:table-cell">Last Modified</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredItems.map(item => (
                <tr 
                  key={item.id}
                  className="hover:bg-white/[0.05] transition-colors group"
                >
                  <td className="py-2.5 px-4">
                    <button
                      onClick={() => onToggleStar(item.id)}
                      className={`p-1 rounded transition-colors ${item.starred ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                      title="Star item"
                    >
                      <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400' : ''}`} />
                    </button>
                  </td>
                  <td className="py-2.5 px-4">
                    <div 
                      onClick={() => onOpenItem(item)}
                      className="flex items-center gap-2.5 cursor-pointer max-w-md truncate"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0">
                        {getItemIcon(item)}
                      </div>
                      <span className="font-medium text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 hidden md:table-cell text-slate-300 capitalize">
                    {item.kind}
                  </td>
                  <td className="py-2.5 px-4 hidden sm:table-cell text-slate-300 font-mono tabular-nums">
                    {formatBytes(item.size)}
                  </td>
                  <td className="py-2.5 px-4 hidden lg:table-cell text-slate-400">
                    {formatDate(item.updated)}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onOpenItem(item)}
                        className="liquid-btn px-2.5 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 border border-white/10 text-slate-100 rounded-lg"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => onDownloadItem(item)}
                        className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${item.name}"?`)) onDeleteItem(item.id);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="p-4 rounded-2xl liquid-card hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.07] border border-white/10 flex items-center justify-center">
                    {getItemIcon(item)}
                  </div>
                  <button
                    onClick={() => onToggleStar(item.id)}
                    className={`p-1 rounded ${item.starred ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Star className={`w-3.5 h-3.5 ${item.starred ? 'fill-amber-400' : ''}`} />
                  </button>
                </div>
                <div 
                  onClick={() => onOpenItem(item)}
                  className="font-semibold text-xs text-slate-100 group-hover:text-indigo-300 transition-colors cursor-pointer truncate font-display"
                >
                  {item.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                  <span className="capitalize">{item.kind}</span>
                  <span>·</span>
                  <span>{formatBytes(item.size)}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>{formatDate(item.updated)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenItem(item)}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Open"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDownloadItem(item)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${item.name}"?`)) onDeleteItem(item.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
