import React, { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle,
    XCircle,
    TrendingUp,
    Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';
import { format } from 'date-fns';

interface AttendanceRecord {
    id: number;
    date: string;
    session: 'morning' | 'afternoon';
    status: 'present' | 'absent';
    className: string;
    submittedAt: string;
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
        loadAttendance();
    }, []);

    const loadAttendance = async () => {
        try {
            const { data } = await api.get('/student/attendance');
            setStats(data.stats);
            setMonthlyStats(data.monthlyStats);
            setRecords(data.records);
        } catch (error) {
            console.error('Failed to load attendance', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return 'text-success';
        if (percentage >= 75) return 'text-warning';
        return 'text-destructive';
    };

    const getMonthName = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        return format(new Date(parseInt(year), parseInt(month) - 1), 'MMM yyyy');
    };

    if (loading) {
        return (
            <StudentLayout title="My Attendance">
                <div className="flex items-center justify-center h-64">
                    <Clock className="w-8 h-8 animate-spin text-primary" />
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Attendance">
            <div className="space-y-6 pb-24">
                {/* Overall Stats */}
                <Card variant="elevated">
                    <CardContent className="p-6">
                        <div className="text-center mb-4">
                            <div className={`text-5xl font-bold ${getStatusColor(stats?.percentage || 0)}`}>
                                {stats?.percentage || 0}%
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">Overall Attendance</p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">{stats?.total || 0}</div>
                                <p className="text-xs text-muted-foreground">Total Days</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-success">{stats?.present || 0}</div>
                                <p className="text-xs text-muted-foreground">Present</p>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-destructive">{stats?.absent || 0}</div>
                                <p className="text-xs text-muted-foreground">Absent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Breakdown */}
                {monthlyStats.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Monthly Breakdown
                        </h3>
                        {monthlyStats.map((month) => (
                            <Card key={month.month} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">
                                                {getMonthName(month.month)}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {month.present}/{month.total} days
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-2xl font-bold ${getStatusColor(month.percentage)}`}>
                                                {month.percentage}%
                                            </div>
                                            <div className="flex gap-2 mt-1">
                                                <Badge variant="success" className="text-xs">
                                                    {month.present}P
                                                </Badge>
                                                <Badge variant="destructive" className="text-xs">
                                                    {month.absent}A
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Recent Records */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Recent Records
                    </h3>
                    {records.length === 0 ? (
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No attendance records yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        records.map((record) => (
                            <Card key={record.id} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.status === 'present'
                                                    ? 'bg-success/10'
                                                    : 'bg-destructive/10'
                                                }`}>
                                                {record.status === 'present' ? (
                                                    <CheckCircle className="w-5 h-5 text-success" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-destructive" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {format(new Date(record.date), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-sm text-muted-foreground capitalize">
                                                    {record.session} Session
                                                </p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={record.status === 'present' ? 'success' : 'destructive'}
                                            className="capitalize"
                                        >
                                            {record.status}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
