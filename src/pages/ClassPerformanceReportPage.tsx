import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Users, TrendingUp, Trophy, Calendar, User, ChevronRight,
    CheckCircle2, XCircle, Search, ArrowUpDown, ArrowUp, ArrowDown,
    MoreHorizontal, CheckCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import api from '@/lib/api';

interface Achievement {
    id: number;
    title: string;
    description: string;
    points: number;
    student_name: string;
    roll_number: string;
    created_at: string;
}

interface ClassReport {
    class: {
        id: number;
        name: string;
        class_teacher: { id: number; name: string } | null;
        total_students: number;
    };
    attendance: {
        average_percentage: number;
        present_today: number;
        absent_today: number;
    };
    academic: {
        average_marks: number;
        top_performers: Array<{ student_name: string; average_marks: number; roll_number: string }>;
    };
    achievements: {
        total_points: number;
        total_achievements: number;
        top_achievers: Array<{ student_name: string; total_points: number; roll_number: string }>;
        recent_achievements: Array<Achievement>;
    };
    students: Array<{
        id: number;
        name: string;
        roll_number: string;
        attendance_percentage: number;
        average_marks: number;
        achievement_points: number;
    }>;
}

// Helper to convert name to title case
const toTitleCase = (str: string) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

type SortField = 'roll_number' | 'name' | 'attendance_percentage' | 'average_marks' | 'achievement_points';
type SortOrder = 'asc' | 'desc';

