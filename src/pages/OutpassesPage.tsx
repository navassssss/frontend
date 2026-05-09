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
    User,
    Trash2,
    Undo2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

// ── IST Time Formatter ─────────────────────────────────────────────────────

const IST = 'Asia/Kolkata';

function formatIST(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...opts }).format(new Date(dateStr));
}

function fTime(dateStr: string): string {
    return formatIST(dateStr, { hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();
}

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

function formatDurationExact(dateStr: string): string {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 0) return '0m';
    const totalMins = Math.floor(ms / 60000);
    if (totalMins < 60) return `${totalMins}m`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const rh = hours % 24;
    return `${days}d ${rh}h ${mins}m`;
}

const initials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
    
    // Default to current time for out_time, and tomorrow same time for expected_in_time
    const [outTime, setOutTime] = useState(() => {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    });
    const [expectedInTime, setExpectedInTime] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    });
    
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
            await api.post('/outpasses', {
                student_id: selectedStudent.id,
                reason: reason.trim(),
                notes: notes.trim() || undefined,
                out_time: outTime,
                expected_in_time: expectedInTime,
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
                        <Input
                            type="datetime-local"
                            className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-medium"
                            value={outTime}
                            onChange={e => setOutTime(e.target.value)}
                        />
                    </div>
                    {/* Expected Return */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Expected Return</label>
                        <Input
                            type="datetime-local"
                            className="h-12 bg-slate-50 border-0 rounded-xl focus-visible:ring-amber-600/20 font-medium"
                            value={expectedInTime}
                            onChange={e => setExpectedInTime(e.target.value)}
                        />
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
    onRevert: (id: number) => void;
    onDelete: (id: number) => void;
    loadingActionId: number | null;
    delay: number;
    tab: 'active' | 'history';
}

function OutpassCard({ outpass, onCheckin, onRevert, onDelete, loadingActionId, delay, tab }: OutpassCardProps) {
    const isActionable = outpass.status !== 'returned';
    const isProcessing = loadingActionId === outpass.id;

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
                    {/* Full name on large screens, break-words to avoid hidden overflow if extremely long */}
                    <p className="text-[15px] font-bold text-slate-900 break-words lg:break-normal lg:whitespace-normal">
                        {outpass.student?.user?.name || '—'}
                    </p>
                    <p className="text-[12px] font-medium text-slate-500 mt-0.5 flex flex-wrap items-center gap-1">
                        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">Class {outpass.student?.classRoom?.name}</span>
                        <span className="opacity-40 mx-0.5">•</span> 
                        <span>ID #{outpass.student?.roll_number || 'N/A'}</span>
                    </p>
                </div>
            </div>

            {/* MIDDLE SECTION - Reason Details */}
            <div className="flex-1 min-w-0 lg:col-span-3 flex flex-col gap-2 border-t lg:border-t-0 border-slate-50 pt-3 lg:pt-0">
                 <p className="text-[14px] font-bold text-slate-900 truncate" title={outpass.reason}>{outpass.reason}</p>
                 <div className="flex items-center gap-2">
                    {outpass.status === 'overdue' && (
                        <span className="text-[9px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest bg-red-50 text-red-600">
                            Overdue
                        </span>
                    )}
                    {outpass.status !== 'returned' && (
                        <span className={`text-[10px] font-bold ${outpass.status === 'overdue' ? 'text-red-500' : 'text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-widest'}`}>
                            ⏱ {formatDurationExact(outpass.out_time)} elapsed
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
            <div className="flex items-center justify-end gap-2 lg:col-span-2 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0 shrink-0">
                {isActionable ? (
                    <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => onCheckin(outpass.id)}
                        className="w-full lg:w-auto h-10 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold shadow-sm"
                    >
                        <LogIn className="w-4 h-4 mr-2" />
                        {isProcessing ? 'Saving...' : 'Return'}
                    </Button>
                ) : (
                    <div className="flex items-center justify-end gap-2 w-full">
                        <Button
                            variant="outline"
                            size="icon"
                            title="Revert to Active"
                            disabled={isProcessing}
                            onClick={() => onRevert(outpass.id)}
                            className="h-10 w-10 text-amber-600 bg-amber-50 hover:bg-amber-100 hover:text-amber-700 border-0 rounded-xl shrink-0 transition-colors"
                        >
                            <Undo2 className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Record"
                            disabled={isProcessing}
                            onClick={() => onDelete(outpass.id)}
                            className="h-10 w-10 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 rounded-xl shrink-0 transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </Button>
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
    const [loadingActionId, setLoadingActionId] = useState<number | null>(null);
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
            raw.sort((a, b) => {
                // Active cases come first when mixed
                if (order[a.status] !== order[b.status]) {
                    return order[a.status] - order[b.status];
                }
                // If both are returned, sort by actual_in_time DESC (latest first)
                if (a.status === 'returned') {
                    return new Date(b.actual_in_time!).getTime() - new Date(a.actual_in_time!).getTime();
                }
                // If active, oldest out_time first
                return new Date(a.out_time).getTime() - new Date(b.out_time).getTime();
            });
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
        setLoadingActionId(id);
        try {
            await api.put(`/outpasses/${id}/checkin`);
            toast.success('Student marked as returned');
            loadData();
        } catch {
            toast.error('Failed to check in student');
        } finally {
            setLoadingActionId(null);
        }
    };

    const handleRevert = async (id: number) => {
        if (!window.confirm('Revert status back to Active (Outside)?')) return;
        setLoadingActionId(id);
        try {
            await api.put(`/outpasses/${id}/revert`);
            toast.success('Check-in reverted successfully');
            loadData();
        } catch {
            toast.error('Failed to revert status');
        } finally {
            setLoadingActionId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Permanently delete this outpass record?')) return;
        setLoadingActionId(id);
        try {
            await api.delete(`/outpasses/${id}`);
            toast.success('Outpass deleted successfully');
            loadData();
        } catch {
            toast.error('Failed to delete outpass');
        } finally {
            setLoadingActionId(null);
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
                                    tab={tab}
                                    loadingActionId={loadingActionId}
                                    onCheckin={handleCheckin}
                                    onRevert={handleRevert}
                                    onDelete={handleDelete}
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
