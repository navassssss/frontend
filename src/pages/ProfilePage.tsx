import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Lock, 
  LogOut, 
  ChevronRight,
  Briefcase,
  Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: Briefcase, label: 'My Responsibilities', path: '/duties' },
  { icon: Bell, label: 'Notifications', path: '/notifications', badge: '3' },
  { icon: Lock, label: 'Change Password', path: '/change-password' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <AppLayout title="Profile">
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <Card variant="elevated" className="animate-fade-in">
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-primary-foreground">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{user?.name || 'User'}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium capitalize">{user?.role || 'Teacher'}</span>
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email || 'user@school.edu'}</span>
            </div>
            {user?.department && (
              <p className="text-sm text-muted-foreground mt-1">
                {user.department} Department
              </p>
            )}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 animate-slide-up">
          {menuItems.map((item, index) => (
            <Card 
              key={item.label}
              variant="interactive"
              onClick={() => navigate(item.path)}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-secondary-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">{item.label}</span>
                {item.badge && (
                  <span className="w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-medium flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logout Button */}
        <div className="pt-4 animate-slide-up stagger-5" style={{ animationFillMode: 'backwards' }}>
          <Button 
            variant="touch-outline" 
            className="w-full text-destructive hover:bg-destructive-light hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </div>

        {/* Version Info */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          EduGov v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
