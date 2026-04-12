// ============================================================
// usePWA — hook for SW registration, push notifications,
//           install prompt, online/offline state
// ============================================================
import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

const DEV = import.meta.env.DEV;

export interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isIOS: boolean;
  notificationPermission: NotificationPermission;
  swRegistration: ServiceWorkerRegistration | null;
  promptInstall: () => void;
  requestPushPermission: () => Promise<void>;
  showIOSInstallTip: boolean;
  dismissIOSTip: () => void;
}

export function usePWA(): PWAState {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [isOnline, setIsOnline]           = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>(() =>
      typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
  const [swRegistration, setSWRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [showIOSInstallTip, setShowIOSInstallTip] = useState(false);

  const deferredPromptRef = useRef<any>(null);

  // Detect iOS
  const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

  // Detect already installed (standalone mode)
  const isInStandaloneMode = () =>
    (window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true;

  // ── Register Service Worker ──────────────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        DEV && console.log('[PWA] Service Worker registered:', reg.scope);
        setSWRegistration(reg);
        const interval = setInterval(() => reg.update(), 60_000);
        return () => clearInterval(interval);
      })
      .catch((err) => console.error('[PWA] SW registration failed:', err));

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      DEV && console.log('[PWA] SW updated — new version active');
    });
  }, []);

  // ── Install prompt ───────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ── Installed / display-mode change ─────────────────────────
  useEffect(() => {
    setIsInstalled(isInStandaloneMode());
    const mq = window.matchMedia('(display-mode: standalone)');
    const onChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // ── iOS install tip — show once if iOS + not installed ───────
  useEffect(() => {
    if (!isIOS || isInStandaloneMode()) return;
    const dismissed = sessionStorage.getItem('dhic-ios-tip-dismissed');
    if (!dismissed) setShowIOSInstallTip(true);
  }, [isIOS]);

  // ── Online / offline ─────────────────────────────────────────
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  toast.success('Back online'); };
    const onOffline = () => { setIsOnline(false); toast.warning('You are offline — cached data available'); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);
  
  // ── Auto-subscribe if permission already granted ───────────
  useEffect(() => {
    if (notificationPermission === 'granted' && swRegistration) {
      subscribeToPush(swRegistration);
    }
  }, [notificationPermission, swRegistration]);


  // ── Prompt Install ───────────────────────────────────────────
  const promptInstall = useCallback(() => {
    if (!deferredPromptRef.current) return;
    deferredPromptRef.current.prompt();
    deferredPromptRef.current.userChoice.then((choice: any) => {
      if (choice.outcome === 'accepted') {
        toast.success('DHIC Portal added to home screen!');
        setIsInstalled(true);
      }
      deferredPromptRef.current = null;
      setIsInstallable(false);
    });
  }, []);

  // ── Request Push Notification permission ─────────────────────
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported on this device');
      return;
    }
    if (Notification.permission === 'granted') {
      toast.info('Notifications already enabled');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      toast.success('Push notifications enabled!');
      await subscribeToPush(swRegistration);
    } else {
      toast.error('Notification permission denied');
    }
  }, [swRegistration]);

  const dismissIOSTip = useCallback(() => {
    setShowIOSInstallTip(false);
    sessionStorage.setItem('dhic-ios-tip-dismissed', '1');
  }, []);

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isIOS,
    notificationPermission,
    swRegistration,
    promptInstall,
    requestPushPermission,
    showIOSInstallTip,
    dismissIOSTip,
  };
}

// ── Push subscription helper ─────────────────────────────────
async function subscribeToPush(reg: ServiceWorkerRegistration | null) {
  if (!reg) return;

  DEV && console.log('[PWA] Checking push subscription status...');

  try {
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      DEV && console.log('[PWA] Browser already has a Push Subscription:', existing.endpoint);
      // Always sync with backend on mount/check just in case the server database was reset
      try {
        DEV && console.log('[PWA] Re-syncing existing subscription to backend /api/push/subscribe...');
        await api.post('/push/subscribe', existing.toJSON());
        DEV && console.log('[PWA] Re-sync successful!');
      } catch (e: any) {
        console.error('[PWA] Failed to re-sync existing subscription:', e.response?.data || e.message);
      }
      return;
    }

    DEV && console.log('[PWA] No existing subscription. Preparing to subscribe...');

    // Use environment variable as primary, fallback to API (for reliability)
    let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    if (!vapidPublicKey) {
        DEV && console.log('[PWA] No VAPID key in .env, fetching from /api/push/vapid-key...');
        const { data } = await api.get('/push/vapid-key');
        vapidPublicKey = data?.publicKey ?? '';
    }

    if (!vapidPublicKey) {
      console.warn('[PWA] No VAPID public key found — skipping push setup');
      return;
    }

    DEV && console.log('[PWA] Using VAPID Public Key:', vapidPublicKey);

    // Base64url → Uint8Array
    const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
    const base64  = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawKey  = Uint8Array.from(window.atob(base64), (c) => c.charCodeAt(0));

    DEV && console.log('[PWA] Requesting push subscription from browser...');
    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: rawKey.buffer as ArrayBuffer,
    });

    DEV && console.log('[PWA] Browser granted subscription:', subscription.endpoint);
    DEV && console.log('[PWA] Sending new subscription to backend...');
    
    // Register subscription with backend
    await api.post('/push/subscribe', subscription.toJSON());
    DEV && console.log('[PWA] Push subscription rigidly registered with server!');
  } catch (err: any) {
    console.error('[PWA] Push subscription complete failure:', err.response?.data || err.message || err);
  }
}
