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
    ChevronRight as ChevronRightIcon
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
    roll_number: string;
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
    }, [searchQuery, classFilter]);

    const handlePageChange = (page: number) => {
        loadStudents(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout title="Students">
            <div className="p-4 space-y-4 pb-24">

                {/* Header */}
                <div className="flex items-center justify-between animate-fade-in">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Students</h2>
                        <p className="text-sm text-muted-foreground">
                            {pagination.total} students total
                        </p>
                    </div>
                </div>

                {/* Quick Actions Bar */}
                <Card className="animate-slide-up">
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
                        <div className="grid grid-cols-6 gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.path}
                                    onClick={() => navigate(action.path)}
                                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-secondary transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-full bg-secondary flex items-center justify-center ${action.color}`}>
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

                {/* Filters */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardContent className="p-4 space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Class Filter */}
                        <Select value={classFilter} onValueChange={setClassFilter}>
                            <SelectTrigger>
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
                    </CardContent>
                </Card>

                {/* Students List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No students found</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {students.map((student, index) => (
                            <Card
                                key={student.id}
                                variant="interactive"
                                onClick={() => navigate(`/students/${student.id}`)}
                                className="animate-slide-up"
                                style={{
                                    animationDelay: `${0.05 * index}s`,
                                    animationFillMode: 'backwards'
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-primary-foreground">
                                                {student.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </span>
                                        </div>

                                        {/* Student Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="font-semibold text-foreground truncate">
                                                    {student.name}
                                                </h3>
                                                <ChevronRightIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-sm text-muted-foreground">
                                                    {student.class_room
                                                        ? `Class ${student.class_room.name}`
                                                        : 'No class assigned'}
                                                </p>
                                                {student.roll_number && (
                                                    <>
                                                        <span className="text-muted-foreground">•</span>
                                                        <p className="text-sm text-muted-foreground">
                                                            Roll {student.roll_number}
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                    <Card className="animate-fade-in">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.current_page - 1)}
                                    disabled={pagination.current_page === 1}
                                >
                                    <ChevronLeft className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>

                                <span className="text-sm text-muted-foreground">
                                    Page {pagination.current_page} of {pagination.last_page}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handlePageChange(pagination.current_page + 1)}
                                    disabled={pagination.current_page === pagination.last_page}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
