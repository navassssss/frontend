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
    if (num <= 8) return "Middle School";
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
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

    const [subjectsSummary, setSubjectsSummary] = useState<SubjectSummary[]>([]);
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [loading, setLoading] = useState(true);

    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
    const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [worksRes] = await Promise.all([
                api.get('/cce/works')
            ]);
            setWorks(worksRes.data.works || worksRes.data);
            setSubjectsSummary(worksRes.data.subjects_summary || []);

            // Auto expand visually first valid class
            if (worksRes.data.subjects_summary?.length > 0) {
                const grouped = groupByClass(worksRes.data.subjects_summary);
                const keys = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
                if (keys.length > 0) {
                    setExpandedClasses(new Set([keys[0]]));
                    if (grouped[keys[0]].length > 0) {
                        setExpandedSubjects(new Set([grouped[keys[0]][0].subject_id]));
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const groupByClass = (summaries: SubjectSummary[]) => {
        return summaries.reduce((acc, summary) => {
            const className = summary.class_name;
            if (!acc[className]) acc[className] = [];
            acc[className].push(summary);
            return acc;
        }, {} as Record<string, SubjectSummary[]>);
    };

    const groupedByClass = groupByClass(subjectsSummary);
    const sortedClasses = Object.keys(groupedByClass).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numB - numA; // Descending like 10, 09, 08 in image
    });

    const toggleClass = (className: string) => {
        const newSet = new Set(expandedClasses);
        if (newSet.has(className)) newSet.delete(className);
        else newSet.add(className);
        setExpandedClasses(newSet);
    };

    const toggleSubject = (e: React.MouseEvent, subjectId: string) => {
        e.stopPropagation();
        const newSet = new Set(expandedSubjects);
        if (newSet.has(subjectId)) newSet.delete(subjectId);
        else newSet.add(subjectId);
        setExpandedSubjects(newSet);
    };

    return (
        <AppLayout title="CCE Works">
            <div className="p-4 md:p-8 max-w-[1100px] mx-auto space-y-6 pb-24 min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2 animate-fade-in">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Curriculum Hierarchy</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Expand classes to manage subject-specific evaluation rubrics.</p>
                    </div>
                    <button
                        onClick={() => navigate('/cce/works/new')}
                        className="bg-[#0a6c5b] hover:bg-emerald-800 text-white font-bold text-sm px-6 py-2.5 rounded-full flex items-center justify-center transition-colors shadow-sm shrink-0 gap-2"
                    >
                        <Plus className="w-4 h-4" strokeWidth={3} /> New Assessment
                    </button>
                </div>

                {/* Accordion list */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100" />)}
                        </div>
                    ) : sortedClasses.map(className => {
                        const classSubjects = groupedByClass[className];
                        const isExpanded = expandedClasses.has(className);
                        const classNum = className.replace(/\D/g, '').padStart(2, '0');
                        const totalClassWorks = classSubjects.reduce((sum, s) => sum + s.total_works, 0);
                        const completedClassWorks = classSubjects.reduce((sum, s) => sum + s.completed_works, 0);
                        const classPercent = totalClassWorks > 0 ? Math.round((completedClassWorks / totalClassWorks) * 100) : 0;

                        return (
                            <div key={className} className={`bg-white rounded-3xl transition-all duration-300 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-100 cursor-pointer overflow-hidden ${isExpanded ? 'p-2 md:p-3' : 'hover:-translate-y-0.5'}`}>

                                {/* Outer Class Header */}
                                <div className={`p-4 md:p-5 flex items-center justify-between transition-colors ${!isExpanded && 'hover:bg-slate-50/50'}`} onClick={() => toggleClass(className)}>
                                    <div className="flex items-center gap-4 md:gap-5">
                                        <div className="w-[52px] h-[52px] rounded-2xl bg-emerald-100/60 flex items-center justify-center font-black text-emerald-800 text-[18px] shrink-0">
                                            {classNum}
                                        </div>
                                        <div>
                                            <h2 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">
                                                Class {className} - {getStage(className)}
                                            </h2>
                                            <p className="text-[12px] font-medium text-slate-500 mt-1 tracking-wide">
                                                {classSubjects.length} Subjects • {totalClassWorks} Total Works • {classPercent}% Complete
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 md:gap-6">
                                        {/* Mini Tags */}
                                        <div className="hidden sm:flex items-center space-x-1.5 mr-2">
                                            {classSubjects.slice(0, 3).map((s, idx) => (
                                                <span key={s.subject_id} className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getSubjectTagStyle(idx)}`}>
                                                    {s.subject_name.substring(0, 3)}
                                                </span>
                                            ))}
                                            {classSubjects.length > 3 && (
                                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                                                    +{classSubjects.length - 3}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-50 text-slate-400">
                                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Subjects List */}
                                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2 pb-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                    <div className="overflow-hidden">
                                        <div className="px-3 md:px-4 space-y-3">
                                            {classSubjects.map((subject, sIdx) => {
                                                const isSubjectExpanded = expandedSubjects.has(subject.subject_id);
                                                const worksForSubject = works.filter(w => w.subjectId === subject.subject_id);

                                                return (
                                                    <div key={subject.subject_id} className={`bg-[#f8fafc] rounded-3xl border transition-all duration-300 ${isSubjectExpanded ? 'border-slate-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>

                                                        <div className="p-4 md:p-5 flex items-center justify-between cursor-pointer rounded-3xl transition-colors hover:bg-slate-50/80" onClick={(e) => toggleSubject(e, subject.subject_id)}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-11 h-11 rounded-[14px] bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
                                                                    <BookOpen className="w-5 h-5 text-emerald-700" strokeWidth={2.5} />
                                                                </div>
                                                                <div>
                                                                    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{subject.subject_name}</h3>
                                                                    <p className="text-[11px] font-bold tracking-wide text-slate-400 mt-0.5">{subject.total_works} CCE Works Configured</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-5">
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-tight">Weightage</p>
                                                                    <p className="text-[13px] font-black text-slate-700">{totalClassWorks > 0 ? Math.round((subject.total_works / totalClassWorks) * 100) : 0}% of Class</p>
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-emerald-700">
                                                                    <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isSubjectExpanded ? 'rotate-180' : ''}`} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Assessments Table */}
                                                        {isSubjectExpanded && (
                                                            <div className="px-2 pb-2 mt-1">
                                                                <div className="bg-white rounded-[1.25rem] shadow-sm border border-slate-100 overflow-hidden">
                                                                    <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">
                                                                        <div className="col-span-5 md:col-span-4">Assessment Title</div>
                                                                        <div className="col-span-2 hidden md:block">Type</div>
                                                                        <div className="col-span-3 md:col-span-2">Status</div>
                                                                        <div className="col-span-3 md:col-span-2">Due Date</div>
                                                                        <div className="col-span-2 hidden lg:block">Distribution</div>
                                                                        <div className="col-span-1 text-center ml-auto">Actions</div>
                                                                    </div>

                                                                    {worksForSubject.length === 0 ? (
                                                                        <div className="p-8 text-center text-sm font-semibold text-slate-400">
                                                                            No assessments created yet.
                                                                        </div>
                                                                    ) : (
                                                                        <div className="divide-y divide-slate-50">
                                                                            {worksForSubject.map(work => {
                                                                                const isDraft = !work.issuedDate || new Date(work.issuedDate) > new Date();
                                                                                const statusColor = isDraft ? 'bg-orange-500' : 'bg-emerald-500';
                                                                                const statusText = isDraft ? 'Drafting' : 'Published';
                                                                                const distWidth = subject.max_marks > 0 ? Math.min(100, Math.round((work.maxMarks / subject.max_marks) * 100)) : 10;

                                                                                return (
                                                                                    <div key={work.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 p-4 items-start sm:items-center hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/cce/works/${work.id}`)}>

                                                                                        <div className="col-span-5 md:col-span-4 w-full">
                                                                                            <p className="text-[14px] font-bold text-slate-800 leading-tight truncate">{work.title}</p>
                                                                                            <p className="text-[11px] font-medium text-slate-400 mt-1 line-clamp-1">{work.description || work.submissionType || 'Internal Assessment'}</p>
                                                                                        </div>

                                                                                        <div className="col-span-2 hidden md:block">
                                                                                            <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md tracking-wider ${getTypeStyle(work.toolMethod || work.submissionType)}`}>
                                                                                                {(work.toolMethod || work.submissionType || 'TASK').substring(0, 10)}
                                                                                            </span>
                                                                                        </div>

                                                                                        <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                                                                                            <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></div>
                                                                                            <span className="text-[12px] font-bold text-slate-700">{statusText}</span>
                                                                                        </div>

                                                                                        <div className="col-span-3 md:col-span-2 text-[12px] font-bold text-slate-600">
                                                                                            {work.dueDate ? format(new Date(work.dueDate), 'MMM dd, yyyy') : 'No Date'}
                                                                                        </div>

                                                                                        <div className="col-span-2 hidden lg:block w-full max-w-[120px]">
                                                                                            <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
                                                                                                <div className="bg-emerald-700 h-full rounded-full transition-all" style={{ width: `${distWidth}%` }}></div>
                                                                                            </div>
                                                                                            <p className="text-[10px] font-bold text-slate-400">{distWidth}% of Subj.</p>
                                                                                        </div>

                                                                                        <div className="col-span-1 hidden sm:flex justify-end text-slate-300 hover:text-slate-600 cursor-pointer ml-auto transition-colors">
                                                                                            <MoreVertical className="w-5 h-5" />
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
