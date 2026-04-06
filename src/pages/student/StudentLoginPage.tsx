import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Trophy, ArrowLeft, User, Lock } from 'lucide-react';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
import { toast } from 'sonner';

export default function StudentLoginPage() {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useStudentAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isAuthenticated) navigate('/student/dashboard');
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            toast.error('Please enter both username and password');
            return;
        }
        setIsLoading(true);
        const success = await login(username, password);
        setIsLoading(false);
        if (success) {
            toast.success('Welcome back!');
            navigate('/student/dashboard');
        } else {
            toast.error('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f9f8] flex items-center justify-center p-4 relative overflow-hidden">

            {/* Decorative blobs */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-48 -right-48 w-[500px] h-[500px] rounded-full bg-[#008f6c]/8" />
                <div className="absolute -bottom-48 -left-48 w-[400px] h-[400px] rounded-full bg-emerald-100/50" />
                <div className="absolute top-1/3 left-1/4 w-3 h-3 bg-[#008f6c]/20 rounded-full" />
                <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-emerald-300/30 rounded-full" />
            </div>

            {/* Back to home */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-5 left-5 flex items-center gap-1.5 text-[11px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Home
            </button>

            <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative z-10">

                {/* Left – branding */}
                <div className="hidden lg:flex flex-col gap-8 animate-in fade-in slide-in-from-left duration-700">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#008f6c] rounded-2xl flex items-center justify-center shadow-lg shadow-[#008f6c]/30">
                            <GraduationCap className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800">DHIC Portal</h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Students Portal</p>
                        </div>
                    </div>

                    <div>
                        <h1 className="text-[44px] font-black text-slate-800 leading-[1.1] tracking-tight">
                            Your Success<br />Journey<br />
                            <span className="text-[#008f6c]">Starts Here.</span>
                        </h1>
                        <p className="mt-5 text-slate-500 font-medium leading-relaxed max-w-sm">
                            Track your achievements, view your marks, and compete on the leaderboard with fellow scholars.
                        </p>
                    </div>

                    {/* Stats teasers */}
                    <div className="flex gap-4">
                        {[
                            { label: 'Active Students', value: '500+' },
                            { label: 'Achievements', value: '2.4K+' },
                            { label: 'Merit Points', value: '∞' },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-2xl px-5 py-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-xl font-black text-[#008f6c]">{s.value}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right – login card */}
                <div className="animate-in fade-in slide-in-from-right duration-700">
                    <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(0,143,108,0.08)] border border-slate-100 p-8 lg:p-10">

                        {/* Mobile logo */}
                        <div className="lg:hidden text-center mb-8">
                            <div className="w-16 h-16 bg-[#008f6c] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#008f6c]/25">
                                <GraduationCap className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-slate-800">DHIC Portal</h2>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Students Portal</p>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-800">Hello! Welcome back 👋</h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Sign in to continue your journey</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Enter your username"
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                        className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        className="w-full h-12 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008f6c]/30 focus:border-[#008f6c] transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer pt-1">
                                <input type="checkbox" className="rounded border-slate-300 accent-[#008f6c]" />
                                <span className="text-sm text-slate-500 font-medium">Remember me</span>
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 rounded-xl bg-[#008f6c] hover:bg-[#007a5c] text-white font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-[#008f6c]/30 disabled:opacity-60 mt-2"
                            >
                                {isLoading
                                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                                }
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="flex items-center gap-3 my-6">
                            <div className="h-px flex-1 bg-slate-100" />
                            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">or</span>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>

                        {/* Leaderboard */}
                        <button
                            onClick={() => navigate('/leaderboard')}
                            className="w-full h-11 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors mb-5"
                        >
                            <Trophy className="w-4 h-4 text-[#008f6c]" /> View Leaderboard
                        </button>

                        <p className="text-center text-sm text-slate-400">
                            Are you staff?{' '}
                            <button
                                onClick={() => navigate('/staff/login')}
                                className="text-[#008f6c] font-black hover:underline"
                            >
                                Staff Portal →
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
