import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Users,
    Award,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    FileText,
    FileSpreadsheet,
    BookOpen,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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

interface Work {
    id: number;
    title: string;
    max_marks: number;
}

interface Subject {
    id: number;
    name: string;
    max_marks: number;
    works: Work[];
}

interface ClassReportStudent {
    id: number;
    name: string;
    roll_number: string;
    marks: Record<number, number>;
    subject_totals: Record<number, {
        obtained: number;
        total: number;
        percentage: number;
    }>;
    overall_obtained: number;
    overall_total: number;
    overall_percentage: number;
}

interface ClassReportData {
    class: {
        id: number;
        name: string;
    };
    subjects: Subject[];
    students: ClassReportStudent[];
}

export default function StudentMarksPage() {
    const [searchParams] = useSearchParams();
    const studentId = searchParams.get('student_id');
    const [students, setStudents] = useState<StudentMark[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalStats, setTotalStats] = useState({ total_students: 0, total_subjects: 0, average_percentage: 0 });

    // Class Report state
    const [classReportData, setClassReportData] = useState<ClassReportData | null>(null);
    const [loadingClassReport, setLoadingClassReport] = useState(false);
    const [activeTab, setActiveTab] = useState('individual');

    // Refs for scroll synchronization
    const topScrollRef = useRef<HTMLDivElement>(null);
    const tableScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadClasses();
    }, []);

    // Debounce search query
    useEffect(() => {
        console.log('Search query changed:', searchQuery);
        const timer = setTimeout(() => {
            console.log('Setting debounced search to:', searchQuery);
            setDebouncedSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        // Reset when class, student, or debounced search changes
        console.log('Filters changed - Class:', selectedClass, 'Student:', studentId, 'Search:', debouncedSearch);
        setStudents([]);
        setCurrentPage(1);
        loadStudentMarks(1, true);

        // Load class report if a specific class is selected
        if (selectedClass !== 'all') {
            loadClassReport();
        } else {
            setClassReportData(null);
        }
    }, [selectedClass, studentId, debouncedSearch]);

    const loadClasses = async () => {
        try {
            const { data } = await api.get('/attendance/classes');
            console.log('Loaded classes:', data);
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
        }
    };

    const loadStudentMarks = async (page: number = 1, reset: boolean = false) => {
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }

        try {
            const params: any = {
                page,
                per_page: 10
            };
            if (selectedClass !== 'all') {
                params.class_id = selectedClass;
            }
            if (studentId) {
                params.student_id = studentId;
            }
            if (debouncedSearch.trim()) {
                params.search = debouncedSearch.trim();
            }

            const { data: response } = await api.get('/cce/student-marks', { params });
            console.log('API Response:', response);
            console.log('Search params:', params);

            if (reset) {
                setStudents(response.data);
                // Update total stats from API
                if (response.stats) {
                    console.log('Stats from API:', response.stats);
                    setTotalStats(response.stats);
                } else {
                    console.log('No stats in response, calculating from data...');
                    // Fallback: calculate stats from all data
                    const allSubjects = new Set<string>();
                    let totalPercentage = 0;

                    response.data.forEach((student: any) => {
                        Object.keys(student.subjectMarks || {}).forEach(subject => {
                            allSubjects.add(subject);
                        });
                        totalPercentage += student.overallPercentage || 0;
                    });

                    const calculatedStats = {
                        total_students: response.total || response.data.length,
                        total_subjects: allSubjects.size,
                        average_percentage: response.data.length > 0
                            ? Math.round(totalPercentage / response.data.length)
                            : 0
                    };
                    console.log('Calculated stats:', calculatedStats);
                    setTotalStats(calculatedStats);
                }
            } else {
                setStudents(prev => [...prev, ...response.data]);
            }

            setCurrentPage(response.current_page);
            setHasMore(response.current_page < response.last_page);
        } catch (error) {
            console.error('Failed to load student marks', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadClassReport = async () => {
        if (selectedClass === 'all') return;

        setLoadingClassReport(true);
        try {
            const { data } = await api.get('/cce/class-report', {
                params: { class_id: selectedClass }
            });
            setClassReportData(data);
        } catch (error) {
            console.error('Failed to load class report', error);
            toast.error('Failed to load class report');
        } finally {
            setLoadingClassReport(false);
        }
    };

    const loadMore = () => {
        loadStudentMarks(currentPage + 1, false);
    };

    const toggleStudent = (studentId: number) => {
        const newExpanded = new Set(expandedStudents);
        if (newExpanded.has(studentId)) {
            newExpanded.delete(studentId);
        } else {
            newExpanded.add(studentId);
        }
        setExpandedStudents(newExpanded);
    };

    // Scroll synchronization handlers
    const handleTopScroll = () => {
        if (topScrollRef.current && tableScrollRef.current) {
            tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        }
    };

    const handleTableScroll = () => {
        if (topScrollRef.current && tableScrollRef.current) {
            topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
        }
    };

    const exportClassReportToPDF = () => {
        if (!classReportData) return;

        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, pageWidth - 20, 20);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('DARUL HASANATH ISLAMIC COLLEGE', pageWidth / 2, 17, { align: 'center' });

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text('CCE MARKS REPORT', pageWidth / 2, 24, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Class: ${classReportData.class.name}`, 14, 38);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 38, { align: 'right' });

        // Build table headers - only subject totals
        const headers: string[] = ['Roll', 'Student Name'];
        classReportData.subjects.forEach(subject => {
            headers.push(subject.name);
        });
        headers.push('Overall\nTotal');
        headers.push('%');

        // Build table body - only subject totals
        const body = classReportData.students.map(student => {
            const row: any[] = [student.roll_number, student.name];

            classReportData.subjects.forEach(subject => {
                const subjectTotal = student.subject_totals[subject.id];
                row.push(subjectTotal ? `${subjectTotal.obtained}/${subjectTotal.total}` : '-');
            });

            row.push(`${student.overall_obtained}/${student.overall_total}`);
            row.push(student.overall_percentage.toFixed(1));

            return row;
        });

        autoTable(doc, {
            startY: 44,
            head: [headers],
            body: body,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.5,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 8,
            },
            bodyStyles: {
                fontSize: 7,
                textColor: [0, 0, 0],
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'center',
            },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 40, halign: 'left' },
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245],
            },
        });

        // Footer with page numbers
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        doc.save(`${classReportData.class.name}_CCE_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF downloaded successfully');
    };

    const exportClassReportToExcel = () => {
        if (!classReportData) return;

        const wb = XLSX.utils.book_new();

        // Build headers - only subject totals
        const headers: string[] = ['Roll', 'Student Name'];
        classReportData.subjects.forEach(subject => {
            headers.push(subject.name);
        });
        headers.push('Overall Total');
        headers.push('Percentage');

        // Build data rows - only subject totals
        const data = classReportData.students.map(student => {
            const row: any[] = [student.roll_number, student.name];

            classReportData.subjects.forEach(subject => {
                const subjectTotal = student.subject_totals[subject.id];
                row.push(subjectTotal ? `${subjectTotal.obtained}/${subjectTotal.total}` : '-');
            });

            row.push(`${student.overall_obtained}/${student.overall_total}`);
            row.push(student.overall_percentage.toFixed(1));

            return row;
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, classReportData.class.name);

        XLSX.writeFile(wb, `${classReportData.class.name}_CCE_Report.xlsx`);
        toast.success('Excel downloaded successfully');
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
                {/* Filters */}
                <div className="space-y-3">
                    {/* Search */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Search</label>
                        <Input
                            placeholder="Search by name or roll number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    {/* Class Filter */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter by Class</label>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.length === 0 && <SelectItem value="loading" disabled>Loading classes...</SelectItem>}
                                {classes.map((cls) => {
                                    console.log('Rendering class:', cls);
                                    return (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>
                                            {cls.name}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-primary">{totalStats.total_students}</p>
                            <p className="text-xs text-muted-foreground">Students</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-success">{totalStats.total_subjects}</p>
                            <p className="text-xs text-muted-foreground">Subjects</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-warning">
                                {Math.round(totalStats.average_percentage)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Avg</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for Individual Students and Class Report */}
                <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="individual">Individual Students</TabsTrigger>
                        <TabsTrigger value="class-report" disabled={selectedClass === 'all'}>
                            Class Report
                        </TabsTrigger>
                    </TabsList>

                    {/* Individual Students Tab */}
                    <TabsContent value="individual" className="space-y-3 mt-4">
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
                            <>
                                {students.map((student) => {
                                    const isExpanded = expandedStudents.has(student.studentId);
                                    return (
                                        <Card key={student.studentId} variant="elevated">
                                            <CardContent className="p-4">
                                                {/* Header - Always Visible */}
                                                <div
                                                    className="flex items-start justify-between cursor-pointer"
                                                    onClick={() => toggleStudent(student.studentId)}
                                                >
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-foreground">{student.studentName}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Roll: {student.rollNumber} • {student.className}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={
                                                                student.overallPercentage >= 75 ? 'success' :
                                                                    student.overallPercentage >= 50 ? 'warning' :
                                                                        'destructive'
                                                            }
                                                        >
                                                            {student.overallPercentage.toFixed(1)}%
                                                        </Badge>
                                                        {isExpanded ? (
                                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                                        ) : (
                                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expandable Details */}
                                                {isExpanded && (
                                                    <div className="mt-4 space-y-3">
                                                        {/* Subject-wise breakdown */}
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase">Subject Details</p>
                                                            {Object.values(student.subjectMarks).map((subject: SubjectMark, idx: number) => (
                                                                <div key={idx} className="bg-muted/30 rounded-lg p-3">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="font-medium text-foreground">{subject.subjectName}</span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={
                                                                                subject.percentage >= 75 ? 'border-success text-success' :
                                                                                    subject.percentage >= 50 ? 'border-warning text-warning' :
                                                                                        'border-destructive text-destructive'
                                                                            }
                                                                        >
                                                                            {subject.percentage.toFixed(1)}%
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Obtained</p>
                                                                            <p className="font-semibold">{subject.obtained}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-xs text-muted-foreground">Total</p>
                                                                            <p className="font-semibold">{subject.total}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Total */}
                                                        <div className="pt-3 border-t border-border">
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-semibold text-foreground flex items-center gap-1">
                                                                    <Award className="w-4 h-4" />
                                                                    Overall Total
                                                                </span>
                                                                <span className="font-bold text-primary text-lg">
                                                                    {student.totalObtained}/{student.totalMarks}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="flex justify-center pt-4">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loadingMore ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    {/* Class Report Tab */}
                    <TabsContent value="class-report" className="space-y-4 mt-4">
                        {loadingClassReport ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">Loading class report...</p>
                            </div>
                        ) : classReportData ? (
                            <>
                                {/* Export Buttons */}
                                <div className="flex gap-3">
                                    <Button
                                        onClick={exportClassReportToPDF}
                                        className="flex-1 gap-2"
                                        variant="outline"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Export PDF
                                    </Button>
                                    <Button
                                        onClick={exportClassReportToExcel}
                                        className="flex-1 gap-2"
                                        variant="outline"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        Export Excel
                                    </Button>
                                </div>

                                {/* Report Table */}
                                <Card>
                                    <CardContent className="p-0">
                                        {/* Top Scrollbar */}
                                        <div
                                            ref={topScrollRef}
                                            onScroll={handleTopScroll}
                                            className="overflow-x-auto overflow-y-hidden border-b"
                                            style={{ height: '20px' }}
                                        >
                                            <div style={{ width: `${classReportData.subjects.length * 100 + 400}px`, height: '1px' }} />
                                        </div>

                                        {/* Table with Bottom Scrollbar */}
                                        <div
                                            ref={tableScrollRef}
                                            onScroll={handleTableScroll}
                                            className="overflow-x-auto"
                                        >
                                            <table className="w-full text-xs">
                                                <thead className="bg-muted">
                                                    <tr>
                                                        <th className="p-2 text-left border sticky left-0 bg-muted z-10">Roll</th>
                                                        <th className="p-2 text-left border sticky left-12 bg-muted z-10">Name</th>
                                                        {classReportData.subjects.map(subject => (
                                                            <th key={subject.id} className="p-2 border text-center bg-muted/30">
                                                                {subject.name}
                                                            </th>
                                                        ))}
                                                        <th className="p-2 border text-center bg-primary/10 font-bold">Overall</th>
                                                        <th className="p-2 border text-center bg-primary/10 font-bold">%</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {classReportData.students.map((student, idx) => {
                                                        const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-gray-50';
                                                        return (
                                                            <tr key={student.id} className={rowBg}>
                                                                <td className={`p-2 border sticky left-0 ${rowBg} z-10`}>{student.roll_number}</td>
                                                                <td className={`p-2 border sticky left-12 ${rowBg} font-medium z-10`}>{student.name}</td>
                                                                {classReportData.subjects.map(subject => {
                                                                    const subjectTotal = student.subject_totals[subject.id];
                                                                    const percentage = subjectTotal ? subjectTotal.percentage : 0;
                                                                    return (
                                                                        <td key={subject.id} className="p-2 border text-center font-semibold">
                                                                            {subjectTotal ? (
                                                                                <span className={percentage >= 75 ? 'text-success' : percentage >= 50 ? 'text-warning' : 'text-destructive'}>
                                                                                    {subjectTotal.obtained}/{subjectTotal.total}
                                                                                </span>
                                                                            ) : '-'}
                                                                        </td>
                                                                    );
                                                                })}
                                                                <td className="p-2 border text-center bg-primary/5 font-bold">
                                                                    {student.overall_obtained}/{student.overall_total}
                                                                </td>
                                                                <td className="p-2 border text-center bg-primary/5">
                                                                    <Badge variant={
                                                                        student.overall_percentage >= 75 ? 'success' :
                                                                            student.overall_percentage >= 50 ? 'warning' :
                                                                                'destructive'
                                                                    }>
                                                                        {student.overall_percentage.toFixed(1)}%
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                    <p className="text-muted-foreground">Select a specific class to view class report</p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout >
    );
}
