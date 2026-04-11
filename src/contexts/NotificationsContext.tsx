// ============================================================
// NotificationsContext  (event-driven — no polling)
//
// Triggers a fresh fetch on:
//   1. Mount (initial load)
//   2. document visibilitychange → visible  (PWA reopen / tab switch)
//   3. window focus              (desktop click-back)
//   4. PUSH_RECEIVED postMessage from Service Worker
//
// Exposes:
//   notifications, unreadCount, hasUnread, isLoading, error,
//   refresh(), markAsRead(), markAllAsRead()
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

// Notification types that deserve a visible toast
const TOAST_WORTHY_TYPES: AppNotification['data']['type'][] = [
  'warning', 'error', 'issue',
];

interface NotificationsContextType {
  notifications:       AppNotification[];
  unreadCount:         number;
  hasUnread:           boolean;
  isLoading:           boolean;
  error:               string | null;
  refresh:             () => void;
  markAsRead:          (id: string) => Promise<void>;
  markAllAsRead:       () => Promise<void>;
}

// ── Context ───────────────────────────────────────────────────
const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  // Guard: prevent concurrent in-flight fetches
  const isFetchingRef = useRef(false);

  // ── Core fetch ───────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (isFetchingRef.current) return;   // skip if already running
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const { data } = await api.get<AppNotification[]>('/notifications');
      if (Array.isArray(data)) {
        setNotifications(data);
        setError(null);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load notifications';
      console.error('[Notifications] fetch error:', msg);
      setError(msg);
      // Keep the last successful list — don't wipe it on a transient error
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  // ── Event-driven refresh listeners ───────────────────────
  useEffect(() => {
    // 1. Initial fetch on mount
    fetchNotifications();

    // 2. Tab/PWA visibility restored (covers PWA close → reopen)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notifications] Tab visible — refreshing');
        fetchNotifications();
      }
    };

    // 3. Window focus (desktop: alt-tab back, click on window)
    const onWindowFocus = () => {
      console.log('[Notifications] Window focused — refreshing');
      fetchNotifications();
    };

    // 4. Service Worker push message → re-fetch + optional toast
    const onSWMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'PUSH_RECEIVED') return;

      const payload = event.data.payload as {
        title?: string;
        body?:  string;
        type?:  AppNotification['data']['type'];
        url?:   string;
      };

      console.log('[Notifications] PUSH_RECEIVED from SW:', payload);

      // Only show toast for important/actionable types, not routine info
      const isImportant = TOAST_WORTHY_TYPES.includes(payload.type as any);
      if (isImportant) {
        toast.warning(payload.title || 'New notification', {
          description: payload.body,
          duration: 6000,
        });
      } else {
        // Non-intrusive: a very short info toast
        toast.info(payload.title || 'New notification', {
          description: payload.body,
          duration: 3500,
        });
      }

      // Immediately refresh so the list shows the new item
      fetchNotifications();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    navigator.serviceWorker?.addEventListener('message', onSWMessage);

    // ── Cleanup — prevent memory leaks ────────────────────
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      navigator.serviceWorker?.removeEventListener('message', onSWMessage);
    };
  }, [fetchNotifications]);   // stable: fetchNotifications is a useCallback with no deps

  // ── Derived state ─────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const hasUnread   = unreadCount > 0;

  // ── Mark single as read (optimistic) ──────────────────────
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update — instant UI
    setNotifications((prev) =>
      prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
    );
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (err) {
      console.error('[Notifications] markAsRead failed — rolling back', err);
      // Rollback: re-fetch server truth
      fetchNotifications();
    }
  }, [fetchNotifications]);

  // ── Mark all as read (optimistic) ─────────────────────────
  const markAllAsRead = useCallback(async () => {
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
        refresh:      fetchNotifications,
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
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return ctx;
}
