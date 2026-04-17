import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Heart, Home, CheckCircle2, Clock, RefreshCw,
  ChevronRight, Stethoscope, History, AlertTriangle, X, User,
  Calendar, FileText, Thermometer,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

/* ─────────────────────── types ─────────────────────── */
interface MedicalRecord {
  id: number;
  illness_name: string;
  reported_at: string;
  went_to_doctor: boolean;
  notes?: string;
  status: 'active' | 'recovered' | 'sent_home';
  recovered_at?: string;
  sent_home_at?: string;
  reported_by?: { id: number; name: string };
  recovered_by?: { id: number; name: string };
  sent_home_by?: { id: number; name: string };
  student?: {
    id: number;
    name: string;
    roll_number?: string;
    class?: string;
  };
}

interface Student {
  id: number;
  name: string;
  roll_number?: string;
  class_room?: { name: string };
  username?: string;
}

/* ─────────────────────── helpers ─────────────────────── */
const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const relativeTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins < 2)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24)return `${hours}h ago`;
  return `${days}d ago`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ─────────────────────── status config ─────────────────────── */
const statusCfg = {
  active:    { label: 'Active',     bg: 'bg-rose-100 text-rose-700 border border-rose-200',     dot: 'bg-rose-500',     icon: Thermometer },
  recovered: { label: 'Recovered',  bg: 'bg-emerald-100 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
  sent_home: { label: 'Sent Home',  bg: 'bg-blue-100 text-blue-700 border border-blue-200',     dot: 'bg-blue-500',     icon: Home },
};

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */
export default function MedicalPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canAccess = user?.role === 'principal' || user?.role === 'manager' ||
    (user as any)?.permissions?.some((p: any) => p.name === 'manage_medical');

  /* data */
  const [active,   setActive]   = useState<MedicalRecord[]>([]);
  const [history,  setHistory]  = useState<MedicalRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<'active' | 'history'>('active');

  /* add form */
  const [showForm,      setShowForm]      = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [illnessName,   setIllnessName]   = useState('');
  const [reportedAt,    setReportedAt]    = useState(() => new Date().toISOString().slice(0, 16));
  const [wentToDoctor,  setWentToDoctor]  = useState(false);
  const [notes,         setNotes]         = useState('');

  /* history search */
  const [histSearch, setHistSearch] = useState('');

  /* action loading */
  const [actionId, setActionId] = useState<number | null>(null);

  /* ── Load data ── */
  const loadActive = useCallback(() =>
    api.get('/medical/active').then(r => setActive(r.data)), []);

  const loadHistory = useCallback(() =>
    api.get('/medical/history', { params: { search: histSearch || undefined } })
       .then(r => setHistory(Array.isArray(r.data) ? r.data : (r.data?.data ?? []))), [histSearch]);

  useEffect(() => {
    if (!canAccess) return;
    Promise.all([
      loadActive(),
      api.get('/students', { params: { per_page: 200 } }).then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
        setStudents(list.map((s: any) => ({
          id: s.id,
          name: s.name || s.user?.name || 'Unknown',
          roll_number: s.roll_number || s.username,
          class_room: s.class_room,
        })));
      }),
    ])
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [canAccess]);

  useEffect(() => {
    if (tab === 'history' && canAccess) loadHistory();
  }, [tab, histSearch, canAccess]);

  /* ── Submit new record ── */
  const handleSubmit = async () => {
    if (!selectedStudent) return toast.error('Select a student');
    if (!illnessName.trim()) return toast.error('Enter illness name');
    if (!reportedAt) return toast.error('Enter date & time');

    setSubmitting(true);
    try {
      const { data } = await api.post('/medical', {
        student_id:     selectedStudent.id,
        illness_name:   illnessName.trim(),
        reported_at:    reportedAt,
        went_to_doctor: wentToDoctor,
        notes:          notes.trim() || undefined,
      });
      setActive(prev => [data, ...prev]);
      toast.success('Medical record added');
      resetForm();
    } catch {
      toast.error('Failed to add record');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setSelectedStudent(null);
    setStudentSearch('');
    setIllnessName('');
    setWentToDoctor(false);
    setNotes('');
    setReportedAt(new Date().toISOString().slice(0, 16));
  };

  /* ── Mark recovered ── */
  const handleRecover = async (id: number) => {
    if (!window.confirm('Mark this student as recovered?')) return;
    setActionId(id);
    try {
      await api.post(`/medical/${id}/recover`);
      setActive(prev => prev.filter(r => r.id !== id));
      toast.success('Marked as recovered');
    } catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  /* ── Mark sent home ── */
  const handleSentHome = async (id: number) => {
    if (!window.confirm('Mark this student as sent home?')) return;
    setActionId(id);
    try {
      await api.post(`/medical/${id}/sent-home`);
      setActive(prev => prev.filter(r => r.id !== id));
      toast.success('Marked as sent home');
    } catch { toast.error('Failed'); } finally { setActionId(null); }
  };

  /* ── Student search ── */
  const filteredStudents = students.filter(s =>
    (s.name + ' ' + (s.roll_number || '')).toLowerCase().includes(studentSearch.toLowerCase())
  ).slice(0, 8);

  /* ── Access guard ── */
  if (!canAccess) {
    return (
      <AppLayout title="Medical">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">You don't have permission to access Medical Records.</p>
        </div>
      </AppLayout>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <AppLayout title="Medical">
      <div className="p-4 md:p-8 max-w-[1280px] mx-auto pb-28 space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-rose-500" />
              Medical Records
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track student health — {active.length} active case{active.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button
            id="btn-add-medical"
            onClick={() => setShowForm(true)}
            className="h-10 rounded-xl gap-2 bg-rose-600 hover:bg-rose-700 text-white shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Record
          </Button>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          {[
            { label: 'Active',    value: active.length,                                       color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-950/30' },
            { label: 'Recovery',  value: history.filter(h => h.status === 'recovered').length, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
            { label: 'Sent Home', value: history.filter(h => h.status === 'sent_home').length, color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-950/30' },
          ].map(s => (
            <Card key={s.label} className={`border-0 shadow-sm ${s.bg}`}>
              <CardContent className="p-4">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Tab Toggle ── */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 w-fit animate-slide-up">
          {(['active', 'history'] as const).map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-sm font-semibold transition-all ${
                tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'active' ? <Heart className="w-3.5 h-3.5" /> : <History className="w-3.5 h-3.5" />}
              {t === 'active' ? 'Active Cases' : 'History'}
            </button>
          ))}
        </div>

        {/* ════════════ ACTIVE TAB ════════════ */}
        {tab === 'active' && (
          <div className="animate-slide-up">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />)}
              </div>
            ) : active.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground">All clear!</p>
                    <p className="text-sm text-muted-foreground mt-0.5">No active medical cases right now.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {active.map((rec, idx) => (
                  <ActiveCard
                    key={rec.id}
                    record={rec}
                    loading={actionId === rec.id}
                    onRecover={() => handleRecover(rec.id)}
                    onSentHome={() => handleSentHome(rec.id)}
                    delay={idx * 0.04}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ HISTORY TAB ════════════ */}
        {tab === 'history' && (
          <div className="space-y-4 animate-slide-up">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="history-search"
                placeholder="Search by student or illness..."
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {history.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-muted-foreground">
                  <History className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No resolved cases yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden divide-y divide-border">
                {history.map((rec) => {
                  const cfg = statusCfg[rec.status];
                  return (
                    <div key={rec.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {initials(rec.student?.name || '?')}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{rec.student?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {rec.illness_name} · {rec.student?.class} · {fmtDate(rec.reported_at)}
                        </p>
                      </div>
                      {/* Badge */}
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 ${cfg.bg}`}>
                        {cfg.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════ ADD RECORD MODAL ════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-foreground">New Medical Record</h2>
              </div>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* Student selector */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Student <span className="text-rose-500">*</span>
                </label>
                {selectedStudent ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border-2 border-primary">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {initials(selectedStudent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{selectedStudent.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedStudent.class_room?.name} · #{selectedStudent.roll_number || selectedStudent.username}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                      className="w-6 h-6 rounded-full hover:bg-secondary flex items-center justify-center shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="student-search-medical"
                        placeholder="Search by name or roll no..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-9 rounded-xl"
                      />
                    </div>
                    {studentSearch && (
                      <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-card shadow-sm">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
                        ) : filteredStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                              {initials(s.name)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.class_room?.name} · #{s.roll_number}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Illness name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Illness / Complaint <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="illness-name"
                  placeholder="e.g. Fever, Headache, Stomach ache..."
                  value={illnessName}
                  onChange={e => setIllnessName(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Reported At <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="reported-at"
                  type="datetime-local"
                  value={reportedAt}
                  onChange={e => setReportedAt(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              {/* Doctor toggle */}
              <div>
                <button
                  id="toggle-doctor"
                  onClick={() => setWentToDoctor(v => !v)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    wentToDoctor ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-primary" />
                    Student visited the doctor
                  </span>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    wentToDoctor ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {wentToDoctor && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                </button>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">
                  Notes <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  id="medical-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Any additional observations, medication given, etc..."
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                id="submit-medical"
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Add Record'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

/* ─────────────────────── ActiveCard ─────────────────────── */
function ActiveCard({
  record, loading, onRecover, onSentHome, delay
}: {
  record: MedicalRecord;
  loading: boolean;
  onRecover: () => void;
  onSentHome: () => void;
  delay: number;
}) {
  return (
    <Card
      className="shadow-sm hover:shadow-md transition-all animate-slide-up border-l-4 border-l-rose-400"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-sm font-bold text-rose-700 shrink-0">
            {initials(record.student?.name || '?')}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold text-foreground text-base leading-tight">{record.student?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {record.student?.class}
                  {record.student?.roll_number && ` · #${record.student.roll_number}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {record.went_to_doctor && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                    Doctor Visit
                  </span>
                )}
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse inline-block" />
                  Active
                </span>
              </div>
            </div>

            {/* Illness + time */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Thermometer className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                {record.illness_name}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {relativeTime(record.reported_at)} · {fmtTime(record.reported_at)}
              </span>
            </div>

            {/* Notes */}
            {record.notes && (
              <p className="mt-1.5 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-1.5 line-clamp-2">
                {record.notes}
              </p>
            )}

            {/* Reporter */}
            {record.reported_by && (
              <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1">
                <User className="w-3 h-3" />
                Reported by {record.reported_by.name}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <Button
                id={`recover-${record.id}`}
                size="sm"
                disabled={loading}
                onClick={onRecover}
                className="h-8 rounded-lg gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recovered
              </Button>
              <Button
                id={`sent-home-${record.id}`}
                size="sm"
                disabled={loading}
                onClick={onSentHome}
                variant="outline"
                className="h-8 rounded-lg gap-1.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
              >
                <Home className="w-3.5 h-3.5" />
                Sent Home
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
