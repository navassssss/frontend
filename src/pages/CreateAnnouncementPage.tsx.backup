import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, Users, GraduationCap, School, UserCheck, X, Search,
    Megaphone, ChevronLeft, Pin, Paperclip
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

type AudienceType = 'teachers' | 'students';
type TargetType   = 'all' | 'class' | 'specific';

interface Teacher  { id: number; name: string; email: string; }
interface Student  {
    id: number;          // student record id
    user_id?: number;    // the linked user id (used for targeting)
    username: string;
    user?: { id?: number; name: string };
    name?: string;           // not present on /students but guard anyway
    class_room?: { name: string };
    class?: { name: string };
}
interface ClassRoom { id: number; name: string; }

export default function CreateAnnouncementPage() {
    const navigate = useNavigate();

    // Form state
    const [title, setTitle]             = useState('');
    const [content, setContent]         = useState('');
    const [audienceType, setAudienceType] = useState<AudienceType>('teachers');
    const [targetType, setTargetType]   = useState<TargetType>('all');
    const [isPinned, setIsPinned]       = useState(false);
    const [publishNow, setPublishNow]   = useState(true);
    const [attachments, setAttachments] = useState<File[]>([]);

    // Data for selectors
    const [teachers, setTeachers]     = useState<Teacher[]>([]);
    const [students, setStudents]     = useState<Student[]>([]);
    const [classes, setClasses]       = useState<ClassRoom[]>([]);

    // Selected targets
    const [selectedUserIds, setSelectedUserIds]   = useState<number[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

    // Search within selector
    const [search, setSearch] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSearching, setIsSearching]   = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load initial list when targetType / audienceType changes
    useEffect(() => {
        setSelectedUserIds([]);
        setSelectedClassIds([]);
        setSearch('');
        setStudents([]);
        setTeachers([]);

        if (targetType === 'specific') {
            fetchRecipients('');
        } else if (targetType === 'class') {
            setIsLoadingData(true);
            api.get('/classes')
                .then(r => setClasses(Array.isArray(r.data) ? r.data : (r.data?.data ?? [])))
                .catch(() => toast.error('Failed to load classes'))
                .finally(() => setIsLoadingData(false));
        }
    }, [targetType, audienceType]);

    // Fetch teachers or students from the server, optionally with a search term
    const fetchRecipients = useCallback((term: string) => {
        setIsSearching(true);
        if (audienceType === 'teachers') {
            // Teachers: load all once, filter on client (list is small)
            api.get('/teachers')
                .then(r => {
                    const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
                    setTeachers(list);
                })
                .catch(() => toast.error('Failed to load teachers'))
                .finally(() => setIsSearching(false));
        } else {
            // Students: paginated — always search on server
            api.get('/students', { params: { search: term || '', per_page: 50 } })
                .then(r => {
                    const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? []);
                    setStudents(list);
                })
                .catch(() => toast.error('Failed to load students'))
                .finally(() => setIsSearching(false));
        }
    }, [audienceType]);

    // Debounced search — only re-fetches for students (server-side)
    // Teachers are already all loaded, handled by client filter above
    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (targetType !== 'specific' || audienceType !== 'students') return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchRecipients(value), 350);
    };

    const toggleUser = (id: number) =>
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const toggleClass = (id: number) =>
        setSelectedClassIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setAttachments(prev => [...prev, ...files]);
        e.target.value = '';
    };

    const removeFile = (index: number) =>
        setAttachments(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async () => {
        if (!title.trim()) { toast.error('Title is required'); return; }
        if (!content.trim()) { toast.error('Content is required'); return; }
        if (targetType === 'specific' && selectedUserIds.length === 0) {
            toast.error('Please select at least one recipient'); return;
        }
        if (targetType === 'class' && selectedClassIds.length === 0) {
            toast.error('Please select at least one class'); return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('content', content);
            formData.append('audience_type', audienceType);
            formData.append('target_type', targetType);
            formData.append('is_pinned', isPinned ? '1' : '0');
            formData.append('publish_now', publishNow ? '1' : '0');

            // For class targeting: class IDs
            // For specific student targeting: we need user_id (not student id)
            // For specific teacher targeting: teacher rows ARE users so id = user_id
            let targetIds: number[];
            if (targetType === 'class') {
                targetIds = selectedClassIds;
            } else if (targetType === 'specific' && audienceType === 'students') {
                // selectedUserIds currently holds student record ids — map to user_id
                targetIds = selectedUserIds.map(sid => {
                    const s = students.find(x => x.id === sid);
                    return s?.user_id ?? s?.user?.id ?? sid;
                }).filter(Boolean) as number[];
            } else {
                targetIds = selectedUserIds;
            }

            targetIds.forEach(id => formData.append('target_ids[]', String(id)));

            attachments.forEach(file => formData.append('attachments[]', file));

            await api.post('/announcements', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Announcement created!');
            navigate('/announcements');
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Failed to create announcement';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Classes: client-side filter (small list, fully loaded)
    const filteredClasses = classes.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );
    // Teachers: client-side filter (all loaded at once)
    const filteredTeachers = teachers.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase())
    );
    // Students: already server-filtered by search term — show as-is
    const filteredStudents = students;

    return (
        <AppLayout title="Create Announcement">
            <div className="p-4 space-y-6 pb-24 max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 animate-fade-in">
                    <button
                        onClick={() => navigate('/announcements')}
                        className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-primary" />
                            Create Announcement
                        </h2>
                        <p className="text-sm text-muted-foreground">Publish targeted messages to staff or students</p>
                    </div>
                </div>

                {/* Audience Type Toggle */}
                <Card className="animate-slide-up">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Who is this for?</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        {([
                            { type: 'teachers', label: 'Teachers', icon: Users,         desc: 'Staff & faculty',   color: 'border-blue-400 bg-blue-50 text-blue-700' },
                            { type: 'students', label: 'Students', icon: GraduationCap, desc: 'Enrolled students',  color: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
                        ] as const).map(opt => (
                            <button
                                key={opt.type}
                                onClick={() => { setAudienceType(opt.type); setTargetType('all'); }}
                                className={`rounded-xl border-2 p-4 flex flex-col items-center gap-2 transition-all font-semibold text-sm ${
                                    audienceType === opt.type
                                        ? opt.color
                                        : 'border-border text-muted-foreground hover:border-primary/30'
                                }`}
                            >
                                <opt.icon className="w-6 h-6" />
                                {opt.label}
                                <span className="text-[11px] font-normal opacity-70">{opt.desc}</span>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Target Type */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Targeting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {([
                            { type: 'all',      label: `All ${audienceType}`,        icon: Users,       desc: 'Broadcast to everyone'   },
                            ...(audienceType === 'students'
                                ? [{ type: 'class', label: 'By Class', icon: School, desc: 'Select one or more classes' }]
                                : []
                            ),
                            { type: 'specific', label: 'Specific recipients', icon: UserCheck, desc: 'Hand-pick individuals' },
                        ] as { type: TargetType; label: string; icon: React.ElementType; desc: string }[]).map(opt => (
                            <button
                                key={opt.type}
                                onClick={() => setTargetType(opt.type)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                                    targetType === opt.type
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-border hover:border-primary/30 text-muted-foreground'
                                }`}
                            >
                                <opt.icon className="w-5 h-5 shrink-0" />
                                <div>
                                    <p className="font-semibold text-sm leading-none">{opt.label}</p>
                                    <p className="text-[11px] mt-0.5 opacity-70">{opt.desc}</p>
                                </div>
                                {targetType === opt.type && (
                                    <Badge variant="default" className="ml-auto text-[10px]">Selected</Badge>
                                )}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Recipient Selector (specific / class) */}
                {(targetType === 'specific' || targetType === 'class') && (
                    <Card className="animate-slide-up" style={{ animationDelay: '0.08s' }}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">
                                {targetType === 'class'
                                    ? 'Select Classes'
                                    : `Select ${audienceType === 'teachers' ? 'Teachers' : 'Students'}`}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={e => handleSearchChange(e.target.value)}
                                    className="pl-9 h-9"
                                />
                                {isSearching && (
                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                                )}
                            </div>

                            {(isLoadingData || isSearching) ? (
                                <div className="flex justify-center py-6">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                                    {/* Class selector */}
                                    {targetType === 'class' && filteredClasses.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => toggleClass(c.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                                                selectedClassIds.includes(c.id)
                                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                    : 'border-transparent hover:bg-secondary/50 text-foreground'
                                            }`}
                                        >
                                            <School className="w-4 h-4 shrink-0" />
                                            <span>{c.name}</span>
                                            {selectedClassIds.includes(c.id) && (
                                                <Badge className="ml-auto text-[10px]">✓</Badge>
                                            )}
                                        </button>
                                    ))}

                                    {/* Teacher selector */}
                                    {targetType === 'specific' && audienceType === 'teachers' && filteredTeachers.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => toggleUser(t.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                                                selectedUserIds.includes(t.id)
                                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                    : 'border-transparent hover:bg-secondary/50 text-foreground'
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold shrink-0">
                                                {t.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{t.name}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{t.email}</p>
                                            </div>
                                            {selectedUserIds.includes(t.id) && (
                                                <Badge className="ml-auto text-[10px]">✓</Badge>
                                            )}
                                        </button>
                                    ))}

                                    {/* Student selector */}
                                    {targetType === 'specific' && audienceType === 'students' && filteredStudents.map(s => {
                                        const displayName = s.user?.name || s.name || s.username || '?';
                                        const className = s.class_room?.name || s.class?.name || 'No class';
                                        return (
                                        <button
                                            key={s.id}
                                            onClick={() => toggleUser(s.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                                                selectedUserIds.includes(s.id)
                                                    ? 'border-primary bg-primary/5 text-primary font-semibold'
                                                    : 'border-transparent hover:bg-secondary/50 text-foreground'
                                            }`}
                                        >
                                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[11px] font-bold shrink-0">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{displayName}</p>
                                                <p className="text-[11px] text-muted-foreground">{className}</p>
                                            </div>
                                            {selectedUserIds.includes(s.id) && (
                                                <Badge className="ml-auto text-[10px]">✓</Badge>
                                            )}
                                        </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Selected count */}
                            {(selectedUserIds.length > 0 || selectedClassIds.length > 0) && (
                                <p className="text-xs text-primary font-semibold">
                                    {targetType === 'class'
                                        ? `${selectedClassIds.length} class${selectedClassIds.length !== 1 ? 'es' : ''} selected`
                                        : `${selectedUserIds.length} recipient${selectedUserIds.length !== 1 ? 's' : ''} selected`
                                    }
                                </p>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Content */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Announcement Content</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                            <Input
                                placeholder="e.g. Staff Meeting – Monday 9 AM"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Message <span className="text-destructive">*</span></label>
                            <Textarea
                                placeholder="Write the announcement details here..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="min-h-[120px] resize-none"
                            />
                        </div>

                        {/* Attachments */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Attachments (optional)</label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm border border-dashed rounded-lg p-3 hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground">
                                <Paperclip className="w-4 h-4" />
                                <span>Click to attach files (PDF, image, etc.)</span>
                                <input type="file" multiple className="hidden" onChange={handleFileChange} />
                            </label>
                            {attachments.length > 0 && (
                                <div className="space-y-1.5">
                                    {attachments.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs bg-secondary/50 px-3 py-2 rounded-lg">
                                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span className="flex-1 truncate font-medium">{f.name}</span>
                                            <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Options */}
                <Card className="animate-slide-up" style={{ animationDelay: '0.12s' }}>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium flex items-center gap-2">
                                    <Pin className="w-4 h-4 text-amber-500" /> Pin Announcement
                                </p>
                                <p className="text-xs text-muted-foreground">Pinned messages appear at the top</p>
                            </div>
                            <Switch checked={isPinned} onCheckedChange={setIsPinned} />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Publish immediately</p>
                                <p className="text-xs text-muted-foreground">Turn off to save as draft</p>
                            </div>
                            <Switch checked={publishNow} onCheckedChange={setPublishNow} />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit */}
                <Button
                    className="w-full h-12 text-base font-bold"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                >
                    {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                    {publishNow ? 'Publish Announcement' : 'Save as Draft'}
                </Button>
            </div>
        </AppLayout>
    );
}
