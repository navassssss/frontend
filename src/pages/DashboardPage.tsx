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
  Plus,
  Trophy,
  Calendar,
  BookOpen,
  Award,
  ArrowUpRight,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

// Helper to convert name to title case
const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper to format time display
const formatTime = (time: string | null) => {
  if (!time || time === 'No time') return 'No due time';
  return time;
};

// Helper to get dynamic greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const teacherQuickActions = [
  {
    title: 'Attendance',
    description: 'Mark daily attendance',
    icon: Calendar,
    path: '/attendance',
    color: 'bg-info'
  },
  {
    title: 'CCE Works',
    description: 'Manage assignments',
    icon: BookOpen,
    path: '/cce/works',
    color: 'bg-warning'
  },
  {
    title: 'My Duties',
    description: '3 active duties',
    icon: ClipboardList,
    path: '/duties',
    color: 'bg-primary'
  },
  {
    title: 'My Tasks',
    description: '5 pending today',
    icon: CheckSquare,
    path: '/tasks',
    color: 'bg-accent'
  },
  {
    title: 'Raise Issue',
    description: 'Report a problem',
    icon: AlertCircle,
    path: '/issues/new',
    color: 'bg-destructive'
  },
  {
    title: 'Submit Report',
    description: 'Complete a duty',
    icon: FileText,
    path: '/reports/new',
    color: 'bg-success'
  },
];

const principalQuickActions = [
  {
    title: 'Attendance',
    description: 'View daily records',
    icon: Calendar,
    path: '/attendance',
    color: 'bg-info'
  },
  {
    title: 'Subjects',
    description: 'Manage subjects',
    icon: BookOpen,
    path: '/subjects',
    color: 'bg-success'
  },
  {
    title: 'CCE Works',
    description: 'Manage assignments',
    icon: BookOpen,
    path: '/cce/works',
    color: 'bg-warning'
  },
  {
    title: 'Student Marks',
    description: 'View CCE marks',
    icon: Award,
    path: '/cce/student-marks',
    color: 'bg-primary'
  },
  {
    title: 'Teachers',
    description: 'Manage staff',
    icon: Users,
    path: '/teachers',
    color: 'bg-primary'
  },
  {
    title: 'Create Duty',
    description: 'Add new duty',
    icon: ClipboardList,
    path: '/duties/new',
    color: 'bg-accent'
  },
  {
    title: 'Achievements',
    description: 'Review students',
    icon: Trophy,
    path: '/student-achievements',
    color: 'bg-warning'
  },
  {
    title: 'All Issues',
    description: '5 open issues',
    icon: AlertCircle,
    path: '/issues',
    color: 'bg-destructive'
  },
  {
    title: 'Review Reports',
    description: 'Pending reviews',
    icon: FileText,
    path: '/reports',
    color: 'bg-primary'
  },
];

