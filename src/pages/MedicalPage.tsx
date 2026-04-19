import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Heart, Home, CheckCircle2, Clock, RefreshCw,
  ChevronRight, Stethoscope, History, AlertTriangle, X, User,
  Calendar, FileText, Thermometer, Filter, Shield, Briefcase
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
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24)return `${hours} hours ago`;
  return `${days} days ago`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/* ─────────────────────── status config ─────────────────────── */
const statusCfg = {
  active:    { label: 'Active',     dot: 'bg-rose-500' },
  recovered: { label: 'Recovered',  dot: 'bg-[#00865B]' },
  sent_home: { label: 'Sent Home',  dot: 'bg-blue-500' },
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
          <h2 className="text-lg font-bold text-slate-800 mb-2">Access Restricted</h2>
          <p className="text-sm text-slate-500">You don't have permission to access Medical Records.</p>
        </div>
      </AppLayout>
    );
  }

  /* ─────────────────────── render ─────────────────────── */
  return (
    <AppLayout title="Medical">
      <div className="p-4 md:p-10 max-w-[1280px] mx-auto pb-28 space-y-8 bg-slate-50/30 min-h-screen">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Medical Records
            </h1>
            <p className="text-base text-slate-600 mt-2 font-medium">
              Track student health — active cases
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-2xl border-0 bg-white shadow-sm text-slate-600 hover:bg-slate-100"
            >
              <Filter className="w-5 h-5" />
            </Button>
            <Button
              id="btn-add-medical"
              onClick={() => setShowForm(true)}
              className="h-12 px-6 rounded-2xl gap-2 bg-[#00865B] hover:bg-[#00704c] text-white shadow-md border-0 transition-all font-semibold"
            >
              <Plus className="w-5 h-5" /> Add Record
            </Button>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
          {/* Active Card */}
          <div className="rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 bg-rose-100/80 w-full relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="bg-rose-200/60 rounded-2xl p-4 shrink-0 text-rose-700">
              <Briefcase className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-5xl font-black text-rose-800 tracking-tight">{active.length.toString().padStart(2, '0')}</span>
              <span className="text-sm font-bold uppercase tracking-widest text-rose-600 mt-1">Active</span>
            </div>
          </div>

          {/* Recovered Card */}
          <div className="rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 bg-emerald-100 w-full relative overflow-hidden transition-all hover:-translate-y-1">
            <div className="bg-emerald-200/70 rounded-2xl p-4 shrink-0 text-[#00865B]">
              <Shield className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-5xl font-black text-emerald-900 tracking-tight">{(history.filter(h => h.status === 'recovered').length).toString().padStart(2, '0')}</span>
              <span className="text-sm font-bold uppercase tracking-widest text-[#00865B] mt-1">Recovered</span>
            </div>
          </div>

          {/* Sent Home Card */}
          <div className="rounded-[2rem] p-6 lg:p-8 flex items-center gap-6 bg-[#ebf3ff] w-full relative overflow-hidden transition-all hover:-translate-y-1">
             <div className="bg-[#d1e4fb] rounded-2xl p-4 shrink-0 text-blue-600">
              <Home className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-5xl font-black text-blue-900 tracking-tight">{(history.filter(h => h.status === 'sent_home').length).toString().padStart(2, '0')}</span>
              <span className="text-sm font-bold uppercase tracking-widest text-blue-600 mt-1">Sent Home</span>
            </div>
          </div>
        </div>

        {/* ── Tab Toggle ── */}
        <div className="flex gap-1 p-1.5 bg-slate-100 rounded-full w-fit animate-slide-up mb-2">
          {(['active', 'history'] as const).map(t => (
            <button
              key={t}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={`flex items-center px-6 py-2.5 rounded-full text-base font-bold transition-all ${
                tab === t 
                  ? 'bg-white shadow-sm text-[#00865B]' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'active' ? 'Active Cases' : 'History'}
            </button>
          ))}
        </div>

        {/* ════════════ ACTIVE TAB ════════════ */}
        {tab === 'active' && (
          <div className="animate-slide-up space-y-4">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-28 rounded-3xl bg-slate-200/50 animate-pulse" />)}
              </div>
            ) : active.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-center gap-4 bg-white rounded-[2rem] shadow-sm">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Clear queue</h3>
                  <p className="text-slate-500 mt-2 font-medium">There are no active medical cases.</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
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
                
                <div className="pt-8 pb-4 text-center">
                  <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                    End of current medical queue
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════ HISTORY TAB ════════════ */}
        {tab === 'history' && (
          <div className="animate-slide-up space-y-6">
            <div className="relative max-w-xl">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="history-search"
                placeholder="Search past records..."
                value={histSearch}
                onChange={e => setHistSearch(e.target.value)}
                className="pl-14 h-14 bg-white border-0 rounded-2xl shadow-sm text-base font-medium focus-visible:ring-[#00865B]/20"
              />
            </div>

            {history.length === 0 ? (
              <div className="py-20 text-center text-slate-500 bg-white rounded-[2rem] shadow-sm">
                <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg text-slate-400">No resolved cases found.</p>
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {history.map((rec, idx) => (
                  <div 
                    key={rec.id} 
                    className="flex flex-col lg:flex-row lg:items-center gap-6 p-5 lg:p-6 bg-white rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-5 w-full lg:w-[35%] shrink-0">
                      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-700 shrink-0">
                        {initials(rec.student?.name || '?')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-slate-900 truncate">{rec.student?.name}</p>
                        <p className="text-sm font-medium text-slate-500 mt-1">
                          {rec.student?.class} <span className="opacity-50 mx-1">•</span> ID #{rec.student?.roll_number || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 bg">
                       <div className="flex flex-wrap items-center gap-3">
                          <p className="text-base font-bold text-slate-900">{rec.illness_name}</p>
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                            rec.status === 'recovered' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {rec.status === 'recovered' ? 'Recovered' : 'Sent Home'}
                          </span>
                       </div>
                       <div className="mt-3 flex items-start gap-4 text-[13px] font-semibold text-slate-400">
                          <span className="flex flex-col gap-1">
                            <span><Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />{fmtDate(rec.reported_at)}</span>
                            <span className="ml-5">{fmtTime(rec.recovered_at || rec.sent_home_at || rec.reported_at)}</span>
                          </span>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════ ADD RECORD MODAL ════════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-3xl shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">New Medical Record</h2>
              <button
                onClick={resetForm}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Student</label>
                {selectedStudent ? (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#ebf3ff]/50 border border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-sm font-bold text-blue-700 shrink-0 shadow-sm">
                      {initials(selectedStudent.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900">{selectedStudent.name}</p>
                      <p className="text-sm font-medium text-slate-500">
                        {selectedStudent.class_room?.name} · ID #{selectedStudent.roll_number || selectedStudent.username}
                      </p>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(null); setStudentSearch(''); }}
                      className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center shrink-0 transition-colors shadow-sm bg-blue-50/50"
                    >
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="student-search-medical"
                        placeholder="Search student names..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="pl-12 h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-[#00865B]/20 font-medium"
                      />
                    </div>
                    {studentSearch && (
                      <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg p-2 mt-2">
                        {filteredStudents.length === 0 ? (
                          <p className="text-sm text-slate-500 text-center py-6 font-medium">No students found</p>
                        ) : filteredStudents.map(s => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedStudent(s); setStudentSearch(''); }}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                              {initials(s.name)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{s.name}</p>
                              <p className="text-xs font-medium text-slate-500">{s.class_room?.name} · #{s.roll_number}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Illness / Condition</label>
                <Input
                  id="illness-name"
                  placeholder="e.g. Seasonal Flu, Sprained Ankle"
                  value={illnessName}
                  onChange={e => setIllnessName(e.target.value)}
                  className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-[#00865B]/20 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Time Reported</label>
                <Input
                  id="reported-at"
                  type="datetime-local"
                  value={reportedAt}
                  onChange={e => setReportedAt(e.target.value)}
                  className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-[#00865B]/20 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  id="toggle-doctor"
                  onClick={() => setWentToDoctor(v => !v)}
                  className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border ${
                    wentToDoctor ? 'bg-[#00865B]/5 border-[#00865B]/20' : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`text-sm font-bold flex items-center gap-3 ${wentToDoctor ? 'text-[#00865B]' : 'text-slate-700'}`}>
                    <div className={`p-2 rounded-lg ${wentToDoctor ? 'bg-[#00865B]/10' : 'bg-slate-100'}`}>
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    Student Requires Doctor Visit
                  </span>
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    wentToDoctor ? 'bg-[#00865B] border-[#00865B]' : 'border-slate-300 bg-white'
                  }`}>
                    {wentToDoctor && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                  </div>
                </button>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-bold text-slate-700">Additional Notes <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                <textarea
                  id="medical-notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-0 bg-slate-50 text-slate-900 resize-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#00865B]/20"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50">
              <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-600 font-bold hover:bg-slate-200" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                id="submit-medical"
                className="flex-1 h-12 rounded-xl bg-[#00865B] hover:bg-[#00704c] text-white font-bold tracking-wide"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Add Record'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

/* ─────────────────────── ActiveCard (Matched to Screenshot) ─────────────────────── */
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
      className="bg-white rounded-3xl p-5 lg:p-6 shadow-sm border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:shadow-md transition-shadow animate-slide-up"
      style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
    >
      {/* LEFT SECTION - Avatar & Name */}
      <div className="flex items-center gap-5 w-full lg:w-[35%] shrink-0">
        <div className="w-16 h-16 rounded-full bg-[#bffff0]/40 flex items-center justify-center text-[22px] font-black text-[#00a877] shrink-0">
          {initials(record.student?.name || '?')}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-slate-900 truncate">{record.student?.name}</p>
          <p className="text-[15px] font-semibold text-slate-500 mt-0.5">
            {record.student?.class} <span className="opacity-50 mx-1.5">•</span> ID #{record.student?.roll_number || 'N/A'}
          </p>
        </div>
      </div>

      {/* MIDDLE SECTION - Illness Details */}
      <div className="flex-1 min-w-0 w-full lg:w-auto border-t lg:border-t-0 border-slate-100 pt-5 lg:pt-0">
         <div className="flex flex-wrap items-center gap-3">
            <p className="text-[17px] font-bold text-slate-900">{record.illness_name}</p>
            {record.went_to_doctor ? (
              <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-[#dcfce7] text-[#166534] uppercase tracking-wide">
                DOCTOR VISIT
              </span>
            ) : (
               <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 uppercase tracking-wide">
                INFIRMARY OBSERVATION
              </span>
            )}
         </div>
         
         <div className="mt-2.5 flex items-start gap-3.5 text-[13px] font-semibold text-slate-400">
            <div className="flex flex-col gap-1 w-[120px] shrink-0">
               <span><Clock className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />{relativeTime(record.reported_at)}</span>
               <span className="ml-[22px]">• {fmtTime(record.reported_at)}</span>
            </div>
            
            {record.reported_by && (
              <div className="flex gap-2">
                <span className="text-slate-300 -mt-2">•</span>
                <span className="flex flex-col gap-1 max-w-[160px]">
                  <span>Reported by {record.reported_by.name.split(' ')[0]}</span>
                  <span>{record.reported_by.name.split(' ').slice(1).join(' ')}</span>
                </span>
              </div>
            )}
         </div>
         
         {record.notes && (
           <p className="mt-3 text-[13px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
             {record.notes}
           </p>
         )}
      </div>

      {/* RIGHT SECTION - Actions */}
      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto mt-2 lg:mt-0 pt-4 lg:pt-0 justify-start lg:justify-end border-t lg:border-t-0 border-slate-100 shrink-0">
        <span className="px-5 py-2.5 rounded-full bg-rose-100/80 text-rose-700 text-sm font-bold mr-2">
          Active
        </span>
        <Button
          id={`recover-${record.id}`}
          size="sm"
          disabled={loading}
          onClick={onRecover}
          className="h-11 px-7 rounded-full bg-[#00865B] hover:bg-[#00704c] text-white text-sm font-bold"
        >
          Recovered
        </Button>
        <Button
          id={`sent-home-${record.id}`}
          size="sm"
          disabled={loading}
          onClick={onSentHome}
          variant="outline"
          className="h-11 px-6 rounded-full border-2 border-blue-100 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-sm font-bold bg-white"
        >
          Sent Home
        </Button>
      </div>
    </div>
  );
}
