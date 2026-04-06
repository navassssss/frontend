import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    ChevronRight, Pin, Trash2, Loader2, Paperclip, Clock,
    Users, GraduationCap, School, UserCheck, Megaphone,
    Eye, Zap, Globe, User, Calendar, Download, Share2,
    FileText, Image as ImageIcon, CheckCircle2, BarChart2,
    Tag, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

interface Attachment { id: number; file_name: string; file_path: string; mime_type: string; file_size?: number; }
interface TargetUser  { id: number; name: string; email: string; }
interface TargetClass { id: number; name: string; }

interface Announcement {
    id: number;
    title: string;
    content: string;
    audience_type: 'teachers' | 'students';
    target_type: 'all' | 'class' | 'specific';
    is_pinned: boolean;
    published_at: string | null;
    created_at: string;
    reads_count: number;
    creator: { id: number; name: string; role?: string; department?: string };
    attachments: Attachment[];
    target_users?: TargetUser[];
    target_classes?: TargetClass[];
}

const AUDIENCE_COLOR: Record<string, string> = {
    teachers: 'bg-blue-100 text-blue-700',
    students: 'bg-emerald-100 text-emerald-700',
};

const TARGET_LABEL: Record<string, string> = {
    all: 'All Recipients',
    class: 'By Class',
    specific: 'Specific People',
};

function getInitials(name: string) {
    return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function fileSizeLabel(bytes?: number) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime?: string }) {
    if (mime?.startsWith('image/'))       return <ImageIcon className="w-5 h-5 text-violet-500" />;
    if (mime === 'application/pdf')       return <FileText className="w-5 h-5 text-red-500" />;
    return <Paperclip className="w-5 h-5 text-slate-500" />;
}

