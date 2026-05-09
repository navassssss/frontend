import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    Download,
    FileSpreadsheet,
    FileText,
    Users,
    BookOpen,
} from 'lucide-react';
import api from '@/lib/api';

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

interface Student {
    id: number;
    name: string;
    roll_number: string;
    marks: Record<number, number>; // work_id => marks_obtained
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
    students: Student[];
}

interface ClassRoom {
    id: number;
    name: string;
}

export default function ClassReportPage() {
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [reportData, setReportData] = useState<ClassReportData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadReport();
        }
    }, [selectedClass]);

    const loadClasses = async () => {
        try {
            const { data } = await api.get('/attendance/classes');
            setClasses(data);
        } catch (error) {
            console.error('Failed to load classes', error);
            toast.error('Failed to load classes');
        }
    };

    const loadReport = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/cce/class-report', {
                params: { class_id: selectedClass }
            });
            setReportData(data);
        } catch (error) {
            console.error('Failed to load report', error);
            toast.error('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        if (!reportData) return;

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
        doc.text(`Class: ${reportData.class.name}`, 14, 38);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - 14, 38, { align: 'right' });

        // Build table headers
        const headers: string[] = ['Roll', 'Student Name'];
        reportData.subjects.forEach(subject => {
            subject.works.forEach(work => {
                headers.push(`${subject.name}\n${work.title}`);
            });
            headers.push(`${subject.name}\nTotal`);
        });
        headers.push('Overall\nTotal');
        headers.push('%');

        // Build table body
        const body = reportData.students.map(student => {
            const row: any[] = [student.roll_number, student.name];

            reportData.subjects.forEach(subject => {
                subject.works.forEach(work => {
                    const marks = student.marks[work.id];
                    row.push(marks !== undefined ? `${marks}/${work.max_marks}` : '-');
                });
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

        doc.save(`${reportData.class.name}_CCE_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        toast.success('PDF downloaded successfully');
    };

    const exportToExcel = () => {
        if (!reportData) return;

        const wb = XLSX.utils.book_new();

        // Build headers
        const headers: string[] = ['Roll', 'Student Name'];
        reportData.subjects.forEach(subject => {
            subject.works.forEach(work => {
                headers.push(`${subject.name} - ${work.title}`);
            });
            headers.push(`${subject.name} Total`);
        });
        headers.push('Overall Total');
        headers.push('Percentage');

        // Build data rows
        const data = reportData.students.map(student => {
            const row: any[] = [student.roll_number, student.name];

            reportData.subjects.forEach(subject => {
                subject.works.forEach(work => {
                    const marks = student.marks[work.id];
                    row.push(marks !== undefined ? `${marks}/${work.max_marks}` : '-');
                });
                const subjectTotal = student.subject_totals[subject.id];
                row.push(subjectTotal ? `${subjectTotal.obtained}/${subjectTotal.total}` : '-');
            });

            row.push(`${student.overall_obtained}/${student.overall_total}`);
            row.push(student.overall_percentage.toFixed(1));

            return row;
        });

        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, reportData.class.name);

        XLSX.writeFile(wb, `${reportData.class.name}_CCE_Report.xlsx`);
        toast.success('Excel downloaded successfully');
    };

    return (
        <AppLayout title="Class Report" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Class Selector */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Select Class</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id.toString()}>
                                        {cls.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {loading && (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading report...</p>
                    </div>
                )}

                {reportData && !loading && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-8 h-8 text-primary" />
                                        <div>
                                            <p className="text-2xl font-bold">{reportData.students.length}</p>
                                            <p className="text-xs text-muted-foreground">Students</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <BookOpen className="w-8 h-8 text-success" />
                                        <div>
                                            <p className="text-2xl font-bold">{reportData.subjects.length}</p>
                                            <p className="text-xs text-muted-foreground">Subjects</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-3">
                            <Button
                                onClick={exportToPDF}
                                className="flex-1 gap-2"
                                variant="outline"
                            >
                                <FileText className="w-4 h-4" />
                                Export PDF
                            </Button>
                            <Button
                                onClick={exportToExcel}
                                className="flex-1 gap-2"
                                variant="outline"
                            >
                                <FileSpreadsheet className="w-4 h-4" />
                                Export Excel
                            </Button>
                        </div>

                        {/* Report Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Class Report - {reportData.class.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-2 text-left border sticky left-0 bg-muted z-10">Roll</th>
                                                <th className="p-2 text-left border sticky left-12 bg-muted z-10">Name</th>
                                                {reportData.subjects.map(subject => (
                                                    <React.Fragment key={subject.id}>
                                                        {subject.works.map(work => (
                                                            <th key={work.id} className="p-2 border text-center">
                                                                <div>{subject.name}</div>
                                                                <div className="font-normal text-muted-foreground">{work.title}</div>
                                                            </th>
                                                        ))}
                                                        <th className="p-2 border text-center bg-muted/50">
                                                            <div>{subject.name}</div>
                                                            <div className="font-normal">Total</div>
                                                        </th>
                                                    </React.Fragment>
                                                ))}
                                                <th className="p-2 border text-center bg-primary/10 font-bold">Overall</th>
                                                <th className="p-2 border text-center bg-primary/10 font-bold">%</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reportData.students.map((student, idx) => (
                                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                                    <td className="p-2 border sticky left-0 bg-inherit">{student.roll_number}</td>
                                                    <td className="p-2 border sticky left-12 bg-inherit font-medium">{student.name}</td>
                                                    {reportData.subjects.map(subject => (
                                                        <React.Fragment key={subject.id}>
                                                            {subject.works.map(work => {
                                                                const marks = student.marks[work.id];
                                                                return (
                                                                    <td key={work.id} className="p-2 border text-center">
                                                                        {marks !== undefined ? (
                                                                            <span className={marks >= work.max_marks * 0.75 ? 'text-success' : marks >= work.max_marks * 0.5 ? 'text-warning' : 'text-destructive'}>
                                                                                {marks}/{work.max_marks}
                                                                            </span>
                                                                        ) : '-'}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="p-2 border text-center bg-muted/30 font-semibold">
                                                                {student.subject_totals[subject.id] ? (
                                                                    `${student.subject_totals[subject.id].obtained}/${student.subject_totals[subject.id].total}`
                                                                ) : '-'}
                                                            </td>
                                                        </React.Fragment>
                                                    ))}
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
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </>
                )}

                {!selectedClass && !loading && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">Select a class to view report</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
