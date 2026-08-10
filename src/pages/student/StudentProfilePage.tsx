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
import { NotificationToggle, InstallButton } from '@/components/pwa/PWAPrompt';

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
  const { student, logout, setStudent } = useStudentAuth();
  
  const [email, setEmail] = React.useState('');
  const [isEditingEmail, setIsEditingEmail] = React.useState(false);
  const [savingEmail, setSavingEmail] = React.useState(false);

  const [passwordForm, setPasswordForm] = React.useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [savingPassword, setSavingPassword] = React.useState(false);

  React.useEffect(() => {
    if (student?.email) {
      setEmail(student.email);
    }
  }, [student?.email]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/student/login');
  };

  if (!student) return null;

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }
    setSavingEmail(true);
    try {
      const res = await api.put('/student/profile', { email });
      if (setStudent && student) {
        setStudent({
          ...student,
          email: res.data.user.email,
        });
      }
      toast.success('Email updated successfully!');
      setIsEditingEmail(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update email');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.current_password || !passwordForm.new_password || !passwordForm.new_password_confirmation) {
      toast.error('All fields are required');
      return;
    }
    if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.post('/student/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        new_password_confirmation: passwordForm.new_password_confirmation,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

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
              {isEditingEmail ? (
                <form onSubmit={handleUpdateEmail} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs text-muted-foreground">Edit Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full mt-1 px-3 py-1.5 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEmail(student.email || '');
                        setIsEditingEmail(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={savingEmail}>
                      {savingEmail ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between pr-4">
                  <ProfileItem
                    icon={<Mail className="w-5 h-5" />}
                    label="Email"
                    value={student.email}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary-hover"
                    onClick={() => setIsEditingEmail(true)}
                  >
                    Edit
                  </Button>
                </div>
              )}
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

        {/* Change Password Card */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">SECURITY</h3>
          <Card variant="flat" className="animate-slide-up stagger-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                Change Password
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, current_password: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Current password"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new_password: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="New password (min 8 chars)"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password_confirmation}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        new_password_confirmation: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-lg border border-border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={savingPassword}>
                  {savingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Settings & Preferences */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground px-1">SETTINGS</h3>
          
          <div className="space-y-3">
            <NotificationToggle />
            <InstallButton />
          </div>
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
