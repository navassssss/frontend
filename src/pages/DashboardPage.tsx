import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckSquare,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertTriangle,
  Users,
  Trophy,
  Calendar,
  BookOpen,
  Award,
  ArrowUpRight,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatTime = (time: string | null) => {
  if (!time || time === 'No time') return 'No due time';
  return time;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const teacherQuickActions = [
  { title: 'Attendance', description: 'Mark daily attendance', icon: Calendar, path: '/attendance', color: 'text-blue-500', bg: 'bg-blue-50' },
  { title: 'CCE Works', description: 'Manage assignments', icon: BookOpen, path: '/cce/works', color: 'text-amber-500', bg: 'bg-amber-50' },
  { title: 'My Duties', description: '3 active duties', icon: ClipboardList, path: '/duties', color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'My Tasks', description: '5 pending today', icon: CheckSquare, path: '/tasks', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { title: 'Raise Issue', description: 'Report a problem', icon: AlertCircle, path: '/issues/new', color: 'text-red-500', bg: 'bg-red-50' },
  { title: 'Submit Report', description: 'Complete a duty', icon: FileText, path: '/reports/new', color: 'text-violet-500', bg: 'bg-violet-50' },
];

const principalQuickActions = [
  { title: 'Attendance', description: 'View daily records', icon: Calendar, path: '/attendance', color: 'text-blue-500', bg: 'bg-blue-50' },
  { title: 'Subjects', description: 'Manage subjects', icon: BookOpen, path: '/subjects', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { title: 'CCE Works', description: 'Manage assignments', icon: BookOpen, path: '/cce/works', color: 'text-amber-500', bg: 'bg-amber-50' },
  { title: 'Student Marks', description: 'View CCE marks', icon: Award, path: '/cce/student-marks', color: 'text-primary', bg: 'bg-primary/10' },
  { title: 'Teachers', description: 'Manage staff', icon: Users, path: '/teachers', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { title: 'Create Duty', description: 'Add new duty', icon: ClipboardList, path: '/duties/new', color: 'text-orange-500', bg: 'bg-orange-50' },
  { title: 'Achievements', description: 'Review students', icon: Trophy, path: '/student-achievements', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { title: 'All Issues', description: '5 open issues', icon: AlertCircle, path: '/issues', color: 'text-red-500', bg: 'bg-red-50' },
  { title: 'Review Reports', description: 'Pending reviews', icon: FileText, path: '/reports', color: 'text-violet-500', bg: 'bg-violet-50' },
];

const getIcon = (iconName: string) => {
  const icons: any = { Users, CheckSquare, AlertTriangle, Clock, ClipboardList, TrendingUp, Calendar, GraduationCap, FileText, Trophy, BookOpen };
  return icons[iconName] || TrendingUp;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  const [stats, setStats] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(res => {
        setStats(res.data.stats);
        setUpcomingTasks(res.data.upcomingTasks);
      })
      .finally(() => setLoading(false));
  }, []);

  let quickActions = isPrincipal ? principalQuickActions : teacherQuickActions;

  if (!isPrincipal && user?.permissions?.some(p => p.name === 'review_achievements')) {
    quickActions = [
      { title: 'Achievements', description: 'Review students', icon: Trophy, path: '/student-achievements', color: 'text-yellow-500', bg: 'bg-yellow-50' },
      ...quickActions
    ];
  }

  // Identify attention items from stats
  const attentionStats = stats.filter(s =>
    ['Open Issues', 'Pending Reports', 'Pending Reviews'].includes(s.label) && parseInt(s.value) > 0
  );

  const attentionPaths: Record<string, string> = {
    'Open Issues': '/issues',
    'Pending Reports': '/reports',
    'Pending Reviews': '/student-achievements',
  };

  const attentionColors: Record<string, string> = {
    'Open Issues': 'text-red-600 bg-red-50 border-red-200',
    'Pending Reports': 'text-amber-600 bg-amber-50 border-amber-200',
    'Pending Reviews': 'text-violet-600 bg-violet-50 border-violet-200',
  };

  return (
    <AppLayout title="Dashboard">

      {/* ── MOBILE VIEW ── */}
      <div className="lg:hidden p-4 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {/* {getGreeting()}, {toTitleCase(user?.name?.split(' ')[0] || 'User')} */}
            Dashboard
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">Here's your overview for today</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {loading ? (
            <p className="col-span-2 text-center text-sm text-muted-foreground py-4">Loading...</p>
          ) : stats.map((stat) => {
            const Icon = getIcon(stat.icon);
            return (
              <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl ${stat.color || 'bg-primary/10'} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground/40" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.slice(0, 6).map((action) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 p-3 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95"
              >
                <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Tasks</h3>
            <button onClick={() => navigate('/tasks')} className="text-xs text-primary font-medium flex items-center gap-1">
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-sm cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{toTitleCase(task.title)}</p>
                    <p className="text-xs text-muted-foreground">{formatTime(task.time)}</p>
                  </div>
                </div>
                <Badge variant={task.status === 'completed' ? 'completed' : 'pending'} className="shrink-0 ml-2 text-[10px]">
                  {toTitleCase(task.status)}
                </Badge>
              </div>
            ))}
            {!loading && upcomingTasks.length === 0 && (
              <p className="text-center text-sm py-4 text-muted-foreground">No pending tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* ── DESKTOP VIEW ── */}
      <div className="hidden lg:flex flex-col h-full p-8 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {/* {getGreeting()}, {toTitleCase(user?.name?.split(' ')[0] || 'User')} */}
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {isPrincipal ? 'Reviewing metrics for your institution today' : "Here's your personal overview for today"}
          </p>
        </div>

        {/* Top Stat Row — clean flat cards like img2 */}
        <div className="grid grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse h-28" />
            ))
          ) : stats.map((stat) => {
            const Icon = getIcon(stat.icon);
            return (
              <div
                key={stat.label}
                className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{stat.label}</p>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-black text-foreground tracking-tight leading-none">{stat.value}</p>
                  <div className={`w-9 h-9 rounded-xl ${stat.color || 'bg-primary/10'} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-3 gap-6 flex-1">

          {/* LEFT: Quick Actions */}
          <div className="col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Quick Actions</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {quickActions.slice(0, 9).map((action) => {
                let description = action.description;
                const openIssuesStat = stats.find(s => s.label === 'Open Issues');
                const pendingReportsStat = stats.find(s => s.label === 'Pending Reports');
                const pendingTasksStat = stats.find(s => s.label === 'Pending Tasks');
                const activeDutiesStat = stats.find(s => s.label === 'Active Duties');
                if (action.title === 'All Issues' && openIssuesStat) description = `${openIssuesStat.value} open`;
                if (action.title === 'Review Reports' && pendingReportsStat) description = `${pendingReportsStat.value} pending`;
                if (action.title === 'My Tasks' && pendingTasksStat) description = `${pendingTasksStat.value} pending`;
                if (action.title === 'My Duties' && activeDutiesStat) description = `${activeDutiesStat.value} active`;

                return (
                  <button
                    key={action.title}
                    onClick={() => navigate(action.path)}
                    className="group flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">{action.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto shrink-0 group-hover:text-primary transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Attention + Tasks */}
          <div className="space-y-6">

            {/* Attention Required */}
            {attentionStats.length > 0 && (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-red-50/50">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-bold text-foreground">Attention Required</h3>
                </div>
                <div className="divide-y divide-border">
                  {attentionStats.map((stat) => (
                    <div
                      key={stat.label}
                      onClick={() => navigate(attentionPaths[stat.label] || '#')}
                      className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Requires your attention</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${attentionColors[stat.label] || 'text-foreground bg-muted border-border'}`}>
                          {stat.value}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tasks */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-sm font-bold text-foreground">
                  {isPrincipal ? 'Recent Tasks' : "Today's Tasks"}
                </h3>
                <button
                  onClick={() => navigate('/tasks')}
                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:gap-1.5 transition-all"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {loading ? (
                  <p className="text-center text-sm py-8 text-muted-foreground">Loading tasks...</p>
                ) : upcomingTasks.length === 0 ? (
                  <p className="text-center text-sm py-8 text-muted-foreground">No pending tasks 🎉</p>
                ) : upcomingTasks.slice(0, 6).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{toTitleCase(task.title)}</p>
                        <p className="text-xs text-muted-foreground">{formatTime(task.time)}</p>
                      </div>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'completed' : 'pending'} className="text-[10px] shrink-0 ml-2">
                      {toTitleCase(task.status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

    </AppLayout>
  );
}
