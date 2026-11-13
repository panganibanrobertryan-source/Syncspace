import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  ScanLine,
  Smartphone,
  Laptop,
  Tablet,
  X,
  Copy,
  Check,
  RefreshCw,
  ArrowRightLeft,
  ShieldCheck,
  Download,
  Wifi,
  Radio,
  Unplug,
} from 'lucide-react';
import { WorkspaceItem, PairedDevice } from '../types';
import { MobileQRScanner } from './MobileQRScanner';
import { MacWindowFrame } from './MacWindowFrame';
import { WindowControls } from './WindowControls';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  isMobile: boolean;
  deviceName: string;
  currentDeviceId: string;
  hostRoomId: string;
  activeRoomId: string;
  wsConnected: boolean;
  items: WorkspaceItem[];
  pairedDevices: PairedDevice[];
  onJoinRoom: (roomCode: string) => void;
  onLeaveJoinedRoom: () => void;
  onRegenerateHostCode: () => void;
  onSyncAll: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  onMinimize,
  isMaximized = false,
  onToggleMaximize,
  isMobile,
  deviceName,
  currentDeviceId,
  hostRoomId,
  activeRoomId,
  wsConnected,
  items,
  pairedDevices,
  onJoinRoom,
  onLeaveJoinedRoom,
  onRegenerateHostCode,
  onSyncAll,
}) => {
  // Mobile defaults to 'scanner', Laptop defaults to 'qr'
  const [activeTab, setActiveTab] = useState<'qr' | 'scanner' | 'devices' | 'pin'>(
    isMobile ? 'scanner' : 'qr'
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputPin, setInputPin] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset default tab whenever modal opens or device mode changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(isMobile ? 'scanner' : 'qr');
    }
  }, [isOpen, isMobile]);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://syncspace.app';
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pairSessionUrl = `${currentOrigin}${currentPath}?pairSession=${activeRoomId}&device=mobile`;

  // Generate QR Code on canvas when QR tab is visible
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr') return;

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        pairSessionUrl,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('Error generating canvas QR code:', error);
        }
      );
    }

    QRCode.toDataURL(pairSessionUrl, { width: 400, margin: 2 })
      .then((url) => setQrUrl(url))
      .catch(console.error);
  }, [isOpen, pairSessionUrl, activeTab]);

  if (!isOpen) return null;

  const isJoinedToExternalRoom = activeRoomId !== hostRoomId;
  const formattedPin =
    activeRoomId.length === 6
      ? `${activeRoomId.slice(0, 3)}-${activeRoomId.slice(3)}`
      : activeRoomId;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pairSessionUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTriggerSync = () => {
    setIsSyncing(true);
    onSyncAll();
    setTimeout(() => {
      setIsSyncing(false);
    }, 900);
  };

  const handleConnectByPin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputPin.replace(/[-\s]/g, '').toUpperCase();
    if (clean.length < 4) return;
    onJoinRoom(clean);
    setInputPin('');
    setActiveTab('devices');
  };

  const handleQrScanned = (scannedRoomCode: string) => {
    onJoinRoom(scannedRoomCode);
    setActiveTab('devices');
  };

  return (
    <MacWindowFrame
      isMaximized={isMaximized}
      onBackdropClick={onMinimize || onClose}
      maxWidthClass="max-w-xl"
      heightClass="max-h-[76dvh] sm:max-h-[80dvh]"
      zIndexClass="z-40"
    >
        {/* Top Header */}
        <div
          onDoubleClick={onToggleMaximize}
          className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.03] select-none"
        >
          <div className="flex items-center gap-3 min-w-0">
            <WindowControls
              onClose={onClose}
              onMinimize={onMinimize}
              onToggleMaximize={onToggleMaximize}
              isMaximized={isMaximized}
            />
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              {isMobile ? <ScanLine className="w-5 h-5" /> : <QrCode className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-100 font-display truncate">
                {isMobile ? 'Mobile QR Scanner & File Sync' : 'QR Mobile Connect (Laptop Host)'}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {isMobile
                  ? 'I-scan ang QR code sa laptop para mag-sync ng files'
                  : 'Ipa-scan ang QR code sa selpon para maka-connect'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="liquid-btn min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher - Distinct primary experience for Mobile vs Laptop */}
        <div className="flex border-b border-white/10 bg-white/[0.02] px-4 pt-2 gap-1 sm:gap-2 text-xs overflow-x-auto">
          {isMobile ? (
            <>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'scanner'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <ScanLine className="w-3.5 h-3.5" />
                <span>QR Scanner</span>
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'devices'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Devices ({pairedDevices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pin')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'pin'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>I-type ang PIN</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('qr')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'qr'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Laptop QR Code</span>
              </button>
              <button
                onClick={() => setActiveTab('devices')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'devices'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Konektadong Devices ({pairedDevices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pin')}
                className={`min-h-[44px] pb-2 px-3 font-medium border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeTab === 'pin'
                    ? 'border-indigo-500 text-indigo-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Pairing PIN</span>
              </button>
            </>
          )}
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto smooth-scroll flex-1">
          {/* MOBILE SCANNER TAB */}
          {activeTab === 'scanner' && (
            <div className="space-y-4">
              {isJoinedToExternalRoom && (
                <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-emerald-300">
                      Naka-connect sa Sync Room: {formattedPin}
                    </div>
                    <div className="text-[11px] text-emerald-400/80">
                      Synchronized · {items.length} files available
                    </div>
                  </div>
                  <button
                    onClick={onLeaveJoinedRoom}
                    className="min-h-[40px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 shrink-0"
                  >
                    <Unplug className="w-3.5 h-3.5 text-rose-400" />
                    <span>Disconnect</span>
                  </button>
                </div>
              )}

              <MobileQRScanner onCodeDetected={handleQrScanned} />
            </div>
          )}

          {/* LAPTOP QR CODE TAB */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-5">
              {/* QR Code Presentation Box */}
              <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center">
                <canvas ref={canvasRef} className="rounded-lg" />
                <div className="mt-2 text-[11px] font-mono font-bold text-slate-800 tracking-wider">
                  SYNC CODE: {formattedPin}
                </div>
              </div>

              {/* Instructions */}
              <div className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-left space-y-2">
                <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Paano I-connect ang Selpon sa Laptop:</span>
                </div>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Buksan ang SyncSpace sa iyong <strong>selpon</strong> (may lalabas na <strong>Scan QR</strong> scanner).</li>
                  <li>O gamitin ang native Camera ng selpon at itapat sa QR code sa itaas.</li>
                  <li>Kapag na-scan, awtomatikong mag-si-sync ang lahat ng files sa pagitan ng laptop at selpon.</li>
                </ol>
              </div>

              {/* Pairing Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full pt-1">
                <button
                  onClick={handleCopyLink}
                  className="liquid-btn min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/20 whitespace-nowrap shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Na-kopya na!' : 'Kopyahin ang Link'}</span>
                </button>

                {qrUrl && (
                  <a
                    href={qrUrl}
                    download="syncspace-qr-code.png"
                    className="liquid-btn min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </a>
                )}

                {!isJoinedToExternalRoom && (
                  <button
                    onClick={onRegenerateHostCode}
                    className="liquid-btn min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-slate-100 text-xs font-medium rounded-xl whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Bagong Code</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PAIRED DEVICES & SYNC TAB */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 font-display">
                    Sync Room: <span className="font-mono text-indigo-400">{formattedPin}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {wsConnected
                      ? 'Live real-time synchronization active'
                      : 'Kumokonekta sa sync server...'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isJoinedToExternalRoom && (
                    <button
                      onClick={onLeaveJoinedRoom}
                      className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl transition-colors"
                    >
                      <Unplug className="w-3.5 h-3.5 text-rose-400" />
                      <span>Disconnect</span>
                    </button>
                  )}
                  <button
                    onClick={handleTriggerSync}
                    disabled={isSyncing}
                    className="min-h-[40px] flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Nagsi-sync...' : 'I-sync Ngayon'}</span>
                  </button>
                </div>
              </div>

              {/* Devices List */}
              <div className="space-y-2 pt-1">
                {pairedDevices.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/30">
                    {isMobile ? (
                      <>
                        <ScanLine className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">
                          Hindi pa naka-connect sa laptop. I-scan ang QR code ng laptop para makita ang synced files.
                        </p>
                        <button
                          onClick={() => setActiveTab('scanner')}
                          className="mt-3 min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl"
                        >
                          Buksan ang QR Scanner
                        </button>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">
                          Wala pang selpon na naka-scan sa QR code. Buksan ang SyncSpace sa selpon at i-scan ang QR code.
                        </p>
                        <button
                          onClick={() => setActiveTab('qr')}
                          className="mt-3 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl"
                        >
                          Ipakita ang Laptop QR Code
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  pairedDevices.map((device) => {
                    const isSelf = device.id === currentDeviceId;
                    return (
                      <div
                        key={device.id}
                        className={`flex items-center justify-between p-3.5 rounded-xl border ${
                          isSelf
                            ? 'bg-slate-950/70 border-indigo-500/30'
                            : 'bg-slate-950/50 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                              device.type === 'mobile'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}
                          >
                            {device.type === 'mobile' ? (
                              <Smartphone className="w-5 h-5" />
                            ) : device.type === 'tablet' ? (
                              <Tablet className="w-5 h-5" />
                            ) : (
                              <Laptop className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-200 flex items-center gap-2 truncate">
                              <span className="truncate">{device.name}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                                  THIS DEVICE
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <span className="text-emerald-400 font-medium">Synced</span>
                              <span>·</span>
                              <span>{items.length} files</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={handleTriggerSync}
                            className="min-h-[36px] px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1"
                            title="I-sync ang files"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-emerald-400" />
                            <span>Sync</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-xs text-slate-300 flex items-center justify-between">
                <span>
                  Kabuuang Synced Files: <strong className="text-white">{items.length}</strong>
                </span>
                <span className={wsConnected ? 'text-emerald-300 font-medium' : 'text-amber-300'}>
                  {wsConnected ? 'Live Sync Ready' : 'Connecting...'}
                </span>
              </div>
            </div>
          )}

          {/* MANUAL PAIRING PIN TAB */}
          {activeTab === 'pin' && (
            <div className="space-y-4 max-w-md mx-auto">
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-100 font-display">
                  {isMobile
                    ? 'I-enter ang Pairing Code ng Laptop'
                    : 'Manual Pairing Code (PIN)'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isMobile
                    ? 'Ilagay ang 6-digit code na nakikita sa screen ng iyong laptop.'
                    : 'Gamitin ito kung walang camera ang kabilang device.'}
                </p>
              </div>

              {!isMobile && (
                <div className="p-4 bg-white/[0.04] border border-white/10 rounded-2xl text-center">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider block mb-1">
                    Laptop Pairing Code:
                  </span>
                  <div className="text-2xl font-mono font-bold text-indigo-300 tracking-widest my-1">
                    {formattedPin}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="mt-2 text-xs text-slate-300 hover:text-white underline underline-offset-2 flex items-center justify-center gap-1 mx-auto"
                  >
                    {copiedCode ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedCode ? 'Na-kopya na!' : 'Kopyahin ang Code'}</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleConnectByPin} className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {isMobile
                      ? '6-Digit Code mula sa Laptop:'
                      : 'O mag-enter ng ibang Sync Room Code:'}
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="hal. 482-910"
                    value={inputPin}
                    onChange={(e) => setInputPin(e.target.value)}
                    className="w-full min-h-[48px] bg-white/[0.05] border border-white/15 focus:border-indigo-400 rounded-xl px-3.5 py-2.5 text-center font-mono font-bold text-base tracking-wider text-slate-100 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inputPin.replace(/[-\s]/g, '').length < 4}
                  className="liquid-btn w-full min-h-[44px] py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 disabled:opacity-40 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 border border-white/20"
                >
                  I-connect sa Sync Room
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.03] flex items-center justify-between gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">
              {deviceName} · {wsConnected ? 'Synced' : 'Offline'}
            </span>
          </span>
          <div className="flex items-center gap-3 shrink-0">
            {isMobile && activeTab !== 'qr' && (
              <button
                onClick={() => setActiveTab('qr')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Ipakita QR
              </button>
            )}
            {!isMobile && activeTab !== 'scanner' && (
              <button
                onClick={() => setActiveTab('scanner')}
                className="text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Buksan Scanner
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white font-medium transition-colors"
            >
              Isara
            </button>
          </div>
        </div>
    </MacWindowFrame>
  );
};
