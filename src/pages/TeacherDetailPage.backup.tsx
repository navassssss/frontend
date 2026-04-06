import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Briefcase, CheckSquare, RotateCcw, Plus, X, Calendar, User as UserIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';

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
          completedTasksList: tasksRes.data.filter((t: any) => t.status === 'completed'),
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
      teacher_ids: [teacher.id],  // Array required by backend
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

  const [showAllReports, setShowAllReports] = useState(false);

  if (!teacher) return <div className="p-6 text-center">Loading...</div>;

  const completionRate = teacher.totalTasks === 0
    ? 0
    : Math.round((teacher.completedTasks / teacher.totalTasks) * 100);

  return (
    <AppLayout title="Teacher Profile">
      <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 pb-24">
        
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Teacher Profile</h1>
                <p className="text-sm text-muted-foreground">Overview, tasks, and reports</p>
            </div>
        </div>
        
        {/* Top Profile Section */}
        {/* MOBILE: centered card-style hero. DESKTOP: horizontal row */}
        <div className="mb-8">
          {/* Hero card – visible on all screens */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">

            {/* Avatar + Name Row */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center shrink-0 shadow-md relative">
                <span className="text-2xl md:text-3xl font-extrabold text-primary-foreground tracking-tight">
                  {teacher.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="absolute -bottom-1.5 -right-1.5 bg-success text-white rounded-full p-0.5 border-2 border-background shadow-sm">
                  <CheckSquare className="w-3 h-3" />
                </div>
              </div>

              {/* Name & meta */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="secondary" className="px-2 py-0 text-[9px] uppercase tracking-wider bg-muted text-muted-foreground shrink-0">{teacher.role}</Badge>
                  <span className="text-[10px] text-muted-foreground truncate">Active Account</span>
                </div>
                <h2 className="text-lg md:text-2xl font-extrabold text-foreground tracking-tight leading-tight truncate">{teacher.name}</h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 opacity-60" />
                    <span>{teacher.department || 'General Education'}</span>
                  </div>
                  {teacher.assigned_classes && teacher.assigned_classes.length > 0 && (
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3 opacity-60" />
                      <span className="font-semibold text-foreground/70">{teacher.assigned_classes.map((c: any) => c.name).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop deactivate */}
              {teacher.role === 'teacher' && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeactivateModal(true)} className="hidden md:flex shrink-0">
                  Deactivate
                </Button>
              )}
            </div>

            {/* Action buttons row */}
            <div className="flex items-center gap-2 mt-4">
              {isPrincipal && (
                <Button
                  variant={teacher.can_review_achievements ? "default" : "outline"}
                  className={`flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${teacher.can_review_achievements ? 'bg-success hover:bg-success/90 text-success-foreground border-transparent' : 'border-border hover:bg-muted bg-background'}`}
                  onClick={() => {
                    api.post(`/teachers/${teacher.id}/toggle-review-permission`)
                      .then(res => {
                        setTeacher({ ...teacher, can_review_achievements: res.data.can_review_achievements });
                        toast.success(`Review permission ${res.data.can_review_achievements ? 'granted' : 'revoked'}`);
                      })
                      .catch(() => toast.error('Failed to update permission'));
                  }}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  {teacher.can_review_achievements ? 'Review Access Granted' : 'Grant Achievement Access'}
                </Button>
              )}
              {/* Mobile deactivate */}
              {teacher.role === 'teacher' && (
                <Button variant="destructive" size="sm" onClick={() => setShowDeactivateModal(true)} className="md:hidden h-9 px-3 text-xs">
                  Deactivate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row - 3 compact cards, horizontal on all screens */}
        <div className="grid grid-cols-3 gap-3 mb-8">
            {/* Duties */}
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4 shadow-sm flex flex-col">
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Active Duties</p>
                <span className="text-3xl md:text-4xl font-black text-primary tracking-tighter leading-none">{String(teacher.duties.length).padStart(2, '0')}</span>
                <span className="text-[9px] text-muted-foreground mt-1 hidden md:block">Total assigned</span>
            </div>
            
            {/* Pending Tasks */}
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4 shadow-sm flex flex-col">
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Pending Tasks</p>
                <span className="text-3xl md:text-4xl font-black text-warning tracking-tighter leading-none">{String(teacher.pendingTasks).padStart(2, '0')}</span>
                <span className="text-[9px] text-muted-foreground mt-1 hidden md:block">Requires attention</span>
            </div>
            
            {/* Completion */}
            <div className="bg-card border border-border rounded-2xl p-3 md:p-4 shadow-sm flex flex-col">
                <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Completion</p>
                <span className="text-3xl md:text-4xl font-black text-foreground tracking-tighter leading-none">{completionRate}%</span>
                <span className="text-[9px] text-muted-foreground mt-1 hidden md:block">Overall progress</span>
            </div>
        </div>

      {/* Main Grid for detailed lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Column 1: Duties & Classes */}
        <div className="space-y-8">

          {/* Class & Subject Operations */}
          {teacher.subjects && teacher.subjects.length > 0 && (
            <div className="animate-slide-up">
              <h3 className="font-bold text-foreground mb-4 text-lg">Subjects & CCE Progress</h3>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {teacher.subjects.map((sub: any) => (
                   <div key={sub.id} className="p-4 bg-card rounded-2xl shadow-sm border border-border">
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <span className="font-bold text-foreground text-sm block">{sub.name} <span className="font-normal text-muted-foreground ml-1">({sub.code})</span></span>
                          <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{sub.class_room?.name || 'Unassigned'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-foreground leading-none block">
                             {String(sub.total_works_assigned || 0).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Works</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 border-t border-border pt-4">
                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                           <span>CCE Completion</span>
                           <span className={sub.completion_percent === 100 ? "text-success" : "text-primary"}>{sub.completion_percent || 0}%</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5 overflow-hidden">
                           <div className={`h-full rounded-full transition-all duration-500 ${sub.completion_percent === 100 ? 'bg-success' : 'bg-primary'}`} style={{ width: `${sub.completion_percent || 0}%` }}></div>
                        </div>
                      </div>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Duties */}
          <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">Assigned Duties</h3>
            <button onClick={() => setShowDutyModal(true)} className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center hover:bg-success/90 transition-colors shadow-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {teacher.duties.map((duty) => (
              <div key={duty.id} className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                      ${duty.type === 'rotational' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}
                    `}>
                      {duty.type === 'rotational' ? (
                        <RotateCcw className="w-5 h-5" />
                      ) : (
                        <Briefcase className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{duty.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{duty.frequency}</p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive h-8 w-8"
                    onClick={() => handleRemoveDuty(duty.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
              </div>
            ))}

            {teacher.duties.length === 0 && (
              <p className="text-xs font-medium text-muted-foreground py-4">
                No duties assigned.
              </p>
            )}
          </div>
        </div>
        </div>

        {/* Column 2: Tasks (Pending & Completed) */}
        <div className="space-y-8">
          {/* Pending Tasks */}
          <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">Pending Tasks</h3>
            <div className="flex items-center gap-3">
                {teacher.tasks.length > 0 && <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded uppercase tracking-wider">Urgent Action</span>}
                <button onClick={() => setShowTaskModal(true)} className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Assign
                </button>
            </div>
          </div>

          <div className="space-y-1">
            {teacher.tasks.map((task) => (
               <div key={task.id} className="flex items-start justify-between py-3 border-b border-border/50 last:border-0 group">
                  <div>
                     <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{task.title}</p>
                     <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(task.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                     </div>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">Pending</span>
               </div>
            ))}

            {teacher.tasks.length === 0 && (
              <p className="text-xs font-medium text-muted-foreground py-4">
                No tasks available.
              </p>
            )}
          </div>
        </div>

          {/* Completed Tasks */}
          {teacher.completedTasksList && teacher.completedTasksList.length > 0 && (
            <div className="animate-slide-up mt-8" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg text-muted-foreground">Completed Tasks</h3>
                <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-bold">{teacher.completedTasksList.length}</span>
              </div>
              <div className="space-y-0 max-h-[200px] overflow-y-auto pr-1">
                {teacher.completedTasksList.map((task: any) => (
                  <div key={task.id} className="flex items-start justify-between py-3 border-b border-border/50 last:border-0 opacity-60 grayscale">
                    <div className="flex gap-3">
                        <CheckSquare className="w-4 h-4 text-success shrink-0 mt-0.5" />
                        <div>
                        <p className="text-sm font-bold leading-tight decoration-muted-foreground/50">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(task.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column 3: Recent Reports */}
        <div className="space-y-8">

           {/* Recent Reports */}
           <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground text-lg">Recent Reports</h3>
                <span onClick={() => setShowAllReports(!showAllReports)} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-primary transition-colors select-none">
                    {showAllReports ? 'Collapse' : 'View All'}
                </span>
              </div>
              
              <div className="space-y-4">
                {teacher.recent_reports && teacher.recent_reports.length > 0 ? (
                  (showAllReports ? teacher.recent_reports : teacher.recent_reports.slice(0, 2)).map((report: any) => (
                    <div key={report.id} className="bg-card rounded-2xl p-5 shadow-sm border border-border cursor-pointer group hover:border-primary/50 transition-all" onClick={() => navigate(`/reports/${report.id}`)}>
                        <div className="flex items-start gap-4 mb-3">
                           <div className="w-8 h-8 rounded shrink-0 bg-muted flex items-center justify-center border border-border/50">
                               <CheckSquare className="w-4 h-4 text-foreground/80" />
                           </div>
                           <div className="flex-1 mt-0.5">
                               <p className="font-bold text-foreground text-sm leading-tight group-hover:text-primary transition-colors">
                                   {report.task?.title || report.duty?.name || 'General Oversight'}
                               </p>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                                   {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                               </p>
                           </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mt-2">
                           Report submission completed for {report.task?.title || report.duty?.name || 'assigned module'}. Waiting for administrative overview.
                        </p>
                        <div className="mt-4 flex font-bold text-[10px] text-primary uppercase tracking-wider items-center gap-1 group-hover:gap-2 transition-all">
                            Download Report <span className="text-lg leading-none">↓</span>
                        </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-muted-foreground py-4">
                    No reports submitted.
                  </p>
                )}
              </div>
           </div>
        </div>

      </div>
      </div>

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

    </AppLayout>
  );
}
