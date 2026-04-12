// ============================================================
// NotificationsContext  (event-driven — no polling)
//
// Triggers a fresh fetch on:
//   1. Mount (initial load)
//   2. document visibilitychange → visible  (PWA reopen / tab switch)
//   3. window focus              (desktop click-back)
//   4. PUSH_RECEIVED postMessage from Service Worker
//   5. window 'online' event (auto-retry)
//
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

// ── Types ───────────────────────────────────────────────────
export interface AppNotification {
  id: string;
  type: string;
  data: {
    title:       string;
    message:     string;
    action_url?: string;
    type?:       'info' | 'success' | 'warning' | 'error' | 'issue';
  };
  read_at:    string | null;
  created_at: string;
}

const TOAST_WORTHY_TYPES: AppNotification['data']['type'][] = [
  'warning', 'error', 'issue',
];

interface NotificationsContextType {
  notifications:       AppNotification[];
  unreadCount:         number;
  hasUnread:           boolean;
  isLoading:           boolean;
  error:               string | null;
  lastUpdated:         number | null;
  isOfflineCached:     boolean;
  refresh:             () => void;
  markAsRead:          (id: string) => Promise<void>;
  markAllAsRead:       () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const CACHE_KEY = 'dhic_notifications_cache';
const CACHE_TIME_KEY = 'dhic_notifications_last_updated';

export function NotificationsProvider({ children }: { children: ReactNode }) {
  // Initialize from cache
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  
  const [lastUpdated, setLastUpdated] = useState<number | null>(() => {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    return cachedTime ? parseInt(cachedTime, 10) : null;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);

  const isFetchingRef = useRef(false);

  // ── Core fetch ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;
    
    // Auto-skip if browser says offline
    if (!navigator.onLine) {
      if (notifications.length > 0) setIsOfflineCached(true);
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const { data } = await api.get<AppNotification[]>('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
        setError(null);
        setIsOfflineCached(false);
        const now = Date.now();
        setLastUpdated(now);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_TIME_KEY, now.toString());
      }
    } catch (err: any) {
      // If we failed but have cached data, don't show full error, just warn
      const cachedTimeRaw = localStorage.getItem(CACHE_TIME_KEY);
      const cachedTime = cachedTimeRaw ? parseInt(cachedTimeRaw, 10) : null;
      const cachedData = localStorage.getItem(CACHE_KEY);
      
      if (cachedData && JSON.parse(cachedData).length > 0) {
        setIsOfflineCached(true);
        const ageInMins = cachedTime ? Math.floor((Date.now() - cachedTime) / 60000) : 0;
        if (ageInMins >= 5) {
          toast.warning(`Showing cached data (last updated ${ageInMins} min ago). Connect to internet for latest.`, { id: 'offline-warning' });
        }
      } else {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load notifications';
        console.error('[Notifications] fetch error:', msg);
        setError(msg);
      }
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // ── Event-driven refresh listeners ───────────────────────
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const safeFetch = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const last = parseInt(localStorage.getItem(CACHE_TIME_KEY) || '0', 10);
        if (!last || Date.now() - last > 10000) {
          fetchNotifications();
        }
      }, 300);
    };

    fetchNotifications();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') safeFetch();
    };

    const onWindowFocus = () => safeFetch();
    
    const onOnline = () => {
      // Auto-retry when coming online
      toast.dismiss('offline-warning');
      fetchNotifications();
    };

    const onSWMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'PUSH_RECEIVED') return;

      const payload = event.data.payload as {
        title?: string;
        body?:  string;
        type?:  AppNotification['data']['type'];
      };

      const isImportant = TOAST_WORTHY_TYPES.includes(payload.type as any);
      if (isImportant) {
        toast.warning(payload.title || 'New notification', {
          description: payload.body,
          duration: 6000,
        });
      } else {
        toast.info(payload.title || 'New notification', {
          description: payload.body,
          duration: 2500, // Very short for info
        });
      }

      fetchNotifications();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('online', onOnline);
    navigator.serviceWorker?.addEventListener('message', onSWMessage);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener('message', onSWMessage);
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const hasUnread   = unreadCount > 0;

  // ── Mark single as read (optimistic) ──────────────────────
  const markAsRead = useCallback(async (id: string) => {
    if (!navigator.onLine) return; // don't try if offline
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (err) {
      console.error('[Notifications] markAsRead failed — rolling back', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Mark all as read (optimistic) ─────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!navigator.onLine) return;
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: now })));
    try {
      await api.post('/notifications/read-all');
    } catch (err) {
      console.error('[Notifications] markAllAsRead failed — rolling back', err);
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        isLoading,
        error,
        lastUpdated,
        isOfflineCached,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

// ── Hook ─────────────────────────────────────────────────────
export function useNotifications(): NotificationsContextType {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationsProvider>');
  return ctx;
}
