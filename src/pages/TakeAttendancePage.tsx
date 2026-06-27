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
        <AppLayout title="Take Attendance" showBack={true} hideBottomNav={true}>
            <div className="p-4 lg:p-6 space-y-6 pb-24 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Session Selection */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground ml-1">Select Session</Label>
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
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Users className="w-5 h-5 text-primary" />
                                                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                                        {selectedClassInfo?.name}
                                                        <span className="text-muted-foreground font-normal text-sm border-l pl-2 border-border/50">
                                                            {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </span>
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-7 text-xs">
                                                    Present <span key={presentCount} className="font-bold ml-1.5 text-sm animate-in zoom-in duration-300 inline-block">{presentCount}</span>
                                                </Badge>
                                                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 h-7 text-xs">
                                                    Absent <span key={absentStudents.length} className="font-bold ml-1.5 text-sm animate-in zoom-in duration-300 inline-block">{absentStudents.length}</span>
                                                </Badge>
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
                                        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 rounded-md border p-1" id="attendance-card">
                                            {/* Header Row */}
                                            <div className="flex items-center px-3 py-2 text-xs font-semibold text-muted-foreground bg-secondary dark:bg-secondary/95 border-b rounded-md sticky top-0 z-10 shadow-sm gap-3">
                                                <div className="w-6 shrink-0"></div>
                                                <div className="w-10 shrink-0 text-right pr-2">Roll</div>
                                                <div className="flex-1">Name</div>
                                            </div>
                                            
                                            {(searchQuery ? filteredStudents : students).map((student) => {
                                                const isAbsent = absentStudents.some(abs => abs.id === student.id);
                                                return (
                                                    <div 
                                                        key={student.id} 
                                                        onClick={() => isAbsent ? removeAbsent(student.id) : addAbsent(student.id)}
                                                        className="flex items-center px-3 py-2 rounded-md transition-colors border-b last:border-0 cursor-pointer hover:bg-muted/50 group"
                                                    >
                                                        <div className="flex items-center w-full flex-1 gap-3">
                                                            {/* Checkbox / Toggle */}
                                                            <div className="w-6 shrink-0 flex justify-center">
                                                                <div className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 ${
                                                                    !isAbsent ? 'bg-emerald-500 text-white scale-100 shadow-sm' : 'border-2 border-muted-foreground/30 bg-background text-transparent group-hover:border-destructive/50'
                                                                }`}>
                                                                    {!isAbsent && <Check className="w-3.5 h-3.5" />}
                                                                    {isAbsent && <X className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 text-destructive" />}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Info */}
                                                            <div className="w-10 shrink-0 text-sm font-bold text-muted-foreground text-right pr-2">
                                                                {student.roll_number || '-'}
                                                            </div>
                                                            <div className={`flex-1 text-[15px] font-bold transition-colors ${isAbsent ? 'text-destructive' : 'text-foreground'}`}>
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
                <DialogContent className="sm:max-w-md w-[90vw] max-w-[400px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Submit Attendance?</DialogTitle>
                    </DialogHeader>
                    
                    <div className="py-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold text-sm">
                                {selectedClassInfo?.name} • {new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10">
                                {absentStudents.length} students marked absent
                            </Badge>
                        </div>
                        
                        <div className="bg-card rounded-md border max-h-[40vh] overflow-y-auto">
                            {absentStudents.length === 0 ? (
                                <div className="p-6 text-center text-sm font-medium text-muted-foreground flex flex-col items-center justify-center">
                                    <Check className="w-8 h-8 text-emerald-500 mb-2" />
                                    All students are marked present.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/50">
                                    {students.filter(s => absentStudents.some(abs => abs.id === s.id)).map(student => (
                                        <div key={student.id} className="p-3 flex gap-3 items-center bg-background hover:bg-muted/50 transition-colors">
                                            <span className="w-8 shrink-0 text-sm font-bold text-muted-foreground text-right">{student.roll_number || '-'}</span>
                                            <span className="font-bold text-[15px] text-destructive flex-1">{student.name}</span>
                                            <X className="w-4 h-4 text-destructive shrink-0" />
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
