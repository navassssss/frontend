import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    ChevronDown,
    MoreVertical,
    BookOpen
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import api from '@/lib/api';

interface SubjectSummary {
    subject_id: string;
    subject_name: string;
    max_marks: number;
    class_name: string;
    total_works: number;
    completed_works: number;
}

interface CCEWork {
    id: number;
    title: string;
    description: string;
    level: number;
    week: number;
    subjectId: string;
    subjectName: string;
    className: string;
    teacherName: string;
    toolMethod: string;
    issuedDate: string;
    dueDate: string;
    maxMarks: number;
    submissionType: string;
    submissionsCount: number;
    evaluatedCount: number;
}

const getStage = (classStr: string) => {
    const num = parseInt(classStr.replace(/\D/g, ''));
    if (isNaN(num)) return "General Segment";
    if (num <= 6) return "Secondary";
    if (num <= 8) return "Senior Secondary";
    return "Degree";
};

const getSubjectTagStyle = (index: number) => {
    const styles = [
        "bg-emerald-100 text-emerald-800",
        "bg-blue-100 text-blue-800",
        "bg-amber-100 text-amber-800",
        "bg-rose-100 text-rose-800",
        "bg-violet-100 text-violet-800"
    ];
    return styles[index % styles.length];
};

const getTypeStyle = (type: string) => {
    const t = type.toUpperCase();
    if (t.includes('QUIZ') || t.includes('TEST')) return "bg-emerald-100 text-emerald-800";
    if (t.includes('PROJECT')) return "bg-rose-100 text-rose-800";
    if (t.includes('ASSIGN')) return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-slate-800";
};

export default function CCEWorksPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';

    const [subjectsSummary, setSubjectsSummary] = useState<SubjectSummary[]>([]);
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState<'my' | 'all'>('my');

    useEffect(() => {
        loadData();
    }, [subjectFilter]);

    const loadData = async () => {
        try {
            const [worksRes] = await Promise.all([
                api.get(`/cce/works?filter=${subjectFilter}`)
            ]);
            setWorks(worksRes.data.works || worksRes.data);
            setSubjectsSummary(worksRes.data.subjects_summary || []);

        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout title="CCE Works">
            <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 pb-24 min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 animate-fade-in">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">CCE Works Management</h1>
                        <p className="text-sm text-muted-foreground mt-1">Expand classes to manage subject-specific evaluation rubrics.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {isPrincipal && (
                            <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200">
                                <button
                                    onClick={() => setSubjectFilter('my')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                        subjectFilter === 'my' 
                                            ? 'bg-white text-emerald-800 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    My Subjects
                                </button>
                                <button
                                    onClick={() => setSubjectFilter('all')}
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                                        subjectFilter === 'all' 
                                            ? 'bg-white text-emerald-800 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    All Subjects
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/cce/works/new')}
                            className="bg-[#0a6c5b] hover:bg-emerald-800 text-white font-semibold text-sm px-4 py-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 gap-2"
                        >
                            <Plus className="w-4 h-4" strokeWidth={3} /> New Assessment
                        </button>
                    </div>
                </div>

                {/* Subject Cards Grid */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {subjectsSummary.map(subject => {
                                const classPercent = subject.total_works > 0 ? Math.round((subject.completed_works / subject.total_works) * 100) : 0;
                                
                                return (
                                    <div 
                                        key={subject.subject_id} 
                                        onClick={() => navigate(`/cce/subjects/${subject.subject_id}`)}
                                        className="bg-white p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md line-clamp-1 max-w-[150px]">
                                                    {subject.class_name}
                                                </span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-emerald-700 transition-colors">{subject.subject_name}</h3>
                                            <p className="text-sm text-slate-500 mt-1">{subject.total_works} Assessments Configured</p>
                                        </div>
                                        
                                        <div className="mt-5">
                                            <div className="flex justify-between items-end mb-1.5">
                                                <span className="text-xs font-semibold text-slate-600">Evaluation Progress</span>
                                                <span className="text-xs font-bold text-emerald-600">{classPercent}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                <div 
                                                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                                                    style={{ width: `${classPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {!loading && subjectsSummary.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-900">No Subjects Found</h3>
                            <p className="text-slate-500 mt-1">No subjects match the current filter.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

