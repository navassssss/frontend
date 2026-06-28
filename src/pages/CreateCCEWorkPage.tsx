import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
    BookOpen,
    Calendar,
    Award,
    FileText,
    Layers,
    Settings2,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { format, addDays } from 'date-fns';
import api from '@/lib/api';

const cceToolMethods = [
    'Written Assignment',
    'Project Work',
    'Presentation',
    'Practical Work',
    'Group Activity',
    'Quiz',
    'Observation',
    'Portfolio'
];

interface Subject {
    id: string;
    name: string;
    className: string;
    departmentName?: string;
    teacherName?: string;
}

export default function CreateCCEWorkPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editId = searchParams.get('id');
    const subjectIdFromUrl = searchParams.get('subject_id');
    const { user } = useAuth();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [formData, setFormData] = useState({
        subject_id: subjectIdFromUrl || '',
        level: '',
        week: '',
        title: '',
        description: '',
        tool_method: '',
        issued_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        max_marks: '',
        submission_type: 'offline' as 'online' | 'offline'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingEdit, setIsLoadingEdit] = useState(!!editId);
    const [showAllSubjects, setShowAllSubjects] = useState(false);
    const isPrincipal = user?.role === 'principal';

    useEffect(() => {
        loadSubjects();
        if (editId) {
            loadExistingWork();
        }
    }, [editId]);

    const loadExistingWork = async () => {
        try {
            const { data } = await api.get(`/cce/works/${editId}`);
            setFormData({
                subject_id: data.subjectId?.toString() || data.subject?.id?.toString() || '',
                level: data.level?.toString() || '',
                week: data.week?.toString() || '',
                title: data.title || '',
                description: data.description || '',
                tool_method: data.toolMethod || '',
                issued_date: data.issuedDate || format(new Date(), 'yyyy-MM-dd'),
                due_date: data.dueDate || format(addDays(new Date(), 7), 'yyyy-MM-dd'),
                max_marks: data.maxMarks?.toString() || '',
                submission_type: data.submissionType || 'offline'
            });
        } catch (error) {
            toast.error('Failed to load work details');
        } finally {
            setIsLoadingEdit(false);
        }
    };

    const loadSubjects = async () => {
        try {
            const { data } = await api.get('/subjects');
            setSubjects(data);
        } catch (error) {
            toast.error('Failed to load subjects');
        }
    };

    const handleSubmit = async () => {
        if (!formData.subject_id || !formData.level || !formData.week || !formData.title || !formData.max_marks) {
            toast.error('Please fill all required fields (Subject, Level, Week, Title, Max Marks)');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editId) {
                await api.put(`/cce/works/${editId}`, formData);
                toast.success('CCE Work updated successfully');
                navigate(`/cce/works/${editId}`, { replace: true });
            } else {
                const { data } = await api.post('/cce/works', formData);
                toast.success('CCE Work created successfully');
                navigate(`/cce/works/${data.work.id}`, { replace: true });
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || `Failed to ${editId ? 'update' : 'create'} CCE Work`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingEdit) {
        return (
            <AppLayout title="Edit CCE Work" showBack={false}>
                <div className="flex items-center justify-center h-[50vh]">
                    <div className="w-8 h-8 border-4 border-[#00a67e]/20 border-t-[#00a67e] rounded-full animate-spin" />
                </div>
            </AppLayout>
        );
    }

    const selectedSubject = subjects.find(s => s.id.toString() === formData.subject_id);
    const backText = selectedSubject ? `${selectedSubject.name} (Subject)` : 'All Assessments';

    return (
        <AppLayout title={editId ? "Edit CCE Work" : "Create CCE Work"} showBack={false} hideBottomNav={true}>
            <div className="p-4 lg:p-6 max-w-[1200px] mx-auto space-y-4 bg-slate-50/50">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to {backText}
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                    {/* LEFT COLUMN - Main Content */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Card 1: Academic Context */}
                        <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-5 bg-[#00a67e] rounded-full"></div>
                                    <h2 className="text-lg font-bold text-slate-800">Primary Details</h2>
                                </div>

                                <div className="space-y-6">
                                    {isPrincipal && !subjectIdFromUrl && (
                                        <div className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                            <div>
                                                <Label className="text-[14px] font-bold text-slate-800">Show All Subjects</Label>
                                                <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                                                    Create work for any subject
                                                </p>
                                            </div>
                                            <Switch
                                                checked={showAllSubjects}
                                                onCheckedChange={setShowAllSubjects}
                                                className="data-[state=checked]:bg-[#00a67e]"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[12px] font-bold text-slate-700">Subject *</Label>
                                            <Link
                                                to="/subjects"
                                                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                <Settings2 className="w-3 h-3" />
                                                Manage Subjects
                                            </Link>
                                        </div>
                                        <Select
                                            value={formData.subject_id}
                                            onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                                        >
                                            <SelectTrigger className="h-14 bg-slate-50 border-0 rounded-xl font-bold text-slate-700">
                                                <SelectValue placeholder="Select subject..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subjects
                                                    .filter(subject => {
                                                        if (formData.subject_id === subject.id.toString()) return true;
                                                        if (!isPrincipal) return true;
                                                        if (showAllSubjects) return true;
                                                        return subject.teacherName === user?.name;
                                                    })
                                                    .map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.id.toString()} className="font-semibold">
                                                            {subject.name} - {subject.className} {subject.departmentName ? `(${subject.departmentName})` : ''}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[12px] font-bold text-slate-700">Level *</Label>
                                            <Select
                                                value={formData.level}
                                                onValueChange={(v) => setFormData({ ...formData, level: v })}
                                            >
                                                <SelectTrigger className="h-14 bg-slate-50 border-0 rounded-xl font-bold text-slate-700">
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1" className="font-semibold">Level 1</SelectItem>
                                                    <SelectItem value="2" className="font-semibold">Level 2</SelectItem>
                                                    <SelectItem value="3" className="font-semibold">Level 3</SelectItem>
                                                    <SelectItem value="4" className="font-semibold">Level 4</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[12px] font-bold text-slate-700">Week *</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                max="52"
                                                value={formData.week}
                                                onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                                                placeholder="Week no."
                                                className="h-14 bg-slate-50 border-0 rounded-xl font-bold text-slate-700 px-4 focus-visible:ring-[#00a67e]/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Card 2: Assessment Details */}
                        <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6 md:p-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-5 bg-[#00a67e] rounded-full"></div>
                                    <h2 className="text-lg font-bold text-slate-800">Assessment Details</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-slate-700">Work Title *</Label>
                                        <Input
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            placeholder="e.g., Mid-term Creative Portfolio"
                                            className="h-14 bg-slate-50/80 border-0 rounded-xl font-medium text-slate-700 px-4 placeholder:text-slate-400 focus-visible:ring-[#00a67e]/20"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-slate-700">Description (Activity)</Label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Briefly describe the learning outcome and steps for completion..."
                                            rows={4}
                                            className="bg-slate-50/80 border-0 rounded-xl font-medium text-slate-700 p-4 resize-none placeholder:text-slate-400 focus-visible:ring-[#00a67e]/20"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[12px] font-bold text-slate-700">Tool/Method</Label>
                                            <div className="relative">
                                                <input
                                                    list="cce-tool-methods"
                                                    value={formData.tool_method}
                                                    onChange={(e) => setFormData({ ...formData, tool_method: e.target.value })}
                                                    placeholder="e.g., Project Work"
                                                    className="h-14 w-full bg-slate-50 border-0 rounded-xl font-bold text-slate-700 px-4 focus:outline-none focus:ring-2 focus:ring-[#00a67e]/20 placeholder:text-slate-400 placeholder:font-normal"
                                                />
                                                {/* <datalist id="cce-tool-methods">
                                                    {cceToolMethods.map((method) => (
                                                        <option key={method} value={method} />
                                                    ))}
                                                </datalist> */}
                                            </div>
                                        </div>
                                        <div className="space-y-2 relative">
                                            <Label className="text-[12px] font-bold text-slate-700">Maximum Marks *</Label>
                                            <div className="relative">
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    value={formData.max_marks}
                                                    onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                                                    placeholder=""
                                                    className="h-14 bg-slate-50 border-0 rounded-xl font-bold text-slate-700 pl-4 pr-12 focus-visible:ring-[#00a67e]/20"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-[#00a67e]">
                                                    MAX
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN - Sidebar */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Card 3: Scheduling */}
                        <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-5 bg-[#00a67e] rounded-full"></div>
                                    <h2 className="text-lg font-bold text-slate-800">Scheduling</h2>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-slate-700">Issue Date</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={formData.issued_date}
                                                onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                                                className="h-12 bg-slate-50/80 border-0 rounded-xl font-semibold text-slate-700 pl-4 pr-10 focus-visible:ring-[#00a67e]/20"
                                            />
                                            <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-bold text-slate-700">Due Date</Label>
                                        <div className="relative">
                                            <Input
                                                type="date"
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="h-12 bg-slate-50/80 border-0 rounded-xl font-semibold text-slate-700 pl-4 pr-10 focus-visible:ring-[#00a67e]/20"
                                            />
                                            <Calendar className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-5 border-slate-100" />

                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-[13px] font-bold text-slate-800">Late Submission</Label>
                                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">
                                            Allow submissions after the due date.
                                        </p>
                                    </div>
                                    <Switch className="data-[state=checked]:bg-[#00a67e] data-[state=checked]:opacity-100 scale-90" defaultChecked />
                                </div>
                            </div>
                        </Card>

                        {/* Card 4: Submission Format */}
                        <Card className="border border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                            <div className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-5 bg-[#00a67e] rounded-full"></div>
                                    <h2 className="text-lg font-bold text-slate-800">Submission Format</h2>
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 mb-5">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, submission_type: 'online' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${formData.submission_type === 'online'
                                            ? 'bg-white text-[#00a67e] shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <BookOpen className="w-4 h-4" />
                                        Online
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, submission_type: 'offline' })}
                                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${formData.submission_type === 'offline'
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        Offline
                                    </button>
                                </div>

                                {formData.submission_type === 'online' && (
                                    <>
                                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-4">
                                            Accepted formats for online submission:<br />
                                            <strong className="text-slate-600">PDF, DOCX, ZIP</strong>. Maximum file size: <strong className="text-slate-600">25MB</strong>.
                                        </p>

                                        <div className="border border-dashed border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3 bg-slate-50/50 cursor-pointer hover:bg-slate-50 hover:border-[#00a67e]/30 transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                                                <Layers className="w-4 h-4 text-slate-400" />
                                            </div>
                                            {/* <span className="text-[12px] font-bold text-slate-600">
                                                Attach Supporting<br />Guidelines
                                            </span> */}
                                        </div>
                                    </>
                                )}
                            </div>
                        </Card>

                        {/* Card 5: Curator's Tip */}
                        <Card className="hidden md:block border-0 shadow-lg shadow-[#008f6c]/20 rounded-3xl overflow-hidden bg-[#00a67e] text-white">
                            <div className="p-6">
                                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-4">
                                    <span className="text-lg">💡</span>
                                </div>
                                <h3 className="text-lg font-bold mb-2">Curator's Tip</h3>
                                <p className="text-[13px] font-medium text-white/90 leading-relaxed">
                                    Consistent CCE tasks across classes help in normalized analytics. Consider using the 'Project Work' method to encourage hands-on learning outside the classroom environment.
                                </p>
                            </div>
                        </Card>

                    </div>
                </div>
            </div>

            {/* Action buttons — inline after fields */}
            <div className="flex gap-3 pb-8 lg:pb-0">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex-none px-6 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                    Discard
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-[#00a67e] hover:bg-[#008f6c] text-white font-bold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isSubmitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isSubmitting ? 'Creating...' : 'Create CCE Work'}
                </button>
            </div>
        </AppLayout>
    );
}
