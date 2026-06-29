import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Calendar,
    Award,
    Clock,
    CheckCircle,
    Upload,
    FileText,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    totalWorks: number;
    pendingWorks: number;
    marksObtained: number;
    totalMarks: number;
    convertedMarks: number;
    finalMaxMarks: number;
    percentage: number;
}

export default function StudentCCESubjectDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [works, setWorks] = useState<CCEWork[]>([]);
    const [subject, setSubject] = useState<SubjectMark | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    useEffect(() => {
        loadWorks();
    }, [id]);

    const loadWorks = async () => {
        try {
            const { data } = await api.get('/student/cce/works');
            const subjectWorks = data.submissions?.filter((w: CCEWork) => w.subjectId.toString() === id) || [];
            const currentSubject = data.subjectMarks?.find((s: SubjectMark) => s.subjectId.toString() === id);
            
            setWorks(subjectWorks);
            setSubject(currentSubject || null);
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

    if (loading) {
        return (
            <StudentLayout title="Loading..." showBack>
                <div className="text-center p-4">Loading...</div>
            </StudentLayout>
        );
    }

    if (!subject && works.length === 0) {
        return (
            <StudentLayout title="Assessments" showBack>
                <div className="text-center p-4">Subject not found</div>
            </StudentLayout>
        );
    }

    const pendingWorks = works.filter(w => w.status === 'pending');
    const submittedWorks = works.filter(w => w.status === 'submitted' || w.status === 'evaluated');

    return (
        <StudentLayout 
            title={subject?.subjectName || 'Assessments'} 
            showBack={true}
            onBack={() => navigate('/student/cce')}
        >
            <div className="space-y-6 pb-24">
                
                {subject && (
                    <Card variant="elevated" className="bg-[#00a67e] text-white border-0 overflow-hidden relative">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                            <Award className="w-32 h-32" />
                        </div>
                        <CardContent className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-1">Subject Performance</p>
                                    <h2 className="text-2xl font-black">{subject.subjectName}</h2>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black">
                                        {subject.convertedMarks} <span className="text-lg opacity-80">/ {subject.finalMaxMarks}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wider">Final Marks</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
                                <div>
                                    <p className="text-2xl font-black">{subject.totalWorks}</p>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Total Works</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{subject.pendingWorks}</p>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Pending</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black">{subject.percentage}%</p>
                                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Raw Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Pending Works */}
                {pendingWorks.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-warning"></span> Pending Assessments
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
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-success"></span> Completed Assessments
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
                                <p className="text-xs text-muted-foreground font-semibold">Teacher Feedback:</p>
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
