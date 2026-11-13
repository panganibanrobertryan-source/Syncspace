import { useState, useEffect } from 'react';

function detectIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const mobileUa = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const narrowViewport = window.innerWidth < 768;
  return mobileUa || narrowViewport;
}

function detectDeviceName(isMobile: boolean): string {
  if (typeof navigator === 'undefined') return isMobile ? 'Mobile Phone' : 'Laptop / Desktop';
  const ua = navigator.userAgent || '';
  if (/iPhone/i.test(ua)) return 'iPhone (Mobile)';
  if (/Android/i.test(ua)) return 'Android Phone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (isMobile) return 'Mobile Phone';
  if (/Mac/i.test(ua)) return 'MacBook / Mac';
  if (/Windows/i.test(ua)) return 'Windows Laptop / PC';
  return 'Laptop / Desktop';
}

export function useDeviceMode() {
  const [isMobile, setIsMobile] = useState<boolean>(() => detectIsMobile());

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(detectIsMobile());
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    deviceType: (isMobile ? 'mobile' : 'desktop') as 'mobile' | 'desktop',
    deviceName: detectDeviceName(isMobile),
  };
}
