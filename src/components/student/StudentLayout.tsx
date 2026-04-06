import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home,
    Award,
    User,
    ArrowLeft,
    BookOpen,
    IndianRupee,
    LogOut,
    GraduationCap,
    Wallet,
    ChevronRight,
    Megaphone
} from 'lucide-react';
import { useStudentAuth } from '@/contexts/StudentAuthContext';

interface StudentLayoutProps {
    children: React.ReactNode;
    title: string;
    showBack?: boolean;
    actions?: React.ReactNode;
}

export default function StudentLayout({ children, title, showBack = false, actions }: StudentLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { student, logout } = useStudentAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        setProfileOpen(false);
        await logout();
        navigate('/student/login');
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // All nav items (used for desktop sidebar)
    const allNavItems = [
        { icon: Home, label: 'Home', path: '/student/dashboard' },
        { icon: Award, label: 'Achievements', path: '/student/achievements' },
        { icon: Megaphone, label: 'Notices', path: '/student/announcements' },
        { icon: Wallet, label: 'Account', path: '/student/account' },
        { icon: IndianRupee, label: 'Donations', path: '/student/fees' },
        { icon: BookOpen, label: 'CCE', path: '/student/cce' },
        { icon: User, label: 'Profile', path: '/student/profile' },
    ];

    // Mobile bottom nav — Profile removed (accessible via avatar dropdown)
    const mobileNavItems = allNavItems.filter(item => item.label !== 'Profile');

    const isActive = (path: string) => location.pathname === path;
    const initials = student?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'S';

    return (
        <div className="min-h-screen bg-[#f6f9f8] flex font-sans">

            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex w-[260px] bg-white border-r border-slate-100 fixed inset-y-0 flex-col z-30 shadow-[1px_0_12px_rgba(0,0,0,0.04)]">
                {/* Logo */}
                <div className="h-[68px] flex items-center px-6 border-b border-slate-100 gap-3">
                    <div className="w-9 h-9 bg-[#008f6c] rounded-xl flex items-center justify-center shadow-sm">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-slate-800 leading-none">DHIC Portal</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">Student</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-0.5">
                    {allNavItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-sm font-bold ${active
                                    ? 'bg-[#008f6c]/10 text-[#008f6c]'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                                    }`}
                            >
                                <item.icon className={`w-[18px] h-[18px] ${active ? 'text-[#008f6c]' : ''}`} />
                                <span>{item.label}</span>
                                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#008f6c]" />}
                            </button>
                        );
                    })}
                </nav>

                {/* User footer */}
                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-[#008f6c] text-white flex items-center justify-center text-[12px] font-black shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[13px] font-bold text-slate-700 truncate leading-tight">{student?.name || 'Student'}</p>
                            <p className="text-[11px] text-slate-400 truncate">{student?.username}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main content ── */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">

                {/* Header */}
                <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 z-20 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">

                    {/* Mobile header */}
                    <div className="lg:hidden px-4 pt-4 pb-3 flex items-start justify-between">
                        <div className="flex-1">
                            {showBack && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400"
                                >
                                    <ArrowLeft className="w-3 h-3" /> Back
                                </button>
                            )}
                            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">DHIC Portal</p>
                            <h1 className="text-[22px] font-black text-[#008f6c] leading-tight mt-0.5">{title}</h1>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                            {actions}

                            {/* Avatar with dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setProfileOpen(prev => !prev)}
                                    className="w-9 h-9 rounded-xl bg-[#008f6c] text-white flex items-center justify-center text-[11px] font-black shadow-sm active:scale-95 transition-transform"
                                >
                                    {initials}
                                </button>

                                {/* Dropdown */}
                                {profileOpen && (
                                    <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                        {/* Student info */}
                                        <div className="px-4 py-3 border-b border-slate-50">
                                            <p className="text-[13px] font-black text-slate-800 truncate">{student?.name || 'Student'}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{student?.username}</p>
                                        </div>

                                        {/* Profile */}
                                        <button
                                            onClick={() => { setProfileOpen(false); navigate('/student/profile'); }}
                                            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-7 h-7 rounded-lg bg-[#008f6c]/10 flex items-center justify-center">
                                                    <User className="w-3.5 h-3.5 text-[#008f6c]" />
                                                </div>
                                                My Profile
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-slate-300" />
                                        </button>

                                        {/* Logout */}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-slate-50"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                                                <LogOut className="w-3.5 h-3.5 text-red-500" />
                                            </div>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Desktop header */}
                    <div className="hidden lg:flex h-[60px] px-8 items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            {showBack && (
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors mr-1"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                            )}
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">{title}</h1>
                        </div>
                        <div className="flex items-center gap-2">{actions}</div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 px-4 md:px-8 pt-6 pb-24 md:pb-8 max-w-7xl mx-auto w-full">
                    {children}
                </main>
            </div>

            {/* ── Mobile Bottom Nav (Profile excluded — in avatar dropdown) ── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-30">
                <div className="h-16 flex items-center justify-around px-1">
                    {mobileNavItems.map((item) => {
                        const active = isActive(item.path);
                        const shortLabel: Record<string, string> = {
                            'Achievements': 'Achieve',
                        };
                        const label = shortLabel[item.label] ?? item.label;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all ${active ? 'text-[#008f6c]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${active ? 'bg-[#008f6c]/10' : ''
                                    }`}>
                                    <item.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[9px] font-black tracking-wide leading-none ${active ? 'text-[#008f6c]' : ''}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}