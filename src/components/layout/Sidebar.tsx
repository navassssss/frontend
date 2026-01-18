import { useState, useEffect } from 'react';
import { NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Home, ClipboardList, CheckSquare, AlertCircle, User, Users, FileText,
    BookOpen, IndianRupee, GraduationCap, LayoutDashboard, LogOut, Settings, Calendar,
    Plus, ChevronDown, ChevronRight, Award, Briefcase, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

interface SubMenuItem {
    label: string;
    path: string;
    icon?: any;
}

interface NavItem {
    icon: any;
    label: string;
    path?: string; // Optional now - if has subItems, clicking won't navigate
    showBadge?: boolean;
    subItems?: SubMenuItem[];
}

const baseNavItems: NavItem[] = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: Calendar, label: 'Attendance', path: '/attendance' },
    { icon: BookOpen, label: 'CCE Works', path: '/cce/works' },
    { icon: CheckSquare, label: 'My Tasks', path: '/tasks' },
    { icon: ClipboardList, label: 'My Duties', path: '/duties' },
    { icon: AlertCircle, label: 'Issues', path: '/issues' },
    { icon: User, label: 'My Profile', path: '/profile' },
];

const principalNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    {
        icon: GraduationCap,
        label: 'Students',
        subItems: [
            { label: 'All Students', path: '/students', icon: GraduationCap },
            { label: 'Add New Student', path: '/students/new', icon: Plus },
            { label: 'Attendance', path: '/attendance', icon: Calendar },
            { label: 'CCE Works', path: '/cce/works', icon: BookOpen },
            { label: 'Marks', path: '/cce/student-marks', icon: Award },
            { label: 'Achievements', path: '/student-achievements', icon: Award },
            { label: 'Classes', path: '/classes', icon: GraduationCap },
            { label: 'Donations', path: '/fees', icon: DollarSign },
        ]
    },
    {
        icon: Users,
        label: 'Teachers',
        subItems: [
            { label: 'All Teachers', path: '/teachers', icon: Users },
            { label: 'Add New Teacher', path: '/teachers/new', icon: Plus },
            { label: 'Assign Duties', path: '/duties', icon: Briefcase },
            { label: 'Assign Tasks', path: '/tasks', icon: CheckSquare },
        ]
    },
    {
        icon: AlertCircle,
        label: 'Issues',
        showBadge: true,
        subItems: [
            { label: 'All Issues', path: '/issues', icon: AlertCircle },
            { label: 'Raise New Issue', path: '/issues/new', icon: Plus },
        ]
    },
    {
        icon: FileText,
        label: 'Reports',
        subItems: [
            { label: 'All Reports', path: '/reports', icon: FileText },
        ]
    },
];

const managerNavItems: NavItem[] = [
    { icon: Home, label: 'Home', path: '/dashboard' },
    { icon: IndianRupee, label: 'Donations', path: '/fees' },
    { icon: ClipboardList, label: 'Duties', path: '/duties' },
    { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
    { icon: User, label: 'Profile', path: '/profile' },
];

export function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isPrincipal = user?.role === 'principal';
    const isManager = user?.role === 'manager';
    const [openIssuesCount, setOpenIssuesCount] = useState(0);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);

    let navItems = baseNavItems;
    if (isPrincipal) navItems = principalNavItems;
    if (isManager) navItems = managerNavItems;

    useEffect(() => {
        if (isPrincipal) {
            fetchOpenIssuesCount();
            const interval = setInterval(fetchOpenIssuesCount, 30000);
            return () => clearInterval(interval);
        }
    }, [isPrincipal]);

    // Auto-expand current section
    useEffect(() => {
        const currentItem = navItems.find(item =>
            item.subItems?.some(sub => location.pathname.startsWith(sub.path))
        );
        if (currentItem && currentItem.subItems) {
            const itemKey = currentItem.label;
            if (!expandedItems.includes(itemKey)) {
                setExpandedItems([...expandedItems, itemKey]);
            }
        }
    }, [location.pathname]);

    const fetchOpenIssuesCount = async () => {
        try {
            const { data } = await api.get('/issues?status=open');
            setOpenIssuesCount(data.length || 0);
        } catch (error) {
            console.error('Failed to fetch open issues count:', error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/staff/login');
    };

    const toggleExpand = (label: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedItems(prev =>
            prev.includes(label)
                ? prev.filter(p => p !== label)
                : [...prev, label]
        );
    };

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-50 flex flex-col hidden lg:flex">
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">DHIC eGov</span>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-border bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user?.name?.[0] || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="font-medium text-sm truncate capitalize">{user?.name?.toLowerCase()}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navItems.map((item) => {
                    const isExpanded = expandedItems.includes(item.label);
                    const isActive = item.path ? location.pathname === item.path :
                        item.subItems?.some(sub => location.pathname === sub.path);

                    return (
                        <div key={item.label}>
                            {/* Main Nav Item */}
                            {item.subItems ? (
                                // Item with dropdown - don't navigate on click
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium cursor-pointer",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                    onClick={(e) => toggleExpand(item.label, e)}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {item.showBadge && openIssuesCount > 0 && (
                                        <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center">
                                            {openIssuesCount > 99 ? '99+' : openIssuesCount}
                                        </span>
                                    )}
                                    {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 flex-shrink-0" />
                                    )}
                                </div>
                            ) : (
                                // Regular item - navigate on click
                                <RouterNavLink
                                    to={item.path!}
                                    className={({ isActive }) => cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <item.icon className="w-5 h-5 flex-shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                </RouterNavLink>
                            )}

                            {/* Sub Items */}
                            {item.subItems && isExpanded && (
                                <div className="ml-8 mt-1 mb-2 space-y-0.5">
                                    {item.subItems.map((subItem) => (
                                        <RouterNavLink
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={({ isActive }) => cn(
                                                "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-xs",
                                                isActive
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            {subItem.icon && <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />}
                                            <span>{subItem.label}</span>
                                        </RouterNavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-border space-y-2">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    size="sm"
                    onClick={handleLogout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
            </div>
        </aside>
    );
}
