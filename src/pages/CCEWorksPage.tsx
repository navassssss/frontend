import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus,
    BookOpen,
    Search
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface SubjectSummary {
    subject_id: string;
    subject_name: string;
    max_marks: number;
    class_name: string;
    teacher_name?: string;
    total_works: number;
    completed_works: number;
}

export default function CCEWorksPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal';

    const [subjectsSummary, setSubjectsSummary] = useState<SubjectSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState<'my' | 'all'>(() => (sessionStorage.getItem('cce_filter') as 'my' | 'all') || 'my');
    const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem('cce_search') || '');
    const [classFilter, setClassFilter] = useState(() => sessionStorage.getItem('cce_class') || 'all');
    const [teacherFilter, setTeacherFilter] = useState(() => sessionStorage.getItem('cce_teacher') || 'all');

    // Save filters to sessionStorage when they change
    useEffect(() => {
        sessionStorage.setItem('cce_filter', subjectFilter);
        sessionStorage.setItem('cce_search', searchQuery);
        sessionStorage.setItem('cce_class', classFilter);
        sessionStorage.setItem('cce_teacher', teacherFilter);
    }, [subjectFilter, searchQuery, classFilter, teacherFilter]);

    useEffect(() => {
        loadData();
    }, [subjectFilter]);

    const loadData = async () => {
        try {
            const [worksRes] = await Promise.all([
                api.get(`/cce/works?filter=${subjectFilter}`)
            ]);
            setSubjectsSummary(worksRes.data.subjects_summary || []);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubjects = subjectsSummary.filter(sub => {
        if (classFilter !== 'all' && sub.class_name !== classFilter) return false;
        if (teacherFilter !== 'all' && (sub.teacher_name || 'Unassigned') !== teacherFilter) return false;

        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            sub.subject_name.toLowerCase().includes(q) ||
            sub.class_name.toLowerCase().includes(q) ||
            (sub.teacher_name && sub.teacher_name.toLowerCase().includes(q))
        );
    });

    const uniqueClasses = Array.from(new Set(subjectsSummary.map(s => s.class_name))).sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB;
        }
        return a.localeCompare(b);
    });
    const uniqueTeachers = Array.from(new Set(subjectsSummary.map(s => s.teacher_name || 'Unassigned'))).sort();

    return (
        <AppLayout title="CCE Works">
            <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6 pb-24 min-h-screen">

                {/* Header Section */}
                <div className="mb-6 animate-fade-in space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        {isPrincipal ? (
                            <div className="flex bg-slate-100/80 p-1 rounded-full border border-slate-200 shrink-0">
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
                        ) : (
                            <div></div>
                        )}
                        <button
                            onClick={() => navigate('/cce/works/new')}
                            className="bg-[#0a6c5b] hover:bg-emerald-800 text-white font-semibold text-sm px-4 py-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 gap-2"
                        >
                            <Plus className="w-4 h-4" strokeWidth={3} /> <span className="hidden sm:inline">New Assessment</span><span className="sm:hidden">New</span>
                        </button>
                    </div>

                    {isPrincipal && subjectFilter === 'all' && (
                        <div className="flex flex-col sm:flex-row gap-3 w-full relative">
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search subject, class, or teacher..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm"
                                />
                            </div>
                            <select
                                value={classFilter}
                                onChange={(e) => setClassFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm outline-none"
                            >
                                <option value="all">All Classes</option>
                                {uniqueClasses.map(c => (
                                    <option key={c} value={c}>{c.match(/^\d+$/) ? `Class ${c}` : c}</option>
                                ))}
                            </select>
                            <select
                                value={teacherFilter}
                                onChange={(e) => setTeacherFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm outline-none"
                            >
                                <option value="all">All Teachers</option>
                                {uniqueTeachers.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Subject Cards Grid */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-100" />)}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSubjects.map(subject => {
                                const classPercent = subject.total_works > 0 ? Math.round((subject.completed_works / subject.total_works) * 100) : 0;
                                
                                return (
                                    <div 
                                        key={subject.subject_id} 
                                        onClick={() => navigate(`/cce/subjects/${subject.subject_id}`)}
                                        className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                                                <BookOpen className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-base font-bold text-slate-900 leading-tight truncate group-hover:text-emerald-700 transition-colors">
                                                        {subject.subject_name}
                                                    </h3>
                                                    <span className="text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-md shrink-0">
                                                        {subject.class_name.match(/^\d+$/) ? `Class ${subject.class_name}` : subject.class_name}
                                                    </span>
                                                </div>
                                                
                                                {isPrincipal && subjectFilter === 'all' ? (
                                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                                        Teacher: <span className="font-semibold text-slate-700">{subject.teacher_name || 'Unassigned'}</span>
                                                    </p>
                                                ) : (
                                                    <p className="text-xs font-semibold text-slate-500 mt-1">
                                                        {subject.total_works === 0 ? 'No Assessments' : `${subject.total_works} Assessment${subject.total_works > 1 ? 's' : ''}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4">
                                            {subject.total_works === 0 ? (
                                                <div className="text-xs font-bold text-slate-400 bg-slate-50 py-1.5 px-3 rounded-lg text-center border border-slate-100">
                                                    No assessments yet
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex justify-between items-end mb-1.5">
                                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                                            {isPrincipal && subjectFilter === 'all' ? `${subject.total_works} Assessments` : 'Progress'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-emerald-600">{classPercent}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                        <div 
                                                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                                                            style={{ width: `${classPercent}%` }}
                                                        />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    
                    {!loading && filteredSubjects.length === 0 && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-lg font-semibold text-slate-900">No Subjects Found</h3>
                            <p className="text-slate-500 mt-1">No subjects match your current filters or search.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
