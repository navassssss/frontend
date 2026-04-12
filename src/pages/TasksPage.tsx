import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, AlertCircle, ChevronRight, Plus, Users, User, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

type TaskFilter = 'all' | 'today' | 'completed';
type ViewMode = 'mine' | 'all';
type TaskStatus = 'pending' | 'completed' | 'missed';

interface ApiTask {
  id: number;
  title: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: TaskStatus;
  duty?: { name: string };
  assigned_to?: { id: number; name: string };
}

const toTitleCase = (str: string) =>
  str?.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || str;

const formatDate = (dateStr: string) => {
  try { return format(new Date(dateStr), 'MMM d, yyyy'); } catch { return dateStr; }
};

const statusConfig: Record<TaskStatus, { label: string; badgeClass: string; iconBg: string }> = {
  completed: { label: 'Completed', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200', iconBg: 'bg-emerald-50' },
  missed:    { label: 'Overdue',   badgeClass: 'bg-red-100 text-red-700 border-red-200',       iconBg: 'bg-red-50' },
  pending:   { label: 'Pending',   badgeClass: 'bg-amber-100 text-amber-700 border-amber-200', iconBg: 'bg-amber-50' },
};

const StatusIcon = ({ status }: { status: TaskStatus }) => {
  if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
  if (status === 'missed') return <AlertCircle className="w-5 h-5 text-red-500" />;
  return <Clock className="w-5 h-5 text-amber-500" />;
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [activeFilter, setActiveFilter] = useState<TaskFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  useEffect(() => {
    api.get('/tasks')
      .then(res => {
        // Handle both array (legacy) and paginated {data:[]} responses
        const list = Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
        setTasks(list);
      })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setIsLoading(false));
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const mine = (task: ApiTask) => task.assigned_to?.id === user?.id;
  const isMissed = (task: ApiTask) => (task.scheduled_date < today && task.status === 'pending') || task.status === 'missed';
  const isToday = (task: ApiTask) => task.scheduled_date === today;

  const ownerMatch = (task: ApiTask) =>
    isPrincipal ? (viewMode === 'all' || mine(task)) : mine(task);

  const filteredTasks = tasks.filter(task => {
    if (!ownerMatch(task)) return false;
    if (activeFilter === 'completed') return task.status === 'completed';
    if (task.status === 'completed') return false;
    if (activeFilter === 'today') return isToday(task);
    return true;
  });

  const visibleBase = tasks.filter(t => ownerMatch(t) && t.status !== 'completed');
  const allCount = visibleBase.length;
  const todayCount = visibleBase.filter(isToday).length;
  const completedCount = tasks.filter(t => ownerMatch(t) && t.status === 'completed').length;

  const filterTabs: { id: TaskFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: allCount },
    { id: 'today', label: 'Today', count: todayCount },
    { id: 'completed', label: 'Completed', count: completedCount },
  ];

  return (
    <AppLayout title="Tasks">
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-28 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {isPrincipal && viewMode === 'all' ? 'All Tasks' : 'My Tasks'}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track your scheduled duties and assignments</p>
          </div>
          {isPrincipal && (
            <Button size="sm" onClick={() => navigate('/tasks/new')} className="h-9 rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          )}
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mine / All toggle (principal only) */}
          {isPrincipal && (
            <div className="flex bg-muted rounded-xl p-0.5 text-sm">
              <button
                onClick={() => setViewMode('mine')}
                className={`px-3 py-1.5 rounded-[10px] font-medium transition-all flex items-center gap-1.5 ${viewMode === 'mine' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <User className="w-3.5 h-3.5" /> Mine
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-[10px] font-medium transition-all flex items-center gap-1.5 ${viewMode === 'all' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Users className="w-3.5 h-3.5" /> All
              </button>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex bg-muted rounded-xl p-0.5 text-sm">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[10px] font-medium transition-all flex items-center gap-1.5 ${activeFilter === tab.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tab.label}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeFilter === tab.id ? 'bg-primary text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-4 animate-pulse h-20" />
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="font-semibold text-foreground">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-1">No tasks in this category.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
            {filteredTasks.map((task, index) => {
              const cfg = statusConfig[isMissed(task) ? 'missed' : task.status] || statusConfig.pending;
              // Strip auto-generated "Report: " prefix
              const displayTitle = task.title?.startsWith('Report: ') ? task.title.slice(8) : task.title;

              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 cursor-pointer transition-colors group animate-slide-up"
                  style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'backwards' }}
                >
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                    <StatusIcon status={isMissed(task) ? 'missed' : task.status} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Duty label */}
                    {task.duty?.name && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <ClipboardList className="w-3 h-3 text-muted-foreground/60" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {toTitleCase(task.duty.name)}
                        </p>
                      </div>
                    )}
                    <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors truncate">
                      {toTitleCase(displayTitle)}
                    </h3>
                    {/* Date & Time */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(task.scheduled_date)}</span>
                      </div>
                      {task.scheduled_time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{task.scheduled_time.slice(0, 5)}</span>
                        </div>
                      )}
                      {isPrincipal && viewMode === 'all' && task.assigned_to?.name && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{toTitleCase(task.assigned_to.name)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
