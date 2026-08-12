'use client';

import { useEffect, useState } from 'react';

const UPDATE_CHECK_INTERVAL_MS = 300_000;
const DISPLAY_MODE_CHECK_MS = 10_000;

interface PwaUpdateState {
  waitingWorker: ServiceWorker | null;
  showReload: boolean;
  reloadPage: () => void;
}

export function usePWAUpdate(): PwaUpdateState {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV === 'development') {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let registration: ServiceWorkerRegistration | null = null;
    let updateFoundHandler: (() => void) | null = null;
    let messageHandler: ((event: MessageEvent) => void) | null = null;
    const trackedWorkers: Array<{ worker: ServiceWorker; handler: () => void }> = [];
    let cancelled = false;

    const handleStateChange = (worker: ServiceWorker) => () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        setWaitingWorker(worker);
        setShowReload(true);
      }
    };

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (cancelled) return;
        registration = reg;

        updateFoundHandler = () => {
          const worker = reg.installing;
          if (!worker) return;
          const handler = handleStateChange(worker);
          worker.addEventListener('statechange', handler);
          trackedWorkers.push({ worker, handler });
        };
        reg.addEventListener('updatefound', updateFoundHandler);

        messageHandler = (event: MessageEvent) => {
          if (event.data?.type === 'SW_UPDATED') setShowReload(true);
        };
        navigator.serviceWorker.addEventListener('message', messageHandler);

        if (reg.waiting) {
          setWaitingWorker(reg.waiting);
          setShowReload(true);
        }

        intervalId = setInterval(() => {
          void reg.update();
        }, UPDATE_CHECK_INTERVAL_MS);
      } catch {}
    };

    void setup();

    const handleOnline = () => {
      void navigator.serviceWorker.ready.then((reg) => reg.update());
    };
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
      if (intervalId !== null) clearInterval(intervalId);
      if (registration && updateFoundHandler) {
        registration.removeEventListener('updatefound', updateFoundHandler);
      }
      if (messageHandler) {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
      }
      for (const { worker, handler } of trackedWorkers) {
        worker.removeEventListener('statechange', handler);
      }
    };
  }, []);

  const reloadPage = () => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setWaitingWorker(null);
    setShowReload(false);
    globalThis.location.reload();
  };

  return { waitingWorker, showReload, reloadPage };
}

export function useIsOnline(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return isOnline;
}

export function useIsPWA(): boolean {
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const check = () => {
      const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
      const fullscreen = window.matchMedia?.('(display-mode: fullscreen)').matches;
      const minimal = window.matchMedia?.('(display-mode: minimal-ui)').matches;
      const iosStandalone =
        'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone;
      setIsPwa(Boolean(standalone || fullscreen || minimal || iosStandalone));
    };

    check();
    const id = setInterval(check, DISPLAY_MODE_CHECK_MS);
    return () => clearInterval(id);
  }, []);

  return isPwa;
}

interface BeforeInstallPromptEvent extends Event {
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

interface InstallPromptState {
  isInstallable: boolean;
  installApp: () => Promise<boolean>;
}

export function useInstallPrompt(): InstallPromptState {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    const onInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!installPrompt) return false;
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome !== 'accepted') return false;
      setInstallPrompt(null);
      setIsInstallable(false);
      return true;
    } catch {
      return false;
    }
  };

  return { isInstallable, installApp };
}
