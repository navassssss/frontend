import { Bell, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';
import { cn } from '@/lib/utils';

/**
 * Desktop-only top header.
 * Shown via `hidden lg:flex` in AppLayout.
 * Contains: right-side notifications + avatar dropdown (profile + logout).
 */
export function DesktopHeader() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        if (!showMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showMenu]);

    const handleLogout = () => {
        logout();
        navigate('/staff/login');
    };

    const avatarInitials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : 'S';

    return (
        <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 z-40 bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] items-center justify-end px-6 gap-3">
            {/* Notifications */}
            <button
                onClick={() => navigate('/notifications')}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                title="Notifications"
            >
                <Bell className="w-[18px] h-[18px]" strokeWidth={2.5} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center leading-none">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Avatar + dropdown */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setShowMenu(v => !v)}
                    className="w-9 h-9 rounded-full bg-emerald-800 flex items-center justify-center text-white text-[13px] font-black hover:bg-emerald-700 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    title={user?.name || 'Account'}
                >
                    {avatarInitials}
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-scale-in z-50">
                        {/* User info header */}
                        <div className="px-4 py-3 border-b border-slate-50">
                            <p className="text-[13px] font-black text-slate-900 truncate">{user?.name || 'Staff'}</p>
                            <p className="text-[11px] font-medium text-slate-500 capitalize mt-0.5">{user?.role || ''}</p>
                        </div>

                        <div className="p-1.5">
                            <button
                                onClick={() => { setShowMenu(false); navigate('/profile'); }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                            >
                                <User className="w-4 h-4 text-slate-400" />
                                View Profile
                            </button>
                        </div>

                        <div className="p-1.5 pt-0 border-t border-slate-50">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-bold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
