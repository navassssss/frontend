import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
    Users,
    Award,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    FileText,
    FileSpreadsheet,
    BookOpen,
    Search,
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
            <div className="p-4 md:p-8 max-w-[1100px] mx-auto space-y-6 pb-24 min-h-screen">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-fade-in">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest mb-1">
                            <span className="text-slate-400">STUDENTS / </span>
                            <span className="text-[#00a67e]">PERFORMANCE MATRIX</span>
                        </p>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Academic Records</h1>
                    </div>
                </div>
                {/* Filters Card */}
                <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-2xl">
                    <div className="flex flex-col gap-6">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50/80 border border-slate-100 rounded-xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Class Filter Pills */}
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mr-2">
                                CLASSES:
                            </span>
                            
                            <button
                                onClick={() => setSelectedClass('all')}
                                className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                                    selectedClass === 'all'
                                        ? 'bg-[#00a67e] text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                All Classes
                            </button>

                            {classes.length === 0 ? (
                                <span className="text-[13px] font-medium text-slate-400">Loading classes...</span>
                            ) : (
                                classes.map((cls) => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClass(cls.id.toString())}
                                        className={`px-4 py-2 rounded-full text-[13px] font-bold transition-all ${
                                            selectedClass === cls.id.toString()
                                                ? 'bg-[#00a67e] text-white shadow-sm'
                                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cls.name}
                                    </button>
                                ))
                            )}

                            {selectedClass !== 'all' && (
                                <button
                                    onClick={() => setSelectedClass('all')}
                                    className="flex items-center gap-1 text-[13px] font-bold text-[#00a67e] hover:text-[#008f6c] ml-2 transition-colors"
                                >
                                    <span className="text-lg leading-none">&times;</span> Clear All
                                </button>
                            )}
                        </div>
                    </div>
                </Card>

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
                            <div className="space-y-4">
                                {students.map((student, index) => {
                                    const isExpanded = expandedStudents.has(student.studentId);
                                    
                                    const getGradeAndStatus = (percentage: number) => {
                                        if (percentage >= 90) return { grade: 'A', status: 'EXCELLENT', color: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100', bar: 'bg-emerald-500' };
                                        if (percentage >= 80) return { grade: 'B+', status: 'CONSISTENT', color: 'text-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-100', bar: 'bg-emerald-400' };
                                        if (percentage >= 70) return { grade: 'B', status: 'GOOD', color: 'text-blue-500', badge: 'bg-blue-50 text-blue-600 border border-blue-100', bar: 'bg-blue-500' };
                                        if (percentage >= 60) return { grade: 'C', status: 'AVERAGE', color: 'text-yellow-600', badge: 'bg-yellow-50 text-yellow-600 border border-yellow-100', bar: 'bg-yellow-500' };
                                        if (percentage >= 50) return { grade: 'D', status: 'NEEDS FOCUS', color: 'text-orange-500', badge: 'bg-orange-50 text-orange-600 border border-orange-100', bar: 'bg-orange-500' };
                                        return { grade: 'F', status: 'CRITICAL', color: 'text-rose-500', badge: 'bg-rose-50 text-rose-600 border border-rose-100', bar: 'bg-rose-500' };
                                    };

                                    const uiData = getGradeAndStatus(student.overallPercentage);

                                    return (
                                        <Card key={student.studentId} className="overflow-hidden border-0 shadow-sm bg-white">
                                            {/* Always Visible Header */}
                                            <div
                                                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                                onClick={() => toggleStudent(student.studentId)}
                                            >
                                                {/* Left Section - Avatar & Details */}
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center text-lg font-bold text-slate-500">
                                                        {student.studentName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-[15px] font-bold text-slate-900 leading-tight">
                                                            {student.studentName}
                                                        </h4>
                                                        <p className="text-[12px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                                                            ROLL #{student.rollNumber || 'N/A'} {student.className && `• ${student.className}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Middle & Right Sections */}
                                                <div className="flex flex-wrap md:flex-nowrap items-center gap-6 md:gap-12">
                                                    {/* Performance */}
                                                    <div className="flex flex-col min-w-[100px]">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                                            PERFORMANCE
                                                        </span>
                                                        <span className={`text-[14px] font-bold ${uiData.color}`}>
                                                            {uiData.grade} ({student.overallPercentage.toFixed(1)}%)
                                                        </span>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="flex flex-col min-w-[90px]">
                                                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                                            STATUS
                                                        </span>
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm w-fit ${uiData.badge}`}>
                                                            {uiData.status}
                                                        </span>
                                                    </div>

                                                    {/* Rank & Toggle */}
                                                    <div className="flex items-center gap-5 min-w-[100px] justify-between">
                                                        <div className="flex flex-col items-center flex-1">
                                                            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">
                                                                RANK
                                                            </span>
                                                            <span className="text-[13px] font-bold text-slate-800">
                                                                #{String(index + 1).padStart(2, '0')} <span className="text-slate-400 font-semibold">/ {totalStats.total_students}</span>
                                                            </span>
                                                        </div>
                                                        <div className="w-8 h-8 flex items-center justify-center text-slate-400">
                                                            {isExpanded ? (
                                                                <ChevronUp className="w-5 h-5" />
                                                            ) : (
                                                                <ChevronDown className="w-5 h-5" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expandable Details */}
                                            {isExpanded && (
                                                <div className="bg-slate-50/80 border-t border-slate-100 p-6">
                                                    {/* Grid of Subjects */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                        {Object.values(student.subjectMarks).map((subject: SubjectMark, idx: number) => {
                                                            const subjUi = getGradeAndStatus(subject.percentage);
                                                            
                                                            return (
                                                                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm flex flex-col gap-3">
                                                                    <div className="flex items-end justify-between">
                                                                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider truncate max-w-[60%]">
                                                                            {subject.subjectName}
                                                                        </span>
                                                                        <div className="flex items-baseline gap-0.5">
                                                                            <span className={`text-[16px] font-bold ${subjUi.color}`}>
                                                                                {subject.obtained}
                                                                            </span>
                                                                            <span className="text-[13px] text-slate-400 font-bold">
                                                                                /{subject.total}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Custom Progress Bar */}
                                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-1">
                                                                        <div 
                                                                            className={`h-full rounded-full ${subjUi.bar}`}
                                                                            style={{ width: `${Math.min(100, Math.max(0, subject.percentage))}%` }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="mt-5 flex justify-end">
                                                        <Link to={`/students/${student.studentId}`} className="text-[13px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition-colors">
                                                            View Full Analytics Report <span className="text-lg leading-none">&rarr;</span>
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </Card>
                                    );
                                })}

                                {/* Load More Button */}
                                {hasMore && (
                                    <div className="flex justify-center pt-2">
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            className="px-6 py-2.5 bg-white border border-slate-200 text-[13px] font-bold text-slate-700 rounded-lg shadow-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            {loadingMore ? 'Loading...' : 'Load More'}
                                        </button>
                                    </div>
                                )}
                            </div>
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
