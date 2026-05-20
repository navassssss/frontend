import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
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
    Filter,
    Edit,
    Trash2
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
        reason?: string;
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
    const [sessionFilter, setSessionFilter] = useState<'morning' | 'afternoon'>(() => {
        const hour = new Date().getHours();
        return hour >= 13 ? 'afternoon' : 'morning';
    });

    const canManage = user?.role === 'principal' || user?.permissions?.some(p => p.name === 'manage_attendance');

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
                            roll_number: '',
                            reason: r.remarks || r.reason
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

    const handleDelete = async (recordId: number) => {
        if (!window.confirm('Are you sure you want to permanently delete this attendance sheet?')) return;
        try {
            await api.delete(`/attendance/${recordId}`);
            toast.success('Attendance record deleted');
            loadRecords();
            loadClassStatuses();
        } catch (error) {
            toast.error('Failed to delete record');
        }
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
            <div className="p-4 lg:p-6 space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold text-foreground">Attendance Overview</h1>
                        <p className="text-muted-foreground text-[11px]">
                            {studentId && studentName ? `Viewing records for ${studentName}` : "Manage and view daily attendance"}
                        </p>
                    </div>

                    {/* Improved Date Navigation */}
                    <div className="flex items-center justify-center bg-card border border-border rounded-xl p-1 shadow-sm mx-auto md:mx-0 w-fit">
                        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8 shrink-0">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex items-center justify-center gap-2 px-2 sm:px-3 border-x border-border mx-1 min-w-[120px]">
                            <CalendarIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-[13px] font-medium w-auto cursor-pointer p-0"
                            />
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => changeDate(1)} className="h-8 w-8 shrink-0">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    {!studentId && (
                        <Button
                            onClick={() => navigate('/attendance/take')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-105 w-full md:w-auto"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Take New Attendance
                        </Button>
                    )}
                </div>

                <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start flex flex-col gap-6">
                    {/* Main Content Area: Submission History */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-3 order-2 lg:order-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <h2 className="text-[13px] font-semibold flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Attendance Records
                                <Badge variant="outline" className="text-[10px] font-normal ml-2">
                                    {records.filter(r => r.session === sessionFilter).length} Records Found
                                </Badge>
                            </h2>

                            {/* Filter Options */}
                            <div className="flex items-center gap-2 self-start sm:self-auto bg-muted/30 p-1 rounded-lg border border-border">
                                <Button
                                    variant={sessionFilter === 'morning' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSessionFilter('morning')}
                                    className="h-7 rounded-md"
                                >
                                    <Sun className="w-3 h-3 mr-1.5" /> Morning
                                </Button>
                                <Button
                                    variant={sessionFilter === 'afternoon' ? 'default' : 'ghost'}
                                    size="sm"
                                    onClick={() => setSessionFilter('afternoon')}
                                    className="h-7 rounded-md"
                                >
                                    <Sunset className="w-3 h-3 mr-1.5" /> Afternoon
                                </Button>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-3`}>
                            {(sessionFilter === 'morning') && (
                                <>
                                    {/* Morning Present - Amber theme */}
                                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <Sun className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Present</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-amber-700">{todayStats.morningPresent}</span>
                                                    <span className="text-[11px] text-teal-600 font-semibold">Students</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Morning Absent - Pink theme */}
                                    <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100 shadow-sm hover:shadow-md transition-all">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <Sun className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-pink-900 uppercase tracking-wider">Absent</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-pink-700">{todayStats.morningAbsent}</span>
                                                    <span className="text-[11px] text-teal-600 font-semibold">Students</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}

                            {(sessionFilter === 'afternoon') && (
                                <>
                                    {/* Afternoon Present - Amber theme */}
                                    <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100 shadow-sm hover:shadow-md transition-all">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <Sunset className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Present</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-amber-700">{todayStats.afternoonPresent}</span>
                                                    <span className="text-[11px] text-teal-600 font-semibold">Students</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Afternoon Absent - Pink theme */}
                                    <Card className="bg-gradient-to-br from-pink-50 to-white border-pink-100 shadow-sm hover:shadow-md transition-all">
                                        <CardContent className="p-3 flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                                                <Sunset className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-pink-900 uppercase tracking-wider">Absent</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xl font-bold text-pink-700">{todayStats.afternoonAbsent}</span>
                                                    <span className="text-[11px] text-teal-600 font-semibold">Students</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-24 bg-muted/20 animate-pulse rounded-xl" />
                                ))}
                            </div>
                        ) : records.filter(r => r.session === sessionFilter).length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CalendarIcon className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No Records Found</h3>
                                    <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
                                        No {sessionFilter} attendance records found.
                                    </p>
                                    {!studentId && (
                                        <Button onClick={() => navigate('/attendance/take')} className="mt-4" variant="outline">
                                            Start Marking
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {records.filter(r => r.session === sessionFilter).map((record) => {
                                    const isExpanded = expandedRecords.has(record.id);
                                    return (
                                        <Card key={record.id} className="group hover:border-primary/30 transition-all duration-300 shadow-sm">
                                            <CardContent className="p-0">
                                                <div
                                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                                                    onClick={() => record.absentCount > 0 && toggleExpand(record.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${record.session === 'morning'
                                                            ? 'bg-amber-100 text-amber-600'
                                                            : 'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {record.session === 'morning' ? <Sun className="w-4 h-4" /> : <Sunset className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-semibold text-sm text-foreground">{record.className}</h3>
                                                                <Badge variant="outline" className="capitalize text-[10px] px-2 py-0.5 rounded-md">
                                                                    {record.session}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
                                                                <Users className="w-3 h-3" />
                                                                <span>Taken by {record.teacherName}</span>
                                                                <span className="text-[10px] px-1">•</span>
                                                                <span>{format(new Date(record.submittedAt), 'h:mm a')}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0">
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-bold text-success uppercase tracking-wider mb-0.5">Present</p>
                                                            <span className="text-lg font-bold text-success">{record.presentCount}</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-[10px] font-bold text-destructive uppercase tracking-wider mb-0.5">Absent</p>
                                                            <span className={`text-lg font-bold ${record.absentCount > 0 ? 'text-destructive' : 'text-muted'}`}>
                                                                {record.absentCount}
                                                            </span>
                                                        </div>
                                                        {record.absentCount > 0 && (
                                                            <div className={`w-7 h-7 rounded-full bg-muted/10 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-90 bg-primary/10 text-primary' : ''}`}>
                                                                <ChevronRight className="w-3.5 h-3.5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 border-t border-border' : 'max-h-0'}`}>
                                                    <div className="p-4 bg-pink-50/50">
                                                        <h4 className="text-[13px] font-semibold mb-3 flex items-center gap-2 text-destructive">
                                                            <XCircle className="w-4 h-4" />
                                                            Absent Students List
                                                        </h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {(Array.isArray(record.absentStudents) ? record.absentStudents : []).map((student) => (
                                                                <div key={student.id} className="flex flex-col md:flex-row md:items-center gap-2 p-2.5 bg-background rounded-lg border border-border/50 text-sm shadow-sm">
                                                                    <div className="flex items-center justify-between md:w-auto md:shrink-0">
                                                                        <span className="font-medium text-foreground md:min-w-[120px] pr-2">{student.name}</span>
                                                                        <Badge variant="secondary" className="text-[10px] md:hidden">
                                                                            Roll #{student.roll_number}
                                                                        </Badge>
                                                                    </div>
                                                                    {student.reason && (
                                                                        <div className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border-l-2 border-primary/40 truncate flex-1">
                                                                            Reason: <span className="italic">{student.reason}</span>
                                                                        </div>
                                                                    )}
                                                                    <Badge variant="secondary" className="text-[10px] hidden md:inline-flex ml-auto shrink-0">
                                                                        Roll #{student.roll_number}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Edit / Delete Actions (Bottom Bar) */}
                                                {!studentId && canManage && (
                                                    <div className="bg-muted/10 px-4 py-2 border-t border-border flex items-center justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-muted-foreground hover:text-primary h-8 text-[11px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(`/attendance/take?edit=${record.id}`);
                                                            }}
                                                        >
                                                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 text-[11px]"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(record.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Class Status Overview - Sidebar */}
                    {!studentId && classStatuses.length > 0 && (
                        <div className="lg:col-span-4 xl:col-span-3 space-y-3 order-1 lg:order-2 lg:sticky lg:top-6">
                            <h2 className="text-[13px] font-semibold flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-primary" />
                                Class Status Overview
                            </h2>
                            <Card className="h-fit shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[13px] font-semibold">Today's Progress</CardTitle>
                                        <Badge variant="secondary">
                                            {classStatuses.filter(c => c.morningTaken && c.afternoonTaken).length}/{classStatuses.length} Complete
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 gap-2">
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
                                                    className={`p-2 rounded-lg border-2 flex items-center justify-between transition-all hover:scale-105 ${statusColor}`}
                                                    title={`Morning: ${cls.morningTaken ? 'Taken' : 'Missing'}, Afternoon: ${cls.afternoonTaken ? 'Taken' : 'Missing'}`}
                                                >
                                                    <span className="text-[11px] font-bold truncate pr-1">{cls.name}</span>
                                                    <div className="flex gap-1 shrink-0">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${cls.morningTaken ? 'bg-emerald-600' : 'bg-red-400'}`} title="Morning"></div>
                                                        <div className={`w-1.5 h-1.5 rounded-full ${cls.afternoonTaken ? 'bg-emerald-600' : 'bg-red-400'}`} title="Afternoon"></div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="mt-3 pt-3 border-t flex flex-wrap gap-3 text-[10px] font-medium text-muted-foreground justify-center">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-emerald-600"></div> Complete
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-amber-600"></div> Partial
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-400 border-2 border-red-500"></div> Missing
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