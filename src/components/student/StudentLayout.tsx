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
  IndianRupee
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
  const { student } = useStudentAuth();

  const navItems = [
    { icon: Home, label: 'Home', path: '/student/dashboard' },
    { icon: IndianRupee, label: 'Fees', path: '/student/fees' },
    { icon: Award, label: 'Achievements', path: '/student/achievements' },
    { icon: BookOpen, label: 'CCE', path: '/student/cce' },
    { icon: User, label: 'Profile', path: '/student/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-10 safe-top">
        <div className="h-14 px-4 flex items-center justify-between max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3">
            {showBack && (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          </div>
          {actions}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pt-4 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border bottom-nav-height z-20">
        <div className="h-16 flex items-center justify-around px-2 max-w-lg mx-auto w-full">
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