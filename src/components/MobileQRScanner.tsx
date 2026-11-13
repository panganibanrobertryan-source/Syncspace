import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  RefreshCw,
  ImagePlus,
  AlertCircle,
  CheckCircle2,
  SwitchCamera,
  Loader2,
} from 'lucide-react';

interface MobileQRScannerProps {
  onCodeDetected: (roomCode: string) => void;
  onScanError?: (message: string) => void;
}

export function extractPairCode(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  try {
    const parsedUrl = new URL(trimmed);
    const param = parsedUrl.searchParams.get('pairSession');
    if (param) {
      return param.replace(/[^a-zA-Z0-9_-]/g, '').toUpperCase();
    }
  } catch {
    // Not a full URL, check regex or plain code
  }

  const queryMatch = trimmed.match(/pairSession=([a-zA-Z0-9_-]+)/i);
  if (queryMatch?.[1]) {
    return queryMatch[1].toUpperCase();
  }

  const cleanCode = trimmed.replace(/[-\s]/g, '');
  if (/^[a-zA-Z0-9]{4,16}$/.test(cleanCode)) {
    return cleanCode.toUpperCase();
  }

  return null;
}

export const MobileQRScanner: React.FC<MobileQRScannerProps> = ({
  onCodeDetected,
  onScanError,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const [status, setStatus] = useState<'starting' | 'scanning' | 'detected' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [detectedLabel, setDetectedLabel] = useState<string>('');

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedString = useCallback(
    (rawData: string) => {
      const code = extractPairCode(rawData);
      if (!code) {
        setErrorMessage('Hindi valid na SyncSpace QR code ang na-scan. Subukan muli.');
        onScanError?.('Invalid SyncSpace QR code');
        return false;
      }

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(100);
        } catch {}
      }

      setDetectedLabel(code);
      setStatus('detected');
      stopCamera();
      setTimeout(() => {
        onCodeDetected(code);
      }, 350);
      return true;
    },
    [onCodeDetected, onScanError, stopCamera]
  );

  const startCamera = useCallback(async () => {
    stopCamera();
    setStatus('starting');
    setErrorMessage('');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage(
        'Hindi suportado ng browser ang camera access. Siguraduhing naka-HTTPS o gumamit ng "Pumili ng QR Image" sa ibaba.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback if specific facingMode constraint is unavailable
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
      }

      setStatus('scanning');

      const scanFrame = (timestamp: number) => {
        if (!videoRef.current || !canvasRef.current) return;

        // Throttle decode checks to ~10 fps for smooth mobile battery/CPU usage
        if (timestamp - lastScanTimeRef.current >= 100) {
          lastScanTimeRef.current = timestamp;
          const video = videoRef.current;
          const canvas = canvasRef.current;

          if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });

              if (qrResult?.data) {
                const matched = handleDecodedString(qrResult.data);
                if (matched) return;
              }
            }
          }
        }

        rafRef.current = requestAnimationFrame(scanFrame);
      };

      rafRef.current = requestAnimationFrame(scanFrame);
    } catch (err: any) {
      stopCamera();
      setStatus('error');
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage(
          'Walang camera permission. I-allow ang camera sa browser settings o pumili ng QR image mula sa gallery.'
        );
      } else if (err?.name === 'NotFoundError') {
        setErrorMessage(
          'Walang nakitang camera sa device na ito. Gamitin ang "Pumili ng QR Image" o manual pairing code.'
        );
      } else {
        setErrorMessage(
          'Hindi mabuksan ang camera. Subukang i-refresh o mag-upload ng screenshot ng QR code.'
        );
      }
    }
  }, [facingMode, handleDecodedString, stopCamera]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const handleImageFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        if (qrResult?.data) {
          handleDecodedString(qrResult.data);
        } else {
          setErrorMessage('Walang nabasang QR code sa larawan. Siguraduhing malinaw ang QR code.');
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      {/* Scanner Viewport */}
      <div className="relative w-full max-w-[300px] aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl flex items-center justify-center">
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${status === 'error' ? 'hidden' : 'block'}`}
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder Overlay when Scanning */}
        {(status === 'scanning' || status === 'starting') && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened outer vignette */}
            <div className="w-52 h-52 relative">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-indigo-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-indigo-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-indigo-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-indigo-400 rounded-br-xl" />
            </div>

            {status === 'starting' && (
              <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 text-slate-300">
                <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
                <span className="text-xs font-medium">Binubuksan ang camera...</span>
              </div>
            )}
          </div>
        )}

        {/* Detected State */}
        {status === 'detected' && (
          <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center gap-2 text-emerald-300 p-4 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            <span className="text-sm font-bold font-display">Na-scan ang QR Code!</span>
            <span className="text-xs font-mono text-emerald-200">Session: {detectedLabel}</span>
          </div>
        )}

        {/* Camera Error / Fallback State */}
        {status === 'error' && (
          <div className="p-5 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
            <button
              onClick={startCamera}
              className="min-h-[44px] px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Subukan Muli ang Camera</span>
            </button>
          </div>
        )}
      </div>

      {/* Scanner Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 w-full">
        {status === 'scanning' && (
          <button
            type="button"
            onClick={() => setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))}
            className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <SwitchCamera className="w-4 h-4 text-indigo-400" />
            <span>{facingMode === 'environment' ? 'Front Camera' : 'Rear Camera'}</span>
          </button>
        )}

        <label className="min-h-[44px] px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap shrink-0">
          <ImagePlus className="w-4 h-4 text-emerald-400" />
          <span>Pumili ng QR Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageFileScan}
            className="hidden"
          />
        </label>
      </div>

      {errorMessage && status !== 'error' && (
        <p className="text-xs text-amber-400 text-center">{errorMessage}</p>
      )}

      {/* Scanner Instructions */}
      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 text-left space-y-1.5">
        <div className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
          <Camera className="w-3.5 h-3.5" />
          <span>Mobile Scanner Mode:</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Itapat ang camera ng iyong selpon sa QR code na nakabukas sa screen ng iyong <strong>laptop</strong> para agad ma-synchronize ang lahat ng files.
        </p>
      </div>
    </div>
  );
};
