import React, { useState, useEffect } from 'react';
import {
    Pin, Megaphone, Loader2, Paperclip, Clock,
    ChevronDown, ChevronUp, Zap, ArrowRight, Eye
} from 'lucide-react';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Announcement {
    id: number;
    title: string;
    content: string;
    is_pinned: boolean;
    is_read: boolean;
    published_at: string;
    creator: { id: number; name: string };
    attachments: { id: number; file_name: string; file_path: string; mime_type: string }[];
}

function getInitials(name: string) {
    return (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function StudentAnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading]         = useState(true);
    const [expanded, setExpanded]           = useState<number | null>(null);

    useEffect(() => {
        api.get('/student/announcements')
            .then(r => setAnnouncements(r.data))
            .catch(() => toast.error('Failed to load announcements'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleExpand = async (a: Announcement) => {
        const id = expanded === a.id ? null : a.id;
        setExpanded(id);

        if (!a.is_read && id === a.id) {
            try {
                await api.post(`/student/announcements/${a.id}/read`);
                setAnnouncements(prev => prev.map(x =>
                    x.id === a.id ? { ...x, is_read: true } : x
                ));
            } catch { /* silent */ }
        }
    };

    const unreadCount = announcements.filter(a => !a.is_read).length;
    const featured    = announcements[0] ?? null;
    const archives    = announcements.slice(1);

    return (
        <StudentLayout title="Notices">
            <div className="space-y-6 pb-10 max-w-3xl mx-auto">

                {/* ── Page Header ── */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
                        Institutional Bulletin
                    </p>
                    <h1 className="text-[28px] font-black text-slate-900 leading-tight tracking-tight">
                        Notices
                    </h1>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                        {unreadCount > 0
                            ? <>You have <span className="font-black text-[#008f6c]">{unreadCount} unread</span> message{unreadCount !== 1 ? 's' : ''}</>
                            : 'Managed communications and authoritative broadcasts for the academic community.'
                        }
                    </p>
                </div>

                {/* ── Loading ── */}
                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-[#008f6c]" />
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="flex flex-col items-center py-16 text-center">
                        <Megaphone className="w-12 h-12 text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold text-sm">No notices yet</p>
                        <p className="text-xs text-slate-300 mt-1">Check back later for updates from your institution.</p>
                    </div>
                ) : (
                    <>
                        {/* ── Featured + Stats Row ── */}
                        {featured && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

                                {/* Featured Card */}
                                <div
                                    className={`lg:col-span-2 bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                        !featured.is_read ? 'border-[#008f6c]/30' : 'border-slate-100'
                                    }`}
                                >
                                    <div className="p-6">
                                        {/* Badges + time */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-2">
                                                {featured.is_pinned && (
                                                    <span className="flex items-center gap-1 px-2.5 py-1 bg-[#008f6c] text-white text-[10px] font-black uppercase tracking-wider rounded-full">
                                                        <Zap className="w-2.5 h-2.5" /> Pinned
                                                    </span>
                                                )}
                                                {!featured.is_read && (
                                                    <span className="px-2.5 py-1 bg-[#008f6c]/10 text-[#008f6c] text-[10px] font-black uppercase tracking-wider rounded-full">
                                                        New
                                                    </span>
                                                )}
                                            </div>
                                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                                                <Clock className="w-3 h-3" />
                                                {formatDistanceToNow(new Date(featured.published_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h2 className="text-[20px] font-black text-[#008f6c] leading-snug mb-3 tracking-tight">
                                            {featured.title}
                                        </h2>

                                        {/* Content preview / full */}
                                        <p className={`text-sm text-slate-500 leading-relaxed mb-5 ${expanded === featured.id ? '' : 'line-clamp-4'}`}>
                                            {featured.content}
                                        </p>

                                        {/* Attachments when expanded */}
                                        {expanded === featured.id && featured.attachments?.length > 0 && (
                                            <div className="mb-5 space-y-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attachments</p>
                                                {featured.attachments.map(att => (
                                                    <a
                                                        key={att.id}
                                                        href={`${import.meta.env.VITE_STORAGE_URL}/${att.file_path}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                                    >
                                                        <Paperclip className="w-3.5 h-3.5 text-[#008f6c] shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-700 truncate">{att.file_name}</span>
                                                    </a>
                                                ))}
                                            </div>
                                        )}

                                        {/* Divider + footer */}
                                        <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-full bg-[#008f6c]/15 flex items-center justify-center text-[10px] font-black text-[#008f6c]">
                                                    {getInitials(featured.creator?.name)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide leading-none">
                                                        {featured.creator?.name}
                                                    </p>
                                                    {featured.attachments?.length > 0 && expanded !== featured.id && (
                                                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                                            <Paperclip className="w-2.5 h-2.5" />
                                                            {featured.attachments.length} file{featured.attachments.length !== 1 ? 's' : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleExpand(featured)}
                                                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#008f6c] text-white text-[11px] font-bold rounded-full hover:bg-[#007a5c] transition-colors"
                                            >
                                                {expanded === featured.id ? (
                                                    <><ChevronUp className="w-3.5 h-3.5" /> Collapse</>
                                                ) : (
                                                    <>Read More <ArrowRight className="w-3.5 h-3.5" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sidebar */}
                                <div className="space-y-4">
                                    {/* Dark stats card */}
                                    <div className="bg-[#003d2e] rounded-2xl p-5 text-white">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Megaphone className="w-4 h-4 text-emerald-400" />
                                            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                                                Your Notices
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5 mb-4">
                                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                                <p className="text-lg font-black">{announcements.length}</p>
                                                <p className="text-[10px] text-white/60 font-semibold mt-0.5">Total</p>
                                            </div>
                                            <div className="bg-white/10 rounded-xl p-3 text-center">
                                                <p className={`text-lg font-black ${unreadCount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                                    {unreadCount}
                                                </p>
                                                <p className="text-[10px] text-white/60 font-semibold mt-0.5">Unread</p>
                                            </div>
                                        </div>
                                        <p className="text-[12px] text-white/60 leading-relaxed">
                                            Tap any notice to read the full message and mark it as seen.
                                        </p>
                                    </div>

                                    {/* Read status card */}
                                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                                            Read Status
                                        </p>
                                        <div className="space-y-2">
                                            {[
                                                { label: 'Read',   count: announcements.filter(a => a.is_read).length,    color: 'bg-slate-200' },
                                                { label: 'Unread', count: unreadCount,                                     color: 'bg-[#008f6c]' },
                                            ].map(item => (
                                                <div key={item.label} className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                                    <span className="flex-1 text-xs text-slate-500 font-semibold">{item.label}</span>
                                                    <span className="text-xs font-black text-slate-700">{item.count}</span>
                                                </div>
                                            ))}
                                            {/* Bar */}
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                <div
                                                    className="h-full bg-[#008f6c] rounded-full transition-all duration-500"
                                                    style={{ width: announcements.length > 0 ? `${((announcements.length - unreadCount) / announcements.length) * 100}%` : '0%' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Archives ── */}
                        {archives.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                                        Recent Archives
                                    </h3>
                                    <div className="h-px flex-1 bg-slate-100" />
                                </div>

                                <div className="space-y-3">
                                    {archives.map(a => (
                                        <div
                                            key={a.id}
                                            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                                                !a.is_read ? 'border-l-4 border-l-[#008f6c] border-slate-100' : 'border-slate-100'
                                            }`}
                                        >
                                            <button
                                                className="w-full flex items-center gap-3 p-4 text-left"
                                                onClick={() => handleExpand(a)}
                                            >
                                                {/* Unread dot */}
                                                {!a.is_read && (
                                                    <div className="w-2 h-2 rounded-full bg-[#008f6c] shrink-0" />
                                                )}

                                                {/* Icon */}
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                    a.is_pinned ? 'bg-amber-50' : 'bg-emerald-50'
                                                }`}>
                                                    {a.is_pinned
                                                        ? <Pin className="w-3.5 h-3.5 text-amber-500" />
                                                        : <Megaphone className="w-3.5 h-3.5 text-emerald-500" />
                                                    }
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                                                            {formatDistanceToNow(new Date(a.published_at), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm leading-snug truncate ${!a.is_read ? 'font-black text-slate-900' : 'font-bold text-slate-700'}`}>
                                                        {a.title}
                                                    </p>
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

                                                <div className="shrink-0">
                                                    {expanded === a.id
                                                        ? <ChevronUp className="w-4 h-4 text-slate-300" />
                                                        : <ChevronDown className="w-4 h-4 text-slate-300" />
                                                    }
                                                </div>
                                            </button>

                                            {/* Expanded */}
                                            {expanded === a.id && (
                                                <div className="px-4 pb-4 pt-2 border-t border-slate-50 space-y-3">
                                                    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                                        {a.content}
                                                    </p>
                                                    {a.attachments?.length > 0 && (
                                                        <div className="space-y-1.5">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                Attachments
                                                            </p>
                                                            {a.attachments.map(att => (
                                                                <a
                                                                    key={att.id}
                                                                    href={`${import.meta.env.VITE_STORAGE_URL}/${att.file_path}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                                                                >
                                                                    <Paperclip className="w-3.5 h-3.5 text-[#008f6c] shrink-0" />
                                                                    <span className="text-xs font-semibold text-slate-700 truncate">
                                                                        {att.file_name}
                                                                    </span>
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </StudentLayout>
    );
}
