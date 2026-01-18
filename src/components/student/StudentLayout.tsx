import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Award,
  Calendar,
  Trophy,
  User,
  ArrowLeft,
  BookOpen,
  IndianRupee,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudentAuth } from '@/contexts/StudentAuthContext';

interface StudentLayoutProps {
  children: React.ReactNode;
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export default function StudentLayout({
  children,
  title,
  showBack = false,
  actions
}: StudentLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { student, logout } = useStudentAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/student/login');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/student/dashboard' },
    { icon: IndianRupee, label: 'Donations', path: '/student/fees' },
    { icon: Award, label: 'Achievements', path: '/student/achievements' },
    { icon: BookOpen, label: 'CCE', path: '/student/cce' },
    { icon: User, label: 'Profile', path: '/student/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-muted/10 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-card border-r border-border fixed inset-y-0 flex-col z-30">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
            <User className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Student Portal</span>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {student?.name?.[0] || 'S'}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-sm truncate">{student?.name || 'Student'}</p>
                <p className="text-xs text-muted-foreground truncate">{student?.username}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive shrink-0"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-20 safe-top">
          <div className="h-16 px-4 md:px-8 flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              {showBack && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
            </div>
            {actions}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 md:px-8 pt-6 pb-24 md:pb-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-height z-30">
        <div className="h-16 flex items-center justify-around px-2 w-full">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${active
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}