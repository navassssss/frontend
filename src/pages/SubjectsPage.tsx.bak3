import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
    BookOpen,
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    Download,
    Upload,
    AlertCircle,
    Users,
    Search
} from 'lucide-react';
import { read, utils, writeFile } from 'xlsx';
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
    assignmentScope?: 'full_class' | 'selected_students';
    completion_percent?: number;
}

interface StudentOption {
    id: number;
    name: string;
    username: string;
}

interface ClassRoom {
    id: number;
    name: string;
}

interface Teacher {
    id: number;
    name: string;
}

interface ImportRow {
    name: string;
    code: string;
    maxMarks: string | number;
    className: string;
    teacherName: string;
    classId?: number;
    teacherId?: number;
    hasError?: boolean;
}

export default function SubjectsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Access control: principal/manager always; teachers only with manage_cce
    const isPrincipalOrManager = user?.role === 'principal' || user?.role === 'manager';
    const canManage = isPrincipalOrManager ||
        (user?.role === 'teacher' && user?.permissions?.some((p: any) => p.name === 'manage_cce'));

    // Read-only teachers (no manage_cce) should not be on this page at all
    // They can only reach it via direct URL — show a gate
    const isReadOnly = user?.role === 'teacher' && !canManage;

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [collapsedClasses, setCollapsedClasses] = useState<string[]>([]);
    const [showDialog, setShowDialog] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [importData, setImportData] = useState<ImportRow[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        class_id: '',
        teacher_id: '',
        final_max_marks: '30',
        assignment_scope: 'full_class' as 'full_class' | 'selected_students',
    });
    const [classStudents, setClassStudents] = useState<StudentOption[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [studentSearch, setStudentSearch] = useState('');
    const [loadingStudents, setLoadingStudents] = useState(false);

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

    const fetchClassStudents = useCallback(async (classId: string) => {
        if (!classId) { setClassStudents([]); return; }
        setLoadingStudents(true);
        try {
            const res = await api.get(`/classes/${classId}/students`);
            // API returns array of {id, name, roll_number/username}
            const arr = (res.data || []).map((s: any) => ({
                id: s.id,
                name: s.name || 'Unknown',
                username: s.roll_number || s.username || '',
            }));
            setClassStudents(arr);
        } catch {
            setClassStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    const openCreateDialog = () => {
        setEditingId(null);
        setFormData({ name: '', code: '', class_id: '', teacher_id: '', final_max_marks: '30', assignment_scope: 'full_class' });
        setSelectedStudentIds([]);
        setClassStudents([]);
        setStudentSearch('');
        setShowDialog(true);
    };

    const handleEdit = async (subject: Subject) => {
        setEditingId(subject.id);
        setFormData({
            name: subject.name,
            code: subject.code,
            class_id: subject.classId.toString(),
            teacher_id: subject.teacherId ? subject.teacherId.toString() : '',
            final_max_marks: subject.finalMaxMarks.toString(),
            assignment_scope: subject.assignmentScope || 'full_class',
        });
        setSelectedStudentIds([]);
        setStudentSearch('');
        // Load subject detail to get existing studentIds
        try {
            const res = await api.get(`/subjects/${subject.id}`);
            if (res.data.studentIds) setSelectedStudentIds(res.data.studentIds);
        } catch {}
        await fetchClassStudents(subject.classId.toString());
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
        if (formData.assignment_scope === 'selected_students' && selectedStudentIds.length === 0) {
            toast.error('Select at least one student for selected-students scope');
            return;
        }
        const payload: any = { ...formData };
        if (formData.assignment_scope === 'selected_students') {
            payload.student_ids = selectedStudentIds;
        }
        try {
            if (editingId) {
                await api.put(`/subjects/${editingId}`, payload);
                toast.success('Subject updated successfully');
            } else {
                await api.post('/subjects', payload);
                toast.success('Subject created successfully');
            }
            setShowDialog(false);
            setEditingId(null);
            setFormData({ name: '', code: '', class_id: '', teacher_id: '', final_max_marks: '30', assignment_scope: 'full_class' });
            setSelectedStudentIds([]);
            setClassStudents([]);
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

    const handleDownloadTemplate = () => {
        const templateData = [
            { 'Subject Name': 'Mathematics', 'Subject Code': 'MTH101', 'Max Marks': 50, 'Class Name': 'Class 1A', 'Teacher Name': 'John Doe' }
        ];
        const ws = utils.json_to_sheet(templateData);

        const referenceData: any[] = [];
        const maxLen = Math.max(classes.length, teachers.length);
        for(let i=0; i<maxLen; i++) {
            referenceData.push({
                'Available Classes': classes[i] ? classes[i].name : '',
                'Available Teachers': teachers[i] ? teachers[i].name : ''
            });
        }
        const wsRef = utils.json_to_sheet(referenceData);

        const wb = utils.book_new();
        utils.book_append_sheet(wb, ws, 'Template');
        utils.book_append_sheet(wb, wsRef, 'Reference Data');

        writeFile(wb, 'Subjects_Import_Template.xlsx');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = utils.sheet_to_json(ws);

                const mappedData: ImportRow[] = data.map((row: any) => {
                    const cName = row['Class Name']?.toString().trim();
                    const tName = row['Teacher Name']?.toString().trim();
                    
                    const matchedClass = classes.find(c => c.name.toLowerCase() === cName?.toLowerCase());
                    const matchedTeacher = teachers.find(t => t.name.toLowerCase() === tName?.toLowerCase());

                    return {
                        name: row['Subject Name'] || '',
                        code: row['Subject Code'] || '',
                        maxMarks: row['Max Marks'] || '30',
                        className: cName || '',
                        teacherName: tName || '',
                        classId: matchedClass?.id,
                        teacherId: matchedTeacher?.id,
                        hasError: !matchedClass || !matchedTeacher || !row['Subject Name'] || !row['Subject Code']
                    };
                });

                setImportData(mappedData);
                setShowImportDialog(true);
            } catch (error) {
                toast.error('Failed to parse Excel file');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    const handleImportSubmit = async () => {
        if (importData.some(d => d.hasError)) {
            toast.error('Please fix all errors before importing');
            return;
        }

        const payload = importData.map(d => ({
            name: d.name,
            code: d.code,
            class_id: d.classId,
            teacher_id: d.teacherId,
            final_max_marks: Number(d.maxMarks) || 30
        }));

        try {
            await api.post('/subjects/bulk', { subjects: payload });
            toast.success('Subjects imported successfully');
            setShowImportDialog(false);
            setImportData([]);
            loadData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to import subjects');
        }
    };

    const updateImportRow = (index: number, field: keyof ImportRow, value: any) => {
        setImportData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            const row = newData[index];
            row.hasError = !row.classId || !row.teacherId || !row.name || !row.code;
            return newData;
        });
    };

    const groupedSubjects = subjects.reduce((acc, subject) => {
        const className = subject.className || 'Unassigned';
        if (!acc[className]) acc[className] = [];
        acc[className].push(subject);
        return acc;
    }, {} as Record<string, Subject[]>);

    // Unauthorized teachers — show access denied
    if (isReadOnly) {
        return (
            <AppLayout title="Subjects" showBack>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Access Restricted</h2>
                    <p className="text-sm text-slate-500 max-w-xs">
                        You don't have permission to manage subjects.
                        Contact your principal to request <strong>manage_cce</strong> access.
                    </p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-6 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
                    >
                        Go Back
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Subjects" showBack>
            <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-8 pb-24">
                {/* Header & Create Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Subjects Directory</h2>
                        <p className="text-sm text-muted-foreground">Manage institutional syllabus structures</p>
                    </div>
                    {canManage && (
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            className="rounded-xl flex-1 sm:flex-none"
                            onClick={handleDownloadTemplate}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Template
                        </Button>
                        <div className="relative flex-1 sm:flex-none">
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                            <Button variant="outline" className="w-full rounded-xl">
                                <Upload className="w-4 h-4 mr-2" />
                                Import
                            </Button>
                        </div>
                        <Button
                            className="flex-1 sm:flex-none hover:scale-105 transition-transform rounded-xl bg-[#008f6c] hover:bg-[#007a5c]"
                            onClick={openCreateDialog}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Subject
                        </Button>
                    </div>
                    )}
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
                                        <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse min-w-[480px]">
                                            <thead>
                                                <tr>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">SUBJECT NAME & CODE</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">ASSIGNED FACULTY</th>
                                                    <th className="pb-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-center">MAX MARKS</th>
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
                                                                    <SelectContent position="popper" side="bottom" align="start" className="z-50">
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
                                                        <td className="py-4 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                {canManage && (<>
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
                                                                </>)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )})
                    )}
                </div>

                {/* Create Dialog */}
                <Dialog open={showDialog} onOpenChange={setShowDialog}>
                    <DialogContent className="max-w-md w-full max-h-[90vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{editingId ? 'Edit Subject' : 'Create Subject'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto flex-1 pr-1">
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
                                    onValueChange={(value) => {
                                        setFormData({ ...formData, class_id: value });
                                        setSelectedStudentIds([]);
                                        fetchClassStudents(value);
                                    }}
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

                            {/* Assignment Scope */}
                            <div className="space-y-2">
                                <Label>Assignment Scope</Label>
                                <Select
                                    value={formData.assignment_scope}
                                    onValueChange={(v) =>
                                        setFormData({ ...formData, assignment_scope: v as 'full_class' | 'selected_students' })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="full_class">Full Class (all students)</SelectItem>
                                        <SelectItem value="selected_students">Selected Students only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Student Picker — visible only when selected_students */}
                            {formData.assignment_scope === 'selected_students' && (
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Select Students
                                        {selectedStudentIds.length > 0 && (
                                            <span className="ml-auto text-xs font-bold text-[#008f6c]">{selectedStudentIds.length} selected</span>
                                        )}
                                    </Label>
                                    {!formData.class_id ? (
                                        <p className="text-xs text-muted-foreground">Pick a class first.</p>
                                    ) : loadingStudents ? (
                                        <p className="text-xs text-muted-foreground animate-pulse">Loading students...</p>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            {/* Search + Select All bar */}
                                            <div className="flex items-center gap-2 px-3 py-2 border-b bg-slate-50">
                                                <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                <input
                                                    type="text"
                                                    placeholder="Search name or roll no..."
                                                    value={studentSearch}
                                                    onChange={e => setStudentSearch(e.target.value)}
                                                    className="flex-1 text-[12px] bg-transparent outline-none placeholder:text-slate-400"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const filtered = classStudents.filter(s =>
                                                            !studentSearch ||
                                                            s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                            s.username.toLowerCase().includes(studentSearch.toLowerCase())
                                                        );
                                                        const filteredIds = filtered.map(s => s.id);
                                                        const allSelected = filteredIds.every(id => selectedStudentIds.includes(id));
                                                        if (allSelected) {
                                                            setSelectedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
                                                        } else {
                                                            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                                                        }
                                                    }}
                                                    className="text-[10px] font-black text-[#008f6c] uppercase tracking-wide shrink-0"
                                                >
                                                    All
                                                </button>
                                            </div>
                                            {/* Student list */}
                                            <div className="max-h-48 overflow-y-auto divide-y">
                                                {classStudents
                                                    .filter(s =>
                                                        !studentSearch ||
                                                        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                                                        s.username.toLowerCase().includes(studentSearch.toLowerCase())
                                                    )
                                                    .map(s => (
                                                        <label
                                                            key={s.id}
                                                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer select-none transition-colors ${
                                                                selectedStudentIds.includes(s.id) ? 'bg-emerald-50' : 'hover:bg-slate-50'
                                                            }`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="accent-[#008f6c] w-4 h-4 shrink-0"
                                                                checked={selectedStudentIds.includes(s.id)}
                                                                onChange={() =>
                                                                    setSelectedStudentIds(prev =>
                                                                        prev.includes(s.id)
                                                                            ? prev.filter(id => id !== s.id)
                                                                            : [...prev, s.id]
                                                                    )
                                                                }
                                                            />
                                                            <span className="text-[13px] font-medium text-slate-700 truncate flex-1">{s.name}</span>
                                                            <span className="text-[11px] text-slate-400">#{s.username}</span>
                                                        </label>
                                                    ))
                                                }
                                                {classStudents.length === 0 && (
                                                    <p className="text-center text-xs text-muted-foreground py-4">No students in this class.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">{editingId ? 'Update Subject' : 'Create Subject'}</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Import Review Dialog */}
                <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                    <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
                        <DialogHeader>
                            <DialogTitle>Review Imported Subjects</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto py-4 border rounded-xl my-2">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="text-xs text-muted-foreground uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3">Subject Name</th>
                                        <th className="px-4 py-3">Code</th>
                                        <th className="px-4 py-3">Max Marks</th>
                                        <th className="px-4 py-3 w-48">Class</th>
                                        <th className="px-4 py-3 w-48">Teacher</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {importData.map((row, i) => (
                                        <tr key={i} className={`border-b last:border-0 ${row.hasError ? 'bg-rose-50/50' : 'hover:bg-slate-50'}`}>
                                            <td className="px-4 py-2">
                                                <Input 
                                                    value={row.name} 
                                                    onChange={(e) => updateImportRow(i, 'name', e.target.value)}
                                                    className="h-8 min-w-[120px]"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input 
                                                    value={row.code} 
                                                    onChange={(e) => updateImportRow(i, 'code', e.target.value)}
                                                    className="h-8 w-24"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Input 
                                                    type="number"
                                                    value={row.maxMarks} 
                                                    onChange={(e) => updateImportRow(i, 'maxMarks', e.target.value)}
                                                    className="h-8 w-20"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <Select 
                                                    value={row.classId?.toString() || ''} 
                                                    onValueChange={(val) => updateImportRow(i, 'classId', parseInt(val))}
                                                >
                                                    <SelectTrigger className={`h-8 ${!row.classId ? 'border-rose-300 bg-white' : 'bg-white'}`}>
                                                        <SelectValue placeholder={row.className || 'Select Class'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {classes.map(c => (
                                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <Select 
                                                    value={row.teacherId?.toString() || ''} 
                                                    onValueChange={(val) => updateImportRow(i, 'teacherId', parseInt(val))}
                                                >
                                                    <SelectTrigger className={`h-8 ${!row.teacherId ? 'border-rose-300 bg-white' : 'bg-white'}`}>
                                                        <SelectValue placeholder={row.teacherName || 'Select Teacher'} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {teachers.map(t => (
                                                            <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td className="px-4 py-2">
                                                {row.hasError ? (
                                                    <span title="Missing required fields or unmapped teacher/class">
                                                        <AlertCircle className="w-5 h-5 text-rose-500" />
                                                    </span>
                                                ) : (
                                                    <span className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-md">Ready</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {importData.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    No rows found in the imported file.
                                </div>
                            )}
                        </div>
                        <DialogFooter className="mt-4">
                            <Button type="button" variant="outline" onClick={() => setShowImportDialog(false)}>
                                Cancel
                            </Button>
                            <Button type="button" className="bg-[#008f6c] hover:bg-[#007a5c]" onClick={handleImportSubmit} disabled={importData.some(d => d.hasError) || importData.length === 0}>
                                Confirm & Import ({importData.filter(d => !d.hasError).length})
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
