import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    ChevronLeft,
    Clock,
    Sun,
    Sunset,
    CheckCircle,
    XCircle,
    Plus,
    Users,
    Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, subDays } from 'date-fns';
import api from '@/lib/api';

interface AttendanceRecord {
    id: number;
    className: string;
    classId: number;
    session: 'morning' | 'afternoon';
    teacherName: string;
    presentCount: number;
    absentCount: number;
    absentStudents: Array<{
        id: number;
        name: string;
        roll_number: string;
    }>;
    date: string;
    submittedAt: string;
}

interface ClassStatus {
    id: number;
    name: string;
    morningTaken: boolean;
    afternoonTaken: boolean;
}

export default function AttendancePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get('student_id');
    const { user } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());
    const [studentName, setStudentName] = useState<string>('');
    const [classStatuses, setClassStatuses] = useState<ClassStatus[]>([]);
    const [todayStats, setTodayStats] = useState({
        morningPresent: 0,
        morningAbsent: 0,
        afternoonPresent: 0,
        afternoonAbsent: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRecords();
        loadClassStatuses();
        if (studentId) {
            loadStudentInfo();
        }
    }, [selectedDate, studentId]);

    const loadStudentInfo = async () => {
        try {
            const { data } = await api.get(`/students/${studentId}`);
            setStudentName(data.name);
        } catch (error) {
            console.error('Failed to load student info', error);
        }
    };

    const loadRecords = async () => {
        setLoading(true);
        try {
            if (studentId) {
                const { data } = await api.get(`/students/${studentId}/attendance?date=${selectedDate}`);
                setStudentName(data.student.name);

                const transformedRecords = data.records.length > 0 ? [{
                    id: Date.now(),
                    className: data.records[0]?.className || 'All Classes',
                    classId: 0,
                    session: data.records[0]?.session || 'morning',
                    teacherName: data.records[0]?.teacherName || 'Various',
                    presentCount: data.stats.present,
                    absentCount: data.stats.absent,
                    absentStudents: data.records
                        .filter((r: any) => r.status === 'absent')
                        .map((r: any) => ({
                            id: parseInt(studentId),
                            name: data.student.name,
                            roll_number: ''
                        })),
                    date: selectedDate,
                    submittedAt: new Date().toISOString()
                }] : [];

                setRecords(transformedRecords);
                setTodayStats({ morningPresent: 0, morningAbsent: 0, afternoonPresent: 0, afternoonAbsent: 0 });
            } else {
                const { data } = await api.get(`/attendance?date=${selectedDate}`);
                setRecords(data.records || data);
                setTodayStats(data.todayStats || { morningPresent: 0, morningAbsent: 0, afternoonPresent: 0, afternoonAbsent: 0 });
            }
        } catch (error) {
            console.error('Failed to load records', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (recordId: number) => {
        setExpandedRecords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recordId)) newSet.delete(recordId);
            else newSet.add(recordId);
            return newSet;
        });
    };

    const loadClassStatuses = async () => {
        try {
            const { data: classes } = await api.get('/attendance/classes');
            const { data: attendanceData } = await api.get(`/attendance?date=${selectedDate}`);
            const attendanceRecords = attendanceData.records || attendanceData;

            const statuses = classes.map((cls: any) => {
                const morningRecord = attendanceRecords.find(
                    (r: AttendanceRecord) => r.classId === cls.id && r.session === 'morning'
                );
                const afternoonRecord = attendanceRecords.find(
                    (r: AttendanceRecord) => r.classId === cls.id && r.session === 'afternoon'
                );

                return {
                    id: cls.id,
                    name: cls.name,
                    morningTaken: !!morningRecord,
                    afternoonTaken: !!afternoonRecord
                };
            });

            setClassStatuses(statuses);
        } catch (error) {
            console.error('Failed to load class statuses', error);
        }
    };

    const changeDate = (days: number) => {
        const newDate = addDays(new Date(selectedDate), days);
        setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    };

    return (
        <AppLayout title="Attendance" showBack>
            <div className="p-4 space-y-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Attendance Overview</h1>
                        <p className="text-muted-foreground text-sm">
                            {studentId && studentName ? `Viewing records for ${studentName}` : "Manage and view daily attendance"}
                        </p>
                    </div>

                    {/* Improved Date Navigation */}
                    <div className="flex items-center bg-card border border-border rounded-xl p-1 shadow-sm">
                        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-9 w-9">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2 px-4 border-x border-border mx-1">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-sm font-medium w-32 cursor-pointer"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-9 w-9">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    {!studentId && (
                        <Button
                            onClick={() => navigate('/attendance/take')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Take New Attendance
                        </Button>
                    )}
                </div>

                {/* Stats Grid - Standardized Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Morning Present - Amber theme */}
                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Sun className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Morning Present</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-amber-700">{todayStats.morningPresent}</span>
                                    <span className="text-xs text-teal-600 font-semibold">Students</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Morning Absent - Pink theme */}
                    <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Sun className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-pink-900 uppercase tracking-wider">Morning Absent</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-pink-700">{todayStats.morningAbsent}</span>
                                    <span className="text-xs text-teal-600 font-semibold">Students</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Afternoon Present - Amber theme */}
                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Sunset className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Afternoon Present</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-amber-700">{todayStats.afternoonPresent}</span>
                                    <span className="text-xs text-teal-600 font-semibold">Students</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Afternoon Absent - Pink theme */}
                    <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100 shadow-sm hover:shadow-md transition-all">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                <Sunset className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-pink-900 uppercase tracking-wider">Afternoon Absent</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-pink-700">{todayStats.afternoonAbsent}</span>
                                    <span className="text-xs text-teal-600 font-semibold">Students</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Records List */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Clock className="w-5 h-5 text-primary" />
                                Submission History
                            </h2>
                            <Badge variant="outline" className="text-xs font-normal">
                                {records.length} Records Found
                            </Badge>
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : records.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No Records Found</h3>
                                    <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                                        No attendance has been marked for {format(new Date(selectedDate), 'MMMM d, yyyy')} yet.
                                    </p>
                                    {!studentId && (
                                        <Button onClick={() => navigate('/attendance/take')} className="mt-4" variant="outline">
                                            Start Marking
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {records.map((record) => {
                                    const isExpanded = expandedRecords.has(record.id);
                                    return (
                                        <Card key={record.id} className="group hover:border-primary/30 transition-all duration-300 shadow-sm">
                                            <CardContent className="p-0">
                                                <div
                                                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                                                    onClick={() => record.absentCount > 0 && toggleExpand(record.id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${record.session === 'morning'
                                                                ? 'bg-amber-100 text-amber-600'
                                                                : 'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {record.session === 'morning' ? <Sun className="w-6 h-6" /> : <Sunset className="w-6 h-6" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-base text-foreground">{record.className}</h3>
                                                                <Badge variant="outline" className="capitalize text-[10px] px-2 py-0.5 rounded-md">
                                                                    {record.session}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                                <Users className="w-3 h-3" />
                                                                <span>Taken by {record.teacherName}</span>
                                                                <span className="text-xs px-1">•</span>
                                                                <span>{format(new Date(record.submittedAt), 'h:mm a')}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-6 pl-16 sm:pl-0">
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-1">Present</p>
                                                            <span className="text-lg font-bold text-success">{record.presentCount}</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-1">Absent</p>
                                                            <span className={`text-lg font-bold ${record.absentCount > 0 ? 'text-destructive' : 'text-muted'}`}>
                                                                {record.absentCount}
                                                            </span>
                                                        </div>
                                                        {record.absentCount > 0 && (
                                                            <div className={`w-8 h-8 rounded-full bg-muted/10 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-primary/10 text-primary' : ''}`}>
                                                                <ChevronRight className="w-4 h-4" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 border-t border-border' : 'max-h-0'}`}>
                                                    <div className="p-5 bg-pink-50/50">
                                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-destructive">
                                                            <XCircle className="w-4 h-4" />
                                                            Absent Students List
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {record.absentStudents.map((student) => (
                                                                <div key={student.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border/50 text-sm shadow-sm">
                                                                    <span className="font-medium text-foreground">{student.name}</span>
                                                                    <Badge variant="secondary" className="text-[10px]">
                                                                        Roll #{student.roll_number}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right Column: Class Status Grid */}
                    {!studentId && classStatuses.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-primary" />
                                Class Status Overview
                            </h2>
                            <Card className="h-fit shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold">Today's Progress</CardTitle>
                                        <Badge variant="secondary">
                                            {classStatuses.filter(c => c.morningTaken && c.afternoonTaken).length}/{classStatuses.length} Complete
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        {classStatuses.map((cls) => {
                                            const isComplete = cls.morningTaken && cls.afternoonTaken;
                                            const isPartial = (cls.morningTaken || cls.afternoonTaken) && !isComplete;

                                            // 3-color status system
                                            let statusColor = "bg-red-100 text-red-700 border-red-300"; // Missing

                                            if (isComplete) {
                                                statusColor = "bg-emerald-100 text-emerald-700 border-emerald-300"; // Complete
                                            } else if (isPartial) {
                                                statusColor = "bg-amber-100 text-amber-700 border-amber-300"; // Partial
                                            }

                                            return (
                                                <div
                                                    key={cls.id}
                                                    className={`
                                                        p-2 rounded-lg border-2 flex items-center justify-between transition-all hover:scale-105
                                                        ${statusColor}
                                                    `}
                                                    title={`Morning: ${cls.morningTaken ? 'Taken' : 'Missing'}, Afternoon: ${cls.afternoonTaken ? 'Taken' : 'Missing'}`}
                                                >
                                                    <span className="text-xs font-bold">{cls.name}</span>
                                                    <div className="flex gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${cls.morningTaken ? 'bg-emerald-600' : 'bg-red-400'}`} title="Morning"></div>
                                                        <div className={`w-2 h-2 rounded-full ${cls.afternoonTaken ? 'bg-emerald-600' : 'bg-red-400'}`} title="Afternoon"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-4 pt-4 border-t flex gap-4 text-[11px] font-medium text-muted-foreground justify-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-600"></div> Complete
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-amber-600"></div> Partial
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3 h-3 rounded-full bg-red-400 border-2 border-red-500"></div> Missing
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}