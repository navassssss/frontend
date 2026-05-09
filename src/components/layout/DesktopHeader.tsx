import { Bell, LogOut, User, Home, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationsContext';

interface DesktopHeaderProps {
    title?: string;
}

// ── Route map: path → { parent?, label } ────────────────────────────────────
const routeMeta: Record<string, { label: string; parent?: string }> = {
    '/dashboard':           { label: 'Dashboard' },
    '/students':            { label: 'Students',           parent: 'Dashboard' },
    '/students/new':        { label: 'Add Student',        parent: 'Students' },
    '/attendance':          { label: 'Attendance',         parent: 'Dashboard' },
    '/classes':             { label: 'Classes',            parent: 'Dashboard' },
    '/teachers':            { label: 'Teachers',           parent: 'Dashboard' },
    '/teachers/new':        { label: 'Add Teacher',        parent: 'Teachers' },
    '/subjects':            { label: 'Subjects',           parent: 'Dashboard' },
    '/cce/works':           { label: 'CCE Works',          parent: 'Dashboard' },
    '/cce/student-marks':   { label: 'Student Marks',      parent: 'CCE Works' },
    '/fees':                { label: 'Donations',          parent: 'Dashboard' },
    '/issues':              { label: 'Issues',             parent: 'Dashboard' },
    '/issues/new':          { label: 'Raise Issue',        parent: 'Issues' },
    '/reports':             { label: 'Reports',            parent: 'Dashboard' },
    '/reports/new':         { label: 'Submit Report',      parent: 'Reports' },
    '/announcements':       { label: 'Announcements',      parent: 'Dashboard' },
    '/announcements/new':   { label: 'New Announcement',   parent: 'Announcements' },
    '/profile':             { label: 'My Profile',         parent: 'Dashboard' },
    '/notifications':       { label: 'Notifications',      parent: 'Dashboard' },
    '/tasks':               { label: 'Tasks',              parent: 'Dashboard' },
    '/tasks/new':           { label: 'Create Task',        parent: 'Tasks' },
    '/duties':              { label: 'Duties',             parent: 'Dashboard' },
    '/duties/new':          { label: 'Create Duty',        parent: 'Duties' },
    '/medical':             { label: 'Medical Records',    parent: 'Dashboard' },
    '/outpasses':           { label: 'Outpasses',          parent: 'Dashboard' },
    '/student-achievements':{ label: 'Achievements',       parent: 'Dashboard' },
};

function getRouteMeta(pathname: string): { label: string; parent?: string } {
    if (routeMeta[pathname]) return routeMeta[pathname];
    // prefix match — longest wins
    const match = Object.keys(routeMeta)
        .filter(k => pathname.startsWith(k) && k.length > 1)
        .sort((a, b) => b.length - a.length)[0];
    return match ? routeMeta[match] : { label: pathname.split('/').filter(Boolean).pop() || 'Portal' };
}

// ────────────────────────────────────────────────────────────────────────────

export function DesktopHeader({ title }: DesktopHeaderProps) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { unreadCount } = useNotifications();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const meta = getRouteMeta(location.pathname);
    const pageLabel = title || meta.label;
    const parentLabel = meta.parent;
    const isDashboard = location.pathname === '/dashboard';

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
        : user?.role === 'teacher'   ? 'Teacher'
        : user?.role === 'manager'   ? 'Manager'
        : user?.role || '';

    return (
        <header className="hidden lg:flex fixed top-0 left-60 right-0 h-[72px] z-40 bg-white border-b border-slate-100/80 items-center px-6 gap-0">

            {/* ── LEFT: Breadcrumb / Page context ─────────────────────────────── */}
            <div className="flex items-center gap-1.5 shrink-0 min-w-[180px]">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-150"
                    title="Dashboard"
                >
                    <Home className="w-3.5 h-3.5" />
                </button>

                {!isDashboard && (
                    <>
                        <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />

                        {parentLabel && parentLabel !== 'Dashboard' && (
                            <>
                                <span className="text-[11px] font-medium text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
                                    {parentLabel}
                                </span>
                                <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                            </>
                        )}

                        <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[160px]">
                            {pageLabel}
                        </span>
                    </>
                )}

                {isDashboard && (
                    <span className="text-[11px] font-semibold text-slate-700">Dashboard</span>
                )}
            </div>

            {/* ── CENTER: Search ───────────────────────────────────────────────── */}
            <div className="flex-1 flex justify-center px-6">
                <div className="relative w-full max-w-[300px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search records..."
                        className="
                            w-full h-[42px] pl-10 pr-4
                            bg-slate-50 border border-slate-200/80
                            rounded-xl text-[13px] text-slate-700
                            placeholder:text-slate-400/80
                            focus:outline-none focus:ring-1 focus:ring-emerald-500/30 focus:border-emerald-300/80
                            transition-all duration-150
                        "
                    />
                </div>
            </div>

            {/* ── RIGHT: Account cluster ───────────────────────────────────────── */}
            <div className="flex items-center shrink-0">

                {/* Notification bell */}
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-150"
                    title="Notifications"
                >
                    <Bell className="w-4 h-4" strokeWidth={2} />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
                    )}
                </button>

                {/* Divider */}
                <div className="w-px h-6 bg-slate-200 mx-3" />

                {/* Profile cluster */}
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(v => !v)}
                        className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 transition-all duration-150 focus:outline-none focus-visible:outline-none focus-visible:ring-0 group"
                    >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[11px] font-black shrink-0 ring-2 ring-emerald-700/10">
                            {avatarInitials}
                        </div>
                        <div className="hidden xl:flex flex-col items-start leading-none">
                            <span className="text-[12px] font-semibold text-slate-700 leading-[1.3]">{displayName}</span>
                            <span className="text-[10px] text-slate-400 leading-[1.3] capitalize">{displayRole}</span>
                        </div>

                        <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>

                    {/* Dropdown */}
                    {showMenu && (
                        <div className="absolute right-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] overflow-hidden z-50 animate-scale-in">
                            {/* User card */}
                            <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-slate-50">
                                <div className="w-7 h-7 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                    {avatarInitials}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[12px] font-bold text-slate-800 truncate">{displayName}</p>
                                    <p className="text-[10px] text-slate-400 capitalize">{displayRole}</p>
                                </div>
                            </div>

                            <div className="p-1">
                                <button
                                    onClick={() => { setShowMenu(false); navigate('/profile'); }}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition-colors duration-150 text-left"
                                >
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    View Profile
                                </button>
                            </div>

                            <div className="border-t border-slate-50 p-1">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium text-rose-500 hover:bg-rose-50 transition-colors duration-150 text-left"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
