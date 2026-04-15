import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, X, Check, Users, ClipboardList, Calendar,
  ChevronDown, ChevronUp, Search, Briefcase, RotateCcw,
  Library, Bus, Award, BookOpen, AlertCircle, CheckCircle2,
  Plus, Minus
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import api from '@/lib/api';

/* ─────────────────────── types ─────────────────────── */
interface Teacher {
  id: number;
  name: string;
  role?: string;
  department?: string;
}

interface Duty {
  id: number;
  name: string;
  description?: string;
  frequency?: string;
  type?: string;
  teachers: Teacher[];
}

/* ─────────────────────── helpers ─────────────────────── */
const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const getDutyIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('library'))                          return Library;
  if (n.includes('bus'))                              return Bus;
  if (n.includes('assembly') || n.includes('meet'))  return Users;
  if (n.includes('sports') || n.includes('coord'))   return Award;
  if (n.includes('cce') || n.includes('curriculum')) return BookOpen;
  if (n.includes('lab') || n.includes('section'))    return Briefcase;
  return RotateCcw;
};

const dutyColors = [
  { icon: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/40', ring: 'ring-emerald-300' },
  { icon: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-950/40',       ring: 'ring-blue-300' },
  { icon: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/40',   ring: 'ring-violet-300' },
  { icon: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950/40',     ring: 'ring-amber-300' },
  { icon: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-950/40',       ring: 'ring-rose-300' },
  { icon: 'text-sky-600',    bg: 'bg-sky-50 dark:bg-sky-950/40',         ring: 'ring-sky-300' },
];

/* ═══════════════════════ component ═══════════════════════ */
export default function CreateTaskPage() {
  const navigate = useNavigate();

  /* data */
  const [duties,   setDuties]   = useState<Duty[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /* assignment mode */
  const [mode, setMode] = useState<'duty' | 'teacher'>('duty');

  /* selections */
  const [selectedDutyIds,    setSelectedDutyIds]    = useState<number[]>([]);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([]);

  /* duty search / expand */
  const [dutySearch, setDutySearch] = useState('');
  const [expandedDuty, setExpandedDuty] = useState<number | null>(null);

  /* teacher search */
  const [teacherSearch, setTeacherSearch] = useState('');

  /* form */
  const [title,        setTitle]        = useState('');
  const [instructions, setInstructions] = useState('');
  const [datetime,     setDatetime]     = useState('');

  /* ── load data ── */
  useEffect(() => {
    Promise.all([
      api.get('/duties'),
      api.get('/teachers'),
    ])
      .then(([dRes, tRes]) => {
        setDuties(
          dRes.data.map((d: any) => ({
            id: d.id,
            name: d.name,
            description: d.description || '',
            frequency: d.frequency || 'none',
            type: d.type || 'responsibility',
            teachers: d.teachers || [],
          }))
        );
        setTeachers(
          tRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            role: t.role,
            department: t.department,
          }))
        );
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  /* ── derived teacher list from duties ── */
  const teachersFromDuties = useMemo(() => {
    if (mode !== 'duty') return [];
    const seen = new Set<number>();
    const list: Teacher[] = [];
    duties
      .filter(d => selectedDutyIds.includes(d.id))
      .forEach(d =>
        d.teachers.forEach(t => {
          if (!seen.has(t.id)) { seen.add(t.id); list.push(t); }
        })
      );
    return list;
  }, [duties, selectedDutyIds, mode]);

  /* ── effective teacher IDs to send ── */
  const effectiveTeacherIds =
    mode === 'duty'
      ? teachersFromDuties.map(t => t.id)
      : selectedTeacherIds;

  /* ── duty toggle ── */
  const toggleDuty = (id: number) => {
    setSelectedDutyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /* ── teacher toggle (manual mode) ── */
  const toggleTeacher = (id: number) => {
    setSelectedTeacherIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  /* ── submit ── */
  const handleSubmit = async () => {
    if (!datetime) return toast.error('Select a date & time');

    if (mode === 'duty') {
      if (selectedDutyIds.length === 0) return toast.error('Select at least one duty');
      if (effectiveTeacherIds.length === 0) return toast.error('Selected duties have no assigned teachers');
    } else {
      if (!title.trim()) return toast.error('Enter task title');
      if (selectedTeacherIds.length === 0) return toast.error('Select at least one teacher');
    }

    const [date, time] = datetime.split('T');
    setSubmitting(true);

    try {
      let payload: Record<string, any>;

      if (mode === 'duty') {
        // Build duty_assignments: one entry per selected duty with its teacher IDs
        const dutyAssignments = duties
          .filter(d => selectedDutyIds.includes(d.id))
          .map(d => ({
            duty_id:     d.id,
            teacher_ids: d.teachers.map(t => t.id),
          }))
          .filter(a => a.teacher_ids.length > 0); // skip duties with no teachers

        payload = {
          duty_assignments:  dutyAssignments,
          custom_title:      title.trim() || undefined, // optional suffix
          scheduled_date:    date,
          scheduled_time:    time || null,
          instructions,
        };
      } else {
        payload = {
          title,
          instructions,
          scheduled_date: date,
          scheduled_time: time || null,
          teacher_ids:    selectedTeacherIds,
        };
      }

      const { data } = await api.post('/tasks', payload);
      toast.success(`${data.count ?? 1} task${(data.count ?? 1) > 1 ? 's' : ''} created!`);
      navigate('/tasks');
    } catch {
      toast.error('Failed to create tasks');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── filtered lists ── */
  const filteredDuties = duties.filter(d =>
    d.name.toLowerCase().includes(dutySearch.toLowerCase())
  );
  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  /* ─────────────────────── render ─────────────────────── */
  return (
    <AppLayout title="Create Task" showBack>
      <div className="p-4 md:p-8 max-w-[1280px] mx-auto pb-24">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shadow-sm shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Create Task</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Assign tasks to teachers individually or in bulk via duty groups.
            </p>
          </div>
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 xl:gap-8 animate-slide-up">

          {/* ════ LEFT: Form ════ */}
          <div className="space-y-5">

            {/* Task Details */}
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                    Task Details
                  </h2>

                  {/* Title */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-semibold text-foreground">
                      {mode === 'duty' ? (
                        <>Custom Title Suffix <span className="text-muted-foreground font-normal">(optional)</span></>
                      ) : (
                        <>Title <span className="text-destructive">*</span></>
                      )}
                    </label>
                    <Input
                      id="task-title"
                      placeholder={
                        mode === 'duty'
                          ? 'e.g. "Morning Session" → "Play - Morning Session"'
                          : 'e.g. Prepare CCE evaluation sheet'
                      }
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      className="h-11 rounded-xl text-base"
                    />
                    {mode === 'duty' && (
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5 mt-1">
                        <span className="shrink-0 font-bold text-primary">Auto:</span>
                        Titles will be generated as <span className="font-semibold mx-1">"{'{Duty Name}'} Report"</span>
                        {title.trim() && (
                          <span>or <span className="font-semibold">"{'{Duty Name}'} - {title.trim()}"</span></span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="space-y-2 mb-4">
                    <label className="text-sm font-semibold text-foreground">
                      Schedule Date & Time <span className="text-destructive">*</span>
                    </label>
                    <Input
                      id="task-datetime"
                      type="datetime-local"
                      value={datetime}
                      onChange={e => setDatetime(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Instructions <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea
                      id="task-instructions"
                      value={instructions}
                      onChange={e => setInstructions(e.target.value)}
                      rows={4}
                      placeholder="Add detailed instructions for the assigned teachers..."
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-shadow"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Mode Toggle */}
            <Card className="shadow-sm border-border/60">
              <CardContent className="p-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                  Assignment Mode
                </h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Duty mode */}
                  <button
                    id="mode-duty"
                    onClick={() => setMode('duty')}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all text-center ${
                      mode === 'duty'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      mode === 'duty' ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <Briefcase className={`w-5 h-5 ${mode === 'duty' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${mode === 'duty' ? 'text-primary' : 'text-foreground'}`}>
                        By Duty Group
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Auto-assign to all teachers in selected duties
                      </p>
                    </div>
                    {mode === 'duty' && (
                      <CheckCircle2 className="w-4 h-4 text-primary absolute top-3 right-3" />
                    )}
                  </button>

                  {/* Manual mode */}
                  <button
                    id="mode-teacher"
                    onClick={() => setMode('teacher')}
                    className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all text-center ${
                      mode === 'teacher'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      mode === 'teacher' ? 'bg-primary/10' : 'bg-secondary'
                    }`}>
                      <Users className={`w-5 h-5 ${mode === 'teacher' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${mode === 'teacher' ? 'text-primary' : 'text-foreground'}`}>
                        Select Teachers
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Manually pick specific teachers
                      </p>
                    </div>
                  </button>
                </div>

                {/* ── Duty Selector ── */}
                {mode === 'duty' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="duty-search"
                        placeholder="Search duties..."
                        value={dutySearch}
                        onChange={e => setDutySearch(e.target.value)}
                        className="pl-9 h-9 rounded-xl bg-muted/40 border-0 text-sm"
                      />
                    </div>

                    {loading ? (
                      <div className="space-y-2">
                        {[1,2,3].map(i => (
                          <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />
                        ))}
                      </div>
                    ) : filteredDuties.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">No duties found</p>
                    ) : (
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {filteredDuties.map((duty, idx) => {
                          const Icon  = getDutyIcon(duty.name);
                          const color = dutyColors[idx % dutyColors.length];
                          const isSelected = selectedDutyIds.includes(duty.id);
                          const isExpanded = expandedDuty === duty.id;

                          return (
                            <div
                              key={duty.id}
                              className={`rounded-2xl border-2 transition-all overflow-hidden ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/30'
                              }`}
                            >
                              {/* Duty Row */}
                              <div className="flex items-center gap-3 p-3.5">
                                {/* Select checkbox */}
                                <button
                                  id={`duty-toggle-${duty.id}`}
                                  onClick={() => toggleDuty(duty.id)}
                                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-primary border-primary'
                                      : 'border-border hover:border-primary'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
                                </button>

                                {/* Icon */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color.bg}`}>
                                  <Icon className={`w-4 h-4 ${color.icon}`} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-foreground truncate">{duty.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {duty.teachers.length === 0
                                      ? 'No teachers assigned'
                                      : `${duty.teachers.length} teacher${duty.teachers.length > 1 ? 's' : ''}`}
                                  </p>
                                </div>

                                {/* Expand teachers */}
                                {duty.teachers.length > 0 && (
                                  <button
                                    id={`duty-expand-${duty.id}`}
                                    onClick={() => setExpandedDuty(isExpanded ? null : duty.id)}
                                    className="w-7 h-7 rounded-lg hover:bg-secondary flex items-center justify-center transition-colors shrink-0"
                                  >
                                    {isExpanded
                                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                  </button>
                                )}
                              </div>

                              {/* Expanded teachers */}
                              {isExpanded && duty.teachers.length > 0 && (
                                <div className="border-t border-border/60 px-4 pb-3 pt-2 space-y-1.5 bg-muted/20">
                                  {duty.teachers.map(t => (
                                    <div key={t.id} className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                                        {initials(t.name)}
                                      </div>
                                      <span className="text-xs font-medium text-foreground">{t.name}</span>
                                      {t.department && (
                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 ml-auto">
                                          {t.department}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Manual Teacher Selector ── */}
                {mode === 'teacher' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="relative flex-1 mr-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="teacher-search"
                          placeholder="Search teachers..."
                          value={teacherSearch}
                          onChange={e => setTeacherSearch(e.target.value)}
                          className="pl-9 h-9 rounded-xl bg-muted/40 border-0 text-sm"
                        />
                      </div>
                      {selectedTeacherIds.length > 0 && (
                        <button
                          onClick={() => setSelectedTeacherIds([])}
                          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {loading ? (
                      <div className="space-y-2">
                        {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted/50 animate-pulse" />)}
                      </div>
                    ) : (
                      <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                        {filteredTeachers.map(teacher => {
                          const isSelected = selectedTeacherIds.includes(teacher.id);
                          return (
                            <button
                              key={teacher.id}
                              id={`teacher-toggle-${teacher.id}`}
                              onClick={() => toggleTeacher(teacher.id)}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-primary bg-primary/5'
                                  : 'border-transparent bg-secondary/50 hover:bg-secondary'
                              }`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                              }`}>
                                {initials(teacher.name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{teacher.name}</p>
                                {teacher.department && (
                                  <p className="text-xs text-muted-foreground">{teacher.department}</p>
                                )}
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ════ RIGHT: Summary Sidebar ════ */}
          <div className="space-y-5">

            {/* Assignment Preview */}
            <Card className="shadow-sm border-border/60 sticky top-6">
              <CardContent className="p-6">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">
                  Assignment Preview
                </h2>

                {/* Summary stats */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className={`rounded-2xl p-3.5 ${effectiveTeacherIds.length > 0 ? 'bg-primary/8' : 'bg-muted/40'}`}>
                    <p className="text-2xl font-black text-foreground leading-none mb-0.5">
                      {effectiveTeacherIds.length}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Teacher{effectiveTeacherIds.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="rounded-2xl p-3.5 bg-muted/40">
                    <p className="text-2xl font-black text-foreground leading-none mb-0.5">
                      {effectiveTeacherIds.length}
                    </p>
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Task{effectiveTeacherIds.length !== 1 ? 's' : ''} Created
                    </p>
                  </div>
                </div>

                {/* Task title preview */}
                {title && (
                  <div className="mb-4 p-3.5 rounded-xl bg-secondary/60">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Task</p>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {datetime && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(datetime).toLocaleString('en-IN', {
                          dateStyle: 'medium', timeStyle: 'short'
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Teachers list */}
                {effectiveTeacherIds.length > 0 ? (
                  <div className="space-y-2 mb-5 max-h-[220px] overflow-y-auto pr-1">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      Assigned To
                    </p>
                    {(mode === 'duty' ? teachersFromDuties : teachers.filter(t => selectedTeacherIds.includes(t.id)))
                      .map(t => (
                        <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-secondary/50">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                            {initials(t.name)}
                          </div>
                          <span className="text-xs font-medium text-foreground flex-1 truncate">{t.name}</span>
                          {mode === 'teacher' && (
                            <button
                              onClick={() => toggleTeacher(t.id)}
                              className="w-5 h-5 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                            >
                              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 mb-5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                      {mode === 'duty'
                        ? 'Select duties to see which teachers will be assigned.'
                        : 'Select teachers to assign this task.'}
                    </p>
                  </div>
                )}

                {/* Submit */}
                <Button
                  id="submit-create-task"
                  className="w-full h-11 rounded-xl font-bold text-sm"
                  onClick={handleSubmit}
                  disabled={submitting || effectiveTeacherIds.length === 0 || !title.trim() || !datetime}
                >
                  {submitting
                    ? 'Creating...'
                    : effectiveTeacherIds.length > 1
                      ? `Create ${effectiveTeacherIds.length} Tasks`
                      : 'Create Task'}
                </Button>

                {effectiveTeacherIds.length > 1 && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    One task will be created per teacher
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Selected duties summary (duty mode) */}
            {mode === 'duty' && selectedDutyIds.length > 0 && (
              <Card className="shadow-sm border-border/60">
                <CardContent className="p-5">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">
                    Selected Duties ({selectedDutyIds.length})
                  </h3>
                  <div className="space-y-2">
                    {duties.filter(d => selectedDutyIds.includes(d.id)).map((d, idx) => {
                      const Icon  = getDutyIcon(d.name);
                      const color = dutyColors[idx % dutyColors.length];
                      return (
                        <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/40">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${color.bg}`}>
                            <Icon className={`w-3.5 h-3.5 ${color.icon}`} />
                          </div>
                          <span className="text-xs font-semibold text-foreground flex-1 truncate">{d.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {d.teachers.length} teacher{d.teachers.length !== 1 ? 's' : ''}
                          </span>
                          <button
                            onClick={() => toggleDuty(d.id)}
                            className="w-5 h-5 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors shrink-0"
                          >
                            <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
