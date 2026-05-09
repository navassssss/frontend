import { Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';

interface DesktopHeaderProps {
    title?: string;
}

/**
 * Desktop-only sticky top header.
 * Shown via `hidden lg:flex` in AppLayout.
 * Left: page title.  Right: notification bell + avatar dropdown.
 */
export function DesktopHeader({ title }: DesktopHeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { unreadCount } = useNotifications();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

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
        <header className="hidden lg:flex fixed top-0 left-60 right-0 h-12 z-40 bg-white border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] items-center justify-between px-6">
            {/* Left: Page title */}
            <span className="text-[13px] font-semibold text-slate-400 select-none">
                {title || 'Dashboard'}
            </span>

            {/* Right: Grouped account actions */}
            <div className="flex items-center gap-1.5">
                {/* Notifications */}
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
                    title="Notifications"
                >
                    <Bell className="w-4 h-4" strokeWidth={2.5} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* Thin separator */}
                <div className="w-px h-5 bg-slate-150 mx-1" />

                {/* Avatar */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className="w-8 h-8 rounded-full bg-emerald-800 flex items-center justify-center text-white text-[11px] font-black hover:bg-emerald-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        title={user?.name || 'Account'}
                    >
                        {avatarInitials}
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-10 w-44 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden z-50 animate-scale-in">
                            {/* User info */}
                            <div className="px-3 py-2.5 border-b border-slate-50">
                                <p className="text-[12px] font-bold text-slate-800 truncate">{user?.name || 'Staff'}</p>
                                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{user?.role || ''}</p>
                            </div>

                            <div className="p-1">
                                <button
                                    onClick={() => { setShowMenu(false); navigate('/profile'); }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors duration-150 text-left"
                                >
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    View Profile
                                </button>
                            </div>

                            <div className="p-1 pt-0 border-t border-slate-50">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold text-rose-500 hover:bg-rose-50 transition-colors duration-150 text-left"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
