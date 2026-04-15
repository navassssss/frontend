import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, ClipboardList, CheckSquare, AlertCircle, User, Users, FileText,
    BookOpen, IndianRupee, GraduationCap, LayoutDashboard, LogOut, Settings, Calendar,
    Plus, ChevronDown, Award, Briefcase, DollarSign, Building2, HelpCircle, HeartHandshake,
    AlertTriangle, Trophy, Megaphone, Bell, Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import api from '@/lib/api';

interface SubMenuItem {
    label: string;
    path: string;
    icon?: any;
}

interface NavItem {
    icon: any;
    label: string;
    path?: string;
    showBadge?: boolean;
    subItems?: SubMenuItem[];
}

const baseNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Attendance', path: '/attendance' },
    { icon: BookOpen, label: 'CCE Works', path: '/cce/works' },
    { icon: CheckSquare, label: 'My Tasks', path: '/tasks' },
    { icon: ClipboardList, label: 'My Duties', path: '/duties' },
    { icon: AlertTriangle, label: 'Issues', path: '/issues' },
    { icon: Megaphone, label: 'Notices', path: '/announcements' },
    { icon: User, label: 'My Profile', path: '/profile' },
];

const principalNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    {
        icon: GraduationCap,
        label: 'Students',
        subItems: [
            { label: 'All Students', path: '/students' },
            { label: 'Add New Student', path: '/students/new' },
            { label: 'Attendance', path: '/attendance' },
            { label: 'CCE Works', path: '/cce/works' },
            { label: 'Marks', path: '/cce/student-marks' },
            { label: 'Achievements', path: '/student-achievements' },
        ]
    },
    { icon: Users, label: 'Classes', path: '/classes' },
    { icon: HeartHandshake, label: 'Donations', path: '/fees' },
    {
        icon: Briefcase,
        label: 'Teachers',
        subItems: [
            { label: 'All Teachers', path: '/teachers' },
            { label: 'Add New Teacher', path: '/teachers/new' },
            { label: 'Subjects', path: '/subjects' },
            { label: 'Assign Duties', path: '/duties' },
            { label: 'Assign Tasks', path: '/tasks' },
        ]
    },
    { icon: AlertTriangle, label: 'Issues', path: '/issues', showBadge: true },
    { icon: FileText, label: 'Reports', path: '/reports' },
    { icon: Megaphone, label: 'Announcements', path: '/announcements' },
    { icon: Stethoscope, label: 'Medical', path: '/medical' },
    { icon: User, label: 'My Profile', path: '/profile' },
];

const managerNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: HeartHandshake, label: 'Donations', path: '/fees' },
    { icon: ClipboardList, label: 'Duties', path: '/duties' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const { unreadCount } = useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager' || (user?.role === 'teacher' && user?.is_vice_principal);
    const isManager = user?.role === 'manager';
    const [openIssuesCount, setOpenIssuesCount] = useState(0);
    // Open Students by default to match the mock visual
    const [expandedItems, setExpandedItems] = useState<string[]>(['Students']);

    const hasPermission = (name: string) => {
        if (isPrincipal) return true;
        return user?.permissions?.some(p => p.name === name) || false;
    };

    let navItems = [...baseNavItems];
    if (isPrincipal) {
        navItems = principalNavItems;
    } else if (isManager) {
        navItems = managerNavItems;
    } else {
        // Build dynamically for teachers based on new permissions
        const extendedItems: NavItem[] = [];

        if (hasPermission('manage_students')) {
            extendedItems.push({
                icon: GraduationCap, label: 'Students', subItems: [
                    { label: 'All Students', path: '/students' },
                    { label: 'Add New Student', path: '/students/new' }
                ]
            });
        }

        if (hasPermission('review_achievements')) {
            extendedItems.push({ icon: Trophy, label: 'Achievements', path: '/student-achievements' });
        }

        if (hasPermission('manage_fees')) {
            extendedItems.push({ icon: HeartHandshake, label: 'Donations', path: '/fees' });
        }

        if (hasPermission('manage_teachers')) {
            extendedItems.push({ icon: Briefcase, label: 'Staff Management', path: '/teachers' });
        }

        if (hasPermission('manage_reports')) {
            extendedItems.push({ icon: FileText, label: 'Reports', path: '/reports' });
        }

        if (hasPermission('manage_announcements')) {
            extendedItems.push({ icon: Megaphone, label: 'Announcements', path: '/announcements' });
        }

        if (hasPermission('manage_medical')) {
            extendedItems.push({ icon: Stethoscope, label: 'Medical', path: '/medical' });
        }

        // Insert extended items right before the Profile nav item (which is at the end)
        navItems.splice(navItems.length - 1, 0, ...extendedItems);
    }

    useEffect(() => {
        if (!isPrincipal) return;

        let lastFetch = 0;

        const safeFetch = () => {
            // Minimum 60s between open-issue refreshes
            if (Date.now() - lastFetch < 60_000) return;
            lastFetch = Date.now();
            fetchOpenIssuesCount();
        };

        // Initial load
        safeFetch();

        const onVisible = () => { if (document.visibilityState === 'visible') safeFetch(); };
        const onFocus   = () => safeFetch();

        document.addEventListener('visibilitychange', onVisible);
        window.addEventListener('focus', onFocus);

        return () => {
            document.removeEventListener('visibilitychange', onVisible);
            window.removeEventListener('focus', onFocus);
        };
    }, [isPrincipal]);

    const fetchOpenIssuesCount = async () => {
        try {
            // Use a lightweight count endpoint — returns { count: N } not full list
            const { data } = await api.get('/issues?status=open&per_page=1');
            // Paginated response: total gives the real count
            setOpenIssuesCount(data.total ?? data.length ?? 0);
        } catch {
            // Silently fail — stale badge count is acceptable
        }
    };


    const handleLogout = () => {
        logout();
        navigate('/staff/login');
    };

    const toggleExpand = (label: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(p => p !== label)
                : [...prev, label]
        );
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#f8fafc] border-r border-[#e2e8f0] z-50 flex flex-col hidden lg:flex shadow-sm">
            {/* Logo Area */}
            <div className="pt-8 pb-8 px-6 flex items-center">
                <div className="w-10 h-10 bg-emerald-800 rounded-xl flex items-center justify-center mr-3 shadow-sm shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-[17px] font-black text-emerald-950 tracking-tight leading-tight truncate">DHIC Portal</h2>
                    <p className="text-[9px] font-black tracking-widest text-slate-500 mt-0.5 truncate uppercase">Staff</p>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-0">
                {navItems.map((item) => {
                    const isExpanded = expandedItems.includes(item.label);
                    // Determine if the item or any of its subitems is active
                    const isActive = item.path
                        ? location.pathname === item.path
                        : item.subItems?.some(sub => location.pathname === sub.path);

                    return (
                        <div key={item.label} className="mb-0.5">
                            {/* Main Nav Item */}
                            {item.subItems ? (
                                <div
                                    className={cn(
                                        "flex items-center gap-3 py-3 pl-6 pr-4 transition-colors cursor-pointer mr-6 rounded-r-xl",
                                        isActive
                                            ? "bg-emerald-100/60 text-emerald-800"
                                            : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                                    )}
                                    onClick={(e) => toggleExpand(item.label, e)}
                                >
                                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2.5} />
                                    <span className="flex-1 font-bold text-[14px]">{item.label}</span>
                                    {item.showBadge && openIssuesCount > 0 && (
                                        <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center">
                                            {openIssuesCount > 99 ? '99+' : openIssuesCount}
                                        </span>
                                    )}
                                    <ChevronDown className={cn("w-4 h-4 flex-shrink-0 transition-transform text-slate-400", isExpanded ? "rotate-180" : "rotate-0")} />
                                </div>
                            ) : (
                                <RouterNavLink
                                    to={item.path!}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 py-3 pl-6 pr-4 transition-colors mr-6 rounded-r-xl",
                                        isActive
                                            ? "bg-emerald-100/60 text-emerald-800 font-bold"
                                            : "text-slate-600 font-bold hover:bg-slate-200/50 hover:text-slate-900"
                                    )}
                                >
                                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={2.5} />
                                    <span className="flex-1 text-[14px]">{item.label}</span>
                                </RouterNavLink>
                            )}

                            {/* Sub Items */}
                            {item.subItems && isExpanded && (
                                <div className="mt-1 mb-3 space-y-0.5">
                                    {item.subItems.map((subItem) => (
                                        <RouterNavLink
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-3 pl-14 pr-6 py-2 transition-colors mr-6 rounded-r-xl",
                                                isActive
                                                    ? "text-emerald-700 font-bold bg-emerald-50/50"
                                                    : "text-[#64748b] font-medium hover:text-slate-800 hover:bg-slate-100/50"
                                            )}
                                        >
                                            <span className="text-[13px]">{subItem.label}</span>
                                        </RouterNavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="pb-8 pt-6 space-y-1">
                <button
                    onClick={() => navigate('/notifications')}
                    className="w-full flex items-center gap-3 pl-6 pr-4 py-3 text-slate-600 font-bold hover:bg-slate-200/50 hover:text-slate-900 transition-colors mr-6 rounded-r-xl relative"
                >
                    <div className="relative">
                        <Bell className="w-[18px] h-[18px] flex-shrink-0 text-slate-500" strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </div>
                    <span className="text-[14px]">Notifications</span>
                </button>
                <button
                    className="w-full flex items-center gap-3 pl-6 pr-4 py-3 text-slate-600 font-bold hover:bg-slate-200/50 hover:text-slate-900 transition-colors mr-6 rounded-r-xl"
                >
                    <HelpCircle className="w-[18px] h-[18px] flex-shrink-0 text-slate-500" strokeWidth={2.5} />
                    <span className="text-[14px]">Support Desk</span>
                </button>
                <button
                    className="w-full flex items-center gap-3 pl-6 pr-4 py-3 text-rose-600 font-bold hover:bg-rose-50 transition-colors mr-6 rounded-r-xl"
                    onClick={handleLogout}
                >
                    <LogOut className="w-[18px] h-[18px] flex-shrink-0 text-rose-500" strokeWidth={2.5} />
                    <span className="text-[14px]">Logout</span>
                </button>
            </div>
        </aside>
    );
}
