import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import { BookOpen, Plus, FileText, BarChart2, ChevronLeft, Calendar, FilePenLine } from 'lucide-react';
import { format } from 'date-fns';

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
            case 'project': return 'bg-purple-100/50 text-purple-700 border border-purple-200';
            case 'quiz': return 'bg-orange-100/50 text-orange-700 border border-orange-200';
            case 'exam': return 'bg-rose-100/50 text-rose-700 border border-rose-200';
            case 'assignment': return 'bg-blue-100/50 text-blue-700 border border-blue-200';
            default: return 'bg-emerald-100/50 text-emerald-700 border border-emerald-200';
        }
    };

    return (
        <AppLayout title={`${subject.name} Dashboard`}>
            <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-6 pb-24 min-h-screen">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button 
                            onClick={() => navigate('/cce/works')}
                            className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-2 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Subjects
                        </button>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            {subject.name}
                        </h1>
                        <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider">{subject.class_name}</span>
                            • Final Marks: {subject.max_marks || 'N/A'}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate(`/cce/works/new?subject_id=${subject.id}`)}
                        className="bg-[#0a6c5b] hover:bg-emerald-800 text-white font-semibold text-sm px-5 py-2.5 rounded-full flex items-center justify-center transition-all shadow-sm gap-2"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> New Assessment
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-max mx-auto md:mx-0 shadow-inner">
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
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-900 text-lg">All Configured Works</h2>
                            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                                {totalWorks} Assessments
                            </span>
                        </div>
                        {works.length === 0 ? (
                            <div className="p-12 text-center">
                                <FilePenLine className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-slate-800">No assessments yet</h3>
                                <p className="text-slate-500 mt-1 max-w-xs mx-auto">Create your first assessment to start evaluating students for this subject.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {works.map(work => (
                                    <div key={work.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getTypeStyle(work.toolMethod || work.submissionType)}`}>
                                                    {work.toolMethod || work.submissionType || 'TASK'}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                                                    Week {work.week} • Lvl {work.level}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900">{work.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-xs font-semibold text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    Due: {work.dueDate ? format(new Date(work.dueDate), 'MMM dd, yyyy') : 'No Date'}
                                                </div>
                                                <div>Max Marks: {work.maxMarks}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-slate-900">
                                                    {work.evaluatedCount} / {work.submissionsCount}
                                                </div>
                                                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                    Evaluated
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => navigate(`/cce/works/${work.id}`)}
                                                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-sm px-4 py-2 rounded-xl transition-colors"
                                            >
                                                Grade
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
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
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <h2 className="font-bold text-slate-900 text-lg">Cumulative Performance</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-[10px] text-slate-400 uppercase tracking-wider font-black bg-slate-50/80 border-b border-slate-100">
                                        <tr>
                                            <th className="px-6 py-4 rounded-tl-[2rem]">Roll No.</th>
                                            <th className="px-6 py-4">Student Name</th>
                                            <th className="px-6 py-4 text-center">Marks ({subject.max_marks})</th>
                                            <th className="px-6 py-4 text-center">Percentage</th>
                                            <th className="px-6 py-4 text-center rounded-tr-[2rem]">Grade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {students.map(student => (
                                            <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-500">
                                                    {student.roll_number}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    {student.name}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-700">
                                                    {student.obtained} / {student.total}
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
                                        ))}
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
