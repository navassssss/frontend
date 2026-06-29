import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    BookOpen,
    Calendar,
    Award,
    Clock,
    CheckCircle,
    Upload,
    FileText,
    Download
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import StudentLayout from '@/components/student/StudentLayout';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';

const levelColors = {
    1: 'bg-primary/10 text-primary',
    2: 'bg-accent/10 text-accent',
    3: 'bg-warning/10 text-warning',
    4: 'bg-success/10 text-success'
};

interface CCEWork {
    id: number;
    workId: number;
    title: string;
    subjectName: string;
    subjectId: number;
    level: number;
    week: number;
    toolMethod: string;
    issuedDate: string | null;
    dueDate: string;
    maxMarks: number;
    submissionType: string;
    status: 'pending' | 'submitted' | 'evaluated';
    submittedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
    fileUrl: string | null;
    percentage: number;
}

interface SubjectMark {
    subjectId: number;
    subjectName: string;
    totalWorks: number;
    pendingWorks: number;
    marksObtained: number;
    totalMarks: number;
    convertedMarks: number;
    finalMaxMarks: number;
    percentage: number;
}

export default function StudentCCEPage() {
    const { student } = useStudentAuth();
    const navigate = useNavigate();
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [subjectMarks, setSubjectMarks] = useState<SubjectMark[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    useEffect(() => {
        loadWorks();
    }, []);

    const loadWorks = async () => {
        try {
            const { data } = await api.get('/student/cce/works');
            setWorks(data.submissions || []);
            setSubjectMarks(data.subjectMarks || []);
        } catch (error) {
            console.error('Failed to load CCE works', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (workId: number, file: File) => {
        setUploadingId(workId);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post(`/student/cce/submissions/${workId}/submit`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            toast.success('File uploaded successfully');
            loadWorks();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload file');
        } finally {
            setUploadingId(null);
        }
    };

    const pendingWorks = works.filter(w => w.status === 'pending');
    const submittedWorks = works.filter(w => w.status === 'submitted' || w.status === 'evaluated');
    const evaluatedWorks = works.filter(w => w.status === 'evaluated');

    const totalMarks = evaluatedWorks.reduce((sum, w) => sum + (w.marksObtained || 0), 0);
    const totalPossible = evaluatedWorks.reduce((sum, w) => sum + w.maxMarks, 0);

    if (loading) {
        return (
            <StudentLayout title="CCE Works">
                <div className="text-center p-4">Loading...</div>
            </StudentLayout>
        );
    }

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text("Student CCE Report", 14, 15);
        
        doc.setFontSize(10);
        doc.text(`Name: ${student?.name || 'N/A'}`, 14, 25);
        doc.text(`Class: ${student?.class || 'N/A'}`, 14, 30);
        if (student?.department) {
            doc.text(`Department: ${student.department}`, 14, 35);
        }
        doc.text(`Generated Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, 14, student?.department ? 40 : 35);
        
        const grouped = works.reduce((acc, work) => {
            if (!acc[work.subjectName]) acc[work.subjectName] = [];
            acc[work.subjectName].push(work);
            return acc;
        }, {} as Record<string, CCEWork[]>);
        
        let startY = student?.department ? 50 : 45;
        
        Object.keys(grouped).forEach((subjectName) => {
            const subjectWorks = grouped[subjectName];
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`Subject: ${subjectName}`, 14, startY);
            startY += 5;
            
            autoTable(doc, {
                startY: startY,
                head: [['Issue Date', 'Level', 'Week', 'Tool Method', 'Assignment', 'Marks', 'Status']],
                body: subjectWorks.map(w => [
                    w.issuedDate || 'N/A',
                    `L${w.level}`,
                    `W${w.week}`,
                    w.toolMethod,
                    w.title,
                    w.status === 'evaluated' ? `${w.marksObtained}/${w.maxMarks}` : `-/${w.maxMarks}`,
                    w.status
                ]),
                theme: 'grid',
                headStyles: { fillColor: [0, 166, 126] },
                styles: { fontSize: 9 }
            });
            
            const subjectMark = subjectMarks.find(s => s.subjectName === subjectName);
            startY = (doc as any).lastAutoTable.finalY + 7;
            
            if (subjectMark) {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text(`Total Marks: ${subjectMark.marksObtained} / ${subjectMark.totalMarks} (${subjectMark.percentage}%)`, 14, startY);
                if (subjectMark.finalMaxMarks) {
                    doc.text(`Final Converted Marks: ${subjectMark.convertedMarks} / ${subjectMark.finalMaxMarks}`, 14, startY + 5);
                    startY += 5;
                }
                startY += 10;
            }
        });
        
        doc.save(`${student?.name || 'Student'}_CCE_Report.pdf`);
    };

    const exportToExcel = () => {
        const rows: any[] = [];
        
        rows.push(['Student CCE Report']);
        rows.push([`Name:`, student?.name || 'N/A']);
        rows.push([`Class:`, student?.class || 'N/A']);
        if (student?.department) {
            rows.push([`Department:`, student.department]);
        }
        rows.push([`Generated Date:`, format(new Date(), 'yyyy-MM-dd HH:mm')]);
        rows.push([]);
        
        const grouped = works.reduce((acc, work) => {
            if (!acc[work.subjectName]) acc[work.subjectName] = [];
            acc[work.subjectName].push(work);
            return acc;
        }, {} as Record<string, CCEWork[]>);
        
        Object.keys(grouped).forEach((subjectName) => {
            const subjectWorks = grouped[subjectName];
            rows.push([`Subject: ${subjectName}`]);
            rows.push(['Issue Date', 'Level', 'Week', 'Tool Method', 'Assignment', 'Marks Obtained', 'Max Marks', 'Status']);
            
            subjectWorks.forEach(w => {
                rows.push([
                    w.issuedDate || 'N/A',
                    w.level,
                    w.week,
                    w.toolMethod,
                    w.title,
                    w.status === 'evaluated' ? w.marksObtained : 0,
                    w.maxMarks,
                    w.status
                ]);
            });
            
            const subjectMark = subjectMarks.find(s => s.subjectName === subjectName);
            if (subjectMark) {
                rows.push(['Total:', '', '', '', '', subjectMark.marksObtained, subjectMark.totalMarks, `${subjectMark.percentage}%`]);
                if (subjectMark.finalMaxMarks) {
                    rows.push(['Converted:', '', '', '', '', subjectMark.convertedMarks, subjectMark.finalMaxMarks, '']);
                }
            }
            rows.push([]);
        });
        
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'CCE Report');
        XLSX.writeFile(workbook, `${student?.name || 'Student'}_CCE_Report.xlsx`);
    };

    const exportActions = (
        <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportToPDF} className="h-8 border-[#00a67e]/20 text-[#00a67e] hover:bg-[#00a67e]/10">
                <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="outline" onClick={exportToExcel} className="h-8 border-[#00a67e]/20 text-[#00a67e] hover:bg-[#00a67e]/10">
                <Download className="w-4 h-4 mr-1" /> Excel
            </Button>
        </div>
    );

    return (
        <StudentLayout title="CCE Works" actions={exportActions}>
            <div className="space-y-6 pb-24">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-0 rounded-[20px] flex flex-col items-center justify-center p-4">
                        <p className="text-[28px] font-black text-[#bc792a] leading-none mb-1.5">{pendingWorks.length}</p>
                        <p className="text-[11px] font-medium text-slate-500">Pending</p>
                    </div>
                    <div className="bg-[#fafffe] shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-0 rounded-[20px] flex flex-col items-center justify-center p-4">
                        <p className="text-[28px] font-black text-[#006050] leading-none mb-1.5">{submittedWorks.length}</p>
                        <p className="text-[11px] font-medium text-slate-500">Submitted</p>
                    </div>
                    <div className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-0 rounded-[20px] flex flex-col items-center justify-center p-4">
                        <p className="text-[28px] font-black text-[#006050] leading-none mb-1.5">
                            {totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0}%
                        </p>
                        <p className="text-[11px] font-medium text-slate-500">Overall</p>
                    </div>
                </div>

                {/* Subject Cards */}
                {subjectMarks.length > 0 ? (
                    <div className="space-y-4">
                        {subjectMarks.map((subject) => (
                            <Card 
                                key={subject.subjectId} 
                                variant="elevated"
                                className="cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.03)] border-0 rounded-[24px] hover:shadow-md transition-all"
                                onClick={() => navigate(`/student/cce/${subject.subjectId}`)}
                            >
                                <CardContent className="p-5 sm:p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-[46px] h-[46px] shrink-0 rounded-full bg-[#ebfbf5] text-[#006050] flex items-center justify-center">
                                                <BookOpen className="w-[22px] h-[22px]" strokeWidth={2} />
                                            </div>
                                            <div className="mt-0.5">
                                                <h3 className="font-bold text-[#002830] text-[16px] leading-tight tracking-tight">
                                                    {subject.subjectName}
                                                </h3>
                                                <p className="text-[13px] font-medium text-slate-500 mt-1">
                                                    {subject.totalWorks} Total Assessments
                                                </p>
                                            </div>
                                        </div>
                                        <div className="shrink-0 ml-3">
                                            <div className={`flex flex-col items-center justify-center w-[54px] h-[54px] rounded-full ${subject.percentage >= 75 ? 'bg-[#ebfbf5] text-[#006050]' : subject.percentage >= 50 ? 'bg-[#fff6ee] text-[#993d00]' : 'bg-[#fff0f0] text-[#cc0000]'}`}>
                                                <span className="font-bold text-[15px] leading-none">{subject.convertedMarks}</span>
                                                <span className="text-[9px] font-bold opacity-60">/ {subject.finalMaxMarks}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100/80">
                                        <div className="flex items-center gap-5 text-[12px] font-medium text-slate-600">
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#bc792a]"></div>
                                                {subject.pendingWorks} Pending
                                            </span>
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#006050]"></div>
                                                {subject.totalWorks - subject.pendingWorks} Completed
                                            </span>
                                        </div>
                                        <span className="text-[12px] font-bold text-[#006050] flex items-center gap-1">
                                            View details &rarr;
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card variant="elevated">
                        <CardContent className="p-6 text-center">
                            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No subjects found</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </StudentLayout>
    );
}