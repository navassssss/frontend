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
  active:    { label: 'Active',     bg: 'bg-rose-50/80 text-rose-700',     dot: 'bg-rose-500',     icon: Thermometer },
  recovered: { label: 'Recovered',  bg: 'bg-teal-50/80 text-teal-700', dot: 'bg-teal-500', icon: CheckCircle2 },
  sent_home: { label: 'Sent Home',  bg: 'bg-slate-100 text-slate-700',     dot: 'bg-slate-500',     icon: Home },
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
      <div className="p-4 md:p-10 max-w-[1280px] mx-auto pb-28 space-y-10">

        {/* ── Page Header (Editorial Style) ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-900/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              </div>
              <p className="text-sm font-semibold tracking-wider text-teal-700 uppercase dark:text-teal-400">
                Institutional Health
              </p>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-slate-900 dark:text-white tracking-tight">
              Medical Records
            </h1>
            <p className="text-base text-slate-500 mt-2 font-medium">
              Monitoring well-being — {active.length} active case{active.length !== 1 ? 's' : ''} currently under observation.
            </p>
          </div>
          <Button
            id="btn-add-medical"
            onClick={() => setShowForm(true)}
            className="h-12 px-6 rounded-full gap-2 bg-gradient-to-tr from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white shrink-0 shadow-md shadow-teal-900/10 border-0 transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Log New Record
          </Button>
        </div>

        {/* ── Stat Cards (Tonal Elevation, No Borders) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {[
            { label: 'Active Under Observation',    value: active.length,                                       color: 'text-slate-900',  bg: 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]', desc: 'Students currently resting' },
            { label: 'Recovered & Cleared',  value: history.filter(h => h.status === 'recovered').length, color: 'text-teal-800', bg: 'bg-teal-50/60 shadow-sm text-teal-900', desc: 'Resolved cases' },
            { label: 'Sent Home', value: history.filter(h => h.status === 'sent_home').length, color: 'text-slate-700',    bg: 'bg-slate-50 shadow-sm text-slate-800', desc: 'Require external care' },
          ].map((s, idx) => (
            <div key={idx} className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between ${s.bg}`}>
              <p className="text-sm font-semibold uppercase tracking-wider opacity-80">{s.label}</p>
              <div className="mt-8">
                <p className={`text-6xl font-serif tracking-tighter ${s.color}`}>{s.value}</p>
                <p className="text-sm font-medium mt-1 opacity-70">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Content Area ── */}
        <div className="bg-white rounded-[2rem] shadow-[0_12px_40px_rgb(0,0,0,0.04)] p-2 md:p-4 overflow-hidden">
          
          {/* ── Tab Toggle ── */}
          <div className="flex gap-2 p-3 bg-slate-50/80 rounded-2xl w-fit animate-slide-up mb-6">
            {(['active', 'history'] as const).map(t => (
              <button
                key={t}
                id={`tab-${t}`}
                onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all ${
                  tab === t 
                    ? 'bg-white shadow-sm text-slate-900 scale-100' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95'
                }`}
              >
                {t === 'active' ? <Heart className="w-4 h-4" /> : <History className="w-4 h-4" />}
                {t === 'active' ? 'Active Cases' : 'Historical Data'}
              </button>
            ))}
          </div>

          <div className="px-2 md:px-6 pb-6">
            {/* ════════════ ACTIVE TAB ════════════ */}
            {tab === 'active' && (
              <div className="animate-slide-up">
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-32 rounded-3xl bg-slate-100 animate-pulse" />)}
                  </div>
                ) : active.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif text-slate-900">All clear</h3>
                      <p className="text-slate-500 mt-2 font-medium">There are no active medical cases at this time.</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <div className="space-y-6 animate-slide-up">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="history-search"
                    placeholder="Search past records by student or illness..."
                    value={histSearch}
                    onChange={e => setHistSearch(e.target.value)}
                    className="pl-11 h-12 bg-slate-50 border-0 rounded-2xl focus-visible:ring-teal-600/20"
                  />
                </div>

                {history.length === 0 ? (
                  <div className="py-20 text-center text-slate-500">
                    <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-medium text-lg">No resolved cases found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {history.map((rec) => {
                      const cfg = statusCfg[rec.status];
                      return (
                        <div key={rec.id} className="flex flex-col sm:flex-row sm:items-center gap-4 py-6 hover:bg-slate-50/50 transition-colors -mx-4 px-4 rounded-2xl">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 shrink-0">
                              {initials(rec.student?.name || '?')}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-base font-bold text-slate-900 truncate tracking-tight">{rec.student?.name}</p>
                              <p className="text-sm font-medium text-slate-500 truncate mt-0.5">
                                {rec.illness_name} <span className="opacity-50 mx-1">·</span> {rec.student?.class} <span className="opacity-50 mx-1">·</span> {fmtDate(rec.reported_at)}
                              </p>
                            </div>
                          </div>
                          {/* Badge */}
                          <span className={`text-xs font-bold px-4 py-1.5 rounded-full shrink-0 w-fit ${cfg.bg}`}>
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
        </div>
      </div>

      {/* ════════════ ADD RECORD MODAL (Glassmorphism Overlay) ════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-[2rem] shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-8 py-6 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-teal-700" />
                </div>
                <h2 className="text-xl font-serif text-slate-900">Log Medical Incident</h2>
              </div>
              <button
                onClick={resetForm}
                className="w-10 h-10 rounded-full hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">

              {/* Student selector */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                  Patient <span className="text-rose-500">*</span>
                </label>
                {selectedStudent ? (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-teal-50 border border-teal-100">
                    <div className="w-10 h-10 rounded-full bg-teal-200/50 flex items-center justify-center text-sm font-bold text-teal-800 shrink-0">
                      {initials(selectedStudent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-teal-900">{selectedStudent.name}</p>
                      <p className="text-sm text-teal-700/70 font-medium">
                        {selectedStudent.class_room?.name} · #{selectedStudent.roll_number || selectedStudent.username}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                      className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center shrink-0 transition-colors"
                    >
                      <X className="w-4 h-4 text-teal-800" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="student-search-medical"
                        placeholder="Search roster by name or ID..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-11 h-12 bg-slate-50 border-0 rounded-2xl focus-visible:ring-teal-600/20"
                      />
                    </div>
                    {studentSearch && (
                      <div className="max-h-52 overflow-y-auto rounded-2xl border border-slate-100 bg-white shadow-lg p-2 mt-2">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-6 font-medium">No results found</p>
                        ) : filteredStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-sm font-bold shrink-0">
                              {initials(s.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{s.name}</p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{s.class_room?.name} · #{s.roll_number}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Illness name */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                  Primary Complaint <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="illness-name"
                  placeholder="e.g. Migraine, Fever, High Temperature..."
                  value={illnessName}
                  onChange={e => setIllnessName(e.target.value)}
                  className="h-12 bg-slate-50 border-0 rounded-2xl focus-visible:ring-teal-600/20"
                />
              </div>

              {/* Date & Time */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                  Time of Record <span className="text-rose-500">*</span>
                </label>
                <Input
                  id="reported-at"
                  type="datetime-local"
                  value={reportedAt}
                  onChange={e => setReportedAt(e.target.value)}
                  className="h-12 bg-slate-50 border-0 rounded-2xl focus-visible:ring-teal-600/20"
                />
              </div>

              {/* Doctor toggle */}
              <div className="pt-2">
                <button
                  id="toggle-doctor"
                  onClick={() => setWentToDoctor(v => !v)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all ${
                    wentToDoctor ? 'bg-teal-50' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-base font-bold flex items-center gap-3 ${wentToDoctor ? 'text-teal-900' : 'text-slate-700'}`}>
                    <Stethoscope className={`w-5 h-5 ${wentToDoctor ? 'text-teal-600' : 'text-slate-400'}`} />
                    Requires Physician Evaluation
                  </span>
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                    wentToDoctor ? 'bg-teal-600' : 'bg-white border-2 border-slate-200'
                  }`}>
                    {wentToDoctor && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </button>
              </div>

              {/* Notes */}
              <div className="space-y-3 pt-2">
                <label className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                  Clinical Notes <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <textarea
                  id="medical-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Record symptoms, medication administered, or guardian communications..."
                  className="w-full px-4 py-4 rounded-2xl border-0 bg-slate-50 text-slate-900 resize-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-600/20"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-6 bg-slate-50/50 flex gap-4">
              <Button variant="ghost" className="flex-1 h-12 rounded-full font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200/50" onClick={resetForm}>
                Dismiss
              </Button>
              <Button
                id="submit-medical"
                className="flex-1 h-12 rounded-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-bold tracking-wide shadow-lg shadow-teal-900/10 border-0"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Committing...' : 'Save Record'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ─────────────────────── ActiveCard (Editorial Style) ─────────────────────── */
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
    <div
      className="bg-slate-50/50 rounded-3xl p-6 hover:bg-slate-50 transition-colors animate-slide-up group flex flex-col"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start gap-5">
        {/* Avatar */}
        <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center text-base font-black text-rose-800 shrink-0">
          {initials(record.student?.name || '?')}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-bold text-slate-900 text-lg leading-tight tracking-tight">{record.student?.name}</p>
              <p className="text-sm font-medium text-slate-500 mt-0.5">
                {record.student?.class}
                {record.student?.roll_number && <span className="opacity-50 mx-1.5">·</span>}
                {record.student?.roll_number && `#${record.student.roll_number}`}
              </p>
            </div>
            {record.went_to_doctor && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800 shrink-0">
                Dr. Consult
              </span>
            )}
          </div>

          {/* Illness + time */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="flex items-center gap-2 font-bold text-slate-800 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100 w-fit">
              <Thermometer className="w-4 h-4 text-rose-500" />
              {record.illness_name}
            </span>
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {relativeTime(record.reported_at)} <span className="opacity-50">·</span> {fmtTime(record.reported_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes Area if any */}
      {record.notes && (
        <div className="mt-5 bg-white/60 p-4 rounded-xl border border-slate-100">
          <p className="text-sm font-medium text-slate-600 italic">"{record.notes}"</p>
        </div>
      )}

      {/* Footer Area with Actions */}
      <div className="mt-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
         {/* Reporter */}
        <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 w-full sm:w-auto">
          {record.reported_by && (
            <>
              <User className="w-3.5 h-3.5" />
              Logged by {record.reported_by.name}
            </>
          )}
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            id={`sent-home-${record.id}`}
            size="sm"
            disabled={loading}
            onClick={onSentHome}
            variant="ghost"
            className="h-10 px-4 rounded-full gap-2 text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 flex-1 sm:flex-none"
          >
            <Home className="w-4 h-4" />
            Send Home
          </Button>
          <Button
            id={`recover-${record.id}`}
            size="sm"
            disabled={loading}
            onClick={onRecover}
            className="h-10 px-4 rounded-full gap-2 text-sm font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 hover:text-teal-800 border-0 flex-1 sm:flex-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
