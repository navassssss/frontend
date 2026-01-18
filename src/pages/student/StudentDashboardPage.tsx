import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  Trophy,
  Wallet,
  TrendingUp,
  Plus,
  ChevronRight,
  Award,
  Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';

// Temporary mock for account balance since that module is deferred
const mockAccount = {
  currentBalance: 0
};

const POINTS_PER_STAR = 20;

interface Achievement {
  id: number;
  title: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  category: {
    name: string;
  };
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { student } = useStudentAuth();
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/student/achievements');
        const allAchievements: Achievement[] = response.data;

        // Filter for recent approved achievements
        const approved = allAchievements
          .filter(a => a.status === 'approved')
          .slice(0, 3);

        // Count pending
        const pending = allAchievements.filter(a => a.status === 'pending').length;

        setRecentAchievements(approved);
        setPendingCount(pending);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalPoints = student?.totalPoints || 0;
  const stars = student?.stars || 0;
  const monthlyPoints = student?.monthlyPoints || 0;

  return (
    <StudentLayout title={`Welcome, ${student?.name?.split(' ')[0] || 'Student'}!`}>
      <div className="space-y-8 pb-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up stagger-1 group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-6 h-6 text-amber-500" fill="currentColor" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{stars}</p>
                  <p className="text-sm font-medium text-muted-foreground">Total Stars</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up stagger-2 group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{totalPoints}</p>
                  <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up stagger-3 group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground tracking-tight">{monthlyPoints}</p>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Balance */}
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up stagger-4 group">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${(student?.walletBalance || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <Wallet className={`w-6 h-6 ${(student?.walletBalance || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold tracking-tight ${(student?.walletBalance || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ₹{Math.abs(student?.walletBalance || 0).toLocaleString()}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {(student?.walletBalance || 0) >= 0 ? 'Available Credit' : 'Payment Due'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content Area - Left 2/3 */}
          <div className="lg:col-span-2 space-y-8">

            {/* Progress to Next Star */}
            <Card className="border-muted shadow-sm hover:shadow-md transition-all duration-300 animate-slide-up stagger-5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Progress to Next Star</h3>
                    <p className="text-sm text-muted-foreground">Keep going! You're doing great.</p>
                  </div>
                  <Badge variant="outline" className="px-3 py-1 text-sm font-medium bg-background">
                    {totalPoints % POINTS_PER_STAR} / {POINTS_PER_STAR} points
                  </Badge>
                </div>
                <div className="w-full h-5 bg-secondary/50 rounded-full overflow-hidden ring-1 ring-border/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${(totalPoints % POINTS_PER_STAR) / POINTS_PER_STAR * 100}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse-soft"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-foreground tracking-tight">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-auto py-6 flex-col gap-3 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group shadow-sm"
                  onClick={() => navigate('/student/achievements/new')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Add Achievement</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex-col gap-3 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group shadow-sm"
                  onClick={() => navigate('/student/account')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <span className="font-medium">View Account</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex-col gap-3 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group shadow-sm"
                  onClick={() => navigate('/student/attendance')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Attendance</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-6 flex-col gap-3 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all duration-300 group shadow-sm"
                  onClick={() => navigate('/student/leaderboard')}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="font-medium">Leaderboard</span>
                </Button>
              </div>
            </div>

            {/* Pending Achievements */}
            {pendingCount > 0 && (
              <Card
                className="cursor-pointer border-amber-200 bg-amber-50 hover:bg-amber-100/50 transition-colors shadow-sm"
                onClick={() => navigate('/student/achievements')}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-200/50 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-amber-700" />
                    </div>
                    <div>
                      <p className="font-bold text-amber-900 text-lg">{pendingCount} Pending Request{pendingCount !== 1 ? 's' : ''}</p>
                      <p className="text-sm text-amber-700 font-medium">Awaiting teacher review</p>
                    </div>
                  </div>
                  <div className="bg-white/50 p-2 rounded-full">
                    <ChevronRight className="w-5 h-5 text-amber-700" />
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - Recent Activity */}
          <div className="space-y-6">


            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold text-foreground tracking-tight">Recent</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary font-medium"
                  onClick={() => navigate('/student/achievements')}
                >
                  View All
                </Button>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground px-1">Loading achievements...</p>
                ) : recentAchievements.length > 0 ? (
                  recentAchievements.map((achievement, index) => (
                    <Card
                      key={achievement.id}
                      className={`hover:shadow-md transition-all duration-200 border-border/50 group animate-slide-up stagger-${index + 1}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors">
                            <Award className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-foreground truncate">{achievement.title}</p>
                              <Badge variant="success" className="flex-shrink-0 font-bold">
                                +{achievement.points}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-muted-foreground mt-1">{achievement.category.name}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed shadow-none bg-muted/30">
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No recent achievements found.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
