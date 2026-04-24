import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Plus,
    Lock,
    Unlock,
    Edit,
    Trash2,
    ChevronDown
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
    completion_percent?: number;
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
    const [collapsedClasses, setCollapsedClasses] = useState<string[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
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

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({ name: '', code: '', class_id: '', teacher_id: '', final_max_marks: '30' });
        setShowDialog(true);
    };

    const handleEdit = (subject: Subject) => {
        setEditingId(subject.id);
        setFormData({
            name: subject.name,
            code: subject.code,
            class_id: subject.classId.toString(),
            teacher_id: subject.teacherId ? subject.teacherId.toString() : '',
            final_max_marks: subject.finalMaxMarks.toString()
        });
        setShowDialog(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this subject? (Soft delete)')) return;
        try {
            await api.delete(`/subjects/${id}`);
            toast.success('Subject deleted successfully');
            loadData();
        } catch (error) {
            toast.error('Failed to delete subject');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, formData);
                toast.success('Subject updated successfully');
            } else {
                await api.post('/subjects', formData);
                toast.success('Subject created successfully');
            }
            setShowDialog(false);
            setEditingId(null);
            setFormData({
                name: '',
                code: '',
                class_id: '',
                teacher_id: '',
                final_max_marks: '30'
            });
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save subject');
        }
    };

    const handleAssignTeacher = async (subjectId: string, teacherId: string) => {
        try {
            await api.put(`/subjects/${subjectId}`, { teacher_id: teacherId });
            toast.success('Faculty updated successfully');
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update faculty');
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

    const toggleClassCollapse = (className: string) => {
        setCollapsedClasses(prev => 
            prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
        );
    };

    const groupedSubjects = subjects.reduce((acc, subject) => {
        const className = subject.className || 'Unassigned';
        if (!acc[className]) acc[className] = [];
        acc[className].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);

    return (
        <AppLayout title="Subjects" showBack>
            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-24">
                {/* Header & Create Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Subjects Directory</h2>
                        <p className="text-sm text-muted-foreground">Manage institutional syllabus structures</p>
                    </div>
                    <Button
                        className="w-full sm:w-auto hover:scale-105 transition-transform rounded-xl bg-[#008f6c] hover:bg-[#007a5c]"
                        onClick={openCreateDialog}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Subject
                    </Button>
                </div>

                {/* Grouped Subjects List */}
                <div className="space-y-10">
                    {loading ? (
                        <div className="text-center py-12"><p className="text-muted-foreground animate-pulse">Loading directory...</p></div>
                    ) : subjects.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-500 font-medium">No subjects found.</p>
                        </div>
                    ) : (
                        Object.entries(groupedSubjects).map(([className, classSubjects], sectionIndex) => {
                            const isCollapsed = collapsedClasses.includes(className);
                            return (
                            <div key={className} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 animate-slide-up" style={{ animationDelay: `${sectionIndex * 0.1}s` }}>
                                {/* Class Header */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[#008f6c]/20 text-[#008f6c] flex items-center justify-center font-black text-lg shrink-0">
                                            {className.slice(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                           <h3 className="text-xl font-black text-slate-800 leading-tight">Class {className}</h3>
                                           <p className="text-[11px] font-black tracking-widest text-[#94a3b8] uppercase mt-0.5">
                                              {classSubjects.length} SUBJECT{classSubjects.length !== 1 ? 'S' : ''}
                                           </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden md:flex -space-x-2 mr-2">
                                            {classSubjects.slice(0, 3).map((sub, i) => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shadow-sm relative z-10" style={{ zIndex: 10 - i}}>
                                                   {sub.teacherName ? sub.teacherName.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            ))}
                                            {classSubjects.length > 3 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shadow-sm relative z-0">
                                                   +{classSubjects.length - 3}
                                                </div>
                                            )}
                                        </div>
                                        <button onClick={() => toggleClassCollapse(className)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 transition-colors">
                                            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Class Subjects Table */}
                                {!isCollapsed && (
                                    <div className="mt-8">
                                        <table className="w-full text-left border-collapse min-w-[600px]">
                                            <thead>
                                                <tr>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">SUBJECT NAME & CODE</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ASSIGNED FACULTY</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">MAX MARKS</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 min-w-[200px]">SYLLABUS PROGRESS</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">ACTIONS</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {classSubjects.map((subject) => (
                                                    <tr key={subject.id} className="group hover:bg-slate-50/50 transition-colors">
                                                        <td className="py-4 px-4">
                                                            <p className="font-extrabold text-slate-800 text-[14px]">{subject.name}</p>
                                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subject.code}</p>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-full bg-[#008f6c] text-white flex items-center justify-center text-[10px] font-bold shadow-sm shrink-0">
                                                                    {subject.teacherName ? subject.teacherName.charAt(0).toUpperCase() : '?'}
                                                                </div>
                                                                <Select 
                                                                    value={subject.teacherId?.toString() || ""} 
                                                                    onValueChange={(val) => handleAssignTeacher(subject.id, val)}
                                                                >
                                                                    <SelectTrigger className="h-8 border-transparent hover:border-slate-200 bg-transparent hover:bg-slate-50 focus:ring-0 shadow-none px-2 -ml-2 text-[13px] font-bold text-slate-700 w-[160px] cursor-pointer">
                                                                        <SelectValue placeholder="Assign Faculty" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {teachers.map(t => (
                                                                            <SelectItem key={t.id} value={t.id.toString()}>
                                                                                {t.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-center">
                                                            <span className="text-[14px] font-black text-slate-800">{subject.finalMaxMarks}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                                    <div className="h-full bg-[#008f6c] rounded-full" style={{ width: `${subject.completion_percent || 0}%` }}></div>
                                                                </div>
                                                                <span className="text-[11px] font-black text-[#008f6c] w-8">{subject.completion_percent || 0}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button 
                                                                    onClick={() => handleEdit(subject)} 
                                                                    className="w-8 h-8 rounded-full hover:bg-blue-50 inline-flex items-center justify-center transition-colors shadow-sm bg-white"
                                                                >
                                                                    <Edit className="w-3.5 h-3.5 text-blue-500" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDelete(subject.id)} 
                                                                    className="w-8 h-8 rounded-full hover:bg-rose-50 inline-flex items-center justify-center transition-colors shadow-sm bg-white"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => toggleLock(subject.id)} 
                                                                    className="w-8 h-8 rounded-full hover:bg-slate-100 inline-flex items-center justify-center transition-colors shadow-sm bg-white ml-1"
                                                                >
                                                                    {subject.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        
                                        <div className="text-center pt-5 mt-2 border-t border-slate-50">
                                            <button className="text-[10px] font-black text-[#008f6c] uppercase tracking-widest hover:text-[#007a5c] transition-colors">
                                                VIEW ALL {classSubjects.length} SUBJECTS
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})
                    )}
                </div>

                {/* Create Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Subject' : 'Create Subject'}</DialogTitle>
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
                                <Button type="submit">{editingId ? 'Update Subject' : 'Create Subject'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
