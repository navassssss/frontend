import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Plus,
    Lock,
    Unlock,
    Edit,
    Trash2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Subject {
    id: string;
    name: string;
    code: string;
    className: string;
    classId: number;
    teacherName: string;
    teacherId: number;
    finalMaxMarks: number;
    isLocked: boolean;
}

interface ClassRoom {
    id: number;
    name: string;
}

interface Teacher {
    id: number;
    name: string;
}

export default function SubjectsPage() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        class_id: '',
        teacher_id: '',
        final_max_marks: '30'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [subjectsRes, classesRes, teachersRes] = await Promise.all([
                api.get('/subjects'),
                api.get('/attendance/classes'),
                api.get('/teachers')
            ]);
            setSubjects(subjectsRes.data);
            setClasses(classesRes.data);
            setTeachers(teachersRes.data);
        } catch (error) {
            console.error('Failed to load data', error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/subjects', formData);
            toast.success('Subject created successfully');
            setShowDialog(false);
            setFormData({
                name: '',
                code: '',
                class_id: '',
                teacher_id: '',
                final_max_marks: '30'
            });
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create subject');
        }
    };

    const toggleLock = async (id: string) => {
        try {
            await api.post(`/subjects/${id}/toggle-lock`);
            toast.success('Subject lock status updated');
            loadData();
        } catch (error) {
            toast.error('Failed to update lock status');
        }
    };

    return (
        <AppLayout title="Subjects" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Create Button */}
                <Button
                    variant="touch"
                    className="w-full"
                    onClick={() => setShowDialog(true)}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Subject
                </Button>

                {/* Subjects List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        All Subjects
                    </h3>
                    {loading ? (
                        <p className="text-center text-muted-foreground">Loading...</p>
                    ) : subjects.length === 0 ? (
                        <Card variant="elevated">
                            <CardContent className="p-6 text-center">
                                <BookOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">No subjects yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        subjects.map((subject) => (
                            <Card key={subject.id} variant="elevated">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold text-foreground">{subject.name}</h4>
                                                <Badge variant="outline">{subject.code}</Badge>
                                                {subject.isLocked && (
                                                    <Lock className="w-4 h-4 text-warning" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{subject.className}</p>
                                            <p className="text-sm text-muted-foreground">Teacher: {subject.teacherName}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Badge variant="outline">Max: {subject.finalMaxMarks}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleLock(subject.id)}
                                        >
                                            {subject.isLocked ? (
                                                <Lock className="w-4 h-4" />
                                            ) : (
                                                <Unlock className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* Create Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Subject</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Subject Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Mathematics"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subject Code</Label>
                                <Input
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="e.g., MATH"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <Select
                                    value={formData.class_id}
                                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id.toString()}>
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Teacher</Label>
                                <Select
                                    value={formData.teacher_id}
                                    onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select teacher" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                                {teacher.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Final Max Marks</Label>
                                <Input
                                    type="number"
                                    value={formData.final_max_marks}
                                    onChange={(e) => setFormData({ ...formData, final_max_marks: e.target.value })}
                                    min="1"
                                    max="100"
                                    required
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Subject</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
