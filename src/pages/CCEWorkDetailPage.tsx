import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Calendar,
    Award,
    FileText,
    Clock,
    Edit,
    User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import api from '@/lib/api';

const levelColors = {
    1: 'bg-primary/10 text-primary',
    2: 'bg-accent/10 text-accent',
    3: 'bg-warning/10 text-warning',
    4: 'bg-success/10 text-success'
};

interface Submission {
    id: number;
    studentId: number;
    studentName: string;
    rollNumber: string;
    status: 'pending' | 'submitted' | 'evaluated';
    submittedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
    fileUrl: string | null;
}

interface WorkDetail {
    id: number;
    title: string;
    description: string;
    level: number;
    week: number;
    subjectName: string;
    className: string;
    toolMethod: string;
    issuedDate: string;
    dueDate: string;
    maxMarks: number;
    submissionType: string;
    submissions: Submission[];
}

export default function CCEWorkDetailPage() {
    const { id } = useParams();
    const [work, setWork] = useState<WorkDetail | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [marks, setMarks] = useState('');
    const [feedback, setFeedback] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) loadWork();
    }, [id]);

    const loadWork = async () => {
        try {
            const { data } = await api.get(`/cce/works/${id}`);
            setWork(data);
        } catch (error) {
            toast.error('Failed to load work details');
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!selectedSubmission || !marks) {
            toast.error('Please enter marks');
            return;
        }

        const marksNum = parseFloat(marks);
        if (marksNum < 0 || marksNum > (work?.maxMarks || 100)) {
            toast.error(`Marks must be between 0 and ${work?.maxMarks}`);
            return;
        }

        try {
            await api.post(`/cce/submissions/${selectedSubmission.id}/evaluate`, {
                marks_obtained: marksNum,
                feedback: feedback
            });
            toast.success('Submission evaluated successfully');
            setDialogOpen(false);
            setSelectedSubmission(null);
            setMarks('');
            setFeedback('');
            loadWork();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to evaluate');
        }
    };

    if (loading) {
        return (
            <AppLayout title="CCE Work" showBack>
                <div className="p-4 text-center">Loading...</div>
            </AppLayout>
        );
    }

    if (!work) {
        return (
            <AppLayout title="CCE Work" showBack>
                <div className="p-4">
                    <Card variant="elevated">
                        <CardContent className="p-6 text-center">
                            <p className="text-muted-foreground">Work not found</p>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const stats = {
        total: work.submissions.length,
        evaluated: work.submissions.filter(s => s.status === 'evaluated').length,
        submitted: work.submissions.filter(s => s.status === 'submitted').length,
        pending: work.submissions.filter(s => s.status === 'pending').length
    };

    // Sort submissions: submitted first, then pending, then evaluated
    const sortedSubmissions = [...work.submissions].sort((a, b) => {
        const statusOrder = { submitted: 0, pending: 1, evaluated: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return (
        <AppLayout title="CCE Work Details" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Work Info */}
                <Card variant="elevated">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Badge className={levelColors[work.level as keyof typeof levelColors]}>
                                Level {work.level}
                            </Badge>
                            <Badge variant="outline">{work.subjectName}</Badge>
                        </div>

                        <h2 className="text-xl font-bold text-foreground">{work.title}</h2>
                        {work.description && (
                            <p className="text-muted-foreground mt-2">{work.description}</p>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Due:</span>
                                <span className="text-foreground">{format(new Date(work.dueDate), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Award className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Max:</span>
                                <span className="text-foreground">{work.maxMarks} marks</span>
                            </div>
                            {work.toolMethod && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Method:</span>
                                    <span className="text-foreground">{work.toolMethod}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Week:</span>
                                <span className="text-foreground">{work.week}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-success">{stats.evaluated}</p>
                            <p className="text-xs text-muted-foreground">Evaluated</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-warning">{stats.submitted}</p>
                            <p className="text-xs text-muted-foreground">Submitted</p>
                        </CardContent>
                    </Card>
                    <Card variant="stat">
                        <CardContent className="p-3 text-center">
                            <p className="text-2xl font-bold text-muted-foreground">{stats.pending}</p>
                            <p className="text-xs text-muted-foreground">Pending</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Submissions List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Student Submissions
                    </h3>

                    {work.submissions.length === 0 ? (
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <User className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No submissions yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        sortedSubmissions.map((submission) => (
                            <Card key={submission.id} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-foreground">{submission.studentName}</p>
                                            <p className="text-sm text-muted-foreground">Roll: {submission.rollNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            {submission.status === 'evaluated' ? (
                                                <>
                                                    <Badge variant="success">
                                                        {submission.marksObtained}/{work.maxMarks}
                                                    </Badge>
                                                </>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedSubmission(submission);
                                                        setMarks('');
                                                        setFeedback('');
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Evaluate
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    {submission.feedback && (
                                        <p className="text-sm text-muted-foreground mt-2 italic">
                                            "{submission.feedback}"
                                        </p>
                                    )}
                                    {submission.fileUrl && (
                                        <a
                                            href={submission.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            <FileText className="w-3 h-3" />
                                            View Submitted File
                                        </a>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Evaluate Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Evaluate Submission</DialogTitle>
                        </DialogHeader>
                        {selectedSubmission && (
                            <div className="space-y-4 mt-4">
                                <div>
                                    <p className="font-medium">{selectedSubmission.studentName}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Roll: {selectedSubmission.rollNumber}
                                    </p>
                                    {selectedSubmission.fileUrl && (
                                        <a
                                            href={selectedSubmission.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            View Submitted File
                                        </a>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Marks (out of {work.maxMarks})</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max={work.maxMarks}
                                        step="0.5"
                                        value={marks}
                                        onChange={(e) => setMarks(e.target.value)}
                                        placeholder="Enter marks"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Feedback</Label>
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Enter feedback"
                                        rows={3}
                                    />
                                </div>
                                <Button onClick={handleEvaluate} className="w-full">
                                    Submit Evaluation
                                </Button>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}