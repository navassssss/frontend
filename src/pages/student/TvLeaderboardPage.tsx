import { useState, useEffect, useRef } from "react";
import {
    Trophy, Star, School, Building, Sparkles,
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
    const [displaySlide, setDisplaySlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
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

    // Helper to filter out zero-point/zero-average entries
    const filterData = (raw: LeaderboardState): LeaderboardState => {
        return {
            studentsMonthly: (raw.studentsMonthly || []).filter(s => s.points > 0),
            studentsOverall: (raw.studentsOverall || []).filter(s => s.points > 0),
            classesMonthly: (raw.classesMonthly || []).filter(c => c.points > 0 || c.average > 0),
            classesOverall: (raw.classesOverall || []).filter(c => c.points > 0 || c.average > 0),
            departmentsMonthly: (raw.departmentsMonthly || []).filter(d => d.points > 0),
            departmentsOverall: (raw.departmentsOverall || []).filter(d => d.points > 0),
        };
    };

    // Helper to calculate the next active slide based on current data
    const getNextSlide = (current: number, dataState: LeaderboardState): number => {
        let next = current;
        const totalSlides = 11;
        
        for (let i = 0; i < totalSlides; i++) {
            next = (next + 1) % totalSlides;
            
            if (next === 0) return 0; // Welcome slide is always active
            if (next === 1 && dataState.studentsMonthly.length > 0) return 1;
            if (next === 2 && dataState.studentsOverall.length > 0) return 2;
            if (next === 3 && dataState.classesMonthly.length > 0) return 3;
            if (next === 4 && dataState.classesOverall.length > 0) return 4;
            if (next === 5 && dataState.departmentsMonthly.length > 0) return 5;
            if (next === 6 && dataState.departmentsOverall.length > 0) return 6;
            if (next === 7 && dataState.studentsMonthly.length > 0) return 7;
            if (next === 8 && dataState.studentsOverall.length > 0) return 8;
            if (next === 9 && dataState.classesMonthly.length > 0) return 9;
            if (next === 10 && dataState.classesOverall.length > 0) return 10;
        }
        
        return 0; // Fallback
    };

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

                setData(filterData({
                    studentsMonthly: stMonthly.data,
                    studentsOverall: stOverall.data,
                    classesMonthly: clMonthly.data,
                    classesOverall: clOverall.data,
                    departmentsMonthly: dpMonthly.data,
                    departmentsOverall: dpOverall.data
                }));
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
            // 1. Trigger transition out (fade out)
            setIsTransitioning(true);

            // 2. Wait for fade out animation (500ms) to update slide content and fade back in
            setTimeout(() => {
                setCurrentSlide((prev) => {
                    const nextSlide = getNextSlide(prev, data);

                    // When returning to slide 0, run background check and commit pending data if any
                    if (nextSlide === 0) {
                        if (pendingData) {
                            setData(pendingData);
                            setPendingData(null);
                        }
                        // Fetch fresh data in the background for the next transition
                        triggerBackgroundFetch();
                    }

                    setDisplaySlide(nextSlide);
                    return nextSlide;
                });
                setIsTransitioning(false);
            }, 500);
        }, slideDuration);

        return () => clearInterval(interval);
    }, [isPlaying, pendingData, data]);

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

            setPendingData(filterData({
                studentsMonthly: stMonthly.data,
                studentsOverall: stOverall.data,
                classesMonthly: clMonthly.data,
                classesOverall: clOverall.data,
                departmentsMonthly: dpMonthly.data,
                departmentsOverall: dpOverall.data
            }));
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

    return (
        <div
            ref={containerRef}
            className="h-screen w-screen bg-[#070b15] text-white flex flex-col justify-between overflow-hidden relative select-none font-sans"
        >
            {/* Pulsing subtle ambient backdrop glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-blue-500/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />

            {/* Header Area */}
            <div className="z-10 flex items-center justify-between px-12 py-8 border-b border-white/5 bg-[#0a0f1d]/60 backdrop-blur-md">
                <div className="flex items-center gap-5">
                    <div className="bg-gradient-to-tr from-[#00a67e] to-[#00f2ad] p-3 rounded-2xl shadow-[0_0_20px_rgba(0,166,126,0.3)]">
                        <Trophy className="w-10 h-10 text-slate-950 stroke-[2.5]" />
                    </div>
                    <div>
                        <h4 className="text-[#00f2ad] text-xs font-black tracking-[0.3em] uppercase">STUDENT STAR SYSTEM</h4>
                        <h2 className="text-2xl font-black text-slate-100 tracking-tight">Excellence Leaderboard</h2>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    {/* Active Slide Indicator Dot Ring */}
                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
                        {[...Array(11)].map((_, i) => {
                            const isActiveState = 
                                i === 0 ||
                                (i === 1 && data.studentsMonthly.length > 0) ||
                                (i === 2 && data.studentsOverall.length > 0) ||
                                (i === 3 && data.classesMonthly.length > 0) ||
                                (i === 4 && data.classesOverall.length > 0) ||
                                (i === 5 && data.departmentsMonthly.length > 0) ||
                                (i === 6 && data.departmentsOverall.length > 0) ||
                                (i === 7 && data.studentsMonthly.length > 0) ||
                                (i === 8 && data.studentsOverall.length > 0) ||
                                (i === 9 && data.classesMonthly.length > 0) ||
                                (i === 10 && data.classesOverall.length > 0);

                            if (!isActiveState) return null;

                            return (
                                <div
                                    key={i}
                                    className={`h-3.5 rounded-full transition-all duration-500 ${displaySlide === i
                                        ? "w-10 bg-gradient-to-r from-[#00a67e] to-[#00f2ad]"
                                        : "w-3.5 bg-white/20"
                                        }`}
                                />
                            );
                        })}
                    </div>

                    {/* Controller Action buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={toggleFullscreen}
                            className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="w-6 h-6" /> : <Maximize2 className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Dynamic Content Slides Viewport */}
            <div className={`flex-1 flex items-center justify-center p-12 z-10 transition-all duration-500 ease-in-out transform ${
                isTransitioning ? "opacity-0 scale-98 translate-y-4" : "opacity-100 scale-100 translate-y-0"
            }`}>

                {/* SLIDE 0: Welcome Brand Introduction */}
                {displaySlide === 0 && (
                    <div className="text-center max-w-5xl space-y-10 animate-in fade-in zoom-in duration-700">
                        <div className="inline-flex p-8 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-[2.5rem] shadow-[0_0_60px_rgba(250,204,21,0.2)] animate-bounce">
                            <Sparkles className="w-24 h-24 text-slate-950" />
                        </div>
                        <div className="space-y-6">
                            <h3 className="text-emerald-400 text-2xl font-black tracking-[0.4em] uppercase">STUDENT STAR SYSTEM</h3>
                            <h1 className="text-7xl md:text-9xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 leading-tight">
                                Excellence Leaderboard
                            </h1>
                            <p className="text-2xl text-slate-400 font-medium max-w-3xl mx-auto leading-relaxed">
                                Recognizing student achievement in academics, co-curricular activities, leadership, creativity, and personal growth
                            </p>
                        </div>
                        <div className="pt-8">
                            <span className="px-8 py-3.5 bg-white/5 border border-white/10 text-sm font-black tracking-widest text-[#00f2ad] uppercase rounded-full">
                                TV Slideshow Running
                            </span>
                        </div>
                    </div>
                )}

                {/* SLIDE 1: This Month Top 3 Students */}
                {displaySlide === 1 && (
                    <PodiumView
                        title="Top performing students"
                        subtitle="Current Month"
                        items={data.studentsMonthly.slice(0, 3)}
                        itemType="student"
                    />
                )}

                {/* SLIDE 2: All Time Top 3 Students */}
                {displaySlide === 2 && (
                    <PodiumView
                        title="Top performing students"
                        subtitle="All Time"
                        items={data.studentsOverall.slice(0, 3)}
                        itemType="student"
                    />
                )}

                {/* SLIDE 3: This Month Top 3 Classes */}
                {displaySlide === 3 && (
                    <PodiumView
                        title="Top performing Classes"
                        subtitle="Current Month"
                        items={data.classesMonthly.slice(0, 3)}
                        itemType="class"
                    />
                )}

                {/* SLIDE 4: All Time Top 3 Classes */}
                {displaySlide === 4 && (
                    <PodiumView
                        title="Top performing Classes"
                        subtitle="All Time"
                        items={data.classesOverall.slice(0, 3)}
                        itemType="class"
                    />
                )}

                {/* SLIDE 5: This Month Top Departments */}
                {displaySlide === 5 && (
                    <TableView
                        title="Top performing Departments"
                        subtitle="Current Month"
                        headers={["Rank", "Department", "Students Enrolled", "Total Contributed Points"]}
                        rows={data.departmentsMonthly.slice(0, 10).map(d => [
                            d.rank.toString().padStart(2, '0'),
                            { name: d.department_name, sub: "Academic Department" },
                            d.student_count.toString(),
                            d.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 6: All Time Top Departments */}
                {displaySlide === 6 && (
                    <TableView
                        title="Top performing Departments"
                        subtitle="All Time"
                        headers={["Rank", "Department", "Students Enrolled", "Total Contributed Points"]}
                        rows={data.departmentsOverall.slice(0, 10).map(d => [
                            d.rank.toString().padStart(2, '0'),
                            { name: d.department_name, sub: "Academic Department" },
                            d.student_count.toString(),
                            d.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 7: This Month Students Top 10 Table */}
                {displaySlide === 7 && (
                    <TableView
                        title="Top performing students"
                        subtitle="Current Month"
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
                {displaySlide === 8 && (
                    <TableView
                        title="Top performing students"
                        subtitle="All Time"
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
                {displaySlide === 9 && (
                    <TableView
                        title="Top performing Classes"
                        subtitle="Current Month"
                        headers={["Rank", "Class", "Average Score", "Total Star Points"]}
                        rows={data.classesMonthly.slice(0, 10).map(c => [
                            c.rank.toString().padStart(2, '0'),
                            { name: c.class_name, sub: `${c.student_count || 0} enrolled students` },
                            c.average?.toFixed(2),
                            c.points.toLocaleString()
                        ])}
                    />
                )}

                {/* SLIDE 10: All Time Classes Top 10 Table */}
                {displaySlide === 10 && (
                    <TableView
                        title="Top performing Classes"
                        subtitle="All Time"
                        headers={["Rank", "Class", "Average Score", "Total Star Points"]}
                        rows={data.classesOverall.slice(0, 10).map(c => [
                            c.rank.toString().padStart(2, '0'),
                            { name: c.class_name, sub: `${c.student_count || 0} enrolled students` },
                            c.average?.toFixed(2),
                            c.points.toLocaleString()
                        ])}
                    />
                )}

            </div>

            {/* Bottom Status / Footer info */}
            <div className="z-10 flex items-center justify-between px-12 py-6 bg-[#050811]/90 border-t border-white/5 text-sm text-slate-500">
                <p>Designed for large ambient displays. Press fullscreen (⛶) for best results.</p>
                <div className="flex items-center gap-5">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                        Live Synchronized
                    </span>
                    <span>© {new Date().getFullYear()} Student Star System</span>
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
    const getIcon = (item: any) => {
        if (itemType === 'class') return <School className="w-12 h-12 text-emerald-300" />;
        if (itemType === 'department') return <Building className="w-12 h-12 text-blue-300" />;
        return null;
    };

    // Case 0: Empty podium (0 items qualify)
    if (items.length === 0) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-16 text-center bg-[#0b1222]/80 border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="p-6 bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full border border-emerald-500/20 text-[#00f2ad] animate-pulse">
                    <Sparkles className="w-16 h-16" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-black text-white">Leaderboard Starting Fresh</h2>
                    <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
                        No active Star Points recorded for this period yet. Earn the first points to claim the top spot!
                    </p>
                </div>
            </div>
        );
    }

    // Case 1: Exactly 1 item qualifies (Solo)
    if (items.length === 1) {
        const first = items[0];
        return (
            <div className="w-full max-w-7xl flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="text-center space-y-4">
                    <h2 className="text-[#00f2ad] text-2xl font-black tracking-[0.2em] uppercase">{title}</h2>
                    <h1 className="text-6xl font-black text-white">{subtitle}</h1>
                </div>

                <div className="w-full flex items-end justify-center pt-12">
                    <div className="w-full md:w-[380px] flex flex-col items-center relative z-20">
                        <div className="absolute top-[-40px] animate-bounce">
                            <Award className="w-14 h-14 text-yellow-400 fill-yellow-400/20" />
                        </div>
                        <div className="relative mb-6">
                            {itemType === 'student' ? (
                                <Avatar className="h-[180px] w-[180px] border-4 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.25)]">
                                    <AvatarFallback className="bg-gradient-to-tr from-yellow-500 to-amber-300 text-5xl font-black text-slate-900">
                                        {first.name ? first.name.charAt(0) : "S"}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-400/20 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-center">
                                    {getIcon(first)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full border-4 border-[#070b15] shadow-md flex items-center justify-center text-base font-black text-slate-950">
                                1
                            </div>
                        </div>
                        <div className="w-full text-center space-y-2 mb-5">
                            <h3 className="text-3xl font-black truncate px-2 text-yellow-400">{first.name || first.class_name || first.department_name}</h3>
                            <p className="text-sm text-slate-400 font-bold">{first.class_name || first.department || ""}</p>
                        </div>
                        <div className="w-full bg-gradient-to-b from-yellow-950/20 to-transparent border-t-2 border-yellow-500/50 rounded-t-[2.5rem] py-16 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
                            <p className="text-5xl font-black text-yellow-400">
                                {itemType === 'class' ? `${first.average?.toFixed(1)}` : first.points.toLocaleString()}
                            </p>
                            <p className="text-xs font-black text-yellow-500/80 uppercase tracking-widest mt-2">
                                {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                            </p>
                            {itemType === 'student' && first.stars > 0 && (
                                <div className="flex items-center justify-center gap-1 mt-3">
                                    {[...Array(Math.min(first.stars, 5))].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    {first.stars > 5 && (
                                        <span className="text-xs font-black text-yellow-400 ml-1.5">+{first.stars - 5}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Case 2: Exactly 2 items qualify (Duo)
    if (items.length === 2) {
        const first = items[0];
        const second = items[1];
        return (
            <div className="w-full max-w-7xl flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="text-center space-y-4">
                    <h2 className="text-[#00f2ad] text-2xl font-black tracking-[0.2em] uppercase">{title}</h2>
                    <h1 className="text-6xl font-black text-white">{subtitle}</h1>
                </div>

                <div className="w-full flex flex-col md:flex-row items-end justify-center gap-12 pt-12">
                    {/* 2nd Place */}
                    <div className="w-full md:w-[320px] flex flex-col items-center order-2 md:order-1">
                        <div className="relative mb-6">
                            {itemType === 'student' ? (
                                <Avatar className="h-[150px] w-[150px] border-4 border-slate-400 shadow-2xl">
                                    <AvatarFallback className="bg-gradient-to-tr from-slate-700 to-slate-500 text-4xl font-black text-white">
                                        {second.name ? second.name.charAt(0) : "S"}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                    {getIcon(second)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-400 rounded-full border-2 border-[#070b15] shadow-md flex items-center justify-center text-sm font-black text-slate-950">
                                2
                            </div>
                        </div>
                        <div className="w-full text-center space-y-2 mb-4">
                            <h3 className="text-2xl font-black truncate px-2 text-slate-100">{second.name || second.class_name || second.department_name}</h3>
                            <p className="text-sm text-slate-400 font-bold">{second.class_name || second.department || ""}</p>
                        </div>
                        <div className="w-full bg-slate-800/40 border-t border-slate-600/50 rounded-t-[2rem] py-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                            <p className="text-4xl font-black text-slate-300">
                                {itemType === 'class' ? `${second.average?.toFixed(1)}` : second.points.toLocaleString()}
                            </p>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
                                {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                            </p>
                        </div>
                    </div>

                    {/* 1st Place */}
                    <div className="w-full md:w-[360px] flex flex-col items-center order-1 md:order-2 -mt-12 relative z-20">
                        <div className="absolute top-[-40px] animate-bounce">
                            <Award className="w-14 h-14 text-yellow-400 fill-yellow-400/20" />
                        </div>
                        <div className="relative mb-6">
                            {itemType === 'student' ? (
                                <Avatar className="h-[180px] w-[180px] border-4 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.25)]">
                                    <AvatarFallback className="bg-gradient-to-tr from-yellow-500 to-amber-300 text-5xl font-black text-slate-900">
                                        {first.name ? first.name.charAt(0) : "S"}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-400/20 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-center">
                                    {getIcon(first)}
                                </div>
                            )}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full border-4 border-[#070b15] shadow-md flex items-center justify-center text-base font-black text-slate-950">
                                1
                            </div>
                        </div>
                        <div className="w-full text-center space-y-2 mb-5">
                            <h3 className="text-3xl font-black truncate px-2 text-yellow-400">{first.name || first.class_name || first.department_name}</h3>
                            <p className="text-sm text-slate-400 font-bold">{first.class_name || first.department || ""}</p>
                        </div>
                        <div className="w-full bg-gradient-to-b from-yellow-950/20 to-transparent border-t-2 border-yellow-500/50 rounded-t-[2.5rem] py-16 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
                            <p className="text-5xl font-black text-yellow-400">
                                {itemType === 'class' ? `${first.average?.toFixed(1)}` : first.points.toLocaleString()}
                            </p>
                            <p className="text-xs font-black text-yellow-500/80 uppercase tracking-widest mt-2">
                                {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                            </p>
                            {itemType === 'student' && first.stars > 0 && (
                                <div className="flex items-center justify-center gap-1 mt-3">
                                    {[...Array(Math.min(first.stars, 5))].map((_, i) => (
                                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                    {first.stars > 5 && (
                                        <span className="text-xs font-black text-yellow-400 ml-1.5">+{first.stars - 5}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Case 3: Standard 3+ items qualify (Trio)
    const first = items[0];
    const second = items[1];
    const third = items[2];

    return (
        <div className="w-full max-w-7xl flex flex-col items-center space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-[#00f2ad] text-2xl font-black tracking-[0.2em] uppercase">{title}</h2>
                <h1 className="text-6xl font-black text-white">{subtitle}</h1>
            </div>

            <div className="w-full flex flex-col md:flex-row items-end justify-center gap-12 pt-12">
                {/* 2nd Place */}
                <div className="w-full md:w-[320px] flex flex-col items-center order-2 md:order-1">
                    <div className="relative mb-6">
                        {itemType === 'student' ? (
                            <Avatar className="h-[150px] w-[150px] border-4 border-slate-400 shadow-2xl">
                                <AvatarFallback className="bg-gradient-to-tr from-slate-700 to-slate-500 text-4xl font-black text-white">
                                    {second.name ? second.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {getIcon(second)}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-400 rounded-full border-2 border-[#070b15] shadow-md flex items-center justify-center text-sm font-black text-slate-950">
                            2
                        </div>
                    </div>
                    <div className="w-full text-center space-y-2 mb-4">
                        <h3 className="text-2xl font-black truncate px-2 text-slate-100">{second.name || second.class_name || second.department_name}</h3>
                        <p className="text-sm text-slate-400 font-bold">{second.class_name || second.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-slate-800/40 border-t border-slate-600/50 rounded-t-[2rem] py-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                        <p className="text-4xl font-black text-slate-300">
                            {itemType === 'class' ? `${second.average?.toFixed(1)}` : second.points.toLocaleString()}
                        </p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
                            {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                        </p>
                    </div>
                </div>

                {/* 1st Place (Center and Elevated) */}
                <div className="w-full md:w-[360px] flex flex-col items-center order-1 md:order-2 -mt-12 relative z-20">
                    <div className="absolute top-[-40px] animate-bounce">
                        <Award className="w-14 h-14 text-yellow-400 fill-yellow-400/20" />
                    </div>
                    <div className="relative mb-6">
                        {itemType === 'student' ? (
                            <Avatar className="h-[180px] w-[180px] border-4 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.25)]">
                                <AvatarFallback className="bg-gradient-to-tr from-yellow-500 to-amber-300 text-5xl font-black text-slate-900">
                                    {first.name ? first.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-yellow-500/20 to-amber-400/20 border-2 border-yellow-400/50 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-center">
                                {getIcon(first)}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full border-4 border-[#070b15] shadow-md flex items-center justify-center text-base font-black text-slate-950">
                            1
                        </div>
                    </div>
                    <div className="w-full text-center space-y-2 mb-5">
                        <h3 className="text-3xl font-black truncate px-2 text-yellow-400">{first.name || first.class_name || first.department_name}</h3>
                        <p className="text-sm text-slate-400 font-bold">{first.class_name || first.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-gradient-to-b from-yellow-950/20 to-transparent border-t-2 border-yellow-500/50 rounded-t-[2.5rem] py-16 text-center shadow-[0_25px_60px_rgba(0,0,0,0.5)] backdrop-blur-md">
                        <p className="text-5xl font-black text-yellow-400">
                            {itemType === 'class' ? `${first.average?.toFixed(1)}` : first.points.toLocaleString()}
                        </p>
                        <p className="text-xs font-black text-yellow-500/80 uppercase tracking-widest mt-2">
                            {itemType === 'class' ? "Avg Star Points" : "Total Star Points"}
                        </p>
                        {itemType === 'student' && first.stars > 0 && (
                            <div className="flex items-center justify-center gap-1 mt-3">
                                {[...Array(Math.min(first.stars, 5))].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                                {first.stars > 5 && (
                                    <span className="text-xs font-black text-yellow-400 ml-1.5">+{first.stars - 5}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="w-full md:w-[320px] flex flex-col items-center order-3">
                    <div className="relative mb-6">
                        {itemType === 'student' ? (
                            <Avatar className="h-[150px] w-[150px] border-4 border-amber-600/80 shadow-2xl">
                                <AvatarFallback className="bg-gradient-to-tr from-amber-800 to-amber-600 text-4xl font-black text-white">
                                    {third.name ? third.name.charAt(0) : "S"}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className="w-28 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                                {getIcon(third)}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-600 rounded-full border-2 border-[#070b15] shadow-md flex items-center justify-center text-sm font-black text-slate-950">
                            3
                        </div>
                    </div>
                    <div className="w-full text-center space-y-2 mb-4">
                        <h3 className="text-2xl font-black truncate px-2 text-slate-200">{third.name || third.class_name || third.department_name}</h3>
                        <p className="text-sm text-slate-400 font-bold">{third.class_name || third.department || ""}</p>
                    </div>
                    {/* 3D Box block */}
                    <div className="w-full bg-slate-800/30 border-t border-slate-700/30 rounded-t-[2rem] py-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] backdrop-blur-md">
                        <p className="text-4xl font-black text-slate-300">
                            {itemType === 'class' ? `${third.average?.toFixed(1)}` : third.points.toLocaleString()}
                        </p>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">
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
    // If no rows have active points/stars
    if (rows.length === 0) {
        return (
            <div className="w-full max-w-4xl flex flex-col items-center justify-center p-16 text-center bg-[#0b1222]/80 border border-white/5 rounded-[2.5rem] shadow-2xl backdrop-blur-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <div className="p-6 bg-gradient-to-tr from-emerald-500/10 to-teal-500/5 rounded-full border border-emerald-500/20 text-[#00f2ad] animate-pulse">
                    <Sparkles className="w-16 h-16" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-4xl font-black text-white">Leaderboard Starting Fresh</h2>
                    <p className="text-xl text-slate-400 max-w-lg mx-auto leading-relaxed">
                        No active entries recorded for this period yet.
                    </p>
                </div>
            </div>
        );
    }

    // Widescreen Split-Table logic:
    // If there are 6 or more items, split them to utilize width on 16:9 TVs.
    // Otherwise, render a single centered table.
    const isSplit = rows.length >= 6;
    const leftRows = isSplit ? rows.slice(0, 5) : rows;
    const rightRows = isSplit ? rows.slice(5, 10) : [];

    const renderTableSegment = (segmentRows: any[][]) => (
        <div className="bg-[#0b1222]/80 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden flex-1 w-full">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-white/5 bg-white/5">
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className={`py-7 px-10 text-base font-black uppercase tracking-wider text-slate-400 ${i === headers.length - 1 ? "text-right" : ""
                                    }`}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {segmentRows.map((row, rowIndex) => {
                        // Safely determine true overall rank from the first cell value
                        const rankVal = parseInt(row[0]) || (rowIndex + 1);
                        const isTopThree = rankVal <= 3;
                        const rankColors = [
                            "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
                            "text-slate-300 bg-slate-300/10 border-slate-300/20",
                            "text-amber-600 bg-amber-600/10 border-amber-600/20"
                        ];
                        const rankColorClass = isTopThree ? rankColors[rankVal - 1] : "text-slate-500 bg-white/5 border-white/5";

                        return (
                            <tr
                                key={rowIndex}
                                className={`hover:bg-white/[0.02] transition-colors ${rankVal === 1 ? "bg-yellow-400/[0.01]" : ""
                                    }`}
                            >
                                {row.map((cell, cellIndex) => {
                                    // Rank Column formatting
                                    if (cellIndex === 0) {
                                        return (
                                            <td key={cellIndex} className="py-6 px-10 font-black text-xl">
                                                <span className={`inline-flex items-center justify-center w-12 h-12 rounded-full border text-lg ${rankColorClass}`}>
                                                    {cell}
                                                </span>
                                            </td>
                                        );
                                    }

                                    // Complex Name Column formatting
                                    if (typeof cell === 'object' && cell !== null) {
                                        return (
                                            <td key={cellIndex} className="py-6 px-10">
                                                <div>
                                                    <p className={`font-black text-xl ${rankVal === 1 ? "text-yellow-400" : "text-slate-200"
                                                        }`}>
                                                        {cell.name}
                                                    </p>
                                                    <p className="text-sm text-slate-500 font-medium mt-1">{cell.sub}</p>
                                                </div>
                                            </td>
                                        );
                                    }

                                    // Regular text/numeric columns
                                    return (
                                        <td
                                            key={cellIndex}
                                            className={`py-6 px-10 text-lg font-bold ${cellIndex === headers.length - 1
                                                ? "text-right text-[#00f2ad] text-2xl font-black"
                                                : "text-slate-400"
                                                }`}
                                        >
                                            {cell}
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="w-full max-w-7xl flex flex-col space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="text-center space-y-4">
                <h2 className="text-[#00f2ad] text-2xl font-black tracking-widest uppercase">{title}</h2>
                <h1 className="text-6xl font-black text-white">{subtitle}</h1>
            </div>

            {isSplit ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                    {renderTableSegment(leftRows)}
                    {renderTableSegment(rightRows)}
                </div>
            ) : (
                <div className="w-full flex justify-center">
                    {renderTableSegment(leftRows)}
                </div>
            )}
        </div>
    );
}
