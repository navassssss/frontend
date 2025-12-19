import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
    CheckCircle,
    XCircle,
    Clock,
    Trophy,
    Calendar,
    User,
    GraduationCap,
    MessageSquare,
    Filter,
    Loader2,
    Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { format } from 'date-fns';

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

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

export default function StudentAchievementReviewPage() {
    const [filter, setFilter] = useState<FilterStatus>('pending');
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAchievements = async () => {
        setIsLoading(true);
        try {
            // Fetch all achievements (backend handles filtering if needed, but we'll filter client-side for smoother UI toggling)
            const response = await api.get('/achievements');
            setAchievements(response.data);
        } catch (error) {
            console.error('Failed to fetch achievements:', error);
            toast.error('Failed to load achievements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    const filteredAchievements = achievements.filter(a =>
        filter === 'all' ? true : a.status === filter
    );

    const handleApprove = async (achievement: Achievement) => {
        try {
            const note = reviewNotes[achievement.id];

            await api.post(`/achievements/${achievement.id}/approve`, {
                review_note: note
            });

            toast.success(`Achievement approved! +${achievement.points} points awarded.`);

            // Refresh list
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
            await api.post(`/achievements/${achievement.id}/reject`, {
                review_note: note
            });

            toast.info('Achievement rejected');

            // Refresh list
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
                return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
        }
    };

    return (
        <AppLayout title="Review Achievements">
            <div className="p-4 space-y-4">
                {/* Stats Card */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending Review</p>
                                <p className="text-3xl font-bold text-primary">{pendingCount}</p>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Trophy className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filter Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
                        <Button
                            key={status}
                            variant={filter === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter(status)}
                            className="capitalize"
                        >
                            {status}
                        </Button>
                    ))}
                </div>

                {/* Achievement List */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredAchievements.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} achievements found</p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredAchievements.map((achievement) => (
                            <Card key={achievement.id} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base truncate">{achievement.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground mt-1">{achievement.description || 'No description provided'}</p>
                                        </div>
                                        {getStatusBadge(achievement.status)}
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium text-foreground">{achievement.student?.user?.name || 'Unknown User'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                            <GraduationCap className="h-4 w-4" />
                                            <span>{achievement.student?.class?.name || 'No Class'}</span>
                                        </div>
                                    </div>

                                    {/* Attachments */}
                                    {achievement.attachments && achievement.attachments.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {achievement.attachments.map(att => (
                                                <a
                                                    key={att.id}
                                                    href={`http://192.168.1.118:8000/storage/${att.file_path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted text-xs font-medium text-primary hover:bg-muted/80 transition-colors"
                                                >
                                                    <Paperclip className="h-3.5 w-3.5" />
                                                    {att.file_name}
                                                </a>
                                            ))}
                                        </div>
                                    )}

                                    {/* Meta Info */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{achievement.category?.name}</Badge>
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {format(new Date(achievement.created_at), 'dd MMM yyyy')}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-primary">+{achievement.points} pts</span>
                                    </div>

                                    {/* Approved/Rejected By Info */}
                                    {(achievement.status !== 'pending' && achievement.approver) && (
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                            <MessageSquare className="h-3 w-3" />
                                            <span>Reviewed by {achievement.approver.name}</span>
                                        </div>
                                    )}

                                    {/* Review Note (for already reviewed) */}
                                    {achievement.review_note && (
                                        <div className="bg-muted/50 rounded-lg p-3 text-sm mt-2">
                                            <p className="text-muted-foreground text-xs font-semibold mb-1">Review Note:</p>
                                            <p>{achievement.review_note}</p>
                                        </div>
                                    )}

                                    {/* Action Section for Pending */}
                                    {achievement.status === 'pending' && (
                                        <div className="pt-2 space-y-3 border-t mt-2">
                                            <Textarea
                                                placeholder="Add review notes (required for rejection)..."
                                                value={reviewNotes[achievement.id] || ''}
                                                onChange={(e) => setReviewNotes(prev => ({
                                                    ...prev,
                                                    [achievement.id]: e.target.value
                                                }))}
                                                className="min-h-[80px]"
                                            />
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    className="flex-1 border-red-500/30 text-red-600 hover:bg-red-500/10"
                                                    onClick={() => handleDisapprove(achievement)}
                                                >
                                                    <XCircle className="h-4 w-4 mr-2" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleApprove(achievement)}
                                                >
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Approve
                                                </Button>
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