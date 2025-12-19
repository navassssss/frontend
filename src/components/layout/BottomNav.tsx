import { Home, ClipboardList, CheckSquare, AlertCircle, User, Users, FileText, BookOpen, IndianRupee } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: BookOpen, label: 'CCE', path: '/cce/works' },
  { icon: ClipboardList, label: 'Duties', path: '/duties' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const principalNavItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: BookOpen, label: 'CCE', path: '/cce/works' },
  { icon: Users, label: 'Teachers', path: '/teachers' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const managerNavItems = [
  { icon: Home, label: 'Home', path: '/dashboard' },
  { icon: IndianRupee, label: 'Fees', path: '/fees' },
  { icon: ClipboardList, label: 'Duties', path: '/duties' },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNav() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal';
  const isManager = user?.role === 'manager';

  let navItems = baseNavItems;
  if (isPrincipal) navItems = principalNavItems;
  if (isManager) navItems = managerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-height z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-2 px-1 rounded-xl transition-all duration-200",
              "text-muted-foreground hover:text-primary"
            )}
            activeClassName="text-primary bg-primary-light"
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
