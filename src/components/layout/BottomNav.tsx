import { Home, ClipboardList, CheckSquare, AlertCircle, User, Users, FileText, BookOpen, IndianRupee, GraduationCap, LayoutDashboard, Calendar, DoorOpen, Stethoscope, Menu } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import api from '@/lib/api';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  showBadge?: boolean;
}

const baseNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: Calendar, label: 'Attendance', path: '/attendance' },
  { icon: BookOpen, label: 'CCE', path: '/cce/works' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: AlertCircle, label: 'Issues', path: '/issues' },
];

const principalNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: GraduationCap, label: 'Students', path: '/students' },
  { icon: DoorOpen, label: 'Outpasses', path: '/outpasses' },
  { icon: Calendar, label: 'Att. Reports', path: '/attendance/reports' },
  { icon: AlertCircle, label: 'Issues', path: '/issues', showBadge: true },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

const managerNavItems: NavItem[] = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: IndianRupee, label: 'Donations', path: '/fees' },
  { icon: AlertCircle, label: 'Issues', path: '/issues', showBadge: true },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || (user?.role === 'teacher' && user?.is_vice_principal);
  const isManager = user?.role === 'manager';
  const [openIssuesCount, setOpenIssuesCount] = useState(0);

  let navItems = baseNavItems;
  if (isPrincipal) navItems = principalNavItems;
  if (isManager) navItems = managerNavItems;

  // Plain class teachers logic
  const isPlainTeacher = user?.role === 'teacher' && !user?.is_vice_principal;
  if (isPlainTeacher) {
    const hasPermission = (name: string) => (user as any)?.permissions?.some((p: any) => p.name === name) || false;

    let items = [
      { icon: Home, label: 'Home', path: '/dashboard' },
      { icon: Calendar, label: 'Attendance', path: '/attendance' },
      { icon: BookOpen, label: 'CCE', path: '/cce/works' },
    ];

    if ((user as any)?.is_class_teacher) items.push({ icon: Users, label: 'My Class', path: '/classes' });
    if (hasPermission('manage_medical')) items.push({ icon: Stethoscope, label: 'Medical', path: '/medical' });
    if (hasPermission('manage_outpasses')) items.push({ icon: DoorOpen, label: 'Outpasses', path: '/outpasses' });
    if (hasPermission('manage_attendance')) items.push({ icon: FileText, label: 'Reports', path: '/attendance/reports' });

    // Fill remaining slots with default items up to 5 if needed
    if (items.length < 5) items.push({ icon: CheckSquare, label: 'Tasks', path: '/tasks' });
    if (items.length < 5) items.push({ icon: AlertCircle, label: 'Issues', path: '/issues' });

    navItems = items;
  }


  useEffect(() => {
    if (!isPrincipal) return;

    let lastFetch = 0;

    const safeFetch = () => {
      if (Date.now() - lastFetch < 60_000) return;
      lastFetch = Date.now();
      fetchOpenIssuesCount();
    };

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
      const { data } = await api.get('/issues?status=open&per_page=1');
      setOpenIssuesCount(data.total ?? data.length ?? 0);
    } catch {
      // silently ignore
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-height z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.slice(0, navItems.length > 5 ? 4 : 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-2 px-1 rounded-xl transition-all duration-200 relative",
              "text-muted-foreground hover:text-primary"
            )}
            activeClassName="text-primary bg-primary-light"
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {item.showBadge && openIssuesCount > 0 && (
              <span className="absolute top-1 right-1/4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {openIssuesCount > 99 ? '99+' : openIssuesCount}
              </span>
            )}
          </NavLink>
        ))}

        {navItems.length > 5 && (
          <Sheet>
            <SheetTrigger asChild>
              <button className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-2 px-1 rounded-xl transition-all duration-200 relative",
                "text-muted-foreground hover:text-primary focus:outline-none"
              )}>
                <Menu className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-[2rem] p-6 pb-12 sm:max-w-md mx-auto h-[60vh] max-h-[400px]">
              <SheetHeader className="mb-6">
                <SheetTitle className="text-left text-xl font-bold">More Modules</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-4">
                {navItems.slice(4).map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 transition-colors"
                  >
                    <item.icon className="w-6 h-6 text-slate-600" strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold text-slate-700 text-center">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
