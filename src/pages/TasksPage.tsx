import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Plus,
  Users,
  User,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';

type TaskFilter = 'today' | 'upcoming' | 'missed';
type ViewMode = 'mine' | 'all';

type TaskStatus = 'pending' | 'completed' | 'missed';

interface ApiTask {
  id: number;
  title: string;
  scheduled_date: string;   // "2025-12-05"
  scheduled_time: string | null; // "08:00:00" or "08:00"
  status: TaskStatus;
  duty?: { name: string };
  assigned_to?: { id: number; name: string };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  // Load tasks from backend
  useEffect(() => {
    api
      .get('/tasks')
      .then((res) => setTasks(res.data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-success" />;
      case 'missed':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-warning" />;
    }
  };

  const isToday = (task: ApiTask) => task.scheduled_date === today;
  const isMissed = (task: ApiTask) => (task.scheduled_date < today && task.status === 'pending') || task.status === 'missed';
  const isUpcoming = (task: ApiTask) =>
    !isMissed(task) && task.scheduled_date > today;

  const filteredTasks = tasks.filter((task) => {
    if (!user) return false;
    const notCompleted = task.status !== 'completed';
    if (!notCompleted) return false;

    const mine = task.assigned_to?.id === user.id;

    const ownerMatch = isPrincipal
      ? (viewMode === "all" || mine)
      : mine;

    const dateMatch =
      activeFilter === "today" ? isToday(task)
        : activeFilter === "upcoming" ? isUpcoming(task)
          : isMissed(task);

    return ownerMatch && dateMatch;
  });



  // Dynamic counts for filter tabs
  // helper to check if the task belongs to current user
  const mine = (task: ApiTask) => task.assigned_to?.id === user?.id;

  // Count only tasks user is allowed to see based on viewMode
  const visibleTasks = tasks.filter((task) => {
    if (!user) return false;

    const notCompleted = task.status !== "completed";
    if (!notCompleted) return false;

    return isPrincipal
      ? (viewMode === "all" || mine(task))
      : mine(task);
  });


  const todayCount = visibleTasks.filter((t) => isToday(t) && !isMissed(t)).length;
  const upcomingCount = visibleTasks.filter((t) => isUpcoming(t)).length;
  const missedCount = visibleTasks.filter((t) => isMissed(t)).length;

  const filterTabs: { id: TaskFilter; label: string; count: number }[] = [
    { id: "today", label: "Today", count: todayCount },
    { id: "upcoming", label: "Upcoming", count: upcomingCount },
    { id: "missed", label: "Missed", count: missedCount },
  ];


  if (isLoading) {
    return (
      <AppLayout title="Tasks">
        <div className="p-4 text-center text-muted-foreground">
          Loading tasks...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Tasks">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isPrincipal
                ? viewMode === 'all'
                  ? 'All Tasks'
                  : 'My Tasks'
                : 'My Tasks'}
            </h2>
            <p className="text-sm text-muted-foreground">Track scheduled duties</p>
          </div>
          {isPrincipal && (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate('/tasks/new')}
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>

        {/* View Mode Toggle for Principal */}
        {isPrincipal && (
          <div className="flex gap-2 animate-slide-up">
            <button
              onClick={() => setViewMode('mine')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'mine'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <User className="w-4 h-4" />
              My Tasks
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'all'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <Users className="w-4 h-4" />
              All Teachers
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 animate-slide-up">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${activeFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              {tab.label}
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === tab.id
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted-foreground/20'
                  }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card variant="flat" className="animate-fade-in">
              <CardContent className="p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="font-medium text-foreground">All caught up!</p>
                <p className="text-sm text-muted-foreground">
                  No tasks in this category
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task, index) => (
              <Card
                key={task.id}
                variant="interactive"
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="animate-slide-up"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'backwards',
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${task.status === 'missed'
                        ? 'bg-destructive-light'
                        : task.status === 'completed'
                          ? 'bg-success-light'
                          : 'bg-warning-light'
                        }`}
                    >
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {task.duty?.name || 'Untitled Duty'}
                          </p>
                          <h3 className="font-semibold text-foreground">
                            {task.title}
                          </h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {task.scheduled_date}
                        </div>
                        {task.scheduled_time && (
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {task.scheduled_time.slice(0, 5)}
                          </div>
                        )}
                        {isPrincipal &&
                          viewMode === 'all' &&
                          task.assigned_to?.name && (
                            <Badge variant="secondary" className="text-xs">
                              {task.assigned_to.name}
                            </Badge>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
