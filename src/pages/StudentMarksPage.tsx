import React, { useState, useEffect } from 'react';
import {
    Users,
    Award,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import api from '@/lib/api';

interface SubjectMark {
    subjectName: string;
    obtained: number;
    total: number;
    percentage: number;
}

interface StudentMark {
    studentId: number;
    studentName: string;
    rollNumber: string;
    className: string;
    subjectMarks: Record<string, SubjectMark>;
    totalObtained: number;
    totalMarks: number;
    overallPercentage: number;
}

interface ClassRoom {
    id: number;
    name: string;
}

export default function StudentMarksPage() {
    const [students, setStudents] = useState<StudentMark[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        loadStudentMarks();
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            const { data } = await api.get('/classes');
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadStudentMarks = async () => {
        setLoading(true);
        try {
            const params = selectedClass !== 'all' ? { class_id: selectedClass } : {};
            const { data } = await api.get('/cce/student-marks', { params });
            setStudents(data);
        } catch (error) {
            console.error('Failed to load student marks', error);
        } finally {
            setLoading(false);
        }
    };

    // Get all unique subjects
    const allSubjects = Array.from(
        new Set(
            students.flatMap(s =>
                Object.values(s.subjectMarks).map((m: SubjectMark) => m.subjectName)
            )
        )
    );

    return (
        <AppLayout title="Student Marks" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Class Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Class</label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                    {cls.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-primary">{students.length}</p>
                            <p className="text-xs text-muted-foreground">Students</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-success">{allSubjects.length}</p>
                            <p className="text-xs text-muted-foreground">Subjects</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-warning">
                                {students.length > 0
                                    ? Math.round(students.reduce((sum, s) => sum + s.overallPercentage, 0) / students.length)
                                    : 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Avg</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Students List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Student Performance
                    </h3>

                    {loading ? (
                        <p className="text-center text-muted-foreground">Loading...</p>
                    ) : students.length === 0 ? (
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No student data available</p>
                            </CardContent>
                        </Card>
                    ) : (
                        students.map((student) => (
                            <Card key={student.studentId} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-foreground">{student.studentName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Roll: {student.rollNumber} • {student.className}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                student.overallPercentage >= 75 ? 'success' :
                                                    student.overallPercentage >= 50 ? 'warning' :
                                                        'destructive'
                                            }
                                        >
                                            {student.overallPercentage}%
                                        </Badge>
                                    </div>

                                    {/* Subject-wise breakdown */}
                                    <div className="space-y-2">
                                        {Object.values(student.subjectMarks).map((subject: SubjectMark, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{subject.subjectName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-foreground font-medium">
                                                        {subject.obtained}/{subject.total}
                                                    </span>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            subject.percentage >= 75 ? 'border-success text-success' :
                                                                subject.percentage >= 50 ? 'border-warning text-warning' :
                                                                    'border-destructive text-destructive'
                                                        }
                                                    >
                                                        {subject.percentage}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Total */}
                                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                                        <span className="font-semibold text-foreground flex items-center gap-1">
                                            <Award className="w-4 h-4" />
                                            Total
                                        </span>
                                        <span className="font-bold text-primary">
                                            {student.totalObtained}/{student.totalMarks}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
