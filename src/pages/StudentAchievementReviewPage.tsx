import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Trophy,
    Calendar,
    User,
    School,
    MessageSquare,
    Filter,
    Loader2,
    Paperclip,
    ChevronRight,
    Search,
    ArrowUpDown,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';
type SortOption = 'date_desc' | 'date_asc' | 'points_desc' | 'points_asc';

interface Achievement {
    id: number;
    title: string;
    description: string;
    points: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    review_note?: string;
    approved_at?: string;
    category: {
        id: number;
        name: string;
    };
    student: {
        id: number;
        user: {
            name: string;
        };
        class?: {
            name: string;
        };
    };
    attachments: Array<{
        id: number;
        file_name: string;
        file_path: string;
        mime_type: string;
    }>;
    approver?: {
        name: string;
    };
}

// Helper for Title Case
const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

export default function StudentAchievementReviewPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const studentId = searchParams.get('student_id');
    const [filter, setFilter] = useState<FilterStatus>(studentId ? 'all' : 'pending');
    const [sort, setSort] = useState<SortOption>('date_desc');
    const [searchQuery, setSearchQuery] = useState('');
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [studentName, setStudentName] = useState<string>('');

    const fetchAchievements = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/achievements');
            setAchievements(response.data);

            if (studentId) {
                try {
                    const studentResponse = await api.get(`/students/${studentId}`);
                    setStudentName(studentResponse.data.name || studentResponse.data.user?.name || '');
                } catch (err) {
                    console.error('Failed to fetch student name:', err);
                }
            }
        } catch (error) {
            console.error('Failed to fetch achievements:', error);
            toast.error('Failed to load achievements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, [studentId]);

    const filteredAndSortedAchievements = useMemo(() => {
        let result = achievements.filter(a => {
            // Filter by status
            const statusMatch = filter === 'all' ? true : a.status === filter;
            // Filter by student
            const studentMatch = studentId ? a.student.id === parseInt(studentId) : true;
            // Filter by search
            const searchMatch = !searchQuery ||
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.student.user.name.toLowerCase().includes(searchQuery.toLowerCase());

            return statusMatch && studentMatch && searchMatch;
        });

        // Sort
        result.sort((a, b) => {
            switch (sort) {
                case 'date_desc': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'date_asc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'points_desc': return b.points - a.points;
                case 'points_asc': return a.points - b.points;
                default: return 0;
            }
        });

        return result;
    }, [achievements, filter, studentId, searchQuery, sort]);

    const handleApprove = async (achievement: Achievement) => {
        try {
            const note = reviewNotes[achievement.id];
            await api.post(`/achievements/${achievement.id}/approve`, { review_note: note });
            toast.success(`Achievement approved! +${achievement.points} points awarded.`);
            fetchAchievements();
            setReviewNotes(prev => ({ ...prev, [achievement.id]: '' }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to approve achievement');
        }
    };

    const handleDisapprove = async (achievement: Achievement) => {
        const note = reviewNotes[achievement.id];
        if (!note?.trim()) {
            toast.error('Please provide a reason for disapproval');
            return;
        }
        try {
            await api.post(`/achievements/${achievement.id}/reject`, { review_note: note });
            toast.info('Achievement rejected');
            fetchAchievements();
            setReviewNotes(prev => ({ ...prev, [achievement.id]: '' }));
        } catch (error) {
            console.error(error);
            toast.error('Failed to reject achievement');
        }
    };

    const pendingCount = achievements.filter(a => a.status === 'pending').length;

    const getStatusBadge = (status: Achievement['status']) => {
        switch (status) {
            case 'approved':
                return <Badge variant="outline" className="bg-success/5 text-success border-success/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>;
            case 'pending':
                return <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20 gap-1"><Clock className="w-3 h-3" /> Pending</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/20 gap-1"><XCircle className="w-3 h-3" /> Rejected</Badge>;
        }
    };

    const totalPoints = useMemo(() => {
        if (!studentId) return 0;
        return achievements
            .filter(a => a.student.id === parseInt(studentId) && a.status === 'approved')
            .reduce((sum, a) => sum + a.points, 0);
    }, [achievements, studentId]);

    return (
        <AppLayout title={studentId ? `Achievements` : "Review Achievements"} showBack={!!studentId}>
            <div className="p-4 space-y-6 pb-24 max-w-5xl mx-auto">
                {/* Back Button & Header */}
                <div className="flex items-center gap-4">
                    {studentId && (
                        <button
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            {studentId ? toTitleCase(studentName) : 'Achievement Reviews'}
                        </h2>
                        {studentId ? (
                            <p className="text-sm text-muted-foreground">Student Profile & History</p>
                        ) : (
                            <p className="text-sm text-muted-foreground">Manage and review student submissions</p>
                        )}
                    </div>
                </div>

                {/* Stats Card */}
                {studentId ? (
                    <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20 animate-slide-up">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg">
                                        {studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <h2 className="text-3xl font-bold text-foreground">{totalPoints}</h2>
                                            <span className="text-sm text-muted-foreground font-medium">Points</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="flex flex-col items-end">
                                        <Badge variant="secondary" className="mb-2 text-primary bg-primary/10 hover:bg-primary/20">
                                            {achievements.filter(a => a.student.id === parseInt(studentId)).length} Achievements
                                        </Badge>
                                        <p className="text-xs text-muted-foreground">Lifetime Total</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-gradient-to-br from-warning/5 to-transparent border-warning/20 animate-slide-up">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Pending Requests</p>
                                <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                                <Clock className="h-6 w-6 text-warning" />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-xl border shadow-sm animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
                        {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
                            <Button
                                key={status}
                                variant={filter === status ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter(status)}
                                className="capitalize rounded-full px-4"
                            >
                                {status}
                            </Button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
                                    <ArrowUpDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSort('date_desc')}>Newest First</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSort('date_asc')}>Oldest First</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSort('points_desc')}>High Points</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setSort('points_asc')}>Low Points</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Achievement List */}
                <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredAndSortedAchievements.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No achievements found</h3>
                            <p className="text-muted-foreground">Try adjusting your search or filters</p>
                        </div>
                    ) : (
                        filteredAndSortedAchievements.map((achievement) => (
                            <Card key={achievement.id} className="group overflow-hidden hover:shadow-md transition-all border-l-4" style={{
                                borderLeftColor: achievement.status === 'approved' ? '#22c55e' : achievement.status === 'rejected' ? '#ef4444' : '#eab308'
                            }}>
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row gap-4 justify-between">
                                        <div className="flex-1 space-y-3">
                                            {/* Header */}
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div>
                                                    <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                                        {toTitleCase(achievement.title)}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                                                            <Calendar className="w-3 h-3" />
                                                            {format(new Date(achievement.created_at), 'd MMM, yyyy')}
                                                        </span>
                                                        <span className="flex items-center gap-1 bg-secondary/50 px-2 py-0.5 rounded-md">
                                                            <Trophy className="w-3 h-3" />
                                                            {toTitleCase(achievement.category.name)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className={`text-sm font-bold px-3 py-1 ${achievement.status === 'rejected' ? 'text-destructive bg-destructive/10' : 'text-primary bg-primary/10'
                                                    }`}>
                                                    +{achievement.points} pts
                                                </Badge>
                                            </div>

                                            {/* Student Info (if valid) */}
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground py-2 border-y border-dashed bg-muted/20 -mx-5 px-5">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-3.5 w-3.5" />
                                                    <span className="font-medium text-foreground">{toTitleCase(achievement.student?.user?.name || 'Unknown')}</span>
                                                </div>
                                                {achievement.student?.class && (
                                                    <div className="flex items-center gap-1.5">
                                                        <School className="h-3.5 w-3.5" />
                                                        <span>Class {achievement.student.class.name}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Description */}
                                            {achievement.description && (
                                                <p className="text-sm text-foreground/80 leading-relaxed bg-secondary/20 p-3 rounded-lg">
                                                    {achievement.description}
                                                </p>
                                            )}

                                            {/* Attachments */}
                                            {achievement.attachments && achievement.attachments.length > 0 && (
                                                <div className="flex flex-wrap gap-2 pt-1">
                                                    {achievement.attachments.map(att => (
                                                        <a
                                                            key={att.id}
                                                            href={`${import.meta.env.VITE_STORAGE_URL}/${att.file_path}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-background hover:bg-secondary/50 transition-colors text-xs font-medium group/att"
                                                        >
                                                            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-primary">
                                                                <Paperclip className="h-3 w-3" />
                                                            </div>
                                                            <span className="truncate max-w-[120px]">{att.file_name}</span>
                                                            <Download className="w-3 h-3 text-muted-foreground opacity-0 group-hover/att:opacity-100 transition-opacity ml-1" />
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Status & Actions Column */}
                                        <div className="flex flex-col sm:items-end gap-3 min-w-[140px] pt-1">
                                            {getStatusBadge(achievement.status)}

                                            {/* Review details */}
                                            {achievement.status !== 'pending' && achievement.approver && (
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground">Reviewed by</p>
                                                    <p className="text-xs font-medium">{toTitleCase(achievement.approver.name)}</p>
                                                </div>
                                            )}

                                            {/* Action Buttons for Pending */}
                                            {achievement.status === 'pending' && (
                                                <div className="w-full space-y-2 pt-2 sm:pt-4">
                                                    <Textarea
                                                        placeholder="Reason (for rejection)..."
                                                        value={reviewNotes[achievement.id] || ''}
                                                        onChange={(e) => setReviewNotes(prev => ({
                                                            ...prev,
                                                            [achievement.id]: e.target.value
                                                        }))}
                                                        className="min-h-[60px] text-xs resize-none bg-background"
                                                    />
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                            onClick={() => handleDisapprove(achievement)}
                                                        >
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="h-8 bg-success hover:bg-success/90 text-white"
                                                            onClick={() => handleApprove(achievement)}
                                                        >
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Note Display */}
                                    {achievement.review_note && achievement.status !== 'pending' && (
                                        <div className="mt-4 flex gap-3 text-sm bg-muted/30 p-3 rounded-lg border border-dashed">
                                            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-xs font-bold text-muted-foreground mb-0.5">Review Note</p>
                                                <p className="text-foreground/80 italic">"{achievement.review_note}"</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}