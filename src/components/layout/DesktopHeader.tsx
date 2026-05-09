import { Bell, LogOut, User, Home, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';

interface DesktopHeaderProps {
    title?: string;
}

// Map routes to breadcrumb labels
const routeLabels: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/students': 'Students',
    '/students/new': 'Add Student',
    '/attendance': 'Attendance',
    '/teachers': 'Teachers',
    '/teachers/new': 'Add Teacher',
    '/classes': 'Classes',
    '/fees': 'Donations',
    '/issues': 'Issues',
    '/issues/new': 'Raise Issue',
    '/reports': 'Reports',
    '/reports/new': 'Submit Report',
    '/announcements': 'Announcements',
    '/announcements/new': 'New Announcement',
    '/profile': 'My Profile',
    '/notifications': 'Notifications',
    '/tasks': 'Tasks',
    '/tasks/new': 'Create Task',
    '/duties': 'Duties',
    '/duties/new': 'Create Duty',
    '/medical': 'Medical Records',
    '/outpasses': 'Outpasses',
    '/subjects': 'Subjects',
    '/cce/works': 'CCE Works',
    '/cce/student-marks': 'Student Marks',
    '/student-achievements': 'Achievements',
};

function getBreadcrumb(pathname: string, title?: string): string {
    if (title) return title.toUpperCase();
    // Try exact match first
    if (routeLabels[pathname]) return routeLabels[pathname].toUpperCase();
    // Try prefix match
    const prefix = Object.keys(routeLabels)
        .filter(k => pathname.startsWith(k) && k !== '/')
        .sort((a, b) => b.length - a.length)[0];
    return prefix ? routeLabels[prefix].toUpperCase() : pathname.split('/').filter(Boolean).pop()?.toUpperCase() || 'PORTAL';
}

export function DesktopHeader({ title }: DesktopHeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotifications();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const breadcrumb = getBreadcrumb(location.pathname, title);

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

    const displayName = user?.name || 'Staff';
    const displayRole = user?.is_vice_principal ? 'Vice Principal'
        : user?.role === 'principal' ? 'Administrator'
        : user?.role === 'teacher' ? 'Teacher'
        : user?.role === 'manager' ? 'Manager'
        : user?.role || '';

    return (
        <header className="hidden lg:flex fixed top-0 left-60 right-0 h-14 z-40 bg-white border-b border-slate-100 items-center px-6 gap-4">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-1.5 shrink-0">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                    <Home className="w-3.5 h-3.5" />
                </button>
                {location.pathname !== '/dashboard' && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                            {breadcrumb}
                        </span>
                    </>
                )}
            </div>

            {/* Center: Search */}
            <div className="flex-1 flex justify-center max-w-sm mx-auto">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="w-full h-8 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-full text-[12px] text-slate-600 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
                    />
                </div>
            </div>

            {/* Right: Notification + User info + Avatar */}
            <div className="flex items-center gap-3 shrink-0">
                {/* Bell */}
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-150"
                    title="Notifications"
                >
                    <Bell className="w-4 h-4" strokeWidth={2.2} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 bg-rose-500 text-white text-[8px] font-black rounded-full min-w-[14px] h-3.5 px-0.5 flex items-center justify-center leading-none">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </button>

                {/* User name + role + avatar dropdown */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-xl hover:bg-slate-50 transition-colors duration-150 focus:outline-none"
                    >
                        {/* Name + role */}
                        <div className="text-right hidden xl:block">
                            <p className="text-[12px] font-bold text-slate-800 leading-tight">{displayName}</p>
                            <p className="text-[10px] text-slate-400 leading-tight capitalize">{displayRole}</p>
                        </div>

                        {/* Avatar circle */}
                        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[11px] font-black shrink-0">
                            {avatarInitials}
                        </div>

                        {/* Chevron */}
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-11 w-44 bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden z-50 animate-scale-in">
                            {/* User info header */}
                            <div className="px-3 py-2.5 border-b border-slate-50">
                                <p className="text-[12px] font-bold text-slate-800 truncate">{displayName}</p>
                                <p className="text-[10px] text-slate-400 capitalize mt-0.5">{displayRole}</p>
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
