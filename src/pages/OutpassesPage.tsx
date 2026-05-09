import React, { useState, useEffect, useCallback } from 'react';
import {
    LogOut,
    LogIn,
    Clock,
    Users,
    AlertTriangle,
    CheckCircle2,
    Plus,
    X,
    Search,
    Filter,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

// ── IST Time Formatter ─────────────────────────────────────────────────────

const IST = 'Asia/Kolkata';

function formatIST(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...opts }).format(new Date(dateStr));
}

function fTime(dateStr: string): string {
    return formatIST(dateStr, { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}

// Smart label: "Today 5:30 PM", "Yesterday 3:15 PM", "22 Apr 4:00 PM"
function fSmartDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date(Date.now() - 86400000));
    const dateOnly = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(date);
    const time = fTime(dateStr);
    if (dateOnly === todayStr) return `Today, ${time}`;
    if (dateOnly === yesterdayStr) return `Yesterday, ${time}`;
    const day = formatIST(dateStr, { day: 'numeric', month: 'short' });
    return `${day}, ${time}`;
}

function todayIST(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());
}

function istOffsetISO(offsetHours = 0): string {
    const d = new Date(Date.now() + offsetHours * 3600000);
    const ist = new Date(d.toLocaleString('en-US', { timeZone: IST }));
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${ist.getFullYear()}-${pad(ist.getMonth()+1)}-${pad(ist.getDate())}T${pad(ist.getHours())}:${pad(ist.getMinutes())}`;
}

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

// 12-hr time picker component
function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    // value format: HH:MM (24hr from datetime-local)
    const toH12 = (h24: number) => h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
    const [h24, setH24] = useState(() => parseInt(value.split('T')[1]?.split(':')[0] ?? '8'));
    const [min, setMin] = useState(() => parseInt(value.split('T')[1]?.split(':')[1] ?? '0'));
    const [ampm, setAmpm] = useState<'AM'|'PM'>(() => parseInt(value.split('T')[1]?.split(':')[0] ?? '8') < 12 ? 'AM' : 'PM');
    const datepart = value.split('T')[0] ?? todayIST();

    const emit = (newH24: number, newMin: number) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        onChange(`${datepart}T${pad(newH24)}:${pad(newMin)}`);
    };

    const setHour = (h12: number) => {
        let h24new = ampm === 'PM' ? (h12 === 12 ? 12 : h12 + 12) : (h12 === 12 ? 0 : h12);
        setH24(h24new); emit(h24new, min);
    };
    const setMinute = (m: number) => { setMin(m); emit(h24, m); };
    const toggleAmPm = (ap: 'AM'|'PM') => {
        let newH = ap === 'PM' ? (h24 < 12 ? h24 + 12 : h24) : (h24 >= 12 ? h24 - 12 : h24);
        setAmpm(ap); setH24(newH); emit(newH, min);
    };

    return (
        <div className="flex items-center gap-1.5">
            <select
                className="border-0 bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                value={toH12(h24)}
                onChange={e => setHour(parseInt(e.target.value))}
            >
                {Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
            </select>
            <span className="text-slate-400 font-bold">:</span>
            <select
                className="border-0 bg-slate-50 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                value={min}
                onChange={e => setMinute(parseInt(e.target.value))}
            >
                {Array.from({length:12},(_,i)=>i*5).map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
            <div className="flex rounded-xl overflow-hidden border border-slate-100 ml-1">
                {(['AM','PM'] as const).map(ap => (
                    <button key={ap} type="button"
                        className={`px-3 py-2.5 text-[11px] font-bold transition-colors uppercase tracking-widest ${
                            ampm === ap ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                        onClick={() => toggleAmPm(ap)}
                    >{ap}</button>
                ))}
            </div>
        </div>
    );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface StudentOption {
    id: number;
    name: string;
    roll_number: string;
    class?: { id: number; name: string };
}

interface ClassOption {
    id: number;
    name: string;
}

interface Outpass {
    id: number;
    student_id: number;
    reason: string;
    notes?: string;
    out_time: string;
    expected_in_time: string;
    actual_in_time: string | null;
    status: 'outside' | 'returned' | 'overdue';
    created_by: number;
    student: {
        id: number;
        roll_number: string;
        user: { id: number; name: string };
        classRoom: { id: number; name: string };
    };
    creator: { id: number; name: string };
}

