import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Calendar,
    Award,
    Clock,
    CheckCircle,
    Upload,
    FileText
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import StudentLayout from '@/components/student/StudentLayout';
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
    dueDate: string;
    maxMarks: number;
    submissionType: string;
    status: 'pending' | 'submitted' | 'evaluated';
    submittedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
    fileUrl: string | null;
}

interface SubjectMark {
    subjectId: number;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
}

export default function StudentCCEPage() {
    const { student } = useStudentAuth();
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

    return (
        <StudentLayout title="CCE Works">
            <div className="space-y-6 pb-24">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-warning">{pendingWorks.length}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-success">{submittedWorks.length}</p>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-primary">
                                {totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">Overall</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Subject-wise Marks */}
                {subjectMarks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Subject-wise Marks
                        </h3>
                        {subjectMarks.map((subject) => (
                            <Card key={subject.subjectId} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">{subject.subjectName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {subject.marksObtained} / {subject.totalMarks} marks
                                            </p>
                                        </div>
                                        <Badge variant={subject.percentage >= 75 ? 'success' : subject.percentage >= 50 ? 'warning' : 'destructive'}>
                                            {subject.percentage}%
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pending Works */}
                {pendingWorks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Pending Works
                        </h3>
                        {pendingWorks.map((work) => (
                            <WorkCard
                                key={work.id}
                                work={work}
                                onFileUpload={handleFileUpload}
                                uploading={uploadingId === work.id}
                            />
                        ))}
                    </div>
                )}

                {/* Submitted/Evaluated Works */}
                {submittedWorks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Submitted Works
                        </h3>
                        {submittedWorks.map((work) => (
                            <WorkCard
                                key={work.id}
                                work={work}
                                onFileUpload={handleFileUpload}
                                uploading={uploadingId === work.id}
                            />
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {works.length === 0 && (
                    <Card variant="elevated">
                        <CardContent className="p-6 text-center">
                            <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No CCE works assigned yet</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </StudentLayout>
    );
}

interface WorkCardProps {
    work: CCEWork;
    onFileUpload: (workId: number, file: File) => void;
    uploading: boolean;
}

function WorkCard({ work, onFileUpload, uploading }: WorkCardProps) {
    const isPastDue = new Date(work.dueDate) < new Date();
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileUpload(work.id, file);
        }
    };

    return (
        <Card variant="elevated">
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={levelColors[work.level as keyof typeof levelColors]}>
                                L{work.level}
                            </Badge>
                            <Badge variant="outline">{work.subjectName}</Badge>
                            {work.status === 'evaluated' && (
                                <Badge variant="success">
                                    {work.marksObtained}/{work.maxMarks}
                                </Badge>
                            )}
                        </div>
                        <p className="font-semibold text-foreground">{work.title}</p>

                        <div className="flex items-center gap-3 mt-3 text-xs">
                            <span className={`flex items-center gap-1 ${isPastDue && work.status === 'pending' ? 'text-destructive' : 'text-muted-foreground'}`}>
                                <Calendar className="w-3 h-3" />
                                Due: {format(new Date(work.dueDate), 'MMM d')}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                                <Award className="w-3 h-3" />
                                {work.maxMarks} marks
                            </span>
                        </div>

                        {work.feedback && (
                            <div className="mt-3 p-2 bg-success/5 rounded-lg border border-success/20">
                                <p className="text-xs text-muted-foreground">Teacher Feedback:</p>
                                <p className="text-sm text-foreground italic">"{work.feedback}"</p>
                            </div>
                        )}

                        {work.fileUrl && (
                            <a
                                href={work.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                            >
                                <FileText className="w-3 h-3" />
                                View Uploaded File
                            </a>
                        )}
                    </div>

                    <div className="flex-shrink-0">
                        {work.status === 'pending' && work.submissionType === 'online' ? (
                            <>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    <Upload className="w-4 h-4 mr-1" />
                                    {uploading ? 'Uploading...' : 'Upload'}
                                </Button>
                            </>
                        ) : work.status === 'pending' ? (
                            <Badge variant="secondary">Offline</Badge>
                        ) : work.status === 'submitted' ? (
                            <Badge variant="warning">
                                <Clock className="w-3 h-3 mr-1" />
                                Pending
                            </Badge>
                        ) : (
                            <Badge variant="success">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Graded
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}