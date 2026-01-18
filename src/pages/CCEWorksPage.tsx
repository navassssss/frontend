import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Plus,
    Filter,
    ChevronRight,
    Calendar,
    Award,
    FileText,
    Lock,
    Unlock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import api from '@/lib/api';

const levelColors = {
    1: 'bg-primary/10 text-primary',
    2: 'bg-accent/10 text-accent',
    3: 'bg-warning/10 text-warning',
    4: 'bg-success/10 text-success'
};

interface Subject {
    id: string;
    name: string;
    code: string;
    className: string;
    teacherName: string;
    finalMaxMarks: number;
    isLocked: boolean;
}

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

export default function CCEWorksPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [subjectsSummary, setSubjectsSummary] = useState<SubjectSummary[]>([]);
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>(isPrincipal ? 'my' : 'all');
    const [loading, setLoading] = useState(true);
    const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
    const [showAllPerClass, setShowAllPerClass] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [subjectsRes, worksRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/cce/works')
            ]);
            setSubjects(subjectsRes.data);
            setWorks(worksRes.data.works || worksRes.data);
            setSubjectsSummary(worksRes.data.subjects_summary || []);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorks = works.filter(w => {
        // Determine which subjects to include based on tab selection
        let allowedSubjects = subjects;
        if (selectedSubject === 'my') {
            allowedSubjects = subjects.filter(s => s.teacherName === user?.name);
        }

        // Handle specific subject filter
        if (selectedSubject !== 'all' && selectedSubject !== 'my' && selectedSubject !== 'none') {
            if (w.subjectId !== selectedSubject) return false;
        }
        // Handle 'my' tab - only show works from my subjects
        else if (selectedSubject === 'my') {
            if (!allowedSubjects.some(s => s.id === w.subjectId)) return false;
        }

        return true;
    });

    const groupedByLevel = [1, 2, 3, 4].map(level => ({
        level,
        works: filteredWorks.filter(w => w.level === level)
    }));

    return (
        <AppLayout title="CCE Works" showBack>
            <div className="p-4 space-y-6">
                {/* Subject Tabs (for principals) */}
                {isPrincipal && (
                    <div className="flex gap-2">
                        <Button
                            variant={selectedSubject === 'all' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setSelectedSubject('all')}
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            All Subjects
                        </Button>
                        <Button
                            variant={selectedSubject === 'my' ? 'default' : 'outline'}
                            className="flex-1"
                            onClick={() => setSelectedSubject('my')}
                        >
                            <Award className="w-4 h-4 mr-2" />
                            My Subjects
                        </Button>
                    </div>
                )}



                {/* Create Work Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={() => navigate('/cce/works/new')}
                        className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create CCE Work
                    </Button>
                </div>

                {/* Subjects with Statistics - Grouped by Class */}
                {isPrincipal && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Subjects Status {selectedSubject !== 'all' && selectedSubject !== 'my' && '(Filtered)'}
                        </h3>

                        {/* Group subjects by class */}
                        {(() => {
                            const ITEMS_PER_CLASS = 4;

                            // Filter subjects based on tab
                            const filteredSummary = subjectsSummary.filter(summary => {
                                if (selectedSubject === 'my') {
                                    const subject = subjects.find(s => s.id === summary.subject_id);
                                    return subject?.teacherName === user?.name;
                                }
                                return true;
                            });

                            // Group by class
                            const groupedByClass = filteredSummary.reduce((acc, summary) => {
                                const className = summary.class_name;
                                if (!acc[className]) acc[className] = [];
                                acc[className].push(summary);
                                return acc;
                            }, {} as Record<string, SubjectSummary[]>);

                            const classNames = Object.keys(groupedByClass).sort();

                            return classNames.map(className => {
                                const classSubjects = groupedByClass[className];
                                const isExpanded = expandedClasses.has(className);
                                const showAll = showAllPerClass.has(className);
                                const displaySubjects = showAll ? classSubjects : classSubjects.slice(0, ITEMS_PER_CLASS);
                                const hasMore = classSubjects.length > ITEMS_PER_CLASS;

                                return (
                                    <div key={className} className="space-y-2">
                                        {/* Class Header */}
                                        <div
                                            className="flex items-center justify-between cursor-pointer p-2 bg-muted/30 rounded-lg"
                                            onClick={() => {
                                                const newExpanded = new Set(expandedClasses);
                                                if (isExpanded) {
                                                    newExpanded.delete(className);
                                                } else {
                                                    newExpanded.add(className);
                                                }
                                                setExpandedClasses(newExpanded);
                                            }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                <span className="font-semibold text-sm">{className}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {classSubjects.length} {classSubjects.length === 1 ? 'subject' : 'subjects'}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Subject Cards */}
                                        {isExpanded && (
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {displaySubjects.map((summary) => {
                                                        const subject = subjects.find(s => s.id === summary.subject_id);
                                                        const isSelected = selectedSubject === summary.subject_id;
                                                        return (
                                                            <Card
                                                                key={summary.subject_id}
                                                                variant="interactive"
                                                                onClick={() => setSelectedSubject(isSelected ? (selectedSubject === 'my' ? 'my' : 'all') : summary.subject_id)}
                                                                className={`cursor-pointer hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                                            >
                                                                <CardContent className="p-3">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <span className="font-medium text-foreground text-sm truncate">
                                                                            {summary.subject_name}
                                                                        </span>
                                                                        {subject?.isLocked ? (
                                                                            <Lock className="w-4 h-4 text-warning" />
                                                                        ) : (
                                                                            <Unlock className="w-4 h-4 text-success" />
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            Max: {summary.max_marks}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div className="text-center">
                                                                            <p className="text-xs text-muted-foreground">Total</p>
                                                                            <p className="text-sm font-bold">{summary.total_works}</p>
                                                                        </div>
                                                                        <div className="text-center">
                                                                            <p className="text-xs text-muted-foreground">Done</p>
                                                                            <p className="text-sm font-bold text-green-600">{summary.completed_works}</p>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>

                                                {/* Show More Button */}
                                                {hasMore && !showAll && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            const newShowAll = new Set(showAllPerClass);
                                                            newShowAll.add(className);
                                                            setShowAllPerClass(newShowAll);
                                                        }}
                                                    >
                                                        Show {classSubjects.length - ITEMS_PER_CLASS} more
                                                    </Button>
                                                )}

                                                {/* Show Less Button */}
                                                {showAll && hasMore && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                        onClick={() => {
                                                            const newShowAll = new Set(showAllPerClass);
                                                            newShowAll.delete(className);
                                                            setShowAllPerClass(newShowAll);
                                                        }}
                                                    >
                                                        Show less
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            });
                        })()}
                    </div>
                )}

                {/* Works by Level */}
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid grid-cols-5 w-full">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="1">L1</TabsTrigger>
                        <TabsTrigger value="2">L2</TabsTrigger>
                        <TabsTrigger value="3">L3</TabsTrigger>
                        <TabsTrigger value="4">L4</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="mt-4 space-y-3">
                        {filteredWorks.length === 0 ? (
                            <Card variant="elevated">
                                <CardContent className="p-6 text-center">
                                    <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No CCE works found</p>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredWorks.map((work) => (
                                <WorkCard key={work.id} work={work} onClick={() => navigate(`/cce/works/${work.id}`)} />
                            ))
                        )}
                    </TabsContent>

                    {[1, 2, 3, 4].map((level) => (
                        <TabsContent key={level} value={level.toString()} className="mt-4 space-y-3">
                            {filteredWorks.filter(w => w.level === level).length === 0 ? (
                                <Card variant="elevated">
                                    <CardContent className="p-6 text-center">
                                        <p className="text-muted-foreground">No Level {level} works</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                filteredWorks
                                    .filter(w => w.level === level)
                                    .map((work) => (
                                        <WorkCard key={work.id} work={work} onClick={() => navigate(`/cce/works/${work.id}`)} />
                                    ))
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </div >
        </AppLayout >
    );
}

function WorkCard({ work, onClick }: { work: CCEWork; onClick: () => void }) {
    return (
        <Card variant="interactive" onClick={onClick} className="hover:border-primary/40 transition-all shadow-sm hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Line 1: Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`${levelColors[work.level as keyof typeof levelColors]} font-semibold px-2.5 py-0.5`}>
                                L{work.level}
                            </Badge>
                            <Badge className="bg-success/10 text-success border-success/20 font-medium px-2.5 py-0.5">
                                {work.subjectName}
                            </Badge>
                        </div>

                        {/* Line 2: Title */}
                        <h3 className="font-bold text-base text-foreground leading-tight">
                            {work.title}
                        </h3>

                        {/* Line 3: Class + Metadata combined */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            <span className="font-semibold text-foreground">Class {work.className}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                                <span className="font-medium">Due: {format(new Date(work.dueDate), 'MMM d')}</span>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-teal-600" />
                                <span className="font-medium">{work.maxMarks} marks</span>
                            </span>
                        </div>
                    </div>

                    {/* Chevron */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