interface DashboardStats {
    total_today: number;
    currently_outside: number;
    overdue: number;
    returned_today: number;
}

// ── CheckoutModal ──────────────────────────────────────────────────────────

interface CheckoutModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

function CheckoutModal({ onClose, onSuccess }: CheckoutModalProps) {
    const [students, setStudents] = useState<StudentOption[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState<StudentOption[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);
    const [reason, setReason] = useState('');
    const [notes, setNotes] = useState('');
    const [outDate, setOutDate] = useState(todayIST());
    const [outTime, setOutTime] = useState(istOffsetISO(0));
    const [expectedDate, setExpectedDate] = useState(todayIST());
    const [expectedInTime, setExpectedInTime] = useState(istOffsetISO(2));
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/students?per_page=1000').then(({ data }) => {
            const list = data.data ?? data;
            setStudents(list);
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) { setFilteredStudents([]); return; }
        const q = searchQuery.toLowerCase();
        setFilteredStudents(
            students.filter(s =>
                s.name?.toLowerCase().includes(q) ||
                s.roll_number?.includes(q)
            ).slice(0, 6)
        );
    }, [searchQuery, students]);

    const handleSubmit = async () => {
        if (!selectedStudent) { toast.error('Select a student'); return; }
        if (!reason.trim()) { toast.error('Enter reason'); return; }
        if (!outTime) { toast.error('Enter out time'); return; }
        if (!expectedInTime) { toast.error('Enter expected return time'); return; }

        setSubmitting(true);
        try {
            const fullOutTime = `${outDate}T${outTime.split('T')[1]}`;
            const fullExpected = `${expectedDate}T${expectedInTime.split('T')[1]}`;
            await api.post('/outpasses', {
                student_id: selectedStudent.id,
                reason: reason.trim(),
                notes: notes.trim() || undefined,
                out_time: fullOutTime,
                expected_in_time: fullExpected,
            });
            toast.success(`Outpass created for ${selectedStudent.name}`);
            onSuccess();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.message ?? 'Failed to create outpass';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 pb-24 sm:pb-6 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-md max-h-[calc(100vh-7rem)] sm:max-h-[85vh] overflow-hidden flex flex-col bg-white rounded-3xl shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <h2 className="text-lg font-black text-slate-900">New Outpass</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Student Search */}
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
                                        {selectedStudent.class?.name} · ID #{selectedStudent.roll_number}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setSelectedStudent(null); setSearchQuery(''); }}
                                    className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center shrink-0 transition-colors shadow-sm bg-blue-50/50"
                                >
                                    <X className="w-4 h-4 text-slate-500" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 relative">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        className="pl-12 h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-medium"
                                        placeholder="Search student name or roll no..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {filteredStudents.length > 0 && (
                                    <div className="absolute z-10 left-0 right-0 max-h-52 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-lg p-2 mt-2">
                                        {filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-left"
                                                onClick={() => { setSelectedStudent(s); setSearchQuery(''); setFilteredStudents([]); }}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                                    {initials(s.name)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                                    <p className="text-xs font-medium text-slate-500">{s.class?.name} · #{s.roll_number}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for Leaving</label>
                        <Input
                            placeholder="e.g. Doctor appointment, Family emergency..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-bold"
                        />
                    </div>

                    {/* Out Time */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Out Date & Time</label>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Input
                                type="date"
                                className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-medium w-auto flex-1 min-w-[130px]"
                                value={outDate}
                                onChange={e => setOutDate(e.target.value)}
                            />
                            <TimePicker value={outTime} onChange={setOutTime} />
                        </div>
                    </div>
                    {/* Expected Return */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Expected Return</label>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Input
                                type="date"
                                className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-medium w-auto flex-1 min-w-[130px]"
                                value={expectedDate}
                                onChange={e => setExpectedDate(e.target.value)}
                            />
                            <TimePicker value={expectedInTime} onChange={setExpectedInTime} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-bold text-slate-700">Additional Notes <span className="text-slate-400 font-normal ml-1">(Optional)</span></label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Additional details..."
                            className="w-full px-4 py-3 rounded-xl border-0 bg-slate-50 text-slate-900 resize-none text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-600/20"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-100 flex gap-4 bg-slate-50/50">
                    <Button variant="ghost" className="flex-1 h-12 rounded-xl text-slate-600 font-bold hover:bg-slate-200" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button
                        className="flex-1 h-12 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold tracking-wide"
                        onClick={handleSubmit}
                        disabled={submitting}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        {submitting ? 'Creating...' : 'Create Outpass'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ── OutpassCard ────────────────────────────────────────────────────────────

interface OutpassCardProps {
    outpass: Outpass;
    onCheckin: (id: number) => void;
    checkingIn: boolean;
    delay: number;
}

function OutpassCard({ outpass, onCheckin, checkingIn, delay }: OutpassCardProps) {
    const isActionable = outpass.status !== 'returned';

    return (
        <div
            className="bg-white rounded-[1.25rem] p-4 lg:p-5 shadow-sm border border-slate-100 flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 hover:shadow-md transition-all animate-slide-up"
            style={{ animationDelay: `${delay}s`, animationFillMode: 'backwards' }}
        >
            {/* LEFT SECTION - Avatar & Name */}
            <div className="flex items-center gap-3.5 lg:col-span-3 shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[15px] font-black shrink-0 ${
                    outpass.status === 'overdue' ? 'bg-red-100/50 text-red-600'
                    : outpass.status === 'returned' ? 'bg-[#bffff0]/40 text-[#00a877]'
                    : 'bg-amber-100/50 text-amber-600'
                }`}>
                    {initials(outpass.student?.user?.name || '?')}
                </div>
                <div className="min-w-0">
                    <p className="text-[15px] font-bold text-slate-900 truncate">{outpass.student?.user?.name || '—'}</p>
                    <p className="text-[12px] font-medium text-slate-500 truncate mt-0.5">
                        {outpass.student?.classRoom?.name} <span className="opacity-30 mx-1">•</span> ID #{outpass.student?.roll_number || 'N/A'}
                    </p>
                </div>
            </div>

            {/* MIDDLE SECTION - Reason Details */}
            <div className="flex-1 min-w-0 lg:col-span-3 flex flex-col gap-2 border-t lg:border-t-0 border-slate-50 pt-3 lg:pt-0">
                 <p className="text-[14px] font-bold text-slate-900 truncate" title={outpass.reason}>{outpass.reason}</p>
                 <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest ${
                        outpass.status === 'overdue' ? 'bg-red-50 text-red-600'
                        : outpass.status === 'returned' ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                        {outpass.status === 'returned' ? 'Returned' : outpass.status === 'overdue' ? 'Overdue' : 'Outside'}
                    </span>
                    {outpass.status !== 'returned' && (
                        <span className={`text-[10px] font-bold ${outpass.status === 'overdue' ? 'text-red-500' : 'text-amber-500'}`}>
                            ⏱ {formatDistanceToNow(new Date(outpass.out_time), { addSuffix: false })}
                        </span>
                    )}
                 </div>
                 {outpass.notes && (
                     <p className="mt-0.5 text-[12px] text-slate-500 line-clamp-2" title={outpass.notes}>
                         {outpass.notes}
                     </p>
                 )}
            </div>

            {/* METADATA SECTION */}
            <div className="flex-1 min-w-0 lg:col-span-4 flex flex-row lg:flex-col gap-4 lg:gap-2.5 border-t lg:border-t-0 border-slate-50 pt-3 lg:pt-0">
                 <div className="flex items-start gap-2 text-[12px] text-slate-500 flex-1">
                    <LogOut className="w-4 h-4 shrink-0 mt-[1px] text-slate-400" />
                    <div className="flex flex-col leading-[1.3]">
                       <span className="font-bold text-slate-700">{formatIST(outpass.out_time, { day: 'numeric', month: 'short' })}</span>
                       <span>{fTime(outpass.out_time)}</span>
                    </div>
                 </div>
                 <div className="flex items-start gap-2 text-[12px] text-slate-500 flex-1 min-w-0">
                    <LogIn className="w-4 h-4 shrink-0 mt-[1px] text-slate-400" />
                    <div className="flex flex-col leading-[1.3] min-w-0 w-full">
                       <span className={`font-bold ${outpass.status === 'overdue' ? 'text-red-600' : 'text-slate-700'} truncate block w-full`}>
                           {outpass.status === 'returned' && outpass.actual_in_time
                              ? formatIST(outpass.actual_in_time, { day: 'numeric', month: 'short' })
                              : formatIST(outpass.expected_in_time, { day: 'numeric', month: 'short' })
                           }
                       </span>
                       <span className={outpass.status === 'overdue' ? 'text-red-500' : ''}>
                           {outpass.status === 'returned' && outpass.actual_in_time
                              ? fTime(outpass.actual_in_time)
                              : fTime(outpass.expected_in_time)
                           }
                       </span>
                    </div>
                 </div>
            </div>

            {/* RIGHT SECTION - Actions */}
            <div className="flex items-center justify-end gap-3 lg:col-span-2 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 shrink-0">
                {isActionable ? (
                    <Button
                        size="sm"
                        disabled={checkingIn}
                        onClick={() => onCheckin(outpass.id)}
                        className="w-full lg:w-auto h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold shadow-sm"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        {checkingIn ? 'Saving...' : 'Return'}
                    </Button>
                ) : (
                    <div className="w-full text-center lg:text-right">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center justify-center lg:justify-end gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Returned
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function OutpassesPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({ total_today: 0, currently_outside: 0, overdue: 0, returned_today: 0 });
    const [outpasses, setOutpasses] = useState<Outpass[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingInId, setCheckingInId] = useState<number | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Tab & Filters
    const [tab, setTab] = useState<'active' | 'history'>('active');
    const [filterClass, setFilterClass] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [searchStudent, setSearchStudent] = useState('');

    const canCreate = user?.role === 'principal'
        || (user?.role === 'teacher' && user?.is_vice_principal)
        || user?.permissions?.some((p: any) => p.name === 'manage_outpasses');

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filterClass !== 'all') params.class_id = filterClass;
            if (filterDate) params.date = filterDate;

            const [statsRes, listRes, classesRes] = await Promise.all([
                api.get('/outpasses/dashboard'),
                api.get('/outpasses', { params }), // Fetching all (up to paginate limit)
                api.get('/attendance/classes'),
            ]);

            setStats(statsRes.data);
            const raw: Outpass[] = listRes.data.data ?? listRes.data;
            const order = { overdue: 0, outside: 1, returned: 2 };
            raw.sort((a, b) =>
                order[a.status] !== order[b.status]
                    ? order[a.status] - order[b.status]
                    : new Date(a.out_time).getTime() - new Date(b.out_time).getTime()
            );
            setOutpasses(raw);
            setClasses(classesRes.data);
        } catch {
            if (!silent) toast.error('Failed to load outpasses');
        } finally {
            setLoading(false);
        }
    }, [filterClass, filterDate]);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        const id = setInterval(() => loadData(true), 60_000);
        return () => clearInterval(id);
    }, [loadData]);

    const handleCheckin = async (id: number) => {
        if (!window.confirm('Mark this student as returned?')) return;
        setCheckingInId(id);
        try {
            await api.put(`/outpasses/${id}/checkin`);
            toast.success('Student marked as returned');
            loadData();
        } catch {
            toast.error('Failed to check in student');
        } finally {
            setCheckingInId(null);
        }
    };

    const filteredOutpasses = outpasses.filter(op => {
        if (tab === 'active' && op.status === 'returned') return false;
        if (tab === 'history' && op.status !== 'returned') return false;

        if (!searchStudent) return true;
        const q = searchStudent.toLowerCase();
        return (
            op.student?.user?.name?.toLowerCase().includes(q) ||
            op.student?.roll_number?.includes(q)
        );
    });

    return (
        <AppLayout title="Outpasses">
            <div className="p-4 md:p-10 max-w-[1280px] mx-auto pb-28 space-y-8 bg-slate-50/30 min-h-screen">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 animate-fade-in">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                            Outpasses
                        </h1>
                        <p className="text-base text-slate-600 mt-2 font-medium">
                            Track students leaving and returning
                        </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => loadData()}
                            disabled={loading}
                            className="h-12 w-12 rounded-2xl border-0 bg-white shadow-sm text-slate-600 hover:bg-slate-100"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-12 w-12 rounded-2xl border-0 bg-white shadow-sm text-slate-600 hover:bg-slate-100"
                        >
                            <Filter className="w-5 h-5" />
                        </Button>
                        {canCreate && (
                            <Button
                                onClick={() => setShowModal(true)}
                                className="h-12 px-6 rounded-2xl gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md border-0 transition-all font-semibold"
                            >
                                <Plus className="w-5 h-5" /> New Outpass
                            </Button>
                        )}
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-slide-up">
                    {/* Active Card */}
                    <div className="rounded-[1.5rem] p-5 flex items-center gap-5 bg-amber-100/80 w-full relative overflow-hidden transition-all hover:bg-amber-100 group">
                        <div className="bg-amber-200/60 rounded-xl p-3 shrink-0 text-amber-700 transition-colors group-hover:bg-amber-200">
                            <LogOut className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black text-amber-800 tracking-tight">{stats.currently_outside.toString().padStart(2, '0')}</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-amber-600">Outside</span>
                        </div>
                    </div>

                    {/* Overdue Card */}
                    <div className="rounded-[1.5rem] p-5 flex items-center gap-5 bg-red-100/80 w-full relative overflow-hidden transition-all hover:bg-red-100 group">
                        <div className="bg-red-200/60 rounded-xl p-3 shrink-0 text-red-700 transition-colors group-hover:bg-red-200">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black text-red-800 tracking-tight">{stats.overdue.toString().padStart(2, '0')}</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-red-600">Overdue</span>
                        </div>
                    </div>

                    {/* Returned Card */}
                    <div className="rounded-[1.5rem] p-5 flex items-center gap-5 bg-emerald-100/80 w-full relative overflow-hidden transition-all hover:bg-emerald-100 group">
                        <div className="bg-emerald-200/70 rounded-xl p-3 shrink-0 text-[#00865B] transition-colors group-hover:bg-emerald-200">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-4xl font-black text-emerald-900 tracking-tight">{stats.returned_today.toString().padStart(2, '0')}</span>
                            <span className="text-[11px] font-black uppercase tracking-widest text-[#00865B]">Returned Today</span>
                        </div>
                    </div>
                </div>

                {/* ── Tab Toggle ── */}
                <div className="flex gap-1 p-1.5 bg-slate-100 rounded-full w-fit animate-slide-up mb-2">
                    {(['active', 'history'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex items-center px-6 py-2.5 rounded-full text-base font-bold transition-all ${
                                tab === t 
                                    ? 'bg-white shadow-sm text-amber-600' 
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {t === 'active' ? 'Active Passes' : 'History'}
                        </button>
                    ))}
                </div>

                {/* ── Filters Bar (Desktop mainly, matches Medical Search bar style) ── */}
                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up">
                    <div className="relative flex-1 max-w-xl">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <Input
                            placeholder="Search student or roll no..."
                            value={searchStudent}
                            onChange={e => setSearchStudent(e.target.value)}
                            className="pl-14 h-14 bg-white border-0 rounded-2xl shadow-sm text-base font-medium focus-visible:ring-amber-600/20"
                        />
                    </div>
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:pb-0">
                        <div className="relative min-w-[130px] flex-1 sm:flex-none">
                            <select 
                                value={filterClass} 
                                onChange={e => setFilterClass(e.target.value)}
                                className="w-full h-14 pl-4 pr-10 bg-white border-0 rounded-2xl shadow-sm text-sm font-bold focus-visible:ring-amber-600/20 text-slate-700 outline-none appearance-none cursor-pointer"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                        <div className="relative min-w-[150px] flex-1 sm:flex-none">
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                                className="w-full h-14 px-4 bg-white border-0 rounded-2xl shadow-sm text-sm font-bold focus-visible:ring-amber-600/20 text-slate-700 outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* ── List Content ── */}
                <div className="animate-slide-up space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-[1.25rem] bg-slate-200/50 animate-pulse" />)}
                        </div>
                    ) : filteredOutpasses.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center gap-4 bg-white rounded-[2rem] shadow-sm">
                            <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-slate-300" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Clear queue</h3>
                                <p className="text-slate-500 mt-2 font-medium">No outpass records found.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col space-y-4">
                            {/* Desktop Table Headers */}
                            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <div className="col-span-3">Student / ID</div>
                                <div className="col-span-3">Reason & Status</div>
                                <div className="col-span-4">Out & Return Time</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            
                            {filteredOutpasses.map((rec, idx) => (
                                <OutpassCard
                                    key={rec.id}
                                    outpass={rec}
                                    checkingIn={checkingInId === rec.id}
                                    onCheckin={handleCheckin}
                                    delay={idx * 0.04}
                                />
                            ))}
                            
                            <div className="pt-8 pb-4 text-center">
                                <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
                                    End of current outpasses
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <CheckoutModal
                    onClose={() => setShowModal(false)}
                    onSuccess={loadData}
                />
            )}
        </AppLayout>
    );
}
