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
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [selectedLevel, setSelectedLevel] = useState<string>('all');
    const [loading, setLoading] = useState(true);

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
            setWorks(worksRes.data);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredWorks = works.filter(w => {
        if (selectedSubject !== 'all' && w.subjectId !== selectedSubject) return false;
        if (selectedLevel !== 'all' && w.level !== parseInt(selectedLevel)) return false;
        return true;
    });

    const groupedByLevel = [1, 2, 3, 4].map(level => ({
        level,
        works: filteredWorks.filter(w => w.level === level)
    }));

    return (
        <AppLayout title="CCE Works" showBack>
            <div className="p-4 space-y-6">
                {/* Filters */}
                <div className="grid grid-cols-2 gap-3">
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name} - {subject.className}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                        <SelectTrigger>
                            <SelectValue placeholder="All Levels" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="1">Level 1</SelectItem>
                            <SelectItem value="2">Level 2</SelectItem>
                            <SelectItem value="3">Level 3</SelectItem>
                            <SelectItem value="4">Level 4</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Create Work Button */}
                <Button
                    variant="touch"
                    className="w-full"
                    onClick={() => navigate('/cce/works/new')}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create CCE Work
                </Button>

                {/* Subjects with Lock Status */}
                {isPrincipal && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Subjects Status
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            {subjects.slice(0, 4).map((subject) => (
                                <Card
                                    key={subject.id}
                                    variant="interactive"
                                    onClick={() => navigate(`/cce/subjects/${subject.id}`)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="font-medium text-foreground text-sm truncate">
                                                {subject.name}
                                            </span>
                                            {subject.isLocked ? (
                                                <Lock className="w-4 h-4 text-warning" />
                                            ) : (
                                                <Unlock className="w-4 h-4 text-success" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{subject.className}</p>
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            Max: {subject.finalMaxMarks}
                                        </Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
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
            </div>
        </AppLayout>
    );
}

function WorkCard({ work, onClick }: { work: CCEWork; onClick: () => void }) {
    return (
        <Card variant="interactive" onClick={onClick}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className={levelColors[work.level as keyof typeof levelColors]}>
                                L{work.level}
                            </Badge>
                            <Badge variant="outline">{work.subjectName}</Badge>
                        </div>
                        <p className="font-semibold text-foreground truncate">{work.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{work.className}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(work.dueDate), 'MMM d')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                {work.maxMarks} marks
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </div>
            </CardContent>
        </Card>
    );
}
