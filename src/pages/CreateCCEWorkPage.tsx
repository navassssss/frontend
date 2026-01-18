import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOpen,
    Calendar,
    Award,
    FileText,
    Layers
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
    teacherName?: string;
}

export default function CreateCCEWorkPage() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [formData, setFormData] = useState({
        subject_id: '',
        level: '',
        week: '1',
        title: '',
        description: '',
        tool_method: '',
        issued_date: format(new Date(), 'yyyy-MM-dd'),
        due_date: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
        max_marks: '',
        submission_type: 'offline' as 'online' | 'offline'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAllSubjects, setShowAllSubjects] = useState(false);
    const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

    useEffect(() => {
        loadSubjects();
    }, []);

    const loadSubjects = async () => {
        try {
            const { data } = await api.get('/subjects');
            setSubjects(data);
        } catch (error) {
            toast.error('Failed to load subjects');
        }
    };

    const handleSubmit = async () => {
        if (!formData.subject_id || !formData.level || !formData.title || !formData.max_marks) {
            toast.error('Please fill all required fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/cce/works', formData);
            toast.success('CCE Work created successfully');
            navigate('/cce/works');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create CCE Work');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AppLayout title="Create CCE Work" showBack>
            <div className="p-4 space-y-6 pb-24">
                {/* Toggle for All Subjects (Principals only) */}
                {isPrincipal && (
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                            <Label className="text-sm font-semibold">Show All Subjects</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                {showAllSubjects ? 'Create work for any subject' : 'Create work for your subjects only'}
                            </p>
                        </div>
                        <Switch
                            checked={showAllSubjects}
                            onCheckedChange={setShowAllSubjects}
                        />
                    </div>
                )}

                {/* Subject Selection */}
                <div className="space-y-2">
                    <Label>Subject *</Label>
                    <Select
                        value={formData.subject_id}
                        onValueChange={(v) => setFormData({ ...formData, subject_id: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects
                                .filter(subject => {
                                    if (!isPrincipal) return true; // Teachers see all their subjects
                                    if (showAllSubjects) return true; // Show all when toggle is on
                                    return subject.teacherName === user?.name; // Show only principal's subjects
                                })
                                .map((subject) => (
                                    <SelectItem key={subject.id} value={subject.id}>
                                        {subject.name} - {subject.className}
                                    </SelectItem>
                                ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Level & Week */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Level *</Label>
                        <Select
                            value={formData.level}
                            onValueChange={(v) => setFormData({ ...formData, level: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Level 1</SelectItem>
                                <SelectItem value="2">Level 2</SelectItem>
                                <SelectItem value="3">Level 3</SelectItem>
                                <SelectItem value="4">Level 4</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Week</Label>
                        <Input
                            type="number"
                            min="1"
                            max="52"
                            value={formData.week}
                            onChange={(e) => setFormData({ ...formData, week: e.target.value })}
                            placeholder="Week number"
                        />
                    </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                    <Label>Title *</Label>
                    <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter work title"
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label>Description (Activity)</Label>
                    <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter work description and instructions"
                        rows={3}
                    />
                </div>

                {/* Tool/Method */}
                <div className="space-y-2">
                    <Label>Tool / Method</Label>
                    <Select
                        value={formData.tool_method}
                        onValueChange={(v) => setFormData({ ...formData, tool_method: v })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            {cceToolMethods.map((method) => (
                                <SelectItem key={method} value={method}>
                                    {method}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label>Issue Date</Label>
                        <Input
                            type="date"
                            value={formData.issued_date}
                            onChange={(e) => setFormData({ ...formData, issued_date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Due Date</Label>
                        <Input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </div>

                {/* Max Marks */}
                <div className="space-y-2">
                    <Label>Maximum Marks *</Label>
                    <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.max_marks}
                        onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                        placeholder="Enter max marks"
                    />
                </div>

                {/* Submission Type */}
                <div className="space-y-2">
                    <Label>Submission Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            type="button"
                            variant={formData.submission_type === 'offline' ? 'default' : 'outline'}
                            className="h-14"
                            onClick={() => setFormData({ ...formData, submission_type: 'offline' })}
                        >
                            <FileText className="w-5 h-5 mr-2" />
                            Offline
                        </Button>
                        <Button
                            type="button"
                            variant={formData.submission_type === 'online' ? 'default' : 'outline'}
                            className="h-14"
                            onClick={() => setFormData({ ...formData, submission_type: 'online' })}
                        >
                            <BookOpen className="w-5 h-5 mr-2" />
                            Online
                        </Button>
                    </div>
                </div>

                {/* Submit Button */}
                <Button
                    variant="touch"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating...' : 'Create CCE Work'}
                </Button>
            </div>
        </AppLayout>
    );
}