export default function ClassPerformanceReportPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState<ClassReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('roll_number');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        api.get(`/classes/${id}/report`)
            .then((res) => {
                console.log('Class report:', res.data);
                setReport(res.data);
            })
            .catch(() => toast.error('Failed to load class report'))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedAndFilteredStudents = useMemo(() => {
        if (!report) return [];

        let result = [...report.students];

        // Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(student =>
                student.name.toLowerCase().includes(query) ||
                student.roll_number.toString().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aValue = a[sortField];
            let bValue = b[sortField];

            // Handle numeric strings if necessary
            if (typeof aValue === 'string' && !isNaN(Number(aValue))) aValue = Number(aValue);
            if (typeof bValue === 'string' && !isNaN(Number(bValue))) bValue = Number(bValue);

            if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [report, searchQuery, sortField, sortOrder]);

    if (loading) {
        return (
            <AppLayout title="Class Report" showBack>
                <div className="p-8 text-center">Loading...</div>
            </AppLayout>
        );
    }

    if (!report) {
        return (
            <AppLayout title="Class Report" showBack>
                <div className="p-8 text-center">Class not found</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title={`Class ${report.class.name} - Report`} showBack>
            <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
                {/* Custom Page Header */}
                <div className="flex items-center justify-between animate-fade-in mb-2">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/classes')}
                            className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground rotate-180" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Class {report.class.name}</h2>
                            <p className="text-sm text-muted-foreground">Performance Report</p>
                        </div>
                    </div>
                </div>

                {/* Class Teacher Card */}
                {report.class.class_teacher && (
                    <Card className="animate-slide-up bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
                                {report.class.class_teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-0.5">Class Teacher</p>
                                <p className="text-lg font-semibold">{toTitleCase(report.class.class_teacher.name)}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-primary/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Total Students</p>
                                <p className="text-2xl font-bold mt-1">{report.class.total_students}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-success/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Avg Attendance</p>
                                <p className="text-2xl font-bold mt-1">{report.attendance.average_percentage}%</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-success" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-all border-l-4 border-l-warning/50">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">Avg Marks</p>
                                <p className="text-2xl font-bold mt-1">{report.academic.average_marks}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-warning" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Attendance - Compact */}
                <Card className="animate-slide-up hover:shadow-md transition-all">
                    <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Today's Attendance
                            </h3>
                            <div className="flex flex-1 sm:justify-end gap-3">
                                <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-success/5 border border-success/10">
                                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                                        <CheckCheck className="w-4 h-4 text-success" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-success leading-none">{report.attendance.present_today}</p>
                                        <p className="text-xs text-muted-foreground font-medium">Present</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${report.attendance.absent_today > 0
                                        ? 'bg-destructive/5 border-destructive/10'
                                        : 'bg-secondary/30 border-secondary'
                                    }`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${report.attendance.absent_today > 0 ? 'bg-destructive/10' : 'bg-secondary'
                                        }`}>
                                        <XCircle className={`w-4 h-4 ${report.attendance.absent_today > 0 ? 'text-destructive' : 'text-muted-foreground'
                                            }`} />
                                    </div>
                                    <div>
                                        <p className={`text-xl font-bold leading-none ${report.attendance.absent_today > 0 ? 'text-destructive' : 'text-muted-foreground'
                                            }`}>{report.attendance.absent_today}</p>
                                        <p className="text-xs text-muted-foreground font-medium">Absent</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Statistics Grid */}
                <div className="grid md:grid-cols-2 gap-6 animate-slide-up">
                    {/* Top Performers (Marks) */}
                    <Card className="h-full hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-warning" />
                                Top Performers (Marks)
                            </h3>
                            <div className="space-y-3">
                                {report.academic.top_performers.slice(0, 3).map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                                        'bg-orange-100 text-orange-700 border border-orange-200'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{toTitleCase(student.student_name)}</p>
                                                <p className="text-xs text-muted-foreground">Roll: {student.roll_number}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="font-bold border-warning/30 text-warning-foreground bg-warning/5">
                                            {student.average_marks}%
                                        </Badge>
                                    </div>
                                ))}
                                {report.academic.top_performers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Achievers (Points) */}
                    <Card className="h-full hover:shadow-md transition-all">
                        <CardContent className="p-6">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary" />
                                Top Achievers (Points)
                            </h3>
                            <div className="space-y-3">
                                {report.achievements.top_achievers.slice(0, 3).map((student, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                                                        'bg-orange-100 text-orange-700 border border-orange-200'
                                                }`}>
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm text-foreground">{toTitleCase(student.student_name)}</p>
                                                <p className="text-xs text-muted-foreground">Roll: {student.roll_number}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="font-bold border-primary/30 text-primary bg-primary/5">
                                            {student.total_points} pts
                                        </Badge>
                                    </div>
                                ))}
                                {report.achievements.top_achievers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Achievements Table - NEW SECTION */}
                <Card className="animate-slide-up">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-bold">Recent Achievements</h3>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Achievement</TableHead>
                                        <TableHead className="text-center">Points</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.achievements.recent_achievements && report.achievements.recent_achievements.length > 0 ? (
                                        report.achievements.recent_achievements.map((achievement) => (
                                            <TableRow key={achievement.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex flex-col">
                                                        <span>{toTitleCase(achievement.student_name)}</span>
                                                        <span className="text-xs text-muted-foreground">#{achievement.roll_number}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-medium">{toTitleCase(achievement.title)}</span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="outline" className="bg-primary/5 text-primary font-bold border-primary/20">
                                                        +{achievement.points}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground text-sm">
                                                    {new Date(achievement.created_at).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                No recent achievements recorded.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Students Table Section */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardContent className="p-6 max-h-[1000px] overflow-auto">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-bold">All Students</h3>
                                <p className="text-sm text-muted-foreground">Manage and view student performance</p>
                            </div>
                            <div className="relative w-full md:w-72">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name or roll no..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow>
                                        <TableHead className="w-[100px] cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('roll_number')}>
                                            <div className="flex items-center gap-1">
                                                Roll No
                                                {sortField === 'roll_number' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                                            <div className="flex items-center gap-1">
                                                Student Name
                                                {sortField === 'name' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('attendance_percentage')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Attendance
                                                {sortField === 'attendance_percentage' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('average_marks')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Avg Marks
                                                {sortField === 'average_marks' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('achievement_points')}>
                                            <div className="flex items-center justify-center gap-1">
                                                Points
                                                {sortField === 'achievement_points' && (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedAndFilteredStudents.length > 0 ? (
                                        sortedAndFilteredStudents.map((student) => (
                                            <TableRow
                                                key={student.id}
                                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                onClick={() => navigate(`/students/${student.id}`)}
                                            >
                                                <TableCell className="font-medium text-muted-foreground">#{student.roll_number}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-foreground">
                                                            {toTitleCase(student.name)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge
                                                        variant="secondary"
                                                        className={`font-semibold ${student.attendance_percentage >= 90 ? 'bg-success/10 text-success hover:bg-success/20' :
                                                            student.attendance_percentage >= 75 ? 'bg-primary/10 text-primary hover:bg-primary/20' :
                                                                'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                                            }`}
                                                    >
                                                        {student.attendance_percentage}%
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {student.average_marks > 0 ? (
                                                        <span className={student.average_marks >= 75 ? 'text-success' : 'text-foreground'}>
                                                            {student.average_marks}%
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center font-medium">
                                                    {student.achievement_points > 0 ? (
                                                        <span className="text-primary">{student.achievement_points}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                No students found matching your search.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
