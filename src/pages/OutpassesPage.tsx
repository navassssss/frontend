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
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import api from '@/lib/api';

// ── IST Time Formatter ─────────────────────────────────────────────────────

const IST = 'Asia/Kolkata';

function formatIST(dateStr: string, opts: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('en-IN', { timeZone: IST, ...opts }).format(new Date(dateStr));
}

function fTime(dateStr: string): string {
    return formatIST(dateStr, { hour: 'numeric', minute: '2-digit', hour12: true });
}

// Smart label: "Today 5:30 PM", "Yesterday 3:15 PM", "22 Apr 4:00 PM"
function fSmartDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date());
    const yesterdayStr = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(new Date(Date.now() - 86400000));
    const dateOnly = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(date);
    const time = formatIST(dateStr, { hour: 'numeric', minute: '2-digit', hour12: true });
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
        <div className="flex items-center gap-1">
            <select
                className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={toH12(h24)}
                onChange={e => setHour(parseInt(e.target.value))}
            >
                {Array.from({length:12},(_,i)=>i+1).map(h => <option key={h} value={h}>{String(h).padStart(2,'0')}</option>)}
            </select>
            <span className="text-muted-foreground font-bold">:</span>
            <select
                className="border border-input rounded-md px-2 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={min}
                onChange={e => setMinute(parseInt(e.target.value))}
            >
                {Array.from({length:12},(_,i)=>i*5).map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
            <div className="flex rounded-md overflow-hidden border border-input">
                {(['AM','PM'] as const).map(ap => (
                    <button key={ap} type="button"
                        className={`px-2 py-2 text-xs font-bold transition-colors ${
                            ampm === ap ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-muted'
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

// ── Helpers ────────────────────────────────────────────────────────────────

const statusConfig = {
    outside: { label: 'Outside', className: 'bg-amber-100 text-amber-800 border-amber-300', icon: LogOut },
    returned: { label: 'Returned', className: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
    overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle },
};

function StatusBadge({ status }: { status: 'outside' | 'returned' | 'overdue' }) {
    const cfg = statusConfig[status];
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    );
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
            // handle paginated or flat response
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
            // Combine date + time parts before sending
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">New Outpass</h2>
                            <p className="text-xs text-muted-foreground">Student campus checkout</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Student Search */}
                    <div className="space-y-2 relative">
                        <Label>Student <span className="text-destructive">*</span></Label>
                        {selectedStudent ? (
                            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div>
                                    <p className="font-semibold text-sm text-foreground">{selectedStudent.name}</p>
                                    <p className="text-xs text-muted-foreground">Roll #{selectedStudent.roll_number}</p>
                                </div>
                                <button onClick={() => { setSelectedStudent(null); setSearchQuery(''); }} className="text-muted-foreground hover:text-destructive">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        className="pl-9"
                                        placeholder="Search student name or roll no..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                {filteredStudents.length > 0 && (
                                    <div className="absolute z-10 left-0 right-0 bg-background border border-border rounded-lg shadow-lg overflow-hidden mt-1">
                                        {filteredStudents.map(s => (
                                            <button
                                                key={s.id}
                                                className="w-full text-left px-4 py-2.5 hover:bg-muted/50 flex items-center justify-between"
                                                onClick={() => { setSelectedStudent(s); setSearchQuery(''); setFilteredStudents([]); }}
                                            >
                                                <span className="font-medium text-sm">{s.name}</span>
                                                <span className="text-xs text-muted-foreground">Roll #{s.roll_number}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label>Reason for leaving <span className="text-destructive">*</span></Label>
                        <Input placeholder="e.g. Doctor appointment, Family emergency..." value={reason} onChange={e => setReason(e.target.value)} />
                    </div>

                    {/* Out Time */}
                    <div className="space-y-2">
                        <Label>Out Date & Time <span className="text-destructive">*</span></Label>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Input type="date" className="w-auto flex-1 min-w-[130px]" value={outDate} onChange={e => setOutDate(e.target.value)} />
                            <TimePicker value={outTime} onChange={setOutTime} />
                        </div>
                    </div>
                    {/* Expected Return */}
                    <div className="space-y-2">
                        <Label>Expected Return <span className="text-destructive">*</span></Label>
                        <div className="flex gap-2 flex-wrap items-center">
                            <Input type="date" className="w-auto flex-1 min-w-[130px]" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
                            <TimePicker value={expectedInTime} onChange={setExpectedInTime} />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label>Notes <span className="text-muted-foreground text-xs">(Optional)</span></Label>
                        <Input placeholder="Additional details..." value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="outline" className="flex-1" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={handleSubmit} disabled={submitting}>
                            <LogOut className="w-4 h-4 mr-2" />
                            {submitting ? 'Creating...' : 'Create Outpass'}
                        </Button>
                    </div>
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
}

function OutpassCard({ outpass, onCheckin, checkingIn }: OutpassCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const isActionable = outpass.status !== 'returned';

    const handleCheckinClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirming) { setConfirming(true); return; }
        setConfirming(false);
        onCheckin(outpass.id);
    };

    return (
        <Card className={`transition-all duration-200 shadow-sm hover:shadow-md ${
            outpass.status === 'overdue' ? 'border-red-300 bg-red-50/30' : ''
        }`}>
            <CardContent className="p-0">
                <div className="p-4 flex flex-col gap-2">
                    {/* Row 1: Icon · Name · Status · Return btn */}
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            outpass.status === 'overdue' ? 'bg-red-100 text-red-700'
                            : outpass.status === 'returned' ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                            {outpass.status === 'returned' ? <LogIn className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(e => !e)}>
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm text-foreground leading-tight">{outpass.student?.user?.name ?? '—'}</p>
                                <StatusBadge status={outpass.status} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {outpass.student?.classRoom?.name} · Roll #{outpass.student?.roll_number}
                            </p>
                        </div>
                        {isActionable ? (
                            <Button
                                size="sm"
                                disabled={checkingIn}
                                onClick={handleCheckinClick}
                                className={`shrink-0 text-xs px-2.5 h-8 transition-all ${
                                    confirming
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300'
                                }`}
                            >
                                <LogIn className="w-3.5 h-3.5 mr-1" />
                                {checkingIn ? 'Saving...' : confirming ? 'Confirm?' : 'Return'}
                            </Button>
                        ) : (
                            <ChevronDown
                                className={`w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform cursor-pointer ${expanded ? 'rotate-180' : ''}`}
                                onClick={() => setExpanded(e => !e)}
                            />
                        )}
                    </div>

                    {/* Row 2 (indented): Duration · spacer · Times · Chevron */}
                    <div className="flex items-center gap-2 pl-[52px] cursor-pointer" onClick={() => setExpanded(e => !e)}>
                        {outpass.status !== 'returned' && (
                            <span className={`text-xs font-medium ${outpass.status === 'overdue' ? 'text-red-600' : 'text-amber-700'}`}>
                                ⏱ {formatDistanceToNow(new Date(outpass.out_time), { addSuffix: false })}
                            </span>
                        )}
                        <div className="flex-1" />
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">Left at</p>
                            <p className="text-xs font-medium">{fSmartDateTime(outpass.out_time)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-muted-foreground">
                                {outpass.status === 'returned' ? 'Returned' : 'Exp. back'}
                            </p>
                            <p className={`text-xs font-medium ${outpass.status === 'overdue' ? 'text-red-600' : ''}`}>
                                {outpass.status === 'returned' && outpass.actual_in_time
                                    ? fSmartDateTime(outpass.actual_in_time)
                                    : fSmartDateTime(outpass.expected_in_time)}
                            </p>
                        </div>
                        {isActionable && (
                            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        )}
                    </div>

                </div>

                {/* Expanded Details */}
                {expanded && (
                    <div className="border-t border-border px-4 py-3 bg-muted/20">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Reason</p>
                                <p>{outpass.reason}</p>
                            </div>
                            {outpass.notes && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Notes</p>
                                    <p>{outpass.notes}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-muted-foreground font-medium mb-0.5">Created by</p>
                                <p>{outpass.creator?.name ?? '—'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
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

    // Filters — default: Outside, all dates
    const [filterStatus, setFilterStatus] = useState('outside');
    const [filterClass, setFilterClass] = useState('all');
    const [filterDate, setFilterDate] = useState('');
    const [searchStudent, setSearchStudent] = useState('');

    const canCreate = user?.role === 'principal' || user?.role === 'manager'
        || (user?.role === 'teacher' && user?.is_vice_principal)
        || user?.permissions?.some((p: any) => p.name === 'manage_outpasses');

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const params: Record<string, string> = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterClass !== 'all') params.class_id = filterClass;
            if (filterDate) params.date = filterDate;

            const [statsRes, listRes, classesRes] = await Promise.all([
                api.get('/outpasses/dashboard'),
                api.get('/outpasses', { params }),
                api.get('/attendance/classes'),
            ]);

            setStats(statsRes.data);
            const raw: Outpass[] = listRes.data.data ?? listRes.data;
            // Sort: overdue first, then outside (oldest first), then returned
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
    }, [filterStatus, filterClass, filterDate]);

    useEffect(() => { loadData(); }, [loadData]);

    // Auto-refresh every 60s (silent — no spinner)
    useEffect(() => {
        const id = setInterval(() => loadData(true), 60_000);
        return () => clearInterval(id);
    }, [loadData]);

    const handleCheckin = async (id: number) => {
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
        if (!searchStudent) return true;
        const q = searchStudent.toLowerCase();
        return (
            op.student?.user?.name?.toLowerCase().includes(q) ||
            op.student?.roll_number?.includes(q)
        );
    });

    return (
        <AppLayout title="Outpass Management" showBack>
            <div className="p-4 space-y-6 lg:p-8 pb-24">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Outpass Management</h1>
                        <p className="text-sm text-muted-foreground">Track students leaving and returning to campus</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => loadData()} size="icon" disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                        {canCreate && (
                            <Button
                                onClick={() => setShowModal(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Outpass
                            </Button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Today Total', value: stats.total_today, icon: Users, color: 'bg-blue-100 text-blue-700', border: 'border-blue-100' },
                        { label: 'Currently Outside', value: stats.currently_outside, icon: LogOut, color: 'bg-amber-100 text-amber-700', border: 'border-amber-100' },
                        { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'bg-red-100 text-red-700', border: 'border-red-100' },
                        { label: 'Returned Today', value: stats.returned_today, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-100' },
                    ].map(({ label, value, icon: Icon, color, border }) => (
                        <Card key={label} className={`shadow-sm border ${border}`}>
                            <CardContent className="p-4 flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                                    <p className="text-2xl font-bold text-foreground">{value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <Card className="shadow-sm">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search student..."
                                    value={searchStudent}
                                    onChange={e => setSearchStudent(e.target.value)}
                                />
                            </div>
                            {/* Status Filter */}
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="outside">Outside</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                    <SelectItem value="returned">Returned</SelectItem>
                                </SelectContent>
                            </Select>
                            {/* Class Filter */}
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map(c => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {/* Date Filter */}
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={e => setFilterDate(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold flex items-center gap-2 text-foreground">
                            <Clock className="w-4 h-4 text-primary" />
                            Outpass Records
                        </h2>
                        <Badge variant="outline" className="text-xs">{filteredOutpasses.length} records</Badge>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : filteredOutpasses.length === 0 ? (
                        <Card className="border-dashed border-2">
                            <CardContent className="py-14 text-center">
                                <div className="w-16 h-16 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-4">
                                    <LogOut className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-foreground">No outpass records</h3>
                                <p className="text-sm text-muted-foreground mt-1">No records match the current filters.</p>
                                {canCreate && (
                                    <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setShowModal(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Create First Outpass
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {filteredOutpasses.map(op => (
                                <OutpassCard
                                    key={op.id}
                                    outpass={op}
                                    onCheckin={handleCheckin}
                                    checkingIn={checkingInId === op.id}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <CheckoutModal
                    onClose={() => setShowModal(false)}
                    onSuccess={loadData}
                />
            )}
        </AppLayout>
    );
}
