import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Briefcase, CheckSquare, RotateCcw, Plus, X, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isPrincipal = user?.role === "principal" || user?.role === "manager";
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [teacher, setTeacher] = useState<any>(null);
  const [duties, setDuties] = useState<any[]>([]);
  const [showDutyModal, setShowDutyModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", dueDate: "", dutyId: "" });

  const loadTeacher = () => {
    Promise.all([
      api.get(`/teachers/${id}`),
      api.get('/duties'),
      api.get(`/tasks?teacher_id=${id}`)
    ])
      .then(([teacherRes, dutiesRes, tasksRes]) => {
        setTeacher({
          ...teacherRes.data,
          tasks: tasksRes.data.filter((t: any) => t.status !== 'completed'),
          pendingTasks: tasksRes.data.filter((t: any) => t.status !== 'completed').length,
          completedTasks: tasksRes.data.filter((t: any) => t.status === 'completed').length,
          totalTasks: tasksRes.data.length
        });
        setDuties(dutiesRes.data);
      })
      .catch(() => toast.error("Failed to load teacher"))
  };

  useEffect(loadTeacher, [id]);

  const handleAssignDuty = (dutyId) => {
    api.post(`/duties/${dutyId}/assign-teachers`, {
      teacher_ids: [teacher.id]  // array required
    })
      .then(() => {
        toast.success("Duty assigned");
        loadTeacher();
        setShowDutyModal(false);
      })
      .catch(() => toast.error("Failed to assign duty"));
  };


  const handleRemoveDuty = (dutyId: number) => {
    api.post(`/duties/${dutyId}/remove-teacher`, {
      teacher_id: teacher.id
    })
      .then(() => {
        toast.success("Duty removed successfully");
        loadTeacher();
      })
      .catch(() => toast.error("Failed to remove duty"));
  };

  const handleDeactivate = () => {
    api.post(`/teachers/${teacher.id}/deactivate`)
      .then(() => {
        toast.success('Teacher deactivated');
        navigate('/teachers');
      })
      .catch(() => toast.error('Failed to deactivate teacher'))
      .finally(() => setShowDeactivateModal(false));
  };


  const handleAssignTask = () => {
    if (!newTask.title || !newTask.dueDate) return toast.error("Enter title & date");

    api.post("/tasks", {
      title: newTask.title,
      duty_id: newTask.dutyId || null,
      assigned_to: teacher.id,
      scheduled_date: newTask.dueDate,
      scheduled_time: null,
      instructions: ""
    })
      .then(() => {
        toast.success("Task assigned!");
        setShowTaskModal(false);
        setNewTask({ title: "", dueDate: "", dutyId: "" });
        loadTeacher();
      })
      .catch(() => toast.error("Error creating task"));
  };

  if (!teacher) return <div className="p-6 text-center">Loading...</div>;

  const completionRate = teacher.totalTasks === 0
    ? 0
    : Math.round((teacher.completedTasks / teacher.totalTasks) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* <header className="sticky top-0 bg-background border-b">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold ml-3">Teacher Profile</h1>
        </div>
      </header> */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-semibold text-foreground ml-3">Teacher Profile</h1>
          </div>

          {/* Hide for principals themselves if you like */}
          {teacher.role === 'teacher' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => setShowDeactivateModal(true)}
            >
              Deactivate
            </Button>
          )}
        </div>
      </header>


      <main className="p-4 max-w-lg mx-auto pb-8 space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">
                {teacher.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <h2 className="text-xl font-bold">{teacher.name}</h2>
            <p className="text-muted-foreground">{teacher.role}</p>
            <Badge variant="secondary" className="mt-2">{teacher.department}</Badge>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardContent className="grid grid-cols-3 text-center p-4">
            <div>
              <p className="text-xl font-bold">{teacher.duties.length}</p>
              <p className="text-xs text-muted-foreground">Duties</p>
            </div>
            <div>
              <p className="text-xl font-bold text-accent">{teacher.pendingTasks}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-xl font-bold text-success">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </div>
          </CardContent>
        </Card>

        {/* Duties */}
        {/* Assigned Duties */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Assigned Duties</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowDutyModal(true)}>
              <Plus className="w-4 h-4" />
              Assign
            </Button>
          </div>

          <div className="space-y-3">
            {teacher.duties.map((duty) => (
              <Card key={duty.id} className="rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center
              ${duty.type === 'rotational' ? 'bg-warning/20 text-warning' : 'bg-primary/20 text-primary'}
            `}>
                      {duty.type === 'rotational' ? (
                        <RotateCcw className="w-6 h-6" />
                      ) : (
                        <Briefcase className="w-6 h-6" />
                      )}
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{duty.name}</p>
                      <p className="text-sm text-muted-foreground">{duty.frequency}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveDuty(duty.id)}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {teacher.duties.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No duties assigned
              </p>
            )}
          </div>
        </div>


        {/* Pending Tasks */}
        {/* Assigned Tasks */}
        <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Pending Tasks</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowTaskModal(true)}>
              <Plus className="w-4 h-4" />
              Assign
            </Button>
          </div>

          <div className="space-y-3">
            {teacher.tasks.map((task) => (
              <Card key={task.id} className="rounded-2xl shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                      <CheckSquare className="w-6 h-6 text-muted-foreground" />
                    </div>

                    <div className="flex-1">
                      <p className="font-semibold text-foreground leading-tight">{task.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {task.scheduled_date}{task.scheduled_time ? ` at ${task.scheduled_time}` : ''}
                      </p>
                    </div>

                    <Badge variant="warning" className="capitalize text-xs">
                      {task.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}

            {teacher.tasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No pending tasks
              </p>
            )}
          </div>
        </div>

      </main>

      {/* Duty Modal */}
      {showDutyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg max-h-[80vh] overflow-hidden rounded-3xl animate-slide-up">
            <CardContent className="p-6 overflow-y-auto max-h-[70vh]">

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-xl text-foreground">Assign Duty</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowDutyModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {duties.map((duty) => {
                  const isAssigned = teacher.duties.some((d) => d.id === duty.id);

                  return (
                    <button
                      key={duty.id}
                      disabled={isAssigned}
                      onClick={() => handleAssignDuty(duty.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border transition 
                  ${isAssigned ?
                          'bg-secondary/50 opacity-60 cursor-not-allowed' :
                          'bg-card hover:bg-secondary'
                        }`}
                    >

                      {/* Icon bubble */}
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center
                  ${duty.type === 'rotational' ? 'bg-warning-light' : 'bg-primary-light'}`}
                      >
                        {duty.type === 'rotational' ? (
                          <RotateCcw className="w-6 h-6 text-warning" />
                        ) : (
                          <Briefcase className="w-6 h-6 text-primary" />
                        )}
                      </div>

                      {/* Duty Info */}
                      <div className="flex-1 text-left">
                        <p className="font-medium text-foreground text-sm">{duty.name}</p>
                        <p className="text-xs text-muted-foreground">{duty.frequency}</p>
                      </div>

                      {/* Assigned Badge */}
                      {isAssigned && (
                        <Badge variant="secondary" className="text-xs">Assigned</Badge>
                      )}

                    </button>
                  );
                })}

                {duties.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No duties found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}


      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg rounded-2xl animate-slide-up">
            <CardContent className="p-6 space-y-4">

              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-lg">Assign Task</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowTaskModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Task Title <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Enter task title"
                    value={newTask.title}
                    className="h-12 rounded-xl border border-input focus:border-primary focus:ring-primary/20"
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Due Date <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="date"
                    value={newTask.dueDate}
                    className="h-12 rounded-xl border border-input focus:border-primary focus:ring-primary/20"
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Related Duty (Optional)</label>
                  <select
                    value={newTask.dutyId}
                    onChange={(e) => setNewTask({ ...newTask, dutyId: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl border border-input bg-background text-foreground focus:border-primary focus:ring-primary/20 transition"
                  >
                    <option value="">Select a duty</option>
                    {teacher?.duties?.map((duty) => (
                      <option key={duty.id} value={duty.id}>{duty.name}</option>
                    ))}
                  </select>
                </div>

                <Button variant="touch" className="w-full h-12 rounded-xl font-semibold" onClick={handleAssignTask}>
                  Assign Task
                </Button>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {showDeactivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-sm rounded-2xl animate-scale-in">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Deactivate Teacher
              </h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to deactivate <span className="font-medium">{teacher.name}</span>?
                They will no longer appear in duty or task assignments, but their past reports
                and records will remain.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeactivateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeactivate}
                >
                  Deactivate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}


    </div>
  );
}
