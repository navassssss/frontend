import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import {
    Plus, Megaphone, Pin, Users, GraduationCap, Loader2,
    Trash2, Eye, ChevronRight, Paperclip, Calendar, Clock,
    BookOpen, Zap, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { formatDistanceToNow, format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

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
    creator: { id: number; name: string };
    attachments: { id: number; file_name: string; file_path: string }[];
}

type TabType = 'all' | 'teachers' | 'students';

const AUDIENCE_META = {
    teachers: { label: 'TEACHERS', color: 'bg-slate-200 text-slate-600' },
    students: { label: 'STUDENTS', color: 'bg-emerald-100 text-emerald-700' },
};

const TARGET_META = {
    all:      { label: 'ALL',      color: 'bg-blue-100 text-blue-700' },
    class:    { label: 'BY CLASS', color: 'bg-violet-100 text-violet-700' },
    specific: { label: 'SPECIFIC', color: 'bg-amber-100 text-amber-700' },
};

function getInitials(name: string) {
    return name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export default function AnnouncementsPage() {
    const navigate  = useNavigate();
    const { user }  = useAuth();
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [tab, setTab]                     = useState<TabType>('all');
    const [deletingId, setDeletingId]       = useState<number | null>(null);

    const isPrincipal = user?.role === 'principal' || user?.is_vice_principal;
    const canManage   = isPrincipal || user?.permissions?.some((p: any) => p.name === 'manage_announcements');
    const pageTitle   = canManage ? 'Announcements' : 'Notices';
    const pageDesc    = canManage
        ? 'Manage and publish announcements to staff and students.'
        : 'Managed communications and authoritative broadcasts for the academic community.';

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/announcements');
            setAnnouncements(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
        } catch {
            toast.error('Failed to load announcements');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchAnnouncements(); }, []);

    const filtered = useMemo(() => {
        if (!Array.isArray(announcements)) return [];
        const list = tab === 'all' ? announcements : announcements.filter(a => a.audience_type === tab);
        return list;
    }, [announcements, tab]);

    // Split: featured (first pinned or first), rest = archives
    const featured  = filtered[0] ?? null;
    const archives  = filtered.slice(1);

    const handleDelete = async (id: number) => {
        if (!window.confirm('Delete this announcement?')) return;
        setDeletingId(id);
        try {
            await api.delete(`/announcements/${id}`);
            toast.success('Announcement deleted');
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch {
            toast.error('Failed to delete');
        } finally {
            setDeletingId(null);
        }
    };

    const handleTogglePin = async (a: Announcement) => {
        try {
            await api.post(`/announcements/${a.id}/toggle-pin`);
            setAnnouncements(prev => prev.map(x =>
                x.id === a.id ? { ...x, is_pinned: !x.is_pinned } : x
            ));
        } catch {
            toast.error('Failed to update pin');
        }
    };

    const tabs: { key: TabType; label: string }[] = [
        { key: 'all',      label: 'All' },
        { key: 'teachers', label: 'Teachers' },
        { key: 'students', label: 'Students' },
    ];

    return (
        <AppLayout title={pageTitle}>
            <div className="max-w-5xl mx-auto px-4 py-6 pb-24 space-y-8">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5">
                            Institutional Bulletin
                        </p>
                        <h1 className="text-[32px] font-black text-slate-900 leading-tight tracking-tight">
                            {pageTitle}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1.5 max-w-sm leading-relaxed">
                            {pageDesc}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 mt-1 shrink-0">
                        {/* Tab Pills */}
                        <div className="flex bg-slate-100 rounded-full p-1 gap-0.5">
                            {tabs.map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setTab(t.key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        tab === t.key
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                    }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        {canManage && (
                            <button
                                onClick={() => navigate('/announcements/new')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#008f6c] text-white text-xs font-bold rounded-full hover:bg-[#007a5c] transition-colors shadow-sm"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Create
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Loading ── */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-[#008f6c]" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <Megaphone className="w-14 h-14 mx-auto mb-4 text-slate-200" />
                        <p className="text-slate-400 font-bold">No announcements yet</p>
                        {canManage && (
                            <button
                                onClick={() => navigate('/announcements/new')}
                                className="mt-4 flex items-center gap-2 mx-auto px-5 py-2.5 border border-slate-200 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Create First Announcement
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── Featured + Sidebar ── */}
                        {featured && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

                                {/* Featured Card */}
                                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                    <div className="p-7 flex flex-col">
                                        {/* Tags + Time */}
                                        <div className="flex items-center justify-between mb-5">
                                            <div className="flex items-center gap-2">
                                                {featured.is_pinned && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1 bg-[#008f6c] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                                        <Zap className="w-2.5 h-2.5" /> Pinned
                                                    </span>
                                                )}
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${AUDIENCE_META[featured.audience_type as keyof typeof AUDIENCE_META]?.color || 'bg-slate-100 text-slate-500'}`}>
                                                    {AUDIENCE_META[featured.audience_type as keyof typeof AUDIENCE_META]?.label || featured.audience_type}
                                                </span>
                                                <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${TARGET_META[featured.target_type as keyof typeof TARGET_META]?.color || 'bg-slate-100 text-slate-500'}`}>
                                                    {TARGET_META[featured.target_type as keyof typeof TARGET_META]?.label || featured.target_type}
                                                </span>
                                            </div>
                                            <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                                                <Clock className="w-3 h-3" />
                                                {featured.published_at
                                                    ? formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })
                                                    : 'Draft'}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-[22px] font-black text-[#008f6c] leading-snug mb-4 tracking-tight">
                                            {featured.title}
                                        </h2>

                                        {/* Content */}
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-6 mb-6 flex-1">
                                            {featured.content}
                                        </p>

                                        {/* Divider */}
                                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                            {/* Author */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#008f6c]/15 flex items-center justify-center text-[11px] font-black text-[#008f6c] shrink-0">
                                                    {getInitials(featured.creator?.name || '')}
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide leading-none">
                                                        {featured.creator?.name}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Author</p>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2">
                                                {featured.attachments?.length > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                                        <Paperclip className="w-3 h-3" />
                                                        {featured.attachments.length} file{featured.attachments.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {featured.reads_count > 0 && (
                                                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                                        <Eye className="w-3 h-3" />
                                                        {featured.reads_count}
                                                    </span>
                                                )}
                                                {canManage && (
                                                    <>
                                                        <button
                                                            onClick={() => handleTogglePin(featured)}
                                                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${featured.is_pinned ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                            title={featured.is_pinned ? 'Unpin' : 'Pin'}
                                                        >
                                                            <Pin className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(featured.id)}
                                                            disabled={deletingId === featured.id}
                                                            className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                                                        >
                                                            {deletingId === featured.id
                                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                                : <Trash2 className="w-3.5 h-3.5" />}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/announcements/${featured.id}`)}
                                                    className="w-8 h-8 rounded-full bg-[#008f6c] text-white flex items-center justify-center hover:bg-[#007a5c] transition-colors shadow-sm"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-4">
                                    {/* Stats / Info Card */}
                                    <div className="bg-[#003d2e] rounded-2xl p-5 text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Megaphone className="w-4 h-4 text-emerald-400" />
                                            <p className="text-xs font-black uppercase tracking-wider text-emerald-400">
                                                Bulletin Board
                                            </p>
                                        </div>
                                        <p className="text-[13px] text-white/80 leading-relaxed mb-4">
                                            Stay informed with the latest institutional communications.
                                            {canManage && ' Create and target announcements to reach the right audience.'}
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-white">{filtered.length}</p>
                                                <p className="text-[10px] text-white/60 font-semibold mt-0.5">Total</p>
                                            </div>
                                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black text-white">
                                                    {Array.isArray(filtered) ? filtered.filter(a => a.is_pinned).length : 0}
                                                </p>
                                                <p className="text-[10px] text-white/60 font-semibold mt-0.5">Pinned</p>
                                            </div>
                                        </div>
                                        {canManage && (
                                            <button
                                                onClick={() => navigate('/announcements/new')}
                                                className="mt-4 w-full py-2.5 bg-[#008f6c] text-white text-xs font-bold rounded-xl hover:bg-[#007a5c] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                New Announcement
                                            </button>
                                        )}
                                    </div>

                                    {/* Audience Breakdown */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Audience Breakdown
                                        </p>
                                        <div className="space-y-2.5">
                                            {[
                                                { label: 'For Teachers', icon: Users,         color: 'text-blue-600 bg-blue-50',     count: Array.isArray(announcements) ? announcements.filter(a => a.audience_type === 'teachers').length : 0 },
                                                { label: 'For Students', icon: GraduationCap, color: 'text-emerald-600 bg-emerald-50', count: Array.isArray(announcements) ? announcements.filter(a => a.audience_type === 'students').length : 0 },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.color}`}>
                                                        <item.icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="flex-1 text-xs font-semibold text-slate-600">{item.label}</span>
                                                    <span className="text-xs font-black text-slate-800">{item.count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Recent Archives ── */}
                        {archives.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-400">
                                        Recent Archives
                                    </h3>
                                    <div className="h-px flex-1 bg-slate-100 mx-4" />
                                </div>

                                <div className="space-y-3">
                                    {archives.map((a) => (
                                        <div
                                            key={a.id}
                                            className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                                        >
                                            <div className="flex items-center gap-4 p-4">
                                                {/* Left accent bar */}
                                                <div className={`w-1 self-stretch rounded-full shrink-0 ${
                                                    a.audience_type === 'teachers' ? 'bg-blue-300' : 'bg-emerald-300'
                                                }`} />

                                                {/* Icon */}
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    a.audience_type === 'teachers' ? 'bg-blue-50' : 'bg-emerald-50'
                                                }`}>
                                                    {a.audience_type === 'teachers'
                                                        ? <Users className="w-4 h-4 text-blue-500" />
                                                        : <GraduationCap className="w-4 h-4 text-emerald-500" />
                                                    }
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${TARGET_META[a.target_type as keyof typeof TARGET_META]?.color || 'bg-slate-100 text-slate-500'}`}>
                                                            {TARGET_META[a.target_type as keyof typeof TARGET_META]?.label || a.target_type}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-medium">
                                                            {a.published_at
                                                                ? formatDistanceToNow(new Date(a.published_at), { addSuffix: true })
                                                                : 'Draft'}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <p className="text-sm font-bold text-slate-800 leading-snug truncate">
                                                        {a.title}
                                                    </p>

                                                    {/* Author */}
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        {a.creator?.name}
                                                        {a.attachments?.length > 0 && (
                                                            <span className="ml-2 inline-flex items-center gap-0.5">
                                                                <Paperclip className="w-2.5 h-2.5" />
                                                                {a.attachments.length} file{a.attachments.length !== 1 ? 's' : ''}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    {canManage && (
                                                        <>
                                                            <button
                                                                onClick={() => handleTogglePin(a)}
                                                                className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${a.is_pinned ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-500'}`}
                                                            >
                                                                <Pin className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(a.id)}
                                                                disabled={deletingId === a.id}
                                                                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors"
                                                            >
                                                                {deletingId === a.id
                                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                                    : <Trash2 className="w-3 h-3" />}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => navigate(`/announcements/${a.id}`)}
                                                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-[#008f6c] hover:text-white text-slate-600 text-[11px] font-bold rounded-full transition-all"
                                                    >
                                                        View Details
                                                        <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
