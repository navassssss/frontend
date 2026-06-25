import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Sun,
    Sunset,
    Search,
    X,
    Check,
    Users,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
import { format } from 'date-fns';
import api from '@/lib/api';

interface ClassData {
    id: number;
    name: string;
    studentCount: number;
}

interface StudentData {
    id: number;
    name: string;
    roll_number: string;
}
export default function TakeAttendancePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const { user } = useAuth();

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');

    const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>('morning');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [absentStudents, setAbsentStudents] = useState<{ id: number, reason: string }[]>([]);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);

    const selectedClassInfo = classes.find(c => c.id.toString() === selectedClass);

    useEffect(() => {
        loadClasses();
        if (editId) {
            loadEditData();
        }
    }, [editId]);

    useEffect(() => {
        if (selectedClass) {
            loadStudents();
            checkDuplicate();
        }
    }, [selectedClass, selectedDate, selectedSession]);

    const loadClasses = async () => {
        try {
            const { data } = await api.get('/attendance/classes');
            setClasses(data);
        } catch (error) {
            toast.error('Failed to load classes');
        }
    };

    const loadStudents = async (classId?: string) => {
        try {
            const { data } = await api.get(`/classes/${classId || selectedClass}/students`);
            setStudents(data);
            if (!editId) setAbsentStudents([]);
        } catch (error) {
            toast.error('Failed to load students');
        }
    };

    const loadEditData = async () => {
        try {
            const { data } = await api.get(`/attendance/${editId}`);
            setSelectedClass(data.classId?.toString() || '');
            setSelectedDate(data.date);
            setSelectedSession(data.session);
            
            // load students for that class
            const { data: studentsData } = await api.get(`/classes/${data.classId}/students`);
            setStudents(studentsData);

            // Populate absentees
            const absent = data.records
                .filter((r: any) => r.status === 'absent')
                .map((r: any) => ({
                    id: r.studentId,
                    reason: r.reason || ''
                }));
            setAbsentStudents(absent);
        } catch (error) {
            toast.error('Failed to load edit data');
        }
    }

    const checkDuplicate = async () => {
        try {
            const { data } = await api.post('/attendance/check', {
                class_id: selectedClass,
                date: selectedDate,
                session: selectedSession
            });
            setDuplicateError(data.exists);
        } catch (error) {
            console.error('Check failed', error);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return [];
        const query = searchQuery.toLowerCase();
        return students.filter(s =>
            (s.name && s.name.toLowerCase().includes(query)) ||
            (s.roll_number && s.roll_number.includes(query))
        ).slice(0, 5);
    }, [students, searchQuery]);

    const addAbsent = (studentId: number) => {
        if (!absentStudents.some(s => s.id === studentId)) {
            setAbsentStudents([...absentStudents, { id: studentId, reason: '' }]);
        }
        setSearchQuery('');
    };

    const removeAbsent = (studentId: number) => {
        setAbsentStudents(absentStudents.filter(s => s.id !== studentId));
    };

    const updateReason = (studentId: number, reason: string) => {
        setAbsentStudents(prev => prev.map(s => s.id === studentId ? { ...s, reason } : s));
    };

    const handleSubmit = async () => {
        if (!selectedClass || !selectedClassInfo) {
            toast.error('Please select a class');
            return;
        }

        if (duplicateError && !editId) {
            toast.error('Attendance already taken for this session');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editId) {
                await api.put(`/attendance/${editId}`, {
                    absent_students: absentStudents
                });
                toast.success('Attendance updated successfully');
            } else {
                await api.post('/attendance', {
                    class_id: selectedClass,
                    date: selectedDate,
                    session: selectedSession,
                    absent_students: absentStudents
                });
                toast.success('Attendance submitted successfully');
            }
            navigate('/attendance');
        } catch (error) {
            toast.error(editId ? 'Failed to update attendance' : 'Failed to submit attendance');
        } finally {
            setIsSubmitting(false);
        }
    };

    const absentStudentDetails = students.filter(s => absentStudents.some(abs => abs.id === s.id));
    const presentCount = selectedClassInfo ? selectedClassInfo.studentCount - absentStudents.length : 0;

    return (
        <AppLayout title="Take Attendance" showBack={false}>
            <div className="p-4 lg:p-6 space-y-6 pb-24 max-w-2xl mx-auto">
                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/attendance')}
                        className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shadow-sm"
                    >
                        <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Attendance Entry</h2>
                        <p className="text-[11px] text-muted-foreground">Mark student attendance</p>
                    </div>
                </div>

                {/* Class Selection */}
                <div className="space-y-2">
                    <Label>Select Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!!editId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Choose a class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name} ({cls.studentCount} students)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                        type="date"
                        value={selectedDate}
                        disabled={!!editId}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>

                {/* Session Selection */}
                <div className="space-y-2">
                    <Label>Session</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant={selectedSession === 'morning' ? 'default' : 'outline'}
                            className="h-14"
                            disabled={!!editId}
                            onClick={() => setSelectedSession('morning')}
                        >
                            <Sun className="w-5 h-5 mr-2" />
                            Morning
                        </Button>
                        <Button
                            variant={selectedSession === 'afternoon' ? 'default' : 'outline'}
                            className="h-14"
                            disabled={!!editId}
                            onClick={() => setSelectedSession('afternoon')}
                        >
                            <Sunset className="w-5 h-5 mr-2" />
                            Afternoon
                        </Button>
                    </div>
                </div>

                {/* Duplicate Error */}
                {duplicateError && !editId && (
                    <Card className="border-destructive bg-destructive/10">
                        <CardContent className="p-4 flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-destructive" />
                            <p className="text-sm text-destructive">
                                Attendance already taken for this class, date, and session
                            </p>
                        </CardContent>
                    </Card>
                )}

                        {/* Attendance Toggles Section */}
                        {selectedClass && (!duplicateError || !!editId) && (
                            <>
                                <Card className="border-primary/20 shadow-md">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Users className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-bold text-foreground">
                                                        Class {selectedClassInfo?.name}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Tap a student to toggle their attendance status
                                                </p>
                                            </div>
                                            <div className="flex gap-2 bg-muted/50 p-1.5 rounded-lg border">
                                                <div className="px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium text-sm flex flex-col items-center min-w-[4rem]">
                                                    <span className="text-lg font-bold leading-none mb-1">{presentCount}</span>
                                                    <span className="text-[10px] uppercase tracking-wider">Present</span>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive font-medium text-sm flex flex-col items-center min-w-[4rem]">
                                                    <span className="text-lg font-bold leading-none mb-1">{absentStudents.length}</span>
                                                    <span className="text-[10px] uppercase tracking-wider">Absent</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Search/Filter for Grid */}
                                        <div className="relative mb-6">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Filter students by name or roll number..."
                                                className="pl-10 bg-background"
                                            />
                                        </div>

                                        {/* Students Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {(searchQuery ? filteredStudents : students).map((student) => {
                                                const isAbsent = absentStudents.some(abs => abs.id === student.id);
                                                return (
                                                    <button
                                                        key={student.id}
                                                        type="button"
                                                        onClick={() => isAbsent ? removeAbsent(student.id) : addAbsent(student.id)}
                                                        className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center text-center gap-2 overflow-hidden ${
                                                            isAbsent
                                                                ? 'border-destructive/40 bg-destructive/5 hover:bg-destructive/10'
                                                                : 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/40'
                                                        }`}
                                                    >
                                                        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${isAbsent ? 'bg-destructive' : 'bg-emerald-500'}`} />
                                                        
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mt-2 mb-1 transition-colors ${
                                                            isAbsent ? 'bg-destructive/10 text-destructive' : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                                                        }`}>
                                                            {isAbsent ? <X className="w-6 h-6" /> : <Check className="w-6 h-6" />}
                                                        </div>
                                                        
                                                        <div className="w-full">
                                                            <p className={`font-bold text-sm leading-tight truncate ${isAbsent ? 'text-destructive' : 'text-foreground'}`}>
                                                                {student.name}
                                                            </p>
                                                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                                                Roll: {student.roll_number || '-'}
                                                            </p>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        {students.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No students found in this class.
                                            </div>
                                        )}
                                        {searchQuery && filteredStudents.length === 0 && students.length > 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No students match your search.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Absent Students List (for reasons) */}
                                {absentStudentDetails.length > 0 && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                        <div className="flex items-center gap-2 px-1">
                                            <AlertCircle className="w-4 h-4 text-destructive" />
                                            <Label className="text-destructive font-semibold">Absentee Details ({absentStudentDetails.length})</Label>
                                        </div>
                                        <div className="grid gap-2">
                                            {absentStudentDetails.map((student) => (
                                                <Card key={student.id} className="border-destructive/20 bg-destructive/5 overflow-hidden">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-destructive truncate">{student.name}</p>
                                                            <p className="text-[11px] text-muted-foreground">Roll: {student.roll_number}</p>
                                                        </div>
                                                        <div className="flex-1 max-w-md w-full relative">
                                                            <Input
                                                                placeholder="Reason for absence (Optional)"
                                                                value={absentStudents.find(s => s.id === student.id)?.reason || ''}
                                                                onChange={(e) => updateReason(student.id, e.target.value)}
                                                                className="h-9 text-sm bg-background border-destructive/20 focus-visible:ring-destructive/30 pr-10"
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeAbsent(student.id)}
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}

                        {/* Submit Button */}
                        <Button
                            variant="touch"
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={isSubmitting || (duplicateError && !editId)}
                        >
                            <Check className="w-5 h-5 mr-2" />
                            {isSubmitting ? (editId ? 'Updating...' : 'Submitting...') : (editId ? 'Update Attendance' : 'Submit Attendance')}
                        </Button>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
