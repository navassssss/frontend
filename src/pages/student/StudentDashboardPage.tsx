import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Star, Trophy, TrendingUp, Plus, ChevronRight,
    Award, Calendar, Wallet, BookOpen, IndianRupee, Clock
} from 'lucide-react';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import StudentLayout from '@/components/student/StudentLayout';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';


interface Achievement {
    id: number;
    title: string;
    points: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    category: { name: string };
}

export default function StudentDashboardPage() {
    const navigate = useNavigate();
    const { student } = useStudentAuth();
    const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get('/student/achievements');
                const all: Achievement[] = res.data;
                setRecentAchievements(all.filter(a => a.status === 'approved').slice(0, 4));
                setPendingCount(all.filter(a => a.status === 'pending').length);
            } catch { /* silent */ }
            finally { setIsLoading(false); }
        })();
    }, []);

    const totalPoints = student?.totalPoints || 0;
    const stars = student?.stars || 0;
    const monthlyPoints = student?.monthlyPoints || 0;
    const walletBalance = student?.walletBalance || 0;

    // Use backend-computed progress (respects dynamic thresholds)
    const sp = student?.starProgress;
    const progressPct   = sp?.progressPct ?? Math.round(((totalPoints % 20) / 20) * 100);
    const pointsToNext  = sp?.pointsToNextStar ?? (20 - (totalPoints % 20));
    const nextStarPts   = sp?.nextStarPoints ?? ((stars + 1) * 20);
    const currentStarPts = sp?.currentStarPoints ?? (stars * 20);

    const quickActions = [
        { icon: Plus,        label: 'Add Achievement', path: '/student/achievements/new', bg: 'bg-[#008f6c]'    },
        { icon: Wallet,      label: 'View Account',    path: '/student/account',          bg: 'bg-slate-700'    },
        { icon: Calendar,    label: 'Attendance',      path: '/student/attendance',        bg: 'bg-blue-600'     },
        { icon: Trophy,      label: 'Leaderboard',     path: '/student/leaderboard',       bg: 'bg-amber-500'    },
        { icon: BookOpen,    label: 'CCE Marks',       path: '/student/cce',               bg: 'bg-violet-600'   },
        { icon: IndianRupee, label: 'Monthly Donations', path: '/student/fees',              bg: 'bg-rose-500'     },
    ];

    return (
        <StudentLayout title={`Welcome, ${student?.name?.split(' ')[0] || 'Scholar'}!`}>
            <div className="space-y-5 pb-10">

                {/* ═══════════════════════════════════════
                    ACADEMIC OVERVIEW — mobile: stacked row cards
                    desktop: 4-col grid
                ═══════════════════════════════════════ */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Academic Overview</p>

                    {/* Mobile: vertical stack of wide cards */}
                    <div className="flex flex-col gap-3 lg:hidden">

                        {/* Stars */}
                        <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#008f6c]/10 flex items-center justify-center shrink-0">
                                <Star className="w-6 h-6 text-[#008f6c] fill-[#008f6c]" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-400">Total Stars</p>
                                <p className="text-2xl font-black text-slate-800 leading-tight">{stars}</p>
                            </div>
                            {stars > 0 && (
                                <span className="px-3 py-1 bg-[#008f6c] text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                                    TOP 5%
                                </span>
                            )}
                        </div>

                        {/* Academic Points */}
                        <button
                            onClick={() => navigate('/student/leaderboard')}
                            className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-4 text-left w-full hover:shadow-md transition-shadow"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Trophy className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-400">Academic Points</p>
                                <p className="text-2xl font-black text-slate-800 leading-tight">{totalPoints.toLocaleString()}</p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
                        </button>

                        {/* Wallet / Credit */}
                        <button
                            onClick={() => navigate('/student/account')}
                            className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-4 text-left w-full hover:shadow-md transition-shadow"
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${walletBalance >= 0 ? 'bg-[#008f6c]/10' : 'bg-red-50'}`}>
                                <Wallet className={`w-6 h-6 ${walletBalance >= 0 ? 'text-[#008f6c]' : 'text-red-500'}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-400">
                                    {walletBalance >= 0 ? 'Available Credit' : 'Payment Due'}
                                </p>
                                <p className={`text-2xl font-black leading-tight ${walletBalance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                                    ₹{Math.abs(walletBalance).toLocaleString()}
                                </p>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${walletBalance >= 0 ? 'text-[#008f6c]' : 'text-red-500'}`}>
                                {walletBalance >= 0 ? 'TOP UP' : 'PAY NOW'}
                            </span>
                        </button>

                        {/* This Month */}
                        <div className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-violet-600" />
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-slate-400">This Month</p>
                                <p className="text-2xl font-black text-slate-800 leading-tight">{monthlyPoints}</p>
                            </div>
                            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">pts</span>
                        </div>
                    </div>

                    {/* Desktop: 4-column grid */}
                    <div className="hidden lg:grid lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Stars',      value: stars,                                         icon: Star,       bg: 'bg-[#008f6c]/10', iconCls: 'text-[#008f6c] fill-[#008f6c]', valCls: 'text-slate-800' },
                            { label: 'Academic Points',  value: totalPoints.toLocaleString(),                  icon: Trophy,     bg: 'bg-blue-50',       iconCls: 'text-blue-600',                  valCls: 'text-slate-800' },
                            { label: 'This Month',       value: `${monthlyPoints} pts`,                        icon: TrendingUp, bg: 'bg-violet-50',     iconCls: 'text-violet-500',                valCls: 'text-slate-800' },
                            { label: walletBalance >= 0 ? 'Available Credit' : 'Payment Due',
                              value: `₹${Math.abs(walletBalance).toLocaleString()}`,
                              icon: Wallet, bg: walletBalance >= 0 ? 'bg-[#008f6c]/10' : 'bg-red-50',
                              iconCls: walletBalance >= 0 ? 'text-[#008f6c]' : 'text-red-500',
                              valCls:  walletBalance >= 0 ? 'text-[#008f6c]' : 'text-red-500' },
                        ].map((s, i) => (
                            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className={`w-11 h-11 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                                    <s.icon className={`w-5 h-5 ${s.iconCls}`} />
                                </div>
                                <p className={`text-2xl font-black ${s.valCls} leading-none`}>{s.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════
                    PROGRESS TO NEXT STAR
                ═══════════════════════════════════════ */}
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-black text-slate-800">Progress to Next Star</h3>
                        <span className="text-[#008f6c] font-black text-sm">{progressPct}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full bg-gradient-to-r from-[#008f6c] to-emerald-400 rounded-full transition-all duration-1000"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                        <span>{currentStarPts} pts — ★ {stars}</span>
                        <span>★ {stars + 1} — {nextStarPts} pts</span>
                    </div>
                    <p className="text-[12px] text-slate-500 leading-relaxed">
                        {pointsToNext <= 0
                            ? <span className="font-black text-[#008f6c]">You've reached the maximum star level! 🎉</span>
                            : <>You need <span className="font-black text-[#008f6c]">{pointsToNext} more points</span> to reach ★ {stars + 1}. Keep it up!</>
                        }
                    </p>
                </div>

                {/* ═══════════════════════════════════════
                    QUICK ACTIONS — 2-col on mobile, 3-col on tablet, 6-col on desktop
                ═══════════════════════════════════════ */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {quickActions.map(action => (
                            <button
                                key={action.path}
                                onClick={() => navigate(action.path)}
                                className="flex flex-col items-center gap-3 py-5 px-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                <div className={`w-12 h-12 rounded-2xl ${action.bg} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}
                                     style={{ backgroundColor: action.bg.replace('bg-', '').replace('-600','').replace('-500','') }}>
                                    {/* Coloured circle with white icon */}
                                    <div className={`w-12 h-12 rounded-2xl ${action.bg} flex items-center justify-center`}>
                                        <action.icon className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <span className="text-[11px] font-black text-slate-600 text-center leading-tight">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ═══════════════════════════════════════
                    PENDING ALERT
                ═══════════════════════════════════════ */}
                {pendingCount > 0 && (
                    <button
                        onClick={() => navigate('/student/achievements')}
                        className="w-full flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl hover:bg-amber-100/70 transition-colors group"
                    >
                        <div className="w-11 h-11 rounded-xl bg-amber-200/60 flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-amber-700" />
                        </div>
                        <div className="text-left flex-1">
                            <p className="font-black text-amber-900 text-sm">{pendingCount} Pending Achievement{pendingCount !== 1 ? 's' : ''}</p>
                            <p className="text-[11px] text-amber-600 font-medium">Awaiting teacher review</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
                    </button>
                )}

                {/* ═══════════════════════════════════════
                    RECENT ACTIVITY
                ═══════════════════════════════════════ */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</p>
                        <button
                            onClick={() => navigate('/student/achievements')}
                            className="text-[11px] font-black text-[#008f6c] hover:underline uppercase tracking-widest"
                        >
                            See All
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                        {isLoading ? (
                            [1, 2, 3].map(i => (
                                <div key={i} className="flex items-center gap-4 p-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-slate-100 rounded animate-pulse w-2/3" />
                                        <div className="h-2.5 bg-slate-50 rounded animate-pulse w-1/2" />
                                    </div>
                                </div>
                            ))
                        ) : recentAchievements.length > 0 ? (
                            recentAchievements.map(achievement => (
                                <div key={achievement.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/70 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-[#008f6c]/10 flex items-center justify-center shrink-0">
                                        <Award className="w-5 h-5 text-[#008f6c]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] font-black text-slate-800 truncate">{achievement.title}</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">{achievement.category.name}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[12px] font-black text-[#008f6c]">+{achievement.points} pts</p>
                                        <p className="text-[10px] text-slate-300 mt-0.5">
                                            {formatDistanceToNow(new Date(achievement.created_at), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <Trophy className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="font-bold text-slate-400 text-sm mb-3">No achievements yet</p>
                                <button
                                    onClick={() => navigate('/student/achievements/new')}
                                    className="px-5 py-2 bg-[#008f6c] text-white rounded-xl text-[12px] font-black hover:bg-[#007a5c] transition-colors"
                                >
                                    Add Your First →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </StudentLayout>
    );
}
