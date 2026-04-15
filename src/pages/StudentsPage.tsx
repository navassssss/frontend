import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar,
    BookOpen,
    BarChart3,
    Trophy,
    IndianRupee,
    GraduationCap,
    Search,
    ChevronRight,
    ChevronLeft,
    ChevronRight as ChevronRightIcon,
    Users,
    Download,
    Printer
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Student {
    id: number;
    name: string;
    roll_number?: string;
    username?: string;
    email?: string;
    user?: { email?: string };
    class_room?: {
        id: number;
        name: string;
    };
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const quickActions = [
    { icon: Calendar, label: 'Attendance', path: '/attendance', color: 'text-blue-600' },
    { icon: BookOpen, label: 'CCE Works', path: '/cce/works', color: 'text-green-600' },
    { icon: BarChart3, label: 'Marks', path: '/cce/student-marks', color: 'text-purple-600' },
    { icon: Trophy, label: 'Achievements', path: '/student-achievements', color: 'text-yellow-600' },
    { icon: GraduationCap, label: 'Classes', path: '/classes', color: 'text-orange-600' },
    { icon: IndianRupee, label: 'Donations', path: '/fees', color: 'text-teal-600' },
];

export default function StudentsPage() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [pagination, setPagination] = useState<PaginationMeta>({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
    });

    const loadStudents = async (page = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                sort: 'roll_number',
                ...(searchQuery && { search: searchQuery }),
                ...(classFilter && classFilter !== 'all' && { class: classFilter }),
            });

            const { data } = await api.get(`/students?${params}`);

            setStudents(data.data || data);
            if (data.meta) {
                setPagination(data.meta);
            } else if (data.current_page) {
                setPagination({
                    current_page: data.current_page,
                    last_page: data.last_page,
                    per_page: data.per_page,
                    total: data.total,
                });
            }
        } catch (error) {
            toast.error('Failed to load students');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStudents(1); // Reset to page 1 when filters change
    }, [searchQuery, classFilter, statusFilter]);

    const handlePageChange = (page: number) => {
        loadStudents(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout title="Students">
            <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 pb-24">

                {/* Header Section (Desktop) */}
                <div className="hidden lg:flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8 animate-fade-in">
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-2">
                            Student Directory
                        </h1>
                        <p className="text-sm font-medium text-muted-foreground mt-1 max-w-md">
                            Manage and monitor the academic status of the current enrollment across all disciplines.
                        </p>
                    </div>

                    <div className="bg-emerald-300 rounded-3xl p-5 flex items-center justify-between gap-8 min-w-[240px] shadow-sm shrink-0">
                        <div>
                            <p className="text-[10px] font-black uppercase text-emerald-900 tracking-widest mb-1.5 opacity-80">Total Students</p>
                            <p className="text-4xl font-black text-emerald-950 leading-none">{pagination.total}</p>
                        </div>
                        <Users className="w-8 h-8 text-emerald-800 opacity-60" />
                    </div>
                </div>

                {/* Header Section (Mobile) */}
                <div className="lg:hidden bg-[#0a6c5b] text-white rounded-[24px] p-6 mb-6 shadow-sm relative overflow-hidden animate-fade-in">
                    <p className="text-[10px] uppercase font-black tracking-[0.15em] text-emerald-300/80 mb-2">
                        Institutional Overview
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black tracking-tight">{pagination.total}</span>
                        <span className="text-emerald-50 text-sm font-semibold opacity-90">Total Students</span>
                    </div>
                </div>

                {/* Mobile Filter & Search Bar */}
                <div className="lg:hidden space-y-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or admission no..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-11 h-12 bg-muted/50 border-0 rounded-2xl w-full text-[13px] font-medium"
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger className="bg-[#0a6c5b] border-0 text-white rounded-full text-xs font-bold w-auto h-8 px-4 flex items-center justify-center shrink-0 focus:ring-0 [&>svg]:ml-2">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((level) => (
                                    <SelectItem key={level} value={String(level)}>Class {level}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="bg-muted/60 text-foreground border border-border rounded-full text-xs font-semibold w-auto h-8 px-4 flex items-center gap-1 shrink-0 focus:ring-0 [&>svg]:ml-2">
                                <SelectValue placeholder="Status: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Status: All</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select defaultValue="all">
                            <SelectTrigger className="bg-muted/60 text-foreground border border-border rounded-full text-xs font-semibold w-auto h-8 px-4 flex items-center gap-1 shrink-0 focus:ring-0 [&>svg]:ml-2">
                                <SelectValue placeholder="Grade: All" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Grade: All</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <div className="animate-slide-up mb-8 hidden lg:block">
                    <h3 className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider">Quick Actions</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center gap-3 p-4 bg-card border border-border rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${action.color}`}>
                                    <action.icon className="w-6 h-6" />
                                </div>
                                <span className="text-[11px] font-bold text-center text-foreground group-hover:text-emerald-700 transition-colors">
                                    {action.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters Row (Desktop) */}
                <div className="hidden lg:flex bg-card border border-border shadow-sm rounded-2xl p-4 flex-col md:flex-row items-center justify-between gap-4 animate-slide-up">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                        <span className="text-sm font-bold text-muted-foreground shrink-0 hidden sm:block">Filter by:</span>

                        <div className="flex gap-3 w-full sm:w-auto">
                            <div className="w-full sm:w-[160px]">
                                <Select value={classFilter} onValueChange={setClassFilter}>
                                    <SelectTrigger className="bg-muted/30 border-border rounded-xl h-10 font-medium">
                                        <SelectValue placeholder="All Classes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((level) => (
                                            <SelectItem key={level} value={String(level)}>
                                                Class {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Status Filter */}
                            <div className="w-full sm:w-[140px]">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="bg-muted/30 border-border rounded-xl h-10 font-medium">
                                        <SelectValue placeholder="Status: All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Status: All</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="relative w-full sm:w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-10 bg-muted/30 border-border rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-muted/50 hover:bg-muted text-foreground font-bold text-xs rounded-xl transition-colors">
                            <Download className="w-4 h-4" /> Export List
                        </button>
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 h-10 px-4 bg-muted/50 hover:bg-muted text-foreground font-bold text-xs rounded-xl transition-colors">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                    </div>
                </div>

                {/* Table Header Row (Desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-70">
                    <div className="col-span-4">Student Information</div>
                    <div className="col-span-2">Class</div>
                    <div className="col-span-3">Ad. No.</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Students List Wrapper */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-16 bg-card border border-border rounded-2xl">
                            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="font-bold text-muted-foreground animate-pulse">Loading directory...</p>
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-16 bg-card border border-border rounded-2xl">
                            <p className="font-bold text-muted-foreground">No students found matching your criteria</p>
                        </div>
                    ) : (
                        (() => {
                            const filteredStudents = students;

                            if (filteredStudents.length === 0) {
                                return (
                                    <div className="text-center py-16 bg-card border border-border rounded-2xl">
                                        <p className="font-bold text-muted-foreground">No students found matching your criteria</p>
                                    </div>
                                );
                            }

                            return filteredStudents.map((student, index) => {
                                const email = student.email || student.user?.email || `${student.name.split(' ')[0].toLowerCase()}@civic.edu`;
                                const adNoRaw = student.username || student.roll_number || 'N/A';
                                const adNo = adNoRaw.replace(/^st_/i, '');
                                const formattedAdNo = adNo !== 'N/A' && !adNo.startsWith('#') ? `#${adNo}` : adNo;

                                return (
                                    <div
                                        key={student.id}
                                        onClick={() => navigate(`/students/${student.id}`)}
                                        className="bg-card border border-border shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-2xl lg:rounded-[20px] p-4 lg:px-6 lg:py-5 flex items-center lg:grid lg:grid-cols-12 gap-4 lg:gap-4 cursor-pointer hover:bg-muted/30 transition-all animate-slide-up group"
                                        style={{ animationDelay: `${0.03 * index}s`, animationFillMode: 'backwards' }}
                                    >
                                        {/* Responsive Column 1: Core Info */}
                                        <div className="lg:col-span-4 flex items-center gap-4 w-full min-w-0">
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 rounded-xl lg:rounded-full overflow-hidden bg-[#0e3b33] flex items-center justify-center border border-border group-hover:border-emerald-200 transition-colors">
                                                    <span className="text-sm font-black text-emerald-100">
                                                        {student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                    </span>
                                                </div>
                                                {/* Mobile active indicator dot */}
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full lg:hidden block"></div>
                                            </div>
                                            <div className="min-w-0 flex-1 lg:text-left">
                                                <p className="text-[15px] lg:text-sm font-bold text-foreground truncate">{student.name}</p>

                                                {/* Subtext Desktop: Email */}
                                                <p className="hidden lg:block text-[11px] font-medium text-muted-foreground truncate">{email}</p>

                                                {/* Subtext Mobile: Class & Ad. No. */}
                                                <p className="text-[12px] font-medium text-muted-foreground truncate lg:hidden mt-0.5">
                                                    <span className="text-[#0a6c5b] font-bold">{student.class_room?.name ? `${student.class_room.name}` : 'N/A'}</span> <span className="opacity-40 mx-1">•</span> {formattedAdNo}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Desktop columns -> Hidden on Mobile */}
                                        <div className="hidden lg:flex col-span-2 text-sm font-bold text-foreground items-center">
                                            Class {student.class_room?.name || 'N/A'}
                                        </div>

                                        <div className="hidden lg:flex col-span-3 text-xs font-bold text-muted-foreground items-center">
                                            {formattedAdNo}
                                        </div>

                                        <div className="hidden lg:flex col-span-1 justify-center items-center">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100/80 text-emerald-700">
                                                ACTIVE
                                            </span>
                                        </div>

                                        <div className="hidden lg:flex col-span-2 justify-end items-center">
                                            <span className="text-[11px] font-black tracking-widest text-[#0a6c5b] group-hover:text-emerald-800 uppercase transition-colors">
                                                View Profile
                                            </span>
                                        </div>

                                        {/* Mobile Right Action Indicator */}
                                        <div className="lg:hidden shrink-0 ml-auto">
                                            <ChevronRight className="w-5 h-5 text-muted-foreground/40 font-bold" />
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    )}
                </div>

                {/* Pagination (Modern Dots) */}
                {pagination.last_page > 1 && (
                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-2 animate-fade-in">
                        <p className="text-xs font-semibold text-muted-foreground">
                            Showing <span className="text-foreground">{(pagination.current_page - 1) * pagination.per_page + 1}</span> to <span className="text-foreground">{Math.min(pagination.current_page * pagination.per_page, pagination.total)}</span> of <span className="text-foreground font-bold">{pagination.total}</span> entries
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &lt;
                            </button>

                            {Array.from({ length: Math.min(5, pagination.last_page) }).map((_, idx) => {
                                // Simplified logic to show first few pages
                                const p = idx + 1;
                                const isActive = p === pagination.current_page;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => handlePageChange(p)}
                                        className={`w-8 h-8 flex flex-col items-center justify-center rounded-full font-bold text-sm transition-colors ${isActive
                                            ? 'bg-emerald-700 text-white shadow-sm'
                                            : 'bg-transparent text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}

                            {pagination.last_page > 5 && (
                                <>
                                    <span className="px-1 text-muted-foreground font-black tracking-widest">...</span>
                                    <button
                                        onClick={() => handlePageChange(pagination.last_page)}
                                        className={`w-8 h-8 flex flex-col items-center justify-center rounded-full font-bold text-sm transition-colors bg-transparent text-foreground hover:bg-muted`}
                                    >
                                        {pagination.last_page}
                                    </button>
                                </>
                            )}

                            <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                &gt;
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