// Helper to map icon name string to component
const getIcon = (iconName: string) => {
  const icons: any = {
    Users,
    CheckSquare,
    AlertTriangle,
    Clock,
    ClipboardList,
    TrendingUp,
    Calendar,
    GraduationCap,
    FileText,
    Trophy,
    BookOpen
  };
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

  // Combine logic: Teachers with permission get the link too
  let quickActions = isPrincipal ? principalQuickActions : teacherQuickActions;

  // Add review link for teachers with permission if not already present (Principal has it in default list)
  if (!isPrincipal && user?.can_review_achievements) {
    quickActions = [
      {
        title: 'Achievements',
        description: 'Review students',
        icon: Trophy,
        path: '/student-achievements',
        color: 'bg-warning'
      },
      ...quickActions
    ];
  }

  // Get primary stat for featured banner
  const primaryStat = stats[0] || { label: 'Loading...', value: '0', icon: 'Users' };

  return (
    <AppLayout title="Dashboard">
      {/* Mobile View */}
      <div className="lg:hidden p-4 space-y-6">
        {/* Greeting */}
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-foreground">
            {getGreeting()}, {toTitleCase(user?.name?.split(' ')[0] || 'User')}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Here's your overview for today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 animate-slide-up">
          {loading ? (
            <p className="col-span-2 text-center text-sm text-muted-foreground">Loading stats...</p>
          ) : stats.map((stat) => {
            const Icon = getIcon(stat.icon);
            return (
              <Card key={stat.label} variant="stat" className="text-center">
                <CardContent className="p-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="animate-slide-up stagger-2" style={{ animationFillMode: 'backwards' }}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              // Dynamic description update based on stats
              let description = action.description;
              if (action.title === 'All Issues') {
                const openIssuesStat = stats.find(s => s.label === 'Open Issues');
                if (openIssuesStat) {
                  description = `${openIssuesStat.value} open issues`;
                }
              }
              if (action.title === 'Review Reports') {
                const pendingReportsStat = stats.find(s => s.label === 'Pending Reports');
                if (pendingReportsStat) {
                  description = `${pendingReportsStat.value} pending reviews`;
                }
              }
              if (action.title === 'My Tasks') {
                const pendingTasksStat = stats.find(s => s.label === 'Pending Tasks');
                if (pendingTasksStat) {
                  description = `${pendingTasksStat.value} pending today`;
                }
              }
              if (action.title === 'My Duties') {
                const activeDutiesStat = stats.find(s => s.label === 'Active Duties');
                if (activeDutiesStat) {
                  description = `${activeDutiesStat.value} active duties`;
                }
              }

              return (
                <Card
                  key={action.title}
                  variant="interactive"
                  onClick={() => navigate(action.path)}
                >
                  <CardContent className="p-4">
                    <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
                      <action.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h4 className="font-semibold text-foreground text-sm">{action.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="animate-slide-up stagger-3" style={{ animationFillMode: 'backwards' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {isPrincipal ? 'Recent Active Tasks' : "Today's Tasks"}
            </h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {loading ? <p className="text-center text-sm py-4">Loading tasks...</p> :
              upcomingTasks.length === 0 ? <p className="text-center text-sm py-4 text-muted-foreground">No pending tasks</p> :
                upcomingTasks.map((task) => (
                  <Card
                    key={task.id}
                    variant="interactive"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'completed' ? 'bg-success' : 'bg-warning'
                          }`} />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-sm truncate">{toTitleCase(task.title)}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(task.time)}</p>
                        </div>
                      </div>
                      <Badge variant={task.status === 'completed' ? 'completed' : 'pending'}>
                        {toTitleCase(task.status)}
                      </Badge>
                    </CardContent>
                  </Card>
                ))
            }
          </div>
        </div>
      </div>

      {/* Desktop View - Completely Different Layout */}
      <div className="hidden lg:block p-6 space-y-6">
        {/* Header with Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {getGreeting()}, {toTitleCase(user?.name?.split(' ')[0] || 'User')}
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's your overview for today
            </p>
          </div>
        </div>

        {/* Stats Grid - All stats in one row */}
        <div className="grid grid-cols-4 gap-4">
          {loading ? (
            <p className="col-span-4 text-center text-sm text-muted-foreground py-8">Loading stats...</p>
          ) : stats.map((stat, index) => {
            const Icon = getIcon(stat.icon);
            const isFirst = index === 0;

            if (isFirst) {
              // Featured stat - larger card
              return (
                <Card key={stat.label} className="col-span-2 bg-gradient-to-br from-primary to-primary/90 border-0 shadow-xl text-white">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <p className="text-white/80 text-sm font-medium uppercase tracking-wide">
                          {stat.label}
                        </p>
                        <p className="text-6xl font-bold">{stat.value}</p>
                        <p className="text-white/70 text-sm">Updated just now</p>
                      </div>
                      <div className="text-white/20">
                        <Icon className="w-32 h-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Regular stats
            return (
              <Card key={stat.label} className="hover:shadow-lg transition-all duration-300 border-2">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Quick Actions - Takes 2 columns */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {quickActions.slice(0, 6).map((action) => {
                let description = action.description;
                if (action.title === 'All Issues') {
                  const openIssuesStat = stats.find(s => s.label === 'Open Issues');
                  if (openIssuesStat) description = `${openIssuesStat.value} open issues`;
                }
                if (action.title === 'Review Reports') {
                  const pendingReportsStat = stats.find(s => s.label === 'Pending Reports');
                  if (pendingReportsStat) description = `${pendingReportsStat.value} pending reviews`;
                }
                if (action.title === 'My Tasks') {
                  const pendingTasksStat = stats.find(s => s.label === 'Pending Tasks');
                  if (pendingTasksStat) description = `${pendingTasksStat.value} pending today`;
                }
                if (action.title === 'My Duties') {
                  const activeDutiesStat = stats.find(s => s.label === 'Active Duties');
                  if (activeDutiesStat) description = `${activeDutiesStat.value} active duties`;
                }

                return (
                  <Card
                    key={action.title}
                    className="hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer border-2"
                    onClick={() => navigate(action.path)}
                  >
                    <CardContent className="p-6">
                      <div className={`w-14 h-14 rounded-2xl ${action.color} flex items-center justify-center mb-4 shadow-lg`}>
                        <action.icon className="w-7 h-7 text-primary-foreground" />
                      </div>
                      <h3 className="font-bold text-base mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Tasks - Takes 1 column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">
                {isPrincipal ? 'Recent Tasks' : "Today's Tasks"}
              </h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-sm text-primary font-medium flex items-center gap-1 hover:gap-2 transition-all"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {loading ? <p className="text-center text-sm py-8">Loading tasks...</p> :
                upcomingTasks.length === 0 ? <p className="text-center text-sm py-8 text-muted-foreground">No pending tasks</p> :
                  upcomingTasks.slice(0, 5).map((task) => (
                    <Card
                      key={task.id}
                      className="hover:shadow-lg transition-all cursor-pointer border-2"
                      onClick={() => navigate(`/tasks/${task.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="font-semibold text-sm flex-1">{toTitleCase(task.title)}</p>
                          <Badge variant={task.status === 'completed' ? 'completed' : 'pending'} className="flex-shrink-0">
                            {toTitleCase(task.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTime(task.time)}</p>
                      </CardContent>
                    </Card>
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
