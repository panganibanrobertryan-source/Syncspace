import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './components/OverviewPage';
import { FeatureWindowModal, WindowFeaturePage } from './components/FeatureWindowModal';
import { DocumentEditorModal } from './components/DocumentEditorModal';
import { SpreadsheetEditorModal } from './components/SpreadsheetEditorModal';
import { PresentationEditorModal } from './components/PresentationEditorModal';
import { FilePreviewModal } from './components/FilePreviewModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { CommandPalette } from './components/CommandPalette';
import { MacDock } from './components/MacDock';
import { WindowExitMode } from './components/MacWindowFrame';
import { WorkspaceItem, ItemKind, NavPage, UserProfile, PairedDevice } from './types';
import { INITIAL_ITEMS } from './initialData';
import { generateId, downloadBlob, convertSheetToCSV } from './utils';
import { useDeviceMode } from './hooks/useDeviceMode';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { motion, AnimatePresence } from 'motion/react';

const STORAGE_KEY_ITEMS = 'syncspace_workspace_items_v3';
const STORAGE_KEY_PROFILE = 'syncspace_user_profile_v3';
const STORAGE_KEY_DEVICE_ID = 'syncspace_device_id_v1';
const STORAGE_KEY_HOST_ROOM = 'syncspace_host_room_v1';
const STORAGE_KEY_JOINED_ROOM = 'syncspace_joined_room_v1';

function createSixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function App() {
  // Local storage state for workspace items - starts completely clean with 0 files
  const [items, setItems] = useState<WorkspaceItem[]>(() => {
    try {
      const alreadyReset = localStorage.getItem('syncspace_clean_scratch_v3');
      if (!alreadyReset) {
        localStorage.removeItem('syncspace_workspace_items_v1');
        localStorage.removeItem('syncspace_workspace_items_v2');
        localStorage.removeItem(STORAGE_KEY_ITEMS);
        localStorage.setItem('syncspace_clean_scratch_v3', 'true');
        return [];
      }
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load items from storage:', e);
    }
    return [];
  });

  // User profile
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      name: 'User',
      email: 'user@syncspace.local',
      avatarText: 'U',
      isDemo: true,
      storageLimitBytes: 50 * 1024 * 1024, // 50 MB
    };
  });

  const { isMobile, deviceType, deviceName } = useDeviceMode();

  const [currentDeviceId] = useState<string>(() => {
    try {
      const existing = sessionStorage.getItem(STORAGE_KEY_DEVICE_ID);
      if (existing) return existing;
      const created = generateId('dev');
      sessionStorage.setItem(STORAGE_KEY_DEVICE_ID, created);
      return created;
    } catch {
      return generateId('dev');
    }
  });

  const [hostRoomId, setHostRoomId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem(STORAGE_KEY_HOST_ROOM);
      if (existing) return existing;
      const created = createSixDigitCode();
      localStorage.setItem(STORAGE_KEY_HOST_ROOM, created);
      return created;
    } catch {
      return createSixDigitCode();
    }
  });

  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get('pairSession');
      if (fromUrl) {
        const clean = fromUrl.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
        localStorage.setItem(STORAGE_KEY_JOINED_ROOM, clean);
        return clean;
      }
      return localStorage.getItem(STORAGE_KEY_JOINED_ROOM);
    } catch {
      return null;
    }
  });

  const activeRoomId = joinedRoomId || hostRoomId;
  const isJoiningPeerRef = useRef<boolean>(Boolean(joinedRoomId));

  const [activeFeatureWindow, setActiveFeatureWindow] = useState<WindowFeaturePage | null>(null);
  const [minimizedFeatures, setMinimizedFeatures] = useState<WindowFeaturePage[]>([]);
  const [isFeatureMaximized, setIsFeatureMaximized] = useState(false);
  const [featureExitMode, setFeatureExitMode] = useState<WindowExitMode>('close');
  const [activeEditingItem, setActiveEditingItem] = useState<WorkspaceItem | null>(null);
  const [activePreviewItem, setActivePreviewItem] = useState<WorkspaceItem | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDeviceSyncModalOpen, setIsDeviceSyncModalOpen] = useState(false);
  const [minimizedItemIds, setMinimizedItemIds] = useState<string[]>([]);
  const [isSyncMinimized, setIsSyncMinimized] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  const [windowExitMode, setWindowExitMode] = useState<WindowExitMode>('close');
  const [wsConnected, setWsConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const effectivePage: NavPage = activeFeatureWindow || 'home';

  const [pairedDevices, setPairedDevices] = useState<PairedDevice[]>([]);

  const minimizedItems = minimizedItemIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is WorkspaceItem => Boolean(i));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainScrollRef = useRef<HTMLElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const itemsRef = useRef<WorkspaceItem[]>(items);
  const isRemoteUpdateRef = useRef<boolean>(false);

  useSmoothScroll(mainScrollRef);

  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeFeatureWindow]);

  itemsRef.current = items;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  };

  // Sync items to localStorage and broadcast to active WebSocket room
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    if (isRemoteUpdateRef.current) {
      isRemoteUpdateRef.current = false;
      return;
    }

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'sync:items',
          roomId: activeRoomId,
          items,
          senderDeviceId: currentDeviceId,
        })
      );
    }
  }, [items, activeRoomId, currentDeviceId]);

  // Sync profile to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('LocalStorage profile error:', e);
    }
  }, [profile]);

  // Real-time cross-device WebSocket connection with automatic reconnect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let closedIntentionally = false;
    let reconnectTimer: number | null = null;

    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        ws.send(
          JSON.stringify({
            type: 'join',
            roomId: activeRoomId,
            deviceId: currentDeviceId,
            deviceName,
            deviceType,
            isJoiningPeer: isJoiningPeerRef.current,
            items: itemsRef.current,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'room:state') {
            if (Array.isArray(msg.devices)) {
              setPairedDevices(msg.devices);
            }
            if (Array.isArray(msg.items) && (isJoiningPeerRef.current || msg.items.length > 0)) {
              isRemoteUpdateRef.current = true;
              setItems(msg.items);
            }
            isJoiningPeerRef.current = false;
          } else if (msg.type === 'sync:items') {
            if (msg.senderDeviceId !== currentDeviceId && Array.isArray(msg.items)) {
              isRemoteUpdateRef.current = true;
              setItems(msg.items);
              showToast('Na-sync ang mga bagong files mula sa kabilang device!');
            }
          } else if (msg.type === 'room:devices') {
            if (Array.isArray(msg.devices)) {
              setPairedDevices(msg.devices);
            }
            if (msg.joinedDevice && msg.joinedDevice.id !== currentDeviceId) {
              showToast(`Konektado na ang ${msg.joinedDevice.name}!`);
            }
          }
        } catch (err) {
          console.warn('WS parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (!closedIntentionally) {
          reconnectTimer = window.setTimeout(connectWs, 2000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWs();

    // Clean up URL query param after joining via scanned URL
    const params = new URLSearchParams(window.location.search);
    if (params.get('pairSession')) {
      showToast('Konektado ka na sa Laptop SyncSpace gamit ang QR Code!');
      const cleanUrl = `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState({}, '', cleanUrl);
    }

    return () => {
      closedIntentionally = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [activeRoomId, currentDeviceId, deviceName, deviceType]);

  const handleJoinRoom = (roomCode: string) => {
    const clean = roomCode.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    if (!clean) return;
    isJoiningPeerRef.current = true;
    localStorage.setItem(STORAGE_KEY_JOINED_ROOM, clean);
    setJoinedRoomId(clean);
    showToast(`Kumokonekta sa Sync Room ${clean}...`);
  };

  const handleLeaveJoinedRoom = () => {
    isJoiningPeerRef.current = false;
    localStorage.removeItem(STORAGE_KEY_JOINED_ROOM);
    setJoinedRoomId(null);
    showToast('Nadiskonekta mula sa host sync room.');
  };

  const handleRegenerateHostCode = () => {
    const nextCode = createSixDigitCode();
    localStorage.setItem(STORAGE_KEY_HOST_ROOM, nextCode);
    setHostRoomId(nextCode);
    showToast(`Bagong QR Sync Code: ${nextCode}`);
  };

  const handleSyncAll = async () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'sync:items',
          roomId: activeRoomId,
          items,
          senderDeviceId: currentDeviceId,
        })
      );
    } else {
      try {
        await fetch(`/api/sync/${encodeURIComponent(activeRoomId)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, senderDeviceId: currentDeviceId }),
        });
      } catch (e) {
        console.warn('REST sync fallback error:', e);
      }
    }
    showToast('Matagumpay na na-sync ang mga files sa mga konektadong devices!');
  };



  // Window management handlers (Open compact first, Minimize to Dock, Maximize/Restore, Exit)
  const minimizeTopOverlayWindows = () => {
    if (activeEditingItem) {
      const id = activeEditingItem.id;
      setWindowExitMode('minimize');
      setMinimizedItemIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActiveEditingItem(null);
    }
    if (activePreviewItem) {
      const id = activePreviewItem.id;
      setWindowExitMode('minimize');
      setMinimizedItemIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActivePreviewItem(null);
    }
    if (isDeviceSyncModalOpen) {
      setWindowExitMode('minimize');
      setIsSyncMinimized(true);
      setIsDeviceSyncModalOpen(false);
    }
  };

  const handleOpenDeviceSync = () => {
    if (isDeviceSyncModalOpen) {
      handleMinimizeSync();
      return;
    }
    minimizeTopOverlayWindows();
    if (activeFeatureWindow) {
      const prevFeature = activeFeatureWindow;
      setFeatureExitMode('minimize');
      setMinimizedFeatures((prev) => (prev.includes(prevFeature) ? prev : [...prev, prevFeature]));
      setActiveFeatureWindow(null);
    }
    setWindowExitMode('close');
    setIsSyncMinimized(false);
    setIsWindowMaximized(false);
    setIsDeviceSyncModalOpen(true);
  };

  const handleMinimizeSync = () => {
    setWindowExitMode('minimize');
    setIsSyncMinimized(true);
    setIsDeviceSyncModalOpen(false);
  };

  const handleCloseSync = () => {
    setWindowExitMode('close');
    setIsSyncMinimized(false);
    setIsDeviceSyncModalOpen(false);
    setIsWindowMaximized(false);
  };

  const handleRestoreSync = () => {
    minimizeTopOverlayWindows();
    if (activeFeatureWindow) {
      const prevFeature = activeFeatureWindow;
      setFeatureExitMode('minimize');
      setMinimizedFeatures((prev) => (prev.includes(prevFeature) ? prev : [...prev, prevFeature]));
      setActiveFeatureWindow(null);
    }
    setWindowExitMode('close');
    setIsSyncMinimized(false);
    setIsWindowMaximized(false);
    setIsDeviceSyncModalOpen(true);
  };

  const handleMinimizeFeatureWindow = () => {
    if (!activeFeatureWindow) return;
    const feat = activeFeatureWindow;
    setFeatureExitMode('minimize');
    setMinimizedFeatures((prev) => (prev.includes(feat) ? prev : [...prev, feat]));
    setActiveFeatureWindow(null);
  };

  const handleCloseFeatureWindow = () => {
    const feat = activeFeatureWindow;
    setFeatureExitMode('close');
    if (feat) {
      setMinimizedFeatures((prev) => prev.filter((f) => f !== feat));
    }
    setActiveFeatureWindow(null);
    setIsFeatureMaximized(false);
  };

  const handleRestoreFeatureWindow = (feature: WindowFeaturePage) => {
    minimizeTopOverlayWindows();
    if (activeFeatureWindow && activeFeatureWindow !== feature) {
      const prevFeature = activeFeatureWindow;
      setFeatureExitMode('minimize');
      setMinimizedFeatures((prev) =>
        prev.includes(prevFeature) ? prev.filter((f) => f !== feature) : [...prev.filter((f) => f !== feature), prevFeature]
      );
    } else {
      setMinimizedFeatures((prev) => prev.filter((f) => f !== feature));
    }
    setFeatureExitMode('close');
    setIsFeatureMaximized(false);
    setActiveFeatureWindow(feature);
  };

  const handleLaunchDockFeature = (page: NavPage) => {
    if (page === 'home') {
      minimizeTopOverlayWindows();
      if (activeFeatureWindow) {
        handleMinimizeFeatureWindow();
      }
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const hasTopOverlay = Boolean(activeEditingItem || activePreviewItem || isDeviceSyncModalOpen);
    if (activeFeatureWindow === page && !hasTopOverlay) {
      handleMinimizeFeatureWindow();
      return;
    }

    minimizeTopOverlayWindows();

    if (activeFeatureWindow && activeFeatureWindow !== page) {
      const prevFeature = activeFeatureWindow;
      setFeatureExitMode('minimize');
      setMinimizedFeatures((prev) => {
        const cleaned = prev.filter((f) => f !== page);
        return cleaned.includes(prevFeature) ? cleaned : [...cleaned, prevFeature];
      });
    } else {
      setMinimizedFeatures((prev) => prev.filter((f) => f !== page));
    }

    setFeatureExitMode('close');
    setIsFeatureMaximized(false); // Always open compact / naka-minimize size first!
    setActiveFeatureWindow(page);
  };

  // Open item in respective modal (compact first)
  const handleOpenItem = (item: WorkspaceItem) => {
    if (isDeviceSyncModalOpen) {
      setWindowExitMode('minimize');
      setIsSyncMinimized(true);
      setIsDeviceSyncModalOpen(false);
    }
    setWindowExitMode('close');
    setMinimizedItemIds((prev) => prev.filter((id) => id !== item.id));
    setIsWindowMaximized(false);
    if (item.kind === 'docs' || item.kind === 'sheets' || item.kind === 'slides') {
      setActivePreviewItem(null);
      setActiveEditingItem(item);
    } else {
      setActiveEditingItem(null);
      setActivePreviewItem(item);
    }
  };

  const handleMinimizeEditingItem = () => {
    if (!activeEditingItem) return;
    const itemId = activeEditingItem.id;
    setWindowExitMode('minimize');
    setMinimizedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    setActiveEditingItem(null);
  };

  const handleCloseEditingItem = () => {
    const itemId = activeEditingItem?.id;
    setWindowExitMode('close');
    if (itemId) {
      setMinimizedItemIds((prev) => prev.filter((id) => id !== itemId));
    }
    setActiveEditingItem(null);
    setIsWindowMaximized(false);
  };

  const handleMinimizePreviewItem = () => {
    if (!activePreviewItem) return;
    const itemId = activePreviewItem.id;
    setWindowExitMode('minimize');
    setMinimizedItemIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
    setActivePreviewItem(null);
  };

  const handleClosePreviewItem = () => {
    const itemId = activePreviewItem?.id;
    setWindowExitMode('close');
    if (itemId) {
      setMinimizedItemIds((prev) => prev.filter((id) => id !== itemId));
    }
    setActivePreviewItem(null);
    setIsWindowMaximized(false);
  };

  // Create new item from scratch
  const handleCreateItem = (kind: ItemKind) => {
    const defaultName = 
      kind === 'docs' ? 'Untitled Document' :
      kind === 'sheets' ? 'Untitled Spreadsheet' :
      kind === 'slides' ? 'Untitled Presentation' : 'New File';

    // Blank templates from scratch
    const blankSheet = [
      ['Column A', 'Column B', 'Column C', 'Column D', 'Column E'],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ];

    const blankSlides = [
      {
        id: generateId('slide'),
        title: 'Untitled Presentation',
        subtitle: 'Click to add subtitle or presenter details',
        bullets: ['Key objective & narrative overview'],
        notes: '',
        layout: 'title' as const,
        themeId: 'obsidian-glass' as const,
        titleAlign: 'center' as const,
        titleFontSize: 'xl' as const,
        transition: 'morph' as const,
        transitionDuration: 0.55,
        elements: [],
      }
    ];

    const newItem: WorkspaceItem = {
      id: generateId(kind),
      kind,
      name: defaultName,
      content: 
        kind === 'docs' ? '# Untitled Document\n\nStart typing here...\n' :
        kind === 'sheets' ? JSON.stringify(blankSheet) :
        kind === 'slides' ? JSON.stringify(blankSlides) : '',
      size: 256,
      updated: Date.now(),
      starred: false,
      tags: [kind],
    };

    setWindowExitMode('close');
    setIsWindowMaximized(false);
    setActivePreviewItem(null);
    setItems(prev => [newItem, ...prev]);
    setActiveEditingItem(newItem);
    showToast(`Created new ${kind === 'docs' ? 'document' : kind === 'sheets' ? 'spreadsheet' : 'presentation'}`);
  };

  // Save updated item from modal
  const handleSaveItem = (updatedItem: WorkspaceItem) => {
    setItems(prev => prev.map(item => (item.id === updatedItem.id ? updatedItem : item)));
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setMinimizedItemIds(prev => prev.filter(itemId => itemId !== id));
    if (activeEditingItem?.id === id) setActiveEditingItem(null);
    if (activePreviewItem?.id === id) setActivePreviewItem(null);
    showToast('Item deleted');
  };

  // Toggle starred
  const handleToggleStar = (id: string) => {
    setItems(prev =>
      prev.map(item => (item.id === id ? { ...item, starred: !item.starred } : item))
    );
  };

  // Download item
  const handleDownloadItem = (item: WorkspaceItem) => {
    if (item.kind === 'docs') {
      const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.md`;
      downloadBlob(item.content || '', filename, 'text/markdown;charset=utf-8');
      showToast('Document downloaded as Markdown');
    } else if (item.kind === 'sheets') {
      let grid: string[][] = [];
      try {
        grid = JSON.parse(item.content || '[]');
      } catch {}
      const csv = convertSheetToCSV(grid);
      const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.csv`;
      downloadBlob(csv, filename, 'text/csv;charset=utf-8');
      showToast('Spreadsheet downloaded as CSV');
    } else if (item.kind === 'slides') {
      let slides: any[] = [];
      try {
        slides = JSON.parse(item.content || '[]');
      } catch {}
      const text = slides
        .map((s, idx) => `Slide ${idx + 1}: ${s.title}\n${s.subtitle ? s.subtitle + '\n' : ''}${s.bullets?.map((b: string) => `• ${b}`).join('\n')}`)
        .join('\n\n');
      const filename = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_slides.txt`;
      downloadBlob(text, filename, 'text/plain;charset=utf-8');
      showToast('Presentation outline downloaded');
    } else {
      if (item.url) {
        const a = document.createElement('a');
        a.href = item.url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        downloadBlob(item.content || '', item.name, item.mime || 'application/octet-stream');
      }
      showToast('File downloaded');
    }
  };

  // File Upload Handling
  const handleFilesUpload = async (files: FileList | File[]) => {
    const newItems: WorkspaceItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.csv') || file.name.endsWith('.txt');
      
      let content = '';
      let url = '';

      if (isText) {
        content = await file.text();
      } else {
        url = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      // Check kind
      let kind: ItemKind = 'file';
      if (file.name.endsWith('.md') || file.name.endsWith('.txt')) kind = 'docs';
      else if (file.name.endsWith('.csv')) kind = 'sheets';

      newItems.push({
        id: generateId('file'),
        kind,
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        content,
        url,
        updated: Date.now(),
        starred: false,
        tags: ['uploaded'],
      });
    }

    setItems(prev => [...newItems, ...prev]);
    showToast(`Na-copy ang ${newItems.length} ${newItems.length === 1 ? 'file' : 'files'} sa workspace!`);
  };

  // Export full workspace JSON
  const handleExportWorkspace = () => {
    const backup = {
      app: 'SyncSpace',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile,
      items,
    };
    downloadBlob(
      JSON.stringify(backup, null, 2),
      `syncspace_backup_${new Date().toISOString().slice(0, 10)}.json`,
      'application/json'
    );
    showToast('Workspace backup JSON downloaded');
  };

  // Import full workspace JSON
  const handleImportWorkspace = (imported: WorkspaceItem[]) => {
    setItems(imported);
    showToast(`Restored ${imported.length} items to workspace`);
  };

  // Reset to initial sample data
  const handleResetSampleData = () => {
    setItems(INITIAL_ITEMS);
    showToast('Reset workspace to starter sample data');
  };

  // Clear workspace
  const handleClearWorkspace = () => {
    setItems([]);
    setMinimizedItemIds([]);
    setActiveEditingItem(null);
    setActivePreviewItem(null);
    localStorage.removeItem(STORAGE_KEY_ITEMS);
    localStorage.removeItem('syncspace_workspace_items_v1');
    localStorage.removeItem('syncspace_workspace_items_v2');
    showToast('Nalinis na ang workspace. Walang naka-save na files.');
  };

  return (
    <div className="relative min-h-screen bg-[#050814] text-slate-100 flex flex-col md:flex-row antialiased overflow-hidden">
      {/* Ambient Apple Liquid Glass atmospheric light field (zero-cost radial gradients) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[18%] -left-[10%] w-[620px] h-[620px] rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.22)_0%,transparent_70%)]" />
        <div className="absolute top-[18%] right-[-10%] w-[560px] h-[560px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16)_0%,transparent_70%)]" />
        <div className="absolute -bottom-[20%] left-[26%] w-[640px] h-[640px] rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.16)_0%,transparent_70%)]" />
      </div>
      
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesUpload(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={effectivePage}
        onNavigate={handleLaunchDockFeature}
        items={items}
        onCreateItem={handleCreateItem}
        onTriggerUpload={() => fileInputRef.current?.click()}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        profile={profile}
        onOpenDeviceSync={handleOpenDeviceSync}
        isMobile={isMobile}
      />

      {/* Main Content Area (Overview Desktop Workspace) */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <Header
          currentPage={effectivePage}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onTriggerUpload={() => fileInputRef.current?.click()}
          onToggleMobileMenu={() => setIsMobileSidebarOpen(prev => !prev)}
          onOpenDeviceSync={handleOpenDeviceSync}
          isMobile={isMobile}
          pairedCount={pairedDevices.length}
        />

        {/* Desktop Overview Viewport */}
        <main
          ref={mainScrollRef}
          className="flex-1 overflow-y-auto smooth-scroll p-4 pb-24 md:p-8 md:pb-28"
          onDragOver={(e) => {
            e.preventDefault();
            if (e.dataTransfer) {
              e.dataTransfer.dropEffect = 'copy';
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleFilesUpload(e.dataTransfer.files);
            }
          }}
        >
          <div className="max-w-6xl mx-auto">
            <OverviewPage
              items={items}
              onCreateItem={handleCreateItem}
              onOpenItem={handleOpenItem}
              onDownloadItem={handleDownloadItem}
              onDeleteItem={handleDeleteItem}
              onTriggerUpload={() => fileInputRef.current?.click()}
              onDropFiles={handleFilesUpload}
              onNavigate={handleLaunchDockFeature}
              onOpenDeviceSync={handleOpenDeviceSync}
              isMobile={isMobile}
            />
          </div>
        </main>
      </div>

      {/* Compact-First Windowed Dock Features (Files, Docs, Sheets, Slides, Settings) */}
      <AnimatePresence custom={featureExitMode}>
        {activeFeatureWindow && (
          <FeatureWindowModal
            key={`feature-${activeFeatureWindow}`}
            feature={activeFeatureWindow}
            items={items}
            profile={profile}
            isMaximized={isFeatureMaximized}
            onToggleMaximize={() => setIsFeatureMaximized(v => !v)}
            onMinimize={handleMinimizeFeatureWindow}
            onClose={handleCloseFeatureWindow}
            onOpenItem={handleOpenItem}
            onCreateItem={handleCreateItem}
            onDownloadItem={handleDownloadItem}
            onDeleteItem={handleDeleteItem}
            onToggleStar={handleToggleStar}
            onTriggerUpload={() => fileInputRef.current?.click()}
            onDropFiles={handleFilesUpload}
            onUpdateProfile={setProfile}
            onExportWorkspace={handleExportWorkspace}
            onImportWorkspace={handleImportWorkspace}
            onResetSampleData={handleResetSampleData}
            onClearWorkspace={handleClearWorkspace}
          />
        )}
      </AnimatePresence>

      {/* Windowed Editor, Preview & QR Sync Modals with Smooth Open/Exit/Minimize/Maximize Transitions */}
      <AnimatePresence custom={windowExitMode}>
        {activeEditingItem && activeEditingItem.kind === 'docs' && (
          <DocumentEditorModal
            key={`docs-${activeEditingItem.id}`}
            item={activeEditingItem}
            onSave={handleSaveItem}
            onClose={handleCloseEditingItem}
            onMinimize={handleMinimizeEditingItem}
            isMaximized={isWindowMaximized}
            onToggleMaximize={() => setIsWindowMaximized(v => !v)}
          />
        )}

        {activeEditingItem && activeEditingItem.kind === 'sheets' && (
          <SpreadsheetEditorModal
            key={`sheets-${activeEditingItem.id}`}
            item={activeEditingItem}
            onSave={handleSaveItem}
            onClose={handleCloseEditingItem}
            onMinimize={handleMinimizeEditingItem}
            isMaximized={isWindowMaximized}
            onToggleMaximize={() => setIsWindowMaximized(v => !v)}
          />
        )}

        {activeEditingItem && activeEditingItem.kind === 'slides' && (
          <PresentationEditorModal
            key={`slides-${activeEditingItem.id}`}
            item={activeEditingItem}
            onSave={handleSaveItem}
            onClose={handleCloseEditingItem}
            onMinimize={handleMinimizeEditingItem}
            isMaximized={isWindowMaximized}
            onToggleMaximize={() => setIsWindowMaximized(v => !v)}
          />
        )}

        {activePreviewItem && (
          <FilePreviewModal
            key={`preview-${activePreviewItem.id}`}
            item={activePreviewItem}
            onSave={handleSaveItem}
            onDelete={handleDeleteItem}
            onClose={handleClosePreviewItem}
            onMinimize={handleMinimizePreviewItem}
            isMaximized={isWindowMaximized}
            onToggleMaximize={() => setIsWindowMaximized(v => !v)}
          />
        )}

        {isDeviceSyncModalOpen && (
          <DeviceSyncModal
            key="device-sync-window"
            isOpen={true}
            onClose={handleCloseSync}
            onMinimize={handleMinimizeSync}
            isMaximized={isWindowMaximized}
            onToggleMaximize={() => setIsWindowMaximized(v => !v)}
            isMobile={isMobile}
            deviceName={deviceName}
            currentDeviceId={currentDeviceId}
            hostRoomId={hostRoomId}
            activeRoomId={activeRoomId}
            wsConnected={wsConnected}
            items={items}
            pairedDevices={pairedDevices}
            onJoinRoom={handleJoinRoom}
            onLeaveJoinedRoom={handleLeaveJoinedRoom}
            onRegenerateHostCode={handleRegenerateHostCode}
            onSyncAll={handleSyncAll}
          />
        )}
      </AnimatePresence>

      {/* Command Palette Modal (Cmd+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        items={items}
        onOpenItem={handleOpenItem}
        onCreateItem={handleCreateItem}
        onNavigate={handleLaunchDockFeature}
      />

      {/* MacBook-style Liquid Glass Bottom Dock */}
      <MacDock
        activeFeatureWindow={activeFeatureWindow}
        minimizedFeatures={minimizedFeatures}
        onLaunchDockFeature={handleLaunchDockFeature}
        onRestoreFeatureWindow={handleRestoreFeatureWindow}
        onOpenDeviceSync={handleOpenDeviceSync}
        isMobile={isMobile}
        isSyncOpen={isDeviceSyncModalOpen}
        isSyncMinimized={isSyncMinimized}
        minimizedItems={minimizedItems}
        activeEditingItem={activeEditingItem}
        activePreviewItem={activePreviewItem}
        onRestoreItem={handleOpenItem}
        onRestoreSync={handleRestoreSync}
      />

      {/* Floating Liquid Glass Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-5 z-50 liquid-glass-elevated text-slate-100 text-xs px-4 py-2.5 rounded-2xl flex items-center gap-2.5"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]" />
            <span className="font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
