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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
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
const getCurrentSession = (): 'morning' | 'afternoon' => {
    const currentHour = new Date().getHours();
    return (currentHour >= 6 && currentHour < 13) ? 'morning' : 'afternoon';
};

export default function TakeAttendancePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('edit');
    const prefilledClass = searchParams.get('class');
    const { user } = useAuth();

    const [classes, setClasses] = useState<ClassData[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>(prefilledClass || '');

    const [selectedSession, setSelectedSession] = useState<'morning' | 'afternoon'>(getCurrentSession());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [searchQuery, setSearchQuery] = useState('');
    const [absentStudents, setAbsentStudents] = useState<{ id: number, reason: string }[]>([]);
    const [students, setStudents] = useState<StudentData[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [duplicateError, setDuplicateError] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

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

    const handleSubmit = async () => {
        if (!selectedClass || !selectedClassInfo) {
            toast.error('Please select a class');
            return;
        }

        if (duplicateError && !editId) {
            toast.error('Attendance already taken for this session');
            return;
        }

        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
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
            setShowConfirmModal(false);
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

                {/* Class & Date Selection in One Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Select Class</Label>
                        <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!!editId}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Choose class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {cls.name} ({cls.studentCount})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input
                            type="date"
                            value={selectedDate}
                            disabled={!!editId}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="h-10 w-full px-2"
                        />
                    </div>
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
                                                    Uncheck a student to mark them as absent.
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

                                        {/* Search/Filter for List */}
                                        <div className="relative mb-4">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search student..."
                                                className="pl-10 bg-background h-9"
                                            />
                                        </div>

                                        {/* Compact Student List */}
                                        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 rounded-md border p-1">
                                            {/* Header Row */}
                                            <div className="flex items-center px-3 py-2 text-xs font-semibold text-muted-foreground bg-secondary dark:bg-secondary/95 border-b rounded-md sticky top-0 z-10 shadow-sm">
                                                <div className="w-8 shrink-0 flex justify-center">Status</div>
                                                <div className="w-12 shrink-0 ml-2">Roll</div>
                                                <div className="flex-1">Name</div>
                                                
                                            </div>
                                            
                                            {(searchQuery ? filteredStudents : students).map((student) => {
                                                const isAbsent = absentStudents.some(abs => abs.id === student.id);
                                                return (
                                                    <div 
                                                        key={student.id} 
                                                        className={`flex flex-col sm:flex-row sm:items-center px-3 py-2 rounded-md transition-colors border-b last:border-0 ${
                                                            isAbsent ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center w-full sm:w-auto flex-1">
                                                            {/* Checkbox / Toggle */}
                                                            <div className="w-8 shrink-0 flex justify-center cursor-pointer" onClick={() => isAbsent ? removeAbsent(student.id) : addAbsent(student.id)}>
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                                    !isAbsent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-input bg-background text-transparent'
                                                                }`}>
                                                                    <Check className="w-3.5 h-3.5" />
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Info */}
                                                            <div className="w-12 shrink-0 text-sm font-medium text-muted-foreground ml-2 sm:ml-0">
                                                                {student.roll_number || '-'}
                                                            </div>
                                                            <div className={`flex-1 text-sm font-medium ${isAbsent ? 'text-destructive line-through opacity-70' : 'text-foreground'}`}>
                                                                {student.name}
                                                            </div>
                                                        </div>

                                                    </div>
                                                );
                                            })}
                                            
                                            {students.length === 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">
                                                    No students found in this class.
                                                </div>
                                            )}
                                            {searchQuery && filteredStudents.length === 0 && students.length > 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">
                                                    No students match your search.
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

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

            {/* Confirmation Modal */}
            <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
                <DialogContent className="sm:max-w-md w-[90vw] max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Confirm Attendance</DialogTitle>
                        <DialogDescription>
                            Review the list of absent students before submitting.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-sm">Class {selectedClassInfo?.name}</span>
                            <div className="flex gap-2">
                                <Badge variant="success">{presentCount} Present</Badge>
                                <Badge variant="destructive">{absentStudents.length} Absent</Badge>
                            </div>
                        </div>
                        
                        <div className="bg-muted/30 rounded-md border max-h-[40vh] overflow-y-auto">
                            {absentStudents.length === 0 ? (
                                <div className="p-6 text-center text-sm font-medium text-muted-foreground flex flex-col items-center justify-center">
                                    <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                    All students are marked present.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {students.filter(s => absentStudents.some(abs => abs.id === s.id)).map(student => (
                                        <div key={student.id} className="p-3 flex justify-between items-center bg-destructive/5 hover:bg-destructive/10 transition-colors">
                                            <span className="font-medium text-sm text-destructive">{student.name}</span>
                                            <span className="text-[10px] text-muted-foreground border bg-background/50 px-2 py-0.5 rounded shadow-sm">Roll: {student.roll_number || '-'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-row justify-end gap-2 sm:gap-2 mt-4">
                        <Button type="button" variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting} className="w-full sm:w-auto">
                            Cancel
                        </Button>
                        <Button type="button" variant="touch" onClick={confirmSubmit} disabled={isSubmitting} className="w-full sm:w-auto bg-primary text-primary-foreground">
                            {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
