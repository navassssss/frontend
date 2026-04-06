import React, { useState, useEffect } from 'react';
import {
    Calendar, CheckCircle, XCircle, TrendingUp, Clock
} from 'lucide-react';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface AttendanceRecord {
    id: number;
    date: string;
    session: 'morning' | 'afternoon';
    status: 'present' | 'absent';
    className: string;
}
interface MonthlyStats {
    month: string;
    total: number;
    present: number;
    absent: number;
    percentage: number;
}
interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    percentage: number;
}

export default function StudentAttendancePage() {
    const [stats, setStats] = useState<AttendanceStats | null>(null);
    const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get('/student/attendance');
                setStats(data.stats);
                setMonthlyStats(data.monthlyStats);
                setRecords(data.records);
            } catch { /* silent */ }
            finally { setLoading(false); }
        })();
    }, []);

    const pct = stats?.percentage || 0;
    const getColor = (p: number) => p >= 90 ? '#008f6c' : p >= 75 ? '#f59e0b' : '#ef4444';
    const getMonthName = (s: string) => {
        const [y, m] = s.split('-');
        return format(new Date(parseInt(y), parseInt(m) - 1), 'MMM yyyy');
    };

    if (loading) {
        return (
            <StudentLayout title="My Attendance">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-[#008f6c]/30 border-t-[#008f6c] rounded-full animate-spin" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Attendance">
            <div className="space-y-5 pb-8">

                {/* Overall ring card */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col sm:flex-row items-center gap-6">
                    {/* Ring visual */}
                    <div className="relative w-28 h-28 shrink-0">
                        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                            <circle
                                cx="50" cy="50" r="40" fill="none"
                                stroke={getColor(pct)} strokeWidth="12"
                                strokeLinecap="round"
                                strokeDasharray={`${2 * Math.PI * 40}`}
                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
                                className="transition-all duration-1000"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black" style={{ color: getColor(pct) }}>{pct}%</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overall</span>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-3 gap-4 text-center sm:text-left">
                        {[
                            { label: 'Total Days', value: stats?.total || 0, color: 'text-slate-700' },
                            { label: 'Present',    value: stats?.present || 0, color: 'text-[#008f6c]' },
                            { label: 'Absent',     value: stats?.absent || 0,  color: 'text-red-500' },
                        ].map(s => (
                            <div key={s.label}>
                                <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Monthly Breakdown */}
                {monthlyStats.length > 0 && (
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Monthly Breakdown</h3>
                        <div className="space-y-2">
                            {monthlyStats.map(month => (
                                <div key={month.month} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{getMonthName(month.month)}</p>
                                            <p className="text-[11px] text-slate-400">{month.present}/{month.total} days</p>
                                        </div>
                                        <span className="text-xl font-black" style={{ color: getColor(month.percentage) }}>
                                            {month.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${month.percentage}%`, backgroundColor: getColor(month.percentage) }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Records */}
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Recent Records</h3>
                    {records.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <Calendar className="w-10 h-10 text-slate-200 mb-3" />
                            <p className="font-bold text-slate-400">No attendance records yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {records.map(record => (
                                <div key={record.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.status === 'present' ? 'bg-[#008f6c]/10' : 'bg-red-50'}`}>
                                            {record.status === 'present'
                                                ? <CheckCircle className="w-5 h-5 text-[#008f6c]" />
                                                : <XCircle className="w-5 h-5 text-red-500" />
                                            }
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{format(new Date(record.date), 'MMM d, yyyy')}</p>
                                            <p className="text-[11px] text-slate-400 capitalize">{record.session} Session</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black capitalize border ${
                                        record.status === 'present'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                            : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                        {record.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
