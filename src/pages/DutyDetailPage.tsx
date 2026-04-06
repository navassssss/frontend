import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Calendar, Users, Clock, FileText, RotateCcw,
  Briefcase, ChevronRight, Mail, Plus, X, CheckCircle2, History
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Duty {
  id: number;
  name: string;
  description: string;
  type: string;
  frequency: string;
  teachers: { id: number; name: string; role?: string; department?: string }[];
}

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

const freqColor: Record<string, string> = {
  daily:     'bg-emerald-100 text-emerald-700',
  weekly:    'bg-blue-100 text-blue-700',
  monthly:   'bg-amber-100 text-amber-700',
  quarterly: 'bg-violet-100 text-violet-700',
  yearly:    'bg-rose-100 text-rose-700',
  none:      'bg-muted text-muted-foreground',
};

export default function DutyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  const [duty, setDuty] = useState<Duty | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([
      api.get(`/duties/${id}`),
      api.get(`/reports?duty_id=${id}`).catch(() => ({ data: [] })),
    ]).then(([dutyRes, reportsRes]) => {
      setDuty(dutyRes.data);
      setReports(Array.isArray(reportsRes.data) ? reportsRes.data.slice(0, 3) : []);
    }).catch(() => {
      toast.error('Failed to load duty details');
      navigate('/duties');
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!showTeacherSelector || !duty) return;
    setSelectedTeachers(duty.teachers.map(t => t.id));
    api.get('/teachers').then(res => setTeacherList(res.data)).catch(() => toast.error('Failed to load teachers'));
  }, [showTeacherSelector, duty]);

  const handleAssignTeachers = () => {
    api.post(`/duties/${id}/assign-teachers`, { teacher_ids: selectedTeachers })
      .then(() => {
        toast.success('Teachers assigned successfully');
        api.get(`/duties/${id}`).then(res => setDuty(res.data));
        setShowTeacherSelector(false);
      })
      .catch(() => toast.error('Failed to assign teachers'));
  };

  const handleRemoveTeacher = (teacherId: number) => {
    api.post(`/duties/${id}/remove-teacher`, { teacher_id: teacherId })
      .then(() => {
        setDuty(prev => prev ? { ...prev, teachers: prev.teachers.filter(t => t.id !== teacherId) } : prev);
        toast.success('Teacher removed');
      })
      .catch(() => toast.error('Failed to remove teacher'));
  };

  if (loading) return (
    <AppLayout title="Duty Details">
      <div className="p-6 text-center text-muted-foreground">Loading...</div>
    </AppLayout>
  );

  if (!duty) return null;

  const freqKey = duty.frequency?.toLowerCase() || 'none';
  const freqClass = freqColor[freqKey] || freqColor.none;

  return (
    <AppLayout title="Duty Details">
      <div className="p-4 md:p-6 max-w-5xl mx-auto pb-28 space-y-6">

        {/* ── Breadcrumb + Back ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate('/duties')} className="hover:text-primary transition-colors">Duty Schedule</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Duty Details</span>
          </div>
          <button
            onClick={() => navigate('/duties')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Duties
          </button>
        </div>

        {/* ── Hero Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {toTitleCase(duty.type || 'Responsibility')}
              </span>
            </div>
            <h1 className="text-3xl font-black text-foreground tracking-tight leading-tight">{toTitleCase(duty.name)}</h1>
            {duty.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{duty.description}</p>
            )}
          </div>
          <Button
            onClick={() => navigate(`/reports/new?dutyId=${duty.id}`)}
            className="shrink-0 h-11 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
          >
            <FileText className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>

        {/* ── Main 2-Column Layout ── */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">

          {/* Left: Meta Info */}
          <div className="space-y-4">

            {/* Frequency */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Frequency</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-black text-foreground text-base leading-none">{toTitleCase(duty.frequency || 'Not Set')}</p>
                  <span className={`text-[10px] font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${freqClass}`}>
                    {toTitleCase(freqKey)}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Count */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Assigned Staff</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-black text-foreground text-3xl leading-none">{duty.teachers.length}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {duty.teachers.length === 1 ? 'Member' : 'Members'}
                  </p>
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-3">Duty Type</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                  {duty.type === 'rotational'
                    ? <RotateCcw className="w-4 h-4 text-violet-600" />
                    : <Briefcase className="w-4 h-4 text-violet-600" />}
                </div>
                <p className="font-bold text-foreground text-sm">{toTitleCase(duty.type || 'Responsibility')}</p>
              </div>
            </div>
          </div>

          {/* Right: Assigned Members */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="font-bold text-foreground text-base">Assigned Members</h2>
                <p className="text-xs text-muted-foreground">Authorized staff for this duty cycle</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                  {duty.teachers.length} Active
                </span>
                {isPrincipal && (
                  <button
                    onClick={() => setShowTeacherSelector(true)}
                    className="w-7 h-7 rounded-full bg-primary flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm"
                    title="Add teachers"
                  >
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                )}
              </div>
            </div>

            {/* Teacher List */}
            <div className="divide-y divide-border">
              {duty.teachers.length === 0 ? (
                <div className="px-5 py-10 text-center text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No staff assigned yet</p>
                </div>
              ) : duty.teachers.map((teacher, i) => (
                <div key={teacher.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-primary/10 border-2 border-background shadow-sm flex items-center justify-center shrink-0">
                      <span className="text-xs font-black text-primary">
                        {teacher.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-bold text-sm text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                        onClick={() => navigate(`/teachers/${teacher.id}`)}
                      >
                        {toTitleCase(teacher.name)}
                      </p>
                      <p className="text-xs text-muted-foreground">{teacher.department || teacher.role || 'Teacher'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                      <p className="text-xs font-semibold text-emerald-600">Active</p>
                    </div>
                    {isPrincipal && (
                      <button
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="w-7 h-7 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors text-muted-foreground hover:text-destructive"
                        title="Remove from duty"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            {duty.teachers.length > 0 && (
              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={() => navigate('/teachers')}
                  className="text-xs font-bold text-primary hover:underline uppercase tracking-wider"
                >
                  View All Staff →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Duty History (Recent Reports) ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <History className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-bold text-foreground text-base">Duty History</h2>
              </div>
              <p className="text-xs text-muted-foreground">Review previous oversight logs and submitted reports.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-xl text-xs"
              onClick={() => navigate('/reports')}
            >
              Explore Archives
            </Button>
          </div>

          {reports.length === 0 ? (
            <div className="px-5 py-10 text-center text-muted-foreground">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No reports submitted for this duty yet.</p>
              <button
                onClick={() => navigate(`/reports/new?dutyId=${duty.id}`)}
                className="text-xs text-primary font-semibold mt-2 hover:underline"
              >
                Submit the first report →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
              {reports.map((report) => {
                // Strip auto-generated "Report: " prefix if present
                const rawTitle = report.task?.title || `Report #${report.id}`;
                const title = rawTitle.startsWith('Report: ') ? rawTitle.slice(8) : rawTitle;
                const status = report.status || 'submitted';
                const statusStyle =
                  status === 'approved'  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  status === 'rejected'  ? 'bg-red-50 text-red-700 border-red-200' :
                  status === 'submitted' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-muted text-muted-foreground border-border';
                const statusLabel =
                  status === 'submitted' ? 'Submitted' :
                  status === 'approved'  ? 'Approved' :
                  status === 'rejected'  ? 'Rejected' : toTitleCase(status);

                return (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="px-5 py-4 hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Recent'}
                      </p>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="font-bold text-sm text-foreground leading-snug">{title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {report.description || 'Report submission completed.'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Teacher Selector Modal ── */}
      {showTeacherSelector && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Select Teachers</h3>
              <button onClick={() => setShowTeacherSelector(false)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-border">
              {teacherList.map((teacher) => {
                const isSelected = selectedTeachers.includes(teacher.id);
                return (
                  <button
                    key={teacher.id}
                    onClick={() => setSelectedTeachers(prev =>
                      prev.includes(teacher.id) ? prev.filter(id => id !== teacher.id) : [...prev, teacher.id]
                    )}
                    className={`w-full px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {teacher.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-foreground">{toTitleCase(teacher.name)}</p>
                        <p className="text-xs text-muted-foreground capitalize">{teacher.role}</p>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-5 py-4 border-t border-border flex gap-2">
              <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowTeacherSelector(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl" onClick={handleAssignTeachers} disabled={selectedTeachers.length === 0}>
                Assign {selectedTeachers.length} Teachers
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
