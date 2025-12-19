import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  GraduationCap,
  Hash,
  Calendar,
  LogOut,
  ExternalLink,
  ChevronRight,
  Star,
  Wallet,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import StudentLayout from '@/components/student/StudentLayout';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Transaction {
  id: number;
  type: 'deposit' | 'expense';
  amount: number;
  purpose: string;
  description: string;
  balance_after: number;
  transaction_date: string;
}

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const { student, logout } = useStudentAuth();
  /* Removed transactions state and effects as redundant */

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/student/login');
  };

  if (!student) return null;

  const totalPoints = student.totalPoints || 0;
  const stars = student.stars || 0;
  const walletBalance = student.walletBalance || 0;

  return (
    <StudentLayout title="Profile">
      <div className="space-y-6 pb-24">
        {/* Profile Header */}
        <Card variant="elevated" className="animate-slide-up overflow-hidden">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 border-4 border-background">
                <AvatarImage src={student.photo} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {student.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">{student.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{student.department}</Badge>
                  <Badge variant="outline">{student.class}</Badge>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-accent fill-accent" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">{totalPoints} pts</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Wallet Section */}
        <Card variant="flat" className="animate-slide-up stagger-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              WALLET BALANCE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">₹{walletBalance.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">INR</span>
            </div>
          </CardContent>
        </Card>



        {/* Profile Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">DETAILS</h3>

          <Card variant="flat" className="animate-slide-up stagger-3">
            <CardContent className="p-0 divide-y divide-border">
              <ProfileItem
                icon={<User className="w-5 h-5" />}
                label="Username"
                value={`@${student.username}`}
              />
              <ProfileItem
                icon={<Mail className="w-5 h-5" />}
                label="Email"
                value={student.email}
              />
              <ProfileItem
                icon={<Hash className="w-5 h-5" />}
                label="Roll Number"
                value={student.rollNumber}
              />
              <ProfileItem
                icon={<GraduationCap className="w-5 h-5" />}
                label="Class"
                value={`${student.class} - ${student.department}`}
              />
              <ProfileItem
                icon={<Calendar className="w-5 h-5" />}
                label="Joined"
                value={format(new Date(student.joinedAt), 'MMMM yyyy')}
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">QUICK ACTIONS</h3>

          <Card
            variant="interactive"
            className="animate-slide-up stagger-4 cursor-pointer"
            onClick={() => navigate(`/students/${student.username}`)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                  <ExternalLink className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-foreground">View Public Profile</p>
                  <p className="text-sm text-muted-foreground">See what others see</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          size="lg"
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </StudentLayout>
  );
}

function ProfileItem({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
