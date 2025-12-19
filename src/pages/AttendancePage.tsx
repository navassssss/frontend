import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    Clock,
    Users,
    CheckCircle,
    XCircle,
    Plus,
    ChevronRight,
    Sun,
    Sunset
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
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

export default function AttendancePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager';
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadRecords();
    }, [selectedDate]);

    const loadRecords = async () => {
        try {
            const { data } = await api.get(`/attendance?date=${selectedDate}`);
            setRecords(data);
        } catch (error) {
            console.error('Failed to load records', error);
        }
    };

    const toggleExpand = (recordId: number) => {
        setExpandedRecords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(recordId)) {
                newSet.delete(recordId);
            } else {
                newSet.add(recordId);
            }
            return newSet;
        });
    };

    const todayStats = {
        totalPresent: records.reduce((sum, r) => sum + r.presentCount, 0),
        totalAbsent: records.reduce((sum, r) => sum + r.absentCount, 0)
    };

    return (
        <AppLayout title="Attendance" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Date Selector */}
                <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-primary" />
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="flex-1 px-4 py-2 bg-card border border-border rounded-xl text-foreground"
                    />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <Card variant="stat">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-success">{todayStats.totalPresent}</p>
                                    <p className="text-xs text-muted-foreground">Present Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                    <XCircle className="w-5 h-5 text-destructive" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-destructive">{todayStats.totalAbsent}</p>
                                    <p className="text-xs text-muted-foreground">Absent Today</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Take Attendance Button */}
                <Button
                    variant="touch"
                    className="w-full"
                    onClick={() => navigate('/attendance/take')}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Take Attendance
                </Button>

                {/* Today's Records */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Records for {format(new Date(selectedDate), 'MMM d, yyyy')}
                    </h3>

                    {records.length === 0 ? (
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No attendance records for this date</p>
                            </CardContent>
                        </Card>
                    ) : (
                        records
                            .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                            .map((record) => {
                                const isExpanded = expandedRecords.has(record.id);
                                return (
                                    <Card key={record.id} variant="elevated">
                                        <CardContent className="p-4">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => record.absentCount > 0 && toggleExpand(record.id)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.session === 'morning'
                                                        ? 'bg-accent/10'
                                                        : 'bg-warning/10'
                                                        }`}>
                                                        {record.session === 'morning'
                                                            ? <Sun className="w-5 h-5 text-accent" />
                                                            : <Sunset className="w-5 h-5 text-warning" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-foreground">{record.className}</p>
                                                        <p className="text-sm text-muted-foreground capitalize">
                                                            {record.session} Session
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="success">{record.presentCount}P</Badge>
                                                        <Badge variant="destructive">{record.absentCount}A</Badge>
                                                        {record.absentCount > 0 && (
                                                            <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {record.teacherName}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Absent Students List */}
                                            {isExpanded && record.absentStudents.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-border">
                                                    <p className="text-sm font-medium text-muted-foreground mb-2">
                                                        Absent Students:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {record.absentStudents.map((student) => (
                                                            <div
                                                                key={student.id}
                                                                className="flex items-center justify-between p-2 bg-destructive/5 rounded-lg"
                                                            >
                                                                <span className="text-sm text-foreground">{student.name}</span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    Roll: {student.roll_number}
                                                                </Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}