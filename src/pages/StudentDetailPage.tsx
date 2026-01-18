import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    BookOpen,
    BarChart3,
    Trophy,
    IndianRupee,
    Mail,
    Phone,
    User as UserIcon
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Student {
    id: number;
    name: string;
    username: string;
    roll_number: string;
    total_points: number;
    stars: number;
    wallet_balance: string;
    class_room?: {
        id: number;
        name: string;
    };
    user?: {
        id: number;
        name: string;
        email: string;
        phone?: string;
    };
}

const quickActions = [
    { icon: Calendar, label: 'Attendance', path: '/students/', color: 'bg-blue-100 text-blue-600', useIdInPath: true },
    { icon: BookOpen, label: 'CCE Works', path: '/cce/works', color: 'bg-green-100 text-green-600', useQuery: true },
    { icon: BarChart3, label: 'Marks', path: '/cce/student-marks', color: 'bg-purple-100 text-purple-600', useQuery: true },
    { icon: Trophy, label: 'Achievements', path: '/student-achievements', color: 'bg-yellow-100 text-yellow-600', useQuery: true },
    { icon: IndianRupee, label: 'Donations', path: '/fees/', color: 'bg-teal-100 text-teal-600', useId: true },
];

export default function StudentDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [student, setStudent] = useState<Student | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudent();
    }, [id]);

    const loadStudent = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/students/${id}`);
            setStudent(data);
        } catch (error) {
            toast.error('Failed to load student details');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="Student Details">
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">Loading student details...</p>
                </div>
            </AppLayout>
        );
    }

    if (!student) {
        return (
            <AppLayout title="Student Details">
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">Student not found</p>
                    <Button className="mt-4" onClick={() => navigate('/students')}>
                        Back to Students
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Student Details">
            <div className="p-4 space-y-4 pb-24">

                {/* Header with Back Button */}
                <div className="flex items-center gap-3 animate-fade-in">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate('/students')}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-xl font-bold text-foreground">Student Profile</h2>
                </div>

                {/* Profile Card */}
                <Card className="animate-slide-up">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl font-bold text-primary-foreground">
                                    {student.name
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-xl font-bold text-foreground mb-1">
                                    {student.name}
                                </h3>

                                <div className="space-y-2">
                                    {student.class_room && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">
                                                Class {student.class_room.name}
                                            </Badge>
                                            {student.roll_number && (
                                                <Badge variant="outline">
                                                    Roll {student.roll_number}
                                                </Badge>
                                            )}
                                        </div>
                                    )}

                                    {student.user?.email && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="w-4 h-4" />
                                            <span>{student.user.email}</span>
                                        </div>
                                    )}

                                    {student.user?.phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="w-4 h-4" />
                                            <span>{student.user.phone}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <UserIcon className="w-4 h-4" />
                                        <span>Username: {student.username}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                            <p className="text-2xl font-bold text-foreground">{student.stars}</p>
                            <p className="text-xs text-muted-foreground">Stars</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <BarChart3 className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                            <p className="text-2xl font-bold text-foreground">{student.total_points}</p>
                            <p className="text-xs text-muted-foreground">Points</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 text-center">
                            <IndianRupee className="w-6 h-6 mx-auto mb-2 text-teal-600" />
                            <p className="text-2xl font-bold text-foreground">₹{student.wallet_balance}</p>
                            <p className="text-xs text-muted-foreground">Balance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-5 gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.path}
                                    onClick={() => {
                                        if (action.useId) {
                                            navigate(`${action.path}${student.id}`);
                                        } else if (action.useIdInPath) {
                                            navigate(`${action.path}${student.id}/attendance`);
                                        } else if (action.useQuery) {
                                            navigate(`${action.path}?student_id=${student.id}`);
                                        } else {
                                            navigate(action.path);
                                        }
                                    }}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${action.color}`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-medium text-center text-foreground">
                                        {action.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Info */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Account Information</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Student ID</span>
                                <span className="font-medium text-foreground">{student.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Username</span>
                                <span className="font-medium text-foreground">{student.username}</span>
                            </div>
                            {student.roll_number && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Roll Number</span>
                                    <span className="font-medium text-foreground">{student.roll_number}</span>
                                </div>
                            )}
                            {student.class_room && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Class</span>
                                    <span className="font-medium text-foreground">Class {student.class_room.name}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
