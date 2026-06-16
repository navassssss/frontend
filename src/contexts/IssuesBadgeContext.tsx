// ============================================================
// IssuesBadgeContext
//
// Provides a shared open-issues count badge for Sidebar and
// BottomNav. Replaces the duplicated independent fetches that
// were causing two simultaneous API calls for identical data.
//
// Refresh policy:
//   - On mount (once)
//   - visibilitychange → visible  (minimum 5-minute cooldown)
//   - window focus                (minimum 5-minute cooldown)
// ============================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface IssuesBadgeContextType {
  openIssuesCount: number;
}

const IssuesBadgeContext = createContext<IssuesBadgeContextType>({ openIssuesCount: 0 });

const FIVE_MINUTES = 5 * 60 * 1000;

export function IssuesBadgeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [openIssuesCount, setOpenIssuesCount] = useState(0);
  const lastFetchRef = useRef(0);

  // Only fetch for roles that actually show the badge (principal / manager)
  const shouldFetch =
    user?.role === 'principal' ||
    user?.role === 'manager' ||
    (user?.role === 'teacher' && (user as any)?.is_vice_principal);

  const fetchCount = async () => {
    if (!shouldFetch) return;
    if (Date.now() - lastFetchRef.current < FIVE_MINUTES) return;
    lastFetchRef.current = Date.now();
    try {
      const { data } = await api.get('/issues?status=open&per_page=1');
      setOpenIssuesCount(data.total ?? data.length ?? 0);
    } catch {
      // silent — badge is non-critical
    }
  };

  useEffect(() => {
    if (!shouldFetch) return;

    fetchCount();

    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };
    const onFocus = () => fetchCount();

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetch]);

  return (
    <IssuesBadgeContext.Provider value={{ openIssuesCount }}>
      {children}
    </IssuesBadgeContext.Provider>
  );
}

export function useIssuesBadge(): IssuesBadgeContextType {
  return useContext(IssuesBadgeContext);
}
