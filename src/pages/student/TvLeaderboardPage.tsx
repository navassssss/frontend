import { useState, useEffect, useRef } from "react";
import { 
    Trophy, Star, School, Building, Sparkles, Medal, 
    Maximize2, Minimize2, Play, Pause, Award 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import api from '@/lib/api';

interface StudentEntry {
    rank: number;
    name: string;
    username: string;
    class_name: string;
    points: number;
    growth: number;
    stars: number;
}

interface ClassEntry {
    rank: number;
    class_name: string;
    department: string;
    student_count?: number;
    points: number;
    growth: number;
    average: number;
}

interface DepartmentEntry {
    rank: number;
    department_name: string;
    student_count: number;
    points: number;
    growth: number;
}

interface LeaderboardState {
    studentsMonthly: StudentEntry[];
    studentsOverall: StudentEntry[];
    classesMonthly: ClassEntry[];
    classesOverall: ClassEntry[];
    departmentsMonthly: DepartmentEntry[];
    departmentsOverall: DepartmentEntry[];
}

export default function TvLeaderboardPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const slideDuration = 10000; // 10 seconds per slide

    // Active screen data
    const [data, setData] = useState<LeaderboardState>({
        studentsMonthly: [],
        studentsOverall: [],
        classesMonthly: [],
        classesOverall: [],
        departmentsMonthly: [],
        departmentsOverall: []
    });

    // Background standby data
    const [pendingData, setPendingData] = useState<LeaderboardState | null>(null);

    // Initial Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [
                    stMonthly, stOverall,
                    clMonthly, clOverall,
                    dpMonthly, dpOverall
                ] = await Promise.all([
                    api.get('/leaderboard/students?type=monthly'),
                    api.get('/leaderboard/students?type=overall'),
                    api.get('/leaderboard/classes?type=monthly'),
                    api.get('/leaderboard/classes?type=overall'),
                    api.get('/leaderboard/departments?type=monthly'),
                    api.get('/leaderboard/departments?type=overall')
                ]);

                setData({
                    studentsMonthly: stMonthly.data,
                    studentsOverall: stOverall.data,
                    classesMonthly: clMonthly.data,
                    classesOverall: clOverall.data,
                    departmentsMonthly: dpMonthly.data,
                    departmentsOverall: dpOverall.data
                });
            } catch (error) {
                console.error("Failed to load initial leaderboard data:", error);
            }
        };
        fetchInitialData();
    }, []);

    // Slideshow transition interval
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            setCurrentSlide((prev) => {
                const totalSlides = 12;
                const nextSlide = (prev + 1) % totalSlides;

                // When returning to slide 0, run background check and commit pending data if any
                if (nextSlide === 0) {
                    if (pendingData) {
                        setData(pendingData);
                        setPendingData(null);
                    }
                    // Fetch fresh data in the background for the next transition
                    triggerBackgroundFetch();
                }

                return nextSlide;
            });
        }, slideDuration);

        return () => clearInterval(interval);
    }, [isPlaying, pendingData]);

    const triggerBackgroundFetch = async () => {
        try {
            const [
                stMonthly, stOverall,
                clMonthly, clOverall,
                dpMonthly, dpOverall
            ] = await Promise.all([
                api.get('/leaderboard/students?type=monthly'),
                api.get('/leaderboard/students?type=overall'),
                api.get('/leaderboard/classes?type=monthly'),
                api.get('/leaderboard/classes?type=overall'),
                api.get('/leaderboard/departments?type=monthly'),
                api.get('/leaderboard/departments?type=overall')
            ]);

            setPendingData({
                studentsMonthly: stMonthly.data,
                studentsOverall: stOverall.data,
                classesMonthly: clMonthly.data,
                classesOverall: clOverall.data,
                departmentsMonthly: dpMonthly.data,
                departmentsOverall: dpOverall.data
            });
        } catch (e) {
            console.warn("Failed background refresh (silent):", e);
        }
    };

    // Fullscreen Toggle Helper
    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(err => {
                console.error("Error enabling fullscreen:", err);
            });
        } else {
            document.exitFullscreen().then(() => setIsFullscreen(false));
        }
    };

    // Listen to ESC key/native fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    const getInitials = (name: string) => name ? name.charAt(0) : "S";

    // Safe retrieval of Top 3 items
    const getTop3 = (list: any[]) => {
        const res = [...list];
        while (res.length < 3) {
            res.push({
                rank: res.length + 1,
                name: "---",
                class_name: "---",
                class_name_short: "---",
                department_name: "---",
                points: 0,
                stars: 0,
                average: 0
            });
        }
        // Return structured as: [2nd Place, 1st Place, 3rd Place]
        return [res[1], res[0], res[2]];
    };

    return (
        <div 
            ref={containerRef}
            className="h-screen w-screen bg-[#070b15] text-white flex flex-col justify-between overflow-hidden relative select-none font-sans"
        >
            {/* Pulsing subtle ambient backdrop glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />

            {/* Header Area */}
            <div className="z-10 flex items-center justify-between px-10 py-6 border-b border-white/5 bg-[#0a0f1d]/60 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-tr from-[#00a67e] to-[#00f2ad] p-2.5 rounded-2xl shadow-[0_0_20px_rgba(0,166,126,0.3)]">
                        <Trophy className="w-8 h-8 text-slate-900 stroke-[2.5]" />
                    </div>
                    <div>
                        <h4 className="text-[#00f2ad] text-[10px] font-black tracking-[0.3em] uppercase">STUDENT STAR SYSTEM</h4>
                        <h2 className="text-xl font-black text-slate-100 tracking-tight">Excellence Leaderboard</h2>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Active Slide Indicator Dot Ring */}
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                        {[...Array(12)].map((_, i) => (
                            <div 
                                key={i} 
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                    currentSlide === i 
                                        ? "w-8 bg-gradient-to-r from-[#00a67e] to-[#00f2ad]" 
                                        : "w-2.5 bg-white/20"
                                }`} 
                            />
                        ))}
                    </div>

                    {/* Controller Action buttons */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button 
                            onClick={toggleFullscreen}
                            className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Content Slides Viewport */}
            <div className="flex-1 flex items-center justify-center p-8 z-10">
                
                {/* SLIDE 0: Welcome Brand Introduction */}
                {currentSlide === 0 && (
                    <div className="text-center max-w-4xl space-y-8 animate-in fade-in zoom-in duration-700">
                        <div className="inline-flex p-6 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-[2.5rem] shadow-[0_0_60px_rgba(250,204,21,0.2)] animate-bounce">
                            <Sparkles className="w-20 h-20 text-slate-950" />
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-emerald-400 text-lg font-black tracking-[0.4em] uppercase">CIVIC ACADEMY ELITE</h3>
                            <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 leading-tight">
                                Excellence Leaderboard
                            </h1>
                            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
                                Commending academic distinction, exemplary character, active leadership, and student-driven civic action.
                            </p>
                        </div>
                        <div className="pt-6">
                            <span className="px-6 py-2.5 bg-white/5 border border-white/10 text-xs font-black tracking-widest text-[#00f2ad] uppercase rounded-full">
                                TV Slideshow Running
                            </span>
                        </div>
                    </div>
                )}

                {/* SLIDE 1: This Month Top 3 Students */}
                {currentSlide === 1 && (
                    <PodiumView 
                        title="Top Scholars" 
                        subtitle="Current Month Performance"
                        items={getTop3(data.studentsMonthly)}
                        itemType="student"
                    />
                )}

                {/* SLIDE 2: All Time Top 3 Students */}
                {currentSlide === 2 && (
                    <PodiumView 
                        title="Top Scholars" 
                        subtitle="All Time Standings"
                        items={getTop3(data.studentsOverall)}
                        itemType="student"
                    />
                )}

                {/* SLIDE 3: This Month Top 3 Classes */}
                {currentSlide === 3 && (
                    <PodiumView 
                        title="Elite Classes" 
                        subtitle="Monthly Average Points"
                        items={getTop3(data.classesMonthly)}
                        itemType="class"
                    />
                )}

                {/* SLIDE 4: All Time Top 3 Classes */}
                {currentSlide === 4 && (
                    <PodiumView 
                        title="Elite Classes" 
                        subtitle="All Time Average Standings"
                        items={getTop3(data.classesOverall)}
                        itemType="class"
                    />
                )}

                {/* SLIDE 5: This Month Top Departments */}
                {currentSlide === 5 && (
                    <PodiumView 
                        title="Outstanding Departments" 
                        subtitle="Current Month Contributions"
                        items={getTop3(data.departmentsMonthly)}
                        itemType="department"
                    />
                )}

                {/* SLIDE 6: All Time Top Departments */}
                {currentSlide === 6 && (
                    <PodiumView 
                        title="Outstanding Departments" 
                        subtitle="All Time Contributions"
                        items={getTop3(data.departmentsOverall)}
                        itemType="department"
                    />
                )}

                {/* SLIDE 7: This Month Students Top 10 Table */}
                {currentSlide === 7 && (
                    <TableView 
                        title="Top 10 Students" 
                        subtitle="This Month Rankings"
                        headers={["Rank", "Student", "Class", "Star Points"]}
                        rows={data.studentsMonthly.slice(0, 10).map(s => [
                            s.rank.toString().padStart(2, '0'),
                            { name: s.name, sub: `ID / ${s.username}` },
                            s.class_name,
                            s.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 8: All Time Students Top 10 Table */}
                {currentSlide === 8 && (
                    <TableView 
                        title="Top 10 Students" 
                        subtitle="All Time Rankings"
                        headers={["Rank", "Student", "Class", "Star Points"]}
                        rows={data.studentsOverall.slice(0, 10).map(s => [
                            s.rank.toString().padStart(2, '0'),
                            { name: s.name, sub: `ID / ${s.username}` },
                            s.class_name,
                            s.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 9: This Month Classes Top 10 Table */}
                {currentSlide === 9 && (
                    <TableView 
                        title="Classes Standings" 
                        subtitle="Current Month Average Rankings"
                        headers={["Rank", "Class", "Average Score", "Total Star Points"]}
                        rows={data.classesMonthly.slice(0, 10).map(c => [
                            c.rank.toString().padStart(2, '0'),
                            { name: c.class_name, sub: `${c.student_count || 0} enrolled students` },
                            `${c.average?.toFixed(2)} pts/student`,
                            c.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 10: All Time Classes Top 10 Table */}
                {currentSlide === 10 && (
                    <TableView 
                        title="Classes Standings" 
                        subtitle="All Time Average Rankings"
                        headers={["Rank", "Class", "Average Score", "Total Star Points"]}
                        rows={data.classesOverall.slice(0, 10).map(c => [
                            c.rank.toString().padStart(2, '0'),
                            { name: c.class_name, sub: `${c.student_count || 0} enrolled students` },
                            `${c.average?.toFixed(2)} pts/student`,
                            c.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 11: Departments overall Table */}
                {currentSlide === 11 && (
                    <TableView 
                        title="Departments Performance" 
                        subtitle="Academic Division Scores"
                        headers={["Rank", "Department", "Students Enrolled", "Total Contributed Points"]}
                        rows={data.departmentsOverall.slice(0, 10).map(d => [
                            d.rank.toString().padStart(2, '0'),
                            { name: d.department_name, sub: "Academic Department" },
                            d.student_count.toString(),
                            d.points.toLocaleString()
                        ])}
                    />
                )}

            </div>

            {/* Bottom Status / Footer info */}
            <div className="z-10 flex items-center justify-between px-10 py-5 bg-[#050811]/90 border-t border-white/5 text-xs text-slate-500">
                <p>Designed for large ambient displays. Press fullscreen (⛶) for best results.</p>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Live Synchronized
                    </span>
                    <span>© {new Date().getFullYear()} Civic Academy Elite</span>
                </div>
            </div>
        </div>
    );
}

/* 3D-Like Podium Render View */
function PodiumView({ title, subtitle, items, itemType }: { 
    title: string; 
    subtitle: string; 
    items: any[]; 
    itemType: 'student' | 'class' | 'department';
}) {
    // items should be [2nd Place, 1st Place, 3rd Place]
    const second = items[0];
    const first = items[1];
    const third = items[2];

    const getIcon = () => {
        if (itemType === 'class') return <School className="w-8 h-8 text-emerald-300" />;
        if (itemType === 'department') return <Building className="w-8 h-8 text-blue-300" />;
        return null;
    };

    return (
        <div className="w-full max-w-6xl flex flex-col items-center space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-emerald-400 text-sm font-black tracking-widest uppercase">{title}</h2>
                <h1 className="text-4xl font-black text-white">{subtitle}</h1>
            </div>

            <div className="w-full flex flex-col md:flex-row items-end justify-center gap-8 pt-8">
                {/* 2nd Place */}
                <div className="w-full md:w-[280px] flex flex-col items-center order-2 md:order-1">
                    <div className="relative mb-4">
                        {itemType === 'student' ? (
                            <Avatar className="h-[96px] w-[96px] border-4 border-slate-400 shadow-2xl">
                                <AvatarFallback className="bg-gradient-to-tr from-slate-700 to-slate-500 text-2xl font-black text-white">
                                    {second.name ? second.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {getIcon()}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-400 rounded-full border-2 border-[#070b15] shadow-md flex items-center justify-center text-xs font-black text-slate-950">
                            2
                        </div>
                    </div>
                    <div className="w-full text-center space-y-1 mb-3">
                        <h3 className="text-lg font-black truncate px-2 text-slate-100">{second.name || second.class_name || second.department_name}</h3>
                        <p className="text-xs text-slate-400 font-bold">{second.class_name || second.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-slate-800/40 border-t border-slate-600/50 rounded-t-[1.5rem] py-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                        <p className="text-3xl font-black text-slate-300">
                            {itemType === 'class' ? `${second.average?.toFixed(1)}` : second.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                        </p>
                    </div>
                </div>

                {/* 1st Place (Center and Elevated) */}
                <div className="w-full md:w-[320px] flex flex-col items-center order-1 md:order-2 -mt-8 relative z-20">
                    <div className="absolute top-[-30px] animate-bounce">
                        <Award className="w-10 h-10 text-yellow-400 fill-yellow-400/20" />
                    </div>
                    <div className="relative mb-4">
                        {itemType === 'student' ? (
                            <Avatar className="h-[120px] w-[120px] border-4 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.2)]">
                                <AvatarFallback className="bg-gradient-to-tr from-yellow-500 to-amber-300 text-3xl font-black text-slate-900">
                                    {first.name ? first.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-400/20 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-center">
                                {getIcon()}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 rounded-full border-4 border-[#070b15] shadow-md flex items-center justify-center text-sm font-black text-slate-950">
                            1
                        </div>
                    </div>
                    <div className="w-full text-center space-y-1 mb-4">
                        <h3 className="text-xl font-black truncate px-2 text-yellow-400">{first.name || first.class_name || first.department_name}</h3>
                        <p className="text-xs text-slate-400 font-bold">{first.class_name || first.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-gradient-to-b from-yellow-950/20 to-transparent border-t-2 border-yellow-500/50 rounded-t-[2rem] py-12 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <p className="text-4xl font-black text-yellow-400">
                            {itemType === 'class' ? `${first.average?.toFixed(1)}` : first.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-black text-yellow-500/80 uppercase tracking-widest mt-1">
                            {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                        </p>
                        {itemType === 'student' && first.stars > 0 && (
                            <div className="flex items-center justify-center gap-0.5 mt-2">
                                {[...Array(Math.min(first.stars, 5))].map((_, i) => (
                                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                ))}
                                {first.stars > 5 && (
                                    <span className="text-[10px] font-black text-yellow-400 ml-1">+{first.stars - 5}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="w-full md:w-[280px] flex flex-col items-center order-3">
                    <div className="relative mb-4">
                        {itemType === 'student' ? (
                            <Avatar className="h-[96px] w-[96px] border-4 border-amber-600/80 shadow-2xl">
                                <AvatarFallback className="bg-gradient-to-tr from-amber-800 to-amber-600 text-2xl font-black text-white">
                                    {third.name ? third.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {getIcon()}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-600 rounded-full border-2 border-[#070b15] shadow-md flex items-center justify-center text-xs font-black text-slate-950">
                            3
                        </div>
                    </div>
                    <div className="w-full text-center space-y-1 mb-3">
                        <h3 className="text-lg font-black truncate px-2 text-slate-200">{third.name || third.class_name || third.department_name}</h3>
                        <p className="text-xs text-slate-400 font-bold">{third.class_name || third.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-slate-800/30 border-t border-slate-700/30 rounded-t-[1.5rem] py-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                        <p className="text-3xl font-black text-slate-300">
                            {itemType === 'class' ? `${third.average?.toFixed(1)}` : third.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* Elegant Table Render View */
function TableView({ title, subtitle, headers, rows }: {
    title: string;
    subtitle: string;
    headers: string[];
    rows: any[][];
}) {
    return (
        <div className="w-full max-w-5xl flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-2">
                <h2 className="text-[#00f2ad] text-sm font-black tracking-widest uppercase">{title}</h2>
                <h1 className="text-4xl font-black text-white">{subtitle}</h1>
            </div>

            <div className="bg-[#0b1222]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                <table className="w-full border-collapse text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            {headers.map((h, i) => (
                                <th 
                                    key={i} 
                                    className={`py-5 px-8 text-xs font-black uppercase tracking-wider text-slate-400 ${
                                        i === headers.length - 1 ? "text-right" : ""
                                    }`}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {rows.length === 0 ? (
                            <tr>
                                <td colSpan={headers.length} className="py-12 text-center text-slate-500 font-bold text-sm">
                                    No records available
                                </td>
                            </tr>
                        ) : (
                            rows.map((row, rowIndex) => {
                                const isTopThree = rowIndex < 3;
                                const rankColors = [
                                    "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                                    "text-slate-300 bg-slate-300/10 border-slate-300/20",
                                    "text-amber-600 bg-amber-600/10 border-amber-600/20"
                                ];

                                return (
                                    <tr 
                                        key={rowIndex} 
                                        className={`hover:bg-white/[0.02] transition-colors ${
                                            rowIndex === 0 ? "bg-yellow-400/[0.01]" : ""
                                        }`}
                                    >
                                        {row.map((cell, cellIndex) => {
                                            // 1. Rank Column formatting
                                            if (cellIndex === 0) {
                                                return (
                                                    <td key={cellIndex} className="py-4.5 px-8 font-black text-base">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs ${
                                                            isTopThree ? rankColors[rowIndex] : "text-slate-500 bg-white/5 border-white/5"
                                                        }`}>
                                                            {cell}
                                                        </span>
                                                    </td>
                                                );
                                            }

                                            // 2. Complex name object formatting
                                            if (typeof cell === 'object' && cell !== null) {
                                                return (
                                                    <td key={cellIndex} className="py-4.5 px-8">
                                                        <div>
                                                            <p className={`font-black text-sm ${
                                                                rowIndex === 0 ? "text-yellow-400" : "text-slate-200"
                                                            }`}>
                                                                {cell.name}
                                                            </p>
                                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{cell.sub}</p>
                                                        </div>
                                                    </td>
                                                );
                                            }

                                            // 3. Regular Column formatting
                                            return (
                                                <td 
                                                    key={cellIndex} 
                                                    className={`py-4.5 px-8 text-sm font-bold ${
                                                        cellIndex === headers.length - 1 
                                                            ? "text-right text-[#00f2ad] text-base font-black" 
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {cell}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