export default function AnnouncementDetailPage() {
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [announcement, setAnnouncement] = useState<Announcement | null>(null);
    const [isLoading, setIsLoading]       = useState(true);
    const [isDeleting, setIsDeleting]     = useState(false);

    const isPrincipal = user?.role === 'principal' || user?.is_vice_principal;
    const canManage   = isPrincipal || user?.permissions?.some((p: any) => p.name === 'manage_announcements');

    useEffect(() => {
        api.get(`/announcements/${id}`)
            .then(r => setAnnouncement(r.data))
            .catch(() => {
                toast.error('Failed to load announcement');
                navigate('/announcements');
            })
            .finally(() => setIsLoading(false));
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Delete this announcement permanently?')) return;
        setIsDeleting(true);
        try {
            await api.delete(`/announcements/${id}`);
            toast.success('Announcement deleted');
            navigate('/announcements');
        } catch {
            toast.error('Failed to delete');
            setIsDeleting(false);
        }
    };

    const handleTogglePin = async () => {
        if (!announcement) return;
        try {
            await api.post(`/announcements/${announcement.id}/toggle-pin`);
            setAnnouncement(prev => prev ? { ...prev, is_pinned: !prev.is_pinned } : prev);
            toast.success(announcement.is_pinned ? 'Unpinned' : 'Pinned');
        } catch { toast.error('Failed to update pin'); }
    };

    if (isLoading) {
        return (
            <AppLayout title="Notice">
                <div className="flex justify-center items-center py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-[#008f6c]" />
                </div>
            </AppLayout>
        );
    }
    if (!announcement) return null;

    /* ── derived helpers ── */
    const isTeachers  = announcement.audience_type === 'teachers';
    const accentColor = isTeachers ? '#2563eb' : '#008f6c';
    const accentLight = isTeachers ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700';
    const publishedStr = announcement.published_at
        ? format(new Date(announcement.published_at), 'MMM dd, yyyy · hh:mm a')
        : 'Draft – not published';

    const TARGET_META_MAP: Record<string, { label: string; desc: string; icon: React.ElementType }> = {
        all:      { label: 'All Recipients',  desc: 'Sent to everyone in this group',     icon: Globe },
        class:    { label: 'By Class',         desc: 'Targeted to specific classes',        icon: School },
        specific: { label: 'Specific People', desc: 'Sent to hand-picked individuals',     icon: UserCheck },
    };
    const tgt     = TARGET_META_MAP[announcement.target_type] ?? TARGET_META_MAP['all'];
    const TgtIcon = tgt.icon;

    /* pull first ~200 chars for the pull-quote (first sentence or two) */
    const pullQuote = (() => {
        const sentences = announcement.content.split(/(?<=[.!?])\s+/);
        let q = '';
        for (const s of sentences) {
            if ((q + s).length > 220) break;
            q += (q ? ' ' : '') + s;
        }
        return q || announcement.content.slice(0, 220);
    })();
    const bodyAfterQuote = announcement.content.length > pullQuote.length
        ? announcement.content.slice(pullQuote.length).trim()
        : '';

    return (
        <AppLayout title="View Notice">
            <div className="max-w-5xl mx-auto px-4 py-6 pb-24">

                {/* ── Breadcrumb ── */}
                <nav className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8">
                    <button onClick={() => navigate('/dashboard')} className="hover:text-slate-600 transition-colors">Portal</button>
                    <ChevronRight className="w-3 h-3" />
                    <button onClick={() => navigate('/announcements')} className="hover:text-slate-600 transition-colors">
                        {canManage ? 'Announcements' : 'Notices'}
                    </button>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-600">View Notice</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* ══ LEFT – Main Content ══ */}
                    <div className="space-y-7">

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            {announcement.is_pinned && (
                                <span className="flex items-center gap-1 px-3 py-1 bg-[#008f6c] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                    <Zap className="w-2.5 h-2.5" /> Pinned
                                </span>
                            )}
                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${AUDIENCE_COLOR[announcement.audience_type]}`}>
                                {announcement.audience_type}
                            </span>
                            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-slate-100 text-slate-600">
                                {announcement.published_at ? 'Published' : 'Draft'}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-[34px] sm:text-[40px] font-black text-slate-900 leading-[1.1] tracking-tight">
                            {announcement.title}
                        </h1>

                        {/* Meta strip */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 border-b border-slate-100 pb-5">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {publishedStr}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {announcement.creator?.name}
                            </span>
                            {announcement.reads_count > 0 && (
                                <span className="flex items-center gap-1.5">
                                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                                    {announcement.reads_count} reads
                                </span>
                            )}
                        </div>

                        {/* Body – first chunk */}
                        <div className="prose prose-slate max-w-none">
                            <p className="text-[15px] text-slate-600 leading-[1.85] whitespace-pre-line">
                                {pullQuote}
                            </p>
                        </div>

                        {/* Pull-quote highlight */}
                        <blockquote className="relative border-l-4 pl-5 py-1" style={{ borderColor: accentColor }}>
                            <p className="text-[14px] italic text-slate-500 leading-relaxed">
                                "{pullQuote.split(' ').slice(0, 30).join(' ')}{pullQuote.split(' ').length > 30 ? '…' : ''}"
                            </p>
                        </blockquote>

                        {/* Body – remainder */}
                        {bodyAfterQuote && (
                            <div className="prose prose-slate max-w-none">
                                <p className="text-[15px] text-slate-600 leading-[1.85] whitespace-pre-line">
                                    {bodyAfterQuote}
                                </p>
                            </div>
                        )}

                        {/* Supporting Documents */}
                        {announcement.attachments?.length > 0 && (
                            <div className="pt-3">
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Paperclip className="w-3.5 h-3.5" /> Supporting Documents
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {announcement.attachments.map(att => (
                                        <a
                                            key={att.id}
                                            href={`${import.meta.env.VITE_STORAGE_URL}/${att.file_path}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group flex items-center gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:border-[#008f6c]/30 hover:bg-white transition-all shadow-sm hover:shadow-md"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                                                <FileIcon mime={att.mime_type} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#008f6c] transition-colors">
                                                    {att.file_name}
                                                </p>
                                                {att.file_size && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {fileSizeLabel(att.file_size)}
                                                    </p>
                                                )}
                                            </div>
                                            <Download className="w-4 h-4 text-slate-300 group-hover:text-[#008f6c] transition-colors shrink-0" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Admin actions (manage) */}
                        {canManage && (
                            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                                <button
                                    onClick={handleTogglePin}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                        announcement.is_pinned
                                            ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <Pin className="w-3.5 h-3.5" />
                                    {announcement.is_pinned ? 'Unpin' : 'Pin Notice'}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                >
                                    {isDeleting
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        : <Trash2 className="w-3.5 h-3.5" />
                                    }
                                    Delete Notice
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT – Sidebar ══ */}
                    <div className="space-y-4">

                        {/* Publisher Details */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Publisher Details
                                </p>
                            </div>
                            <div className="px-5 py-5 text-center">
                                <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-lg font-black ${
                                    isTeachers ? 'bg-blue-100 text-blue-700' : 'bg-[#008f6c]/15 text-[#008f6c]'
                                }`}>
                                    {getInitials(announcement.creator?.name || '')}
                                </div>
                                <p className="text-sm font-black text-slate-800 leading-snug">
                                    {announcement.creator?.name}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                                    {announcement.creator?.department || 'Academic Affairs'}
                                </p>
                                <div className="mt-3 flex justify-center gap-1.5">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${accentLight}`}>
                                        {announcement.creator?.role === 'principal' ? 'Principal' : 'Administration'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Targeting & Recipients */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    Targeting
                                </p>
                            </div>
                            <div className="px-5 py-4">
                                {/* Target type row */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                        <TgtIcon className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{tgt.label}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{tgt.desc}</p>
                                    </div>
                                </div>

                                {/* Specific target users */}
                                {announcement.target_type === 'specific' && announcement.target_users && announcement.target_users.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                            Recipients
                                        </p>
                                        <div className="space-y-1">
                                            {announcement.target_users.slice(0, 5).map(u => (
                                                <div key={u.id} className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0 tracking-wide">
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide truncate">
                                                        {u.name}
                                                    </p>
                                                </div>
                                            ))}
                                            {announcement.target_users.length > 5 && (
                                                <p className="text-[11px] font-bold text-[#008f6c] pl-2 pt-1">
                                                    +{announcement.target_users.length - 5} more recipients
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Target classes */}
                                {announcement.target_type === 'class' && announcement.target_classes && announcement.target_classes.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                            Classes
                                        </p>
                                        <div className="space-y-1">
                                            {announcement.target_classes.map(c => (
                                                <div key={c.id} className="flex items-center gap-3 py-1.5 px-2 rounded-xl hover:bg-slate-50 transition-colors">
                                                    <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                                        <School className="w-4 h-4 text-violet-500" />
                                                    </div>
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                                                        {c.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Engagement Analytics */}
                        <div className="bg-[#003d2e] rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                        Engagement Analytics
                                    </p>
                                </div>
                            </div>
                            <div className="px-5 py-4 grid grid-cols-2 gap-3">
                                <div className="bg-white/10 rounded-xl p-3 text-center">
                                    <p className="text-xl font-black text-white">{announcement.reads_count.toLocaleString()}</p>
                                    <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">Read Receipts</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3 text-center">
                                    <p className="text-xl font-black text-white">{String(announcement.attachments?.length || 0).padStart(2, '0')}</p>
                                    <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider mt-0.5">Attachments</p>
                                </div>
                            </div>
                            <div className="px-5 pb-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">Current Status</span>
                                    <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${
                                        announcement.published_at ? 'bg-emerald-400/20 text-emerald-400' : 'bg-white/10 text-white/40'
                                    }`}>
                                        <CheckCircle2 className="w-2.5 h-2.5" />
                                        {announcement.published_at ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-2.5">
                            <button
                                onClick={() => navigate('/announcements')}
                                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Back
                            </button>
                            {announcement.attachments?.length > 0 && (
                                <a
                                    href={`${import.meta.env.VITE_STORAGE_URL}/${announcement.attachments[0].file_path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
