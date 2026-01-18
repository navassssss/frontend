import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Users,
    Calendar,
    CheckCircle,
    Clock,
    TrendingUp,
    Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import api from '@/lib/api';
import { format } from 'date-fns';

interface SubjectData {
    id: string;
    name: string;
    code: string;
    max_marks: number;
    class_id: string;
    class_name: string;
    teacher_name: string;
}

interface WorkData {
    id: number;
    title: string;
    description: string;
    max_marks: number;
    deadline: string | null;
    is_completed: boolean;
    evaluated_count: number;
    total_students: number;
}

interface StudentMark {
    student_id: number;
    student_name: string;
    username: string;
    total_obtained: number;
    total_possible: number;
    aggregated_marks: number;
    percentage: number;
}

interface SubjectStatistics {
    subject: SubjectData;
    total_works: number;
    completed_works: number;
    works: WorkData[];
    student_marks: StudentMark[];
}

export default function SubjectDetailPage() {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<SubjectStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [subjectId]);

    const loadData = async () => {
        try {
            const response = await api.get(`/subjects/${subjectId}/statistics`);
            setData(response.data);
        } catch (error) {
            console.error('Failed to load subject statistics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Subject Details" showBack>
                <div className="p-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">Loading...</p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (!data) {
        return (
            <AppLayout title="Subject Details" showBack>
                <div className="p-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <p className="text-muted-foreground">Subject not found</p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={data.subject.name} showBack>
            <div className="p-4 space-y-4">
                {/* Subject Overview */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            {data.subject.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="outline">{data.subject.code}</Badge>
                            <Badge variant="outline">{data.subject.class_name}</Badge>
                            <Badge variant="outline">Max: {data.subject.max_marks}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center p-3 bg-background/80 rounded-lg">
                                <p className="text-xs text-muted-foreground">Total Works</p>
                                <p className="text-2xl font-bold">{data.total_works}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <p className="text-xs text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {data.completed_works}
                                </p>
                            </div>
                            <div className="text-center p-3 bg-background/80 rounded-lg">
                                <p className="text-xs text-muted-foreground">Students</p>
                                <p className="text-2xl font-bold">{data.student_marks.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="assignments" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="assignments">
                            Assignments ({data.works.length})
                        </TabsTrigger>
                        <TabsTrigger value="students">
                            Student Marks ({data.student_marks.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Assignments Tab */}
                    <TabsContent value="assignments" className="mt-4 space-y-3">
                        {data.works.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                    <p className="text-muted-foreground">No assignments yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            data.works.map((work) => (
                                <Card
                                    key={work.id}
                                    variant="interactive"
                                    onClick={() => navigate(`/cce/works/${work.id}`)}
                                    className="cursor-pointer hover:shadow-md transition-shadow"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-foreground">
                                                    {work.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {work.description}
                                                </p>
                                            </div>
                                            {work.is_completed ? (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Completed
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    Pending
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-4">
                                                {work.deadline ? (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        {format(new Date(work.deadline), 'MMM dd, yyyy')}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <Calendar className="w-4 h-4" />
                                                        No deadline
                                                    </span>
                                                )}
                                                <Badge variant="outline">
                                                    Max: {work.max_marks}
                                                </Badge>
                                            </div>
                                            <span className="text-muted-foreground">
                                                {work.evaluated_count}/{work.total_students} evaluated
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    {/* Student Marks Tab */}
                    <TabsContent value="students" className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4" />
                                    Student Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {data.student_marks.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                        <p className="text-muted-foreground">No student data available</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto -mx-6">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[50px]">#</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead className="text-right">Marks</TableHead>
                                                    <TableHead className="text-right">Aggregated</TableHead>
                                                    <TableHead className="text-right">%</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.student_marks.map((student, index) => (
                                                    <TableRow key={student.student_id}>
                                                        <TableCell className="font-medium">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div>
                                                                <p className="font-medium">{student.student_name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {student.username}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="text-sm">
                                                                {student.total_obtained}/{student.total_possible}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge variant="outline" className="font-mono">
                                                                {student.aggregated_marks}/{data.subject.max_marks}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className={`font-semibold ${student.percentage >= 75 ? 'text-green-600' :
                                                                student.percentage >= 50 ? 'text-yellow-600' :
                                                                    'text-red-600'
                                                                }`}>
                                                                {student.percentage.toFixed(1)}%
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
