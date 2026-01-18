import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import api from '@/lib/api';

interface User {
    id: number;
    name: string;
    role: string;
}

interface Issue {
    id: number;
    title: string;
    description: string;
}

export default function ForwardIssuePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [issue, setIssue] = useState<Issue | null>(null);
    const [teachers, setTeachers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [issueRes, teachersRes] = await Promise.all([
                    api.get(`/issues/${id}`),
                    api.get('/teachers?scope=assignable')
                ]);

                setIssue(issueRes.data.issue);
                setTeachers(teachersRes.data);
            } catch (error) {
                toast.error('Failed to load data');
                navigate(`/issues/${id}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) {
            toast.error('Please select a user');
            return;
        }

        setSubmitting(true);
        try {
            await api.post(`/issues/${id}/forward`, {
                to_user_id: selectedUser,
                note: note
            });
            toast.success('Issue forwarded successfully');
            navigate(`/issues/${id}`);
        } catch (error) {
            toast.error('Failed to forward issue');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!issue) return <div className="p-8 text-center">Issue not found</div>;

    return (
        <AppLayout title="Forward Issue">
            <div className="max-w-xl mx-auto p-4">
                <Button variant="ghost" className="mb-4 pl-0" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Issue
                </Button>

                <Card>
                    <CardHeader>
                        <CardTitle>Forward Issue</CardTitle>
                        <CardDescription>Assign this issue to another staff member</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold">{issue.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{issue.description}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assign To <span className="text-destructive">*</span></label>
                                <Select value={selectedUser} onValueChange={setSelectedUser}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select staff member">
                                            {selectedUser && (() => {
                                                const teacher = teachers.find(t => t.id.toString() === selectedUser);
                                                return teacher ? (
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                            <span className="text-xs font-semibold text-primary-foreground">
                                                                {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-medium">{teacher.name}</span>
                                                            <span className="text-xs text-muted-foreground capitalize">{teacher.role}</span>
                                                        </div>
                                                    </div>
                                                ) : null;
                                            })()}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        {teachers.map((teacher) => (
                                            <SelectItem
                                                key={teacher.id}
                                                value={teacher.id.toString()}
                                                className="h-16 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 py-1">
                                                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                        <span className="text-sm font-semibold text-primary-foreground">
                                                            {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span className="font-medium text-sm">{teacher.name}</span>
                                                        <span className="text-xs text-muted-foreground capitalize">{teacher.role}</span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Note (Optional)</label>
                                <Textarea
                                    placeholder="Why are you forwarding this?"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={submitting}>
                                {submitting ? 'Forwarding...' : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Forward Issue
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
