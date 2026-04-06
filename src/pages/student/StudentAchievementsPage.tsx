import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Award, Plus, Star, Trophy,
    CheckCircle2, Clock, XCircle, AlertCircle
} from 'lucide-react';
import StudentLayout from '@/components/student/StudentLayout';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useStudentAuth } from '@/contexts/StudentAuthContext';

const POINTS_PER_STAR = 20;
type FilterType = 'all' | 'approved' | 'pending' | 'rejected';

interface Achievement {
    id: number;
    title: string;
    description: string;
    points: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    review_note?: string;
    category: { name: string };
    approver?: { name: string };
}

const statusConfig = {
    approved: { icon: CheckCircle2, label: 'Approved', pill: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending:  { icon: Clock,        label: 'Pending',  pill: 'bg-amber-50 text-amber-700 border-amber-100' },
    rejected: { icon: XCircle,      label: 'Rejected', pill: 'bg-red-50 text-red-600 border-red-100' },
};

export default function StudentAchievementsPage() {
    const navigate = useNavigate();
    const { student } = useStudentAuth();
    const [filter, setFilter] = useState<FilterType>('all');
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/student/achievements');
                setAchievements(res.data);
            } catch { /* silent */ }
            finally { setIsLoading(false); }
        })();
    }, []);

    const filtered = achievements.filter(a => filter === 'all' || a.status === filter);
    const totalPoints = student?.totalPoints || 0;
    const stars = student?.stars || 0;

    const filters: { value: FilterType; label: string; count: number }[] = [
        { value: 'all',      label: 'All',      count: achievements.length },
        { value: 'approved', label: 'Approved', count: achievements.filter(a => a.status === 'approved').length },
        { value: 'pending',  label: 'Pending',  count: achievements.filter(a => a.status === 'pending').length },
        { value: 'rejected', label: 'Rejected', count: achievements.filter(a => a.status === 'rejected').length },
    ];

    return (
        <StudentLayout
            title="My Achievements"
            actions={
                <button
                    onClick={() => navigate('/student/achievements/new')}
                    className="h-9 px-4 bg-[#008f6c] hover:bg-[#007a5c] text-white rounded-xl text-[12px] font-black flex items-center gap-1.5 transition-colors shadow-sm"
                >
                    <Plus className="w-3.5 h-3.5" /> Add New
                </button>
            }
        >
            <div className="space-y-5 pb-8">

                {/* Summary banner */}
                <div className="bg-[#008f6c] rounded-2xl p-6 text-white shadow-lg shadow-[#008f6c]/20">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Total Points Earned</p>
                            <p className="text-4xl font-black mt-1">{totalPoints}</p>
                            <p className="text-[11px] text-emerald-100 mt-2">
                                {POINTS_PER_STAR - (totalPoints % POINTS_PER_STAR)} more pts to next star
                            </p>
                        </div>
                        <div className="flex gap-1">
                            {[...Array(Math.min(stars, 5))].map((_, i) => (
                                <Star key={i} className="w-6 h-6 fill-white text-white drop-shadow-sm" />
                            ))}
                            {stars === 0 && <Star className="w-6 h-6 text-emerald-300/50" />}
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-1000"
                            style={{ width: `${Math.round(((totalPoints % POINTS_PER_STAR) / POINTS_PER_STAR) * 100)}%` }}
                        />
                    </div>
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2 flex-wrap">
                    {filters.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border ${
                                filter === f.value
                                    ? 'bg-[#008f6c] text-white border-[#008f6c] shadow-sm'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {f.label} {f.count > 0 && <span className="ml-1 opacity-70">{f.count}</span>}
                        </button>
                    ))}
                </div>

                {/* Add button */}
                <button
                    onClick={() => navigate('/student/achievements/new')}
                    className="w-full py-3 rounded-2xl border-2 border-dashed border-[#008f6c]/30 text-[#008f6c] font-black text-sm flex items-center justify-center gap-2 hover:bg-[#008f6c]/5 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add New Achievement
                </button>

                {/* List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl border border-slate-100 animate-pulse" />)}
                        </div>
                    ) : filtered.length > 0 ? (
                        filtered.map(achievement => {
                            const sc = statusConfig[achievement.status];
                            const StatusIcon = sc.icon;
                            return (
                                <div key={achievement.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-[#008f6c]/10 flex items-center justify-center shrink-0">
                                            <Award className="w-5 h-5 text-[#008f6c]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-black text-slate-800 text-sm leading-tight">{achievement.title}</p>
                                                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border shrink-0 ${sc.pill}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {achievement.status === 'approved' ? `+${achievement.points}` : sc.label}
                                                </span>
                                            </div>
                                            <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{achievement.description}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold border border-slate-100">
                                                    {achievement.category.name}
                                                </span>
                                                <span className="text-[10px] text-slate-300">
                                                    {format(new Date(achievement.created_at), 'MMM d, yyyy')}
                                                </span>
                                            </div>
                                            {achievement.review_note && (
                                                <div className="mt-2 flex items-start gap-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                                                    <AlertCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                                                    <p className="text-[11px] text-slate-500 italic">"{achievement.review_note}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                            <Trophy className="w-12 h-12 text-slate-200 mb-4" />
                            <p className="font-bold text-slate-400 mb-3">No achievements found</p>
                            <button
                                onClick={() => navigate('/student/achievements/new')}
                                className="px-5 py-2 bg-[#008f6c] text-white rounded-xl text-[12px] font-black hover:bg-[#007a5c] transition-colors"
                            >
                                Add Your First Achievement
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </StudentLayout>
    );
}
