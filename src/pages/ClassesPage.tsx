import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ChevronRight, GraduationCap, UserCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

interface ClassRoom {
    id: number;
    name: string;
    level: number;
    section: string;
    students_count: number;
    class_teacher: {
        id: number;
        name: string;
    } | null;
}

interface Teacher {
    id: number;
    name: string;
    role: string;
}

// Helper to convert name to title case
const toTitleCase = (str: string) => {
    if (!str) return str;
    return str.toLowerCase().split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
};

// Helper to get color based on class level
const getClassColor = (level: number) => {
    const colors = [
        'bg-blue-100 text-blue-700',
        'bg-green-100 text-green-700',
        'bg-purple-100 text-purple-700',
        'bg-orange-100 text-orange-700',
        'bg-pink-100 text-pink-700',
        'bg-teal-100 text-teal-700',
        'bg-indigo-100 text-indigo-700',
        'bg-red-100 text-red-700',
        'bg-yellow-100 text-yellow-700',
        'bg-cyan-100 text-cyan-700',
    ];
    return colors[(level - 1) % colors.length];
};

// Helper to get avatar color based on initials
const getAvatarColor = (name: string) => {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-orange-500',
        'bg-pink-500',
        'bg-teal-500',
    ];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
};

export default function ClassesPage() {
    const navigate = useNavigate();
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            api.get('/classes'),
            api.get('/teachers')
        ])
            .then(([classesRes, teachersRes]) => {
                console.log('Classes response:', classesRes.data);
                console.log('Teachers response:', teachersRes.data);
                setClasses(classesRes.data);
                setTeachers(teachersRes.data);
            })
            .catch(() => toast.error('Failed to load data'))
            .finally(() => setLoading(false));
    }, []);

    const handleAssignTeacher = (classId: number, teacherId: string) => {
        api.post(`/classes/${classId}/assign-teacher`, { teacher_id: teacherId })
            .then((res) => {
                setClasses(prev => prev.map(c =>
                    c.id === classId
                        ? { ...c, class_teacher: res.data.class.class_teacher }
                        : c
                ));
                toast.success('Class teacher assigned successfully');
            })
            .catch(() => toast.error('Failed to assign teacher'));
    };

    if (loading) {
        return (
            <AppLayout title="Classes">
                <div className="p-8 text-center">Loading...</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Classes" showBack>
            <div className="p-4 space-y-4">
                {/* Header */}
                <div className="animate-fade-in">
                    <h2 className="text-xl font-bold text-foreground">Class Management</h2>
                    <p className="text-sm text-muted-foreground">{classes.length} classes</p>
                </div>

                {/* Classes Grid - Responsive */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classes.map((classRoom, index) => (
                        <Card
                            key={classRoom.id}
                            className="animate-slide-up hover:shadow-lg transition-all hover:border-primary/40"
                            style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
                        >
                            <CardContent className="p-4">
                                {/* Header with Class Name and Icon */}
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-lg ${getClassColor(classRoom.level)} flex items-center justify-center flex-shrink-0`}>
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base text-foreground leading-tight">
                                            Class {classRoom.name}
                                        </h3>
                                        <Badge variant="secondary" className="text-xs mt-1 bg-muted text-muted-foreground font-medium">
                                            <Users className="w-3 h-3 mr-1" />
                                            {classRoom.students_count ?? 0} students
                                        </Badge>
                                    </div>
                                </div>

                                {/* Class Teacher */}
                                <div className="space-y-1.5 mb-3">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Class Teacher
                                    </label>
                                    {classRoom.class_teacher ? (
                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                                            <div className={`w-7 h-7 rounded-full ${getAvatarColor(classRoom.class_teacher.name)} flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-xs font-bold text-white">
                                                    {classRoom.class_teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium truncate" title={toTitleCase(classRoom.class_teacher.name)}>
                                                {toTitleCase(classRoom.class_teacher.name)}
                                            </span>
                                        </div>
                                    ) : (
                                        <Select
                                            value=""
                                            onValueChange={(value) => handleAssignTeacher(classRoom.id, value)}
                                        >
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder="Assign teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {teachers.map((teacher) => (
                                                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full ${getAvatarColor(teacher.name)} flex items-center justify-center`}>
                                                                <span className="text-[10px] font-bold text-white">
                                                                    {teacher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <span>{toTitleCase(teacher.name)}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* View Report Button */}
                                <button
                                    onClick={() => navigate(`/classes/${classRoom.id}/performance`)}
                                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shadow-sm hover:shadow-md"
                                >
                                    <span>View Report</span>
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {classes.length === 0 && (
                    <div className="text-center py-12 animate-fade-in">
                        <p className="text-muted-foreground">No classes found</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
