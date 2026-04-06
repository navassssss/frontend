import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Users, Medal, School, ChevronDown, Search, ArrowUpRight, TrendingUp, TrendingDown, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';

interface StudentLeaderboardEntry {
    rank: number;
    name: string;
    username: string;
    class_name: string;
    points: number;
    growth: number;
    stars: number;
}

interface ClassLeaderboardEntry {
    rank: number;
    class_name: string;
    department: string;
    student_count?: number;
    points: number;
    growth: number;
}

export default function PublicLeaderboardPage() {
    const navigate = useNavigate();
    const [leaderboardType, setLeaderboardType] = useState<'students' | 'classes'>('students');
    const [timeFilter, setTimeFilter] = useState<'monthly' | 'overall'>('monthly');
    const [searchQuery, setSearchQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const [studentData, setStudentData] = useState<StudentLeaderboardEntry[]>([]);
    const [classData, setClassData] = useState<ClassLeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setIsLoading(true);
            try {
                if (leaderboardType === 'students') {
                    const response = await api.get(`/leaderboard/students?type=${timeFilter}`);
                    setStudentData(response.data);
                } else {
                    const response = await api.get(`/leaderboard/classes?type=${timeFilter}`);
                    setClassData(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch public leaderboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLeaderboard();
    }, [leaderboardType, timeFilter]);

    const getInitials = (name: string) => name.charAt(0);

    return (
        <div className="min-h-screen bg-[#f8fbfa] font-sans pb-24">
            {/* Header Bar */}
            <header className="p-4 flex items-center justify-between max-w-7xl mx-auto">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-700">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Button variant="ghost" onClick={() => navigate('/student/login')} className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                    Student Login
                </Button>
            </header>

            <main className="max-w-[1000px] mx-auto px-4">

                {/* Title Section */}
                <div className="text-center mt-6 mb-16 animate-in slide-in-from-bottom-4 duration-700">
                    <h4 className="text-[#008f6c] text-[10px] uppercase font-black tracking-[0.3em] mb-4">CIVIC ACADEMY ELITE</h4>
                    <h1 className="text-4xl md:text-[44px] font-black text-slate-800 tracking-tight leading-none mb-4">Scholarly Excellence Leaderboard</h1>
                    <p className="text-[14px] font-medium text-slate-500 max-w-xl mx-auto leading-relaxed">
                        Celebrating the intellectual rigor and civic contribution of our top-tier researchers and students.
                    </p>

                    <div className="flex justify-center mt-8 inline-flex bg-white rounded-full p-1 shadow-sm border border-slate-100 mx-auto">
                        <button
                            onClick={() => setLeaderboardType('students')}
                            className={`px-6 py-2 text-[11px] font-black uppercase tracking-wider rounded-full transition-all ${leaderboardType === 'students' ? 'bg-[#00a67e] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Students
                        </button>
                        <button
                            onClick={() => setLeaderboardType('classes')}
                            className={`px-6 py-2 text-[11px] font-black uppercase tracking-wider rounded-full transition-all ${leaderboardType === 'classes' ? 'bg-[#00a67e] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            Classes
                        </button>
                    </div>

                    <div className="flex justify-center mt-4 gap-2">
                        <button
                            onClick={() => setTimeFilter('monthly')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${timeFilter === 'monthly' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setTimeFilter('overall')}
                            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${timeFilter === 'overall' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
                        >
                            All Time
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="text-center py-20 text-slate-400 font-bold">Loading Rankings...</div>
                ) : (
                    <>
                        {leaderboardType === 'students' && studentData.length >= 3 && (
                            <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-16 relative z-10 px-4">

                                {/* 2nd Place */}
                                <div className="w-full md:w-[260px] flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                                    <div className="relative mb-6 z-20">
                                        <Avatar className="h-[88px] w-[88px] border-[3px] border-white shadow-xl">
                                            <AvatarFallback className="bg-gradient-to-tr from-slate-200 to-slate-100 text-2xl font-black text-slate-500">{getInitials(studentData[1].name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                                            <span className="text-[12px] font-black text-slate-600">2</span>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[2rem] w-full p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-12 -mt-16 relative z-10 border border-white/60">
                                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full mb-3">HONOR SCHOLAR</span>
                                        <h3 className="text-[17px] font-black text-slate-800 mb-1">{studentData[1].name}</h3>
                                        <p className="text-[12px] font-bold text-slate-400 mb-5">{studentData[1].class_name}</p>
                                        <p className="text-2xl font-black text-[#00a67e]">{studentData[1].points.toLocaleString()}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">MERIT POINTS</p>
                                    </div>
                                </div>

                                {/* 1st Place */}
                                <div className="w-full md:w-[320px] flex flex-col items-center -mt-10 md:mt-0 animate-in slide-in-from-bottom-8 duration-700">
                                    <div className="relative mb-6 z-20">
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                                            <Star className="w-10 h-10 fill-yellow-400 text-yellow-500 drop-shadow-md" />
                                        </div>
                                        <Avatar className="h-[120px] w-[120px] border-[4px] border-[#008f6c] shadow-2xl">
                                            <AvatarFallback className="bg-emerald-100 text-4xl font-black text-emerald-800">{getInitials(studentData[0].name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-3 -right-3 w-9 h-9 bg-[#008f6c] rounded-full shadow-lg flex items-center justify-center border-2 border-white">
                                            <span className="text-[14px] font-black text-white">1</span>
                                        </div>
                                    </div>
                                    <div className="bg-[#008f6c] rounded-[2rem] w-full p-8 text-center shadow-[0_20px_40px_rgb(0,143,108,0.2)] pt-14 -mt-20 relative z-10 text-white">
                                        <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 backdrop-blur-sm shadow-sm border border-white/20">🏆 MASTER AMBASSADOR</span>
                                        <h3 className="text-2xl font-black tracking-tight mb-2">{studentData[0].name}</h3>
                                        <p className="text-[13px] font-semibold text-emerald-100 mb-6">{studentData[0].class_name}</p>
                                        <p className="text-[34px] font-black text-white leading-none shadow-sm">{studentData[0].points.toLocaleString()}</p>
                                        <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest mt-2">TOTAL MERIT POINTS</p>
                                    </div>
                                    <Building className="w-6 h-6 text-slate-300 mt-6" />
                                </div>

                                {/* 3rd Place */}
                                <div className="w-full md:w-[260px] flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                                    <div className="relative mb-6 z-20">
                                        <Avatar className="h-[88px] w-[88px] border-[3px] border-white shadow-xl">
                                            <AvatarFallback className="bg-gradient-to-tr from-orange-100 to-orange-50 text-2xl font-black text-orange-400">{getInitials(studentData[2].name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center">
                                            <span className="text-[12px] font-black text-slate-600">3</span>
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-[2rem] w-full p-6 text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] pt-12 -mt-16 relative z-10 border border-white/60">
                                        <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-full mb-3">HONOR SCHOLAR</span>
                                        <h3 className="text-[17px] font-black text-slate-800 mb-1">{studentData[2].name}</h3>
                                        <p className="text-[12px] font-bold text-slate-400 mb-5">{studentData[2].class_name}</p>
                                        <p className="text-2xl font-black text-[#00a67e]">{studentData[2].points.toLocaleString()}</p>
                                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">MERIT POINTS</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Directory Section */}
                        <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Scholars Directory</h2>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Filter by name, department or class..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-slate-200 text-slate-600 text-[13px] font-medium rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:border-[#00a67e] shadow-sm"
                                    />
                                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                                </div>
                                <button className="h-10 px-5 bg-[#008f6c] hover:bg-[#007a5c] text-white rounded-xl text-[12px] font-black whitespace-nowrap shadow-sm flex items-center gap-2 transition-colors">
                                    <Star className="w-3.5 h-3.5 fill-white" />
                                    My Rank
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden mb-12">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th className="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 w-24">RANK</th>
                                            <th className="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">SCHOLAR IDENTITY</th>
                                            <th className="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 hidden md:table-cell">DEPARTMENT</th>
                                            <th className="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 hidden sm:table-cell text-center">GROWTH</th>
                                            <th className="py-5 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 text-right">TOTAL POINTS</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {leaderboardType === 'students' ? (
                                            studentData.slice(3)
                                                .filter(s =>
                                                    searchQuery === '' ||
                                                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    s.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    s.username?.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .slice(0, isExpanded ? undefined : 10)
                                                .map((student) => {
                                                    const isUp = student.growth >= 0;
                                                    return (
                                                        <tr key={student.rank} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="py-4 px-6 text-[14px] font-medium text-slate-300 group-hover:text-slate-400 transition-colors">
                                                                {student.rank.toString().padStart(2, '0')}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-4">
                                                                    <Avatar className="h-10 w-10">
                                                                        <AvatarFallback className="bg-slate-100 text-[13px] font-bold text-slate-600">{getInitials(student.name)}</AvatarFallback>
                                                                    </Avatar>
                                                                    <div>
                                                                        <p className="text-[13px] font-black text-slate-800">{student.name}</p>
                                                                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">Scholar / {student.username}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 hidden md:table-cell">
                                                                <p className="text-[12px] font-bold text-slate-500">{student.class_name}</p>
                                                            </td>
                                                            <td className="py-4 px-6 hidden sm:table-cell text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`text-[11px] font-black flex items-center gap-0.5 ${isUp ? 'text-[#00a67e]' : 'text-slate-400'}`}>
                                                                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                        {isUp ? '+' : ''}{student.growth}%
                                                                    </span>
                                                                    {isUp ? (
                                                                        <svg className="w-10 h-3 mt-1" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M1 10C5 10 8 4 12 4C16 4 19 8 23 8C27 8 30 2 34 2C36 2 38 2 39 4" stroke="#00a67e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                                                                        </svg>
                                                                    ) : (
                                                                        <svg className="w-10 h-3 mt-1" viewBox="0 0 40 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M1 6H39" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                                                                        </svg>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <span className="text-[15px] font-black text-slate-800">{student.points.toLocaleString()}</span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                        ) : (
                                            classData.slice(3)
                                                .filter(cls =>
                                                    searchQuery === '' ||
                                                    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    cls.department?.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .slice(0, isExpanded ? undefined : 10)
                                                .map((cls, idx) => {
                                                    const rankNumber = idx + 4;
                                                    const isUp = cls.growth >= 0;
                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="py-4 px-6 text-[14px] font-medium text-slate-300 group-hover:text-slate-400 transition-colors">
                                                                {rankNumber.toString().padStart(2, '0')}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                                                        <School className="w-5 h-5" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[13px] font-black text-slate-800">{cls.class_name}</p>
                                                                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{cls.student_count || 0} enrolled scholars</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 hidden md:table-cell">
                                                                <p className="text-[12px] font-bold text-slate-500">{cls.department}</p>
                                                            </td>
                                                            <td className="py-4 px-6 hidden sm:table-cell text-center">
                                                                <div className="flex flex-col items-center">
                                                                    <span className={`text-[11px] font-black flex items-center gap-0.5 ${isUp ? 'text-[#00a67e]' : 'text-slate-400'}`}>
                                                                        {isUp ? <ArrowUpRight className="w-3 h-3" /> : null}
                                                                        {isUp ? '+' : ''}{cls.growth}%
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-right">
                                                                <span className="text-[15px] font-black text-slate-800">{cls.points.toLocaleString()}</span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* View All Footer */}
                            {!isExpanded && (
                                <div className="border-t border-slate-100 p-4 text-center bg-slate-50/50">
                                    <button
                                        onClick={() => setIsExpanded(true)}
                                        className="text-[11px] font-black uppercase tracking-widest text-[#008f6c] hover:text-[#00a67e] transition-colors flex items-center justify-center gap-1 mx-auto w-full"
                                    >
                                        View Full LeaderBoard (Top 100) <span className="text-[14px]">›</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
