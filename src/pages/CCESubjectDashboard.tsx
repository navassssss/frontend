import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookOpen, Plus, FileText, BarChart2, ChevronLeft, Calendar, FilePenLine, Download } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Work {
    id: number;
    title: string;
    description: string;
    level: string;
    week: string;
    toolMethod: string;
    submissionType: string;
    issuedDate: string;
    dueDate: string;
    maxMarks: number;
    submissionsCount: number;
    evaluatedCount: number;
}

interface StudentPerformance {
    id: number;
    name: string;
    roll_number: string;
    obtained: number;
    total: number;
    percentage: number;
    grade: string;
    marks: Record<string, number>;
}

interface SubjectDashboard {
    subject: {
        id: string;
        name: string;
        class_name: string;
        department_name?: string;
        max_marks: number;
    };
    works: Work[];
    students: StudentPerformance[];
}

export default function CCESubjectDashboard() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<SubjectDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'works' | 'performance'>('works');

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/cce/subjects/${id}/dashboard`);
            setData(res.data);
        } catch (error) {
            console.error('Failed to load subject dashboard', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <AppLayout title="Subject Dashboard">
                <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
                    <div className="h-32 bg-white rounded-3xl animate-pulse" />
                    <div className="h-64 bg-white rounded-3xl animate-pulse" />
                </div>
            </AppLayout>
        );
    }

    const { subject, works, students } = data;
    
    // Stats calculation
    const totalWorks = works.length;
    const completedWorks = works.filter(w => w.evaluatedCount === w.submissionsCount && w.submissionsCount > 0).length;
    const overallProgress = totalWorks > 0 ? Math.round((completedWorks / totalWorks) * 100) : 0;

    const classAverage = students.length > 0 
        ? Math.round(students.reduce((acc, s) => acc + s.percentage, 0) / students.length)
        : 0;

    const getTypeStyle = (type: string) => {
        switch ((type || '').toLowerCase()) {
            case 'project': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'quiz': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'exam': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'assignment': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        }
    };

    const formattedClassName = subject.class_name.match(/^\d+$/) 
        ? `Class ${subject.class_name}` 
        : subject.class_name;

    const formatMark = (mark: any) => {
        if (mark === undefined || mark === null) return '-';
        return Number(mark);
    };

    const getExportTitle = () => {
        let title = `${data?.subject.name} - ${formattedClassName}`;
        if (data?.subject.department_name) {
            title += ` (${data.subject.department_name})`;
        }
        return title;
    };

    const handleExportExcel = () => {
        if (!data) return;
        const headers = ['Roll No.', 'Student Name'];
        data.works.forEach(w => headers.push(`${w.title} (${w.maxMarks})`));
        headers.push(`Total Raw (${data.works.reduce((a, b) => a + b.maxMarks, 0)})`, `Converted Marks (${data.subject.max_marks})`, 'Percentage', 'Grade');

        const rows = data.students.map(s => {
            const row: any[] = [s.roll_number, s.name];
            let rawTotal = 0;
            data.works.forEach(w => {
                const mark = s.marks[w.id];
                row.push(formatMark(mark));
                if (mark !== undefined && mark !== null) rawTotal += Number(mark);
            });
            row.push(rawTotal, Number(s.obtained), `${s.percentage}%`, s.grade);
            return row;
        });

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Performance");
        XLSX.writeFile(wb, `${getExportTitle()}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!data) return;

        let html = `
        <html>
        <head>
            <title>${getExportTitle()}</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: center; }
                th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                th { background-color: #f4f4f5; }
                h2 { text-align: center; margin: 10px 0 20px; }
                .arabic { direction: rtl; text-align: right; }
            </style>
        </head>
        <body>
            <h2>${getExportTitle()}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Roll No.</th>
                        <th>Student Name</th>
        `;

        data.works.forEach(w => {
            html += `<th>${w.title}<br/>(${w.maxMarks})</th>`;
        });
        
        html += `
                        <th>Total Raw<br/>(${data.works.reduce((a, b) => a + b.maxMarks, 0)})</th>
                        <th>Converted (${data.subject.max_marks})</th>
                        <th>Percentage</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.students.forEach(s => {
            let rawTotal = 0;
            let worksCols = '';
            data.works.forEach(w => {
                const mark = s.marks[w.id];
                if (mark !== undefined && mark !== null) {
                    rawTotal += Number(mark);
                    worksCols += `<td>${formatMark(mark)}</td>`;
                } else {
                    worksCols += `<td>-</td>`;
                }
            });

            const isArabic = /[\u0600-\u06FF]/.test(s.name);
            html += `
                    <tr>
                        <td>${s.roll_number}</td>
                        <td style="text-align: ${isArabic ? 'right' : 'left'};" class="${isArabic ? 'arabic' : ''}">${s.name}</td>
                        ${worksCols}
                        <td>${rawTotal}</td>
                        <td>${Number(s.obtained)}</td>
                        <td>${s.percentage}%</td>
                        <td><strong>${s.grade}</strong></td>
                    </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </body>
        </html>
        `;

        const printWindow = window.open('', '', 'width=1000,height=800');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    return (
        <AppLayout title={`${subject.name}${subject.department_name ? ` (${subject.department_name})` : ''} Dashboard`}>
            <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5 pb-24 min-h-screen">
                
                {/* Compact Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-fade-in">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/cce/works')}
                            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors shrink-0 -ml-2"
                        >
                            <ChevronLeft className="w-7 h-7" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-600 hidden sm:block" />
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                                    {subject.name}
                                    {subject.department_name && <span className="text-lg text-slate-500 font-bold normal-case">({subject.department_name})</span>}
                                </h1>
                            </div>
                            <p className="text-sm font-bold text-slate-500 mt-0.5 flex items-center gap-2">
                                {formattedClassName} <span className="text-slate-300">•</span> {subject.max_marks || 'N/A'} Marks
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate(`/cce/works/new?subject_id=${subject.id}`)}
                        className="bg-[#0a6c5b] hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-2.5 rounded-full flex items-center justify-center transition-all shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> New Assessment
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-max shadow-inner">
                    <button
                        onClick={() => setActiveTab('works')}
                        className={`flex-1 md:w-40 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'works' 
                                ? 'bg-white text-emerald-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <FileText className="w-4 h-4" /> Assessments
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`flex-1 md:w-40 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            activeTab === 'performance' 
                                ? 'bg-white text-emerald-800 shadow-sm' 
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        <BarChart2 className="w-4 h-4" /> Performance
                    </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'works' ? (
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 text-lg">Configured Works</h2>
                            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                {totalWorks} Assessments
                            </span>
                        </div>
                        {works.length === 0 ? (
                            <div className="p-12 text-center bg-slate-50">
                                <FilePenLine className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No assessments yet</h3>
                                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Create your first assessment to start evaluating students for this subject.</p>
                            </div>
                        ) : (
                            <div className="p-4 space-y-3 bg-slate-50/50">
                                {works.map(work => {
                                    const workMarks = students.map(s => s.marks[work.id]).filter(m => m !== undefined && m !== null);
                                    const rawAvg = workMarks.length > 0 ? workMarks.reduce((a, b) => Number(a) + Number(b), 0) / workMarks.length : 0;
                                    const average = workMarks.length > 0 && work.maxMarks > 0 ? ((rawAvg / work.maxMarks) * 100).toFixed(1) + '%' : '-';
                                    
                                    return (
                                    <div key={work.id} onClick={() => navigate(`/cce/works/${work.id}`)} className="cursor-pointer p-5 bg-white border border-slate-200 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${getTypeStyle(work.toolMethod || work.submissionType)}`}>
                                                    {work.toolMethod || work.submissionType || 'TASK'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                                                    Week {work.week} • Lvl {work.level}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 mt-2 mb-2 leading-tight">{work.title}</h3>
                                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                    {work.dueDate ? format(new Date(work.dueDate), 'MMM dd, yyyy') : 'No Date'}
                                                </div>
                                                <div className="bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                                                    {work.maxMarks} Marks
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 shrink-0 justify-between md:justify-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
                                            <div className="text-right">
                                                <div className="text-base font-black text-slate-900">
                                                    {work.evaluatedCount} <span className="text-slate-400">/ {work.submissionsCount}</span>
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                    Evaluated
                                                </div>
                                            </div>
                                            <div className="text-right pl-4 border-l border-slate-100">
                                                <div className="text-lg font-black text-emerald-600">
                                                    {average}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                                                    Average
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* Performance Highlights */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Class Average</span>
                                <span className="text-3xl font-black text-emerald-600">{classAverage}%</span>
                            </div>
                            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Total Students</span>
                                <span className="text-3xl font-black text-slate-800">{students.length}</span>
                            </div>
                            <div className="col-span-2 bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="flex-1">
                                    <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Grade Distribution</span>
                                    <div className="flex w-full h-8 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        {['A+', 'A', 'B', 'C', 'D', 'F'].map(grade => {
                                            const count = students.filter(s => s.grade === grade).length;
                                            if (count === 0) return null;
                                            const pct = (count / students.length) * 100;
                                            const colors: Record<string, string> = {
                                                'A+': 'bg-emerald-500',
                                                'A': 'bg-emerald-400',
                                                'B': 'bg-blue-400',
                                                'C': 'bg-amber-400',
                                                'D': 'bg-orange-400',
                                                'F': 'bg-rose-500'
                                            };
                                            return (
                                                <div 
                                                    key={grade} 
                                                    style={{ width: `${pct}%` }} 
                                                    className={`${colors[grade]} h-full flex items-center justify-center text-[10px] font-black text-white`}
                                                    title={`${grade}: ${count} students`}
                                                >
                                                    {pct > 10 ? grade : ''}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Roster Table */}
                        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="font-bold text-slate-900 text-lg">Performance Data</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
                                        <Download className="w-3.5 h-3.5" /> Excel
                                    </button>
                                    <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">
                                        <Download className="w-3.5 h-3.5" /> PDF
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-400 uppercase tracking-wider font-black bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-[2rem]">Roll No.</th>
                                            <th className="px-6 py-4">Student Name</th>
                                            {works.map(w => (
                                                <th key={w.id} className="px-4 py-4 text-center whitespace-nowrap">
                                                    {w.title.length > 10 ? w.title.substring(0, 10) + '...' : w.title}<br/>
                                                    <span className="text-[10px] opacity-70">({w.maxMarks})</span>
                                                </th>
                                            ))}
                                            <th className="px-6 py-4 text-center whitespace-nowrap">Total Raw<br/><span className="text-[10px] opacity-70">({works.reduce((acc, w) => acc + w.maxMarks, 0)})</span></th>
                                            <th className="px-6 py-4 text-center whitespace-nowrap">Converted<br/><span className="text-[10px] opacity-70">({subject.max_marks})</span></th>
                                            <th className="px-6 py-4 text-center">Percentage</th>
                                            <th className="px-6 py-4 text-center rounded-tr-[2rem]">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map(student => {
                                            const rawTotal = works.reduce((acc, w) => acc + (student.marks[w.id] !== undefined && student.marks[w.id] !== null ? Number(student.marks[w.id]) : 0), 0);
                                            const rawMax = works.reduce((acc, w) => acc + w.maxMarks, 0);
                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">
                                                        {student.roll_number}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap text-left" dir={/[\u0600-\u06FF]/.test(student.name) ? 'rtl' : 'ltr'}>
                                                        {student.name}
                                                    </td>
                                                    {works.map(w => (
                                                        <td key={w.id} className="px-4 py-4 text-center font-semibold text-slate-600 bg-white border-l border-r border-slate-50/50">
                                                            {formatMark(student.marks[w.id])}
                                                        </td>
                                                    ))}
                                                    <td className="px-6 py-4 text-center font-bold text-slate-700 bg-slate-50/50 border-l border-slate-100">
                                                        {rawTotal} / {rawMax}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-slate-900 bg-emerald-50/30">
                                                        {Number(student.obtained)} / {student.total}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`px-2 py-1 rounded-lg font-bold text-xs ${
                                                            student.percentage >= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                                                        }`}>
                                                            {student.percentage}%
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-black text-slate-800 text-base">
                                                            {student.grade}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
