import { useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, Users, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth, UserRole } from '@/contexts/AuthContext';

const roles = [
  {
    id: 'teacher' as UserRole,
    title: 'Teacher',
    description: 'Manage duties, tasks, and submit reports',
    icon: GraduationCap,
    color: 'bg-primary',
  },
  {
    id: 'principal' as UserRole,
    title: 'Principal',
    description: 'Oversee staff, assign duties, and review reports',
    icon: Briefcase,
    color: 'bg-accent',
  },
  {
    id: 'manager' as UserRole,
    title: 'Manager',
    description: 'Administrative oversight and analytics',
    icon: Users,
    color: 'bg-success',
  },
];

export default function SelectRolePage() {
  const { selectRole, user } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    selectRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground mt-2">{user?.name || 'User'}</p>
          <p className="text-sm text-muted-foreground mt-1">Select your role to continue</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4">
          {roles.map((role, index) => (
            <Card
              key={role.id}
              variant="interactive"
              onClick={() => handleRoleSelect(role.id)}
              className={`animate-slide-up stagger-${index + 1}`}
              style={{ animationFillMode: 'backwards' }}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl ${role.color} flex items-center justify-center flex-shrink-0`}>
                  <role.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground">{role.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{role.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
