import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    ClipboardList,
    BarChart2,
    Trophy,
    HandHeart,
    Star,
    Medal,
    Wallet,
    Key,
    User as UserIcon,
    BadgeCheck
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
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
        created_at?: string;
    };
}

const quickActionsItems = [
    { icon: Calendar, label: 'Attendance', sub: 'Check daily records', path: '/students/', useIdInPath: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { icon: ClipboardList, label: 'CCE Works', sub: 'Continuous Evaluation', path: '/cce/works', useQuery: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { icon: BarChart2, label: 'Marks', sub: 'Exam scorecards', path: '/cce/student-marks', useQuery: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { icon: Trophy, label: 'Achievements', sub: 'Awards & medals', path: '/student-achievements', useQuery: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { icon: HandHeart, label: 'Donations', sub: 'Philanthropic history', path: '/fees/', useId: true, color: 'text-emerald-700', bg: 'bg-emerald-50' },
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
            <AppLayout title="Student Profile">
                <div className="flex justify-center items-center h-[60vh]">
                    <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </AppLayout>
        );
    }

    if (!student) {
        return (
            <AppLayout title="Student Profile">
                <div className="p-4 text-center py-12">
                    <p className="text-muted-foreground">Student not found</p>
                    <Button className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white" onClick={() => navigate('/students')}>
                        Back to Students
                    </Button>
                </div>
            </AppLayout>
        );
    }

    // Extract initials
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    // Format date if available
    const memberSince = student.user?.created_at 
        ? new Date(student.user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Not Available';

    return (
        <AppLayout title="Student Profile">
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5 pb-24 animate-fade-in min-h-screen">
                
                {/* Header Section */}
                <div className="flex items-center gap-3 mb-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/students')} className="hover:bg-slate-100">
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </Button>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h2>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white rounded-[1.5rem] p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-slate-900 flex items-center justify-center text-3xl font-black text-white shadow-sm overflow-hidden">
                                {/* Fallback avatar visual */}
                                <div className="absolute inset-0 bg-slate-800 opacity-50"></div>
                                <div className="relative z-10">{getInitials(student.name)}</div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center border-[3px] border-white shadow-sm">
                                <BadgeCheck className="w-3.5 h-3.5 text-white" />
                            </div>
                        </div>
                        
                        <div className="text-center md:text-left pt-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-2">
                                {student.name}
                            </h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                {student.class_room && (
                                    <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                                        CLASS {student.class_room.name}
                                    </span>
                                )}
                                {student.roll_number && (
                                    <span className="flex items-center gap-1.5 text-slate-600 text-[13px] font-semibold bg-slate-50 px-2.5 py-1 rounded-full">
                                        <UserIcon className="w-3.5 h-3.5 text-slate-400" /> Roll No: {student.roll_number}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Stars */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                                <Star className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                                +12 This Week
                            </span>
                        </div>
                        <div className="mt-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">TOTAL STARS</p>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{student.stars}</p>
                        </div>
                    </div>

                    {/* Points */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <Medal className="w-5 h-5 text-emerald-600" />
                            </div>
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full">
                                Top 5%
                            </span>
                        </div>
                        <div className="mt-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">ACADEMIC POINTS</p>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{student.total_points}</p>
                        </div>
                    </div>

                    {/* Balance */}
                    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden flex flex-col justify-between min-h-[130px]">
                        <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full border border-slate-100">
                                Due in 5d
                            </span>
                        </div>
                        <div className="mt-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">ACCOUNT BALANCE</p>
                            <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">₹{student.wallet_balance}</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - 2 Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    
                    {/* Quick Actions */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-2.5 ml-1">
                            <div className="w-1.5 h-5 bg-emerald-700 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Quick Actions</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {quickActionsItems.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (action.path === '#') return;
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
                                    className="relative bg-white rounded-2xl p-4 text-left transition-transform hover:-translate-y-1 hover:shadow-md border border-slate-100 shadow-sm min-h-[120px]"
                                >
                                    <div className={`w-10 h-10 rounded-xl ${action.bg} flex items-center justify-center mb-3`}>
                                        <action.icon className={`w-5 h-5 ${action.color}`} />
                                    </div>
                                    <p className="font-bold text-slate-900 mb-1 text-[15px]">{action.label}</p>
                                    <p className="text-[12px] font-medium text-slate-500 line-clamp-1">{action.sub}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Account Information */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2.5 ml-1">
                            <div className="w-1.5 h-5 bg-emerald-700 rounded-full"></div>
                            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Account Information</h2>
                        </div>
                        
                        <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100">
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">USERNAME</p>
                                    <p className="font-semibold text-slate-900 text-[14px]">{student.username}</p>
                                </div>
                                <div className="h-px w-full bg-slate-50"></div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">REGISTERED EMAIL</p>
                                    <p className="font-semibold text-slate-900 text-[14px]">
                                        {student.user?.email || 'Not provided'}
                                    </p>
                                </div>
                                <div className="h-px w-full bg-slate-50"></div>

                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">MEMBER SINCE</p>
                                    <p className="font-semibold text-slate-900 text-[14px]">{memberSince}</p>
                                </div>

                                <div className="pt-2">
                                    <button className="w-full flex items-center justify-center gap-2.5 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition-colors text-[13px]">
                                        <Key className="w-4 h-4 text-slate-500" /> Security Settings
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            
        </AppLayout>
    );
}
