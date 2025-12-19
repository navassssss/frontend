import { Bell, Menu, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export function Header({ title, showBack = false, onBack }: HeaderProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    // Check for unread notifications
    const checkUnread = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (Array.isArray(data)) {
          setHasUnread(data.some((n: any) => !n.read_at));
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (user) {
      checkUnread();
      // Poll every minute
      const interval = setInterval(checkUnread, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border safe-top">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              className="mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">
              {user?.name?.charAt(0) || 'S'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{title || 'EduGov'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Welcome'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5" />
            {hasUnread && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background" />
            )}
          </Button>
          <Button variant="ghost" size="icon-sm">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
