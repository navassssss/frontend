import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    XCircle,
    Sun,
    Sunset,
    TrendingUp
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

interface AttendanceData {
    student: {
        id: number;
        name: string;
    };
    overallStats: {
        totalDays: number;
        presentDays: number;
        absentDays: number;
        percentage: number;
    };
    today: {
        morning: {
            status: string;
            className: string;
        } | null;
        afternoon: {
            status: string;
            className: string;
        } | null;
    };
    absentDates: Array<{
        date: string;
        sessions: string[];
        count: number;
        isFullDay: boolean;
    }>;
    recentRecords: Array<{
        date: string;
        morning: {
            status: string;
            className: string;
        } | null;
        afternoon: {
            status: string;
            className: string;
        } | null;
    }>;
}

export default function StudentAttendanceOverviewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<AttendanceData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttendance();
    }, [id]);

    const loadAttendance = async () => {
        setLoading(true);
        try {
            const { data: response } = await api.get(`/students/${id}/attendance`);
            setData(response);
        } catch (error) {
            toast.error('Failed to load attendance data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Attendance">
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">Loading attendance...</p>
                </div>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="Attendance">
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">No attendance data found</p>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={`Attendance - ${data.student.name}`}>
            <div className="p-4 space-y-4 pb-24">

                {/* Header */}
                <div className="flex items-center gap-3 animate-fade-in">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{data.student.name}</h2>
                        <p className="text-sm text-muted-foreground">Attendance Overview</p>
                    </div>
                </div>

                {/* Overall Stats Card */}
                <Card className="animate-slide-up">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Overall Attendance</p>
                                <p className="text-3xl font-bold text-foreground mt-1">
                                    {Math.floor(data.overallStats.presentDays)}/{data.overallStats.totalDays}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {data.overallStats.presentDays % 1 !== 0 && `(${data.overallStats.presentDays} days)`}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2 justify-end mb-1">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    <span className="text-2xl font-bold text-primary">
                                        {data.overallStats.percentage}%
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">Attendance Rate</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-success/10 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="w-4 h-4 text-success" />
                                    <span className="text-sm font-medium text-success">Present</span>
                                </div>
                                <p className="text-2xl font-bold text-success">{data.overallStats.presentDays}</p>
                                <p className="text-xs text-muted-foreground">days</p>
                            </div>

                            <div className="bg-destructive/10 rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <XCircle className="w-4 h-4 text-destructive" />
                                    <span className="text-sm font-medium text-destructive">Absent</span>
                                </div>
                                <p className="text-2xl font-bold text-destructive">{data.overallStats.absentDays}</p>
                                <p className="text-xs text-muted-foreground">days</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Today's Status */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Today's Status</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Morning Session */}
                            <div className="bg-accent/5 rounded-xl p-3 border border-accent/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sun className="w-4 h-4 text-accent" />
                                    <span className="text-xs font-medium text-muted-foreground">Morning</span>
                                </div>
                                {data.today.morning ? (
                                    <>
                                        <Badge
                                            variant={data.today.morning.status === 'present' ? 'success' : 'destructive'}
                                            className="mb-1"
                                        >
                                            {data.today.morning.status === 'present' ? 'Present' : 'Absent'}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">{data.today.morning.className}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Not marked</p>
                                )}
                            </div>

                            {/* Afternoon Session */}
                            <div className="bg-warning/5 rounded-xl p-3 border border-warning/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sunset className="w-4 h-4 text-warning" />
                                    <span className="text-xs font-medium text-muted-foreground">Afternoon</span>
                                </div>
                                {data.today.afternoon ? (
                                    <>
                                        <Badge
                                            variant={data.today.afternoon.status === 'present' ? 'success' : 'destructive'}
                                            className="mb-1"
                                        >
                                            {data.today.afternoon.status === 'present' ? 'Present' : 'Absent'}
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">{data.today.afternoon.className}</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">Not marked</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Absent Dates */}
                {data.absentDates.length > 0 && (
                    <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Absent Dates</h3>
                            <div className="space-y-2">
                                {data.absentDates.map((absent, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/10"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-4 h-4 text-destructive" />
                                            <div>
                                                <p className="text-sm font-medium text-foreground">
                                                    {format(new Date(absent.date), 'MMM d, yyyy')}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {absent.sessions.join(' & ')} session{absent.sessions.length > 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant="destructive" className="text-xs">
                                            {absent.count} {absent.count > 1 ? 'sessions' : 'session'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Records */}
                {data.recentRecords.length > 0 && (
                    <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                        <CardContent className="p-4">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Records</h3>
                            <div className="space-y-3">
                                {data.recentRecords.slice(0, 5).map((record, index) => (
                                    <div
                                        key={index}
                                        className="bg-secondary/50 rounded-lg p-3"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <p className="text-sm font-medium text-foreground">
                                                {format(new Date(record.date), 'MMM d, yyyy')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            {/* Morning */}
                                            <div className="flex items-center justify-between p-2 bg-accent/5 rounded border border-accent/20">
                                                <div className="flex items-center gap-2">
                                                    <Sun className="w-3 h-3 text-accent" />
                                                    <span className="text-xs text-muted-foreground">Morning</span>
                                                </div>
                                                {record.morning ? (
                                                    <Badge
                                                        variant={record.morning.status === 'present' ? 'success' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {record.morning.status === 'present' ? 'P' : 'A'}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </div>

                                            {/* Afternoon */}
                                            <div className="flex items-center justify-between p-2 bg-warning/5 rounded border border-warning/20">
                                                <div className="flex items-center gap-2">
                                                    <Sunset className="w-3 h-3 text-warning" />
                                                    <span className="text-xs text-muted-foreground">Afternoon</span>
                                                </div>
                                                {record.afternoon ? (
                                                    <Badge
                                                        variant={record.afternoon.status === 'present' ? 'success' : 'destructive'}
                                                        className="text-xs"
                                                    >
                                                        {record.afternoon.status === 'present' ? 'P' : 'A'}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </AppLayout>
    );
}
