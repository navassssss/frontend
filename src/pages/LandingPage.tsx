import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Trophy, ArrowRight, Sparkles, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen w-full bg-background relative overflow-hidden selection:bg-primary/20">
            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-yellow-500/5 blur-3xl animate-pulse delay-2000" />
            </div>

            <div className="container mx-auto px-4 h-full min-h-screen flex flex-col">
                {/* Navbar */}
                <nav className="flex items-center justify-between py-6">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <GraduationCap className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">DHIC eGov</span>
                    </div>
                </nav>

                {/* Main Content Split */}
                <div className="flex-1 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 py-8 lg:py-0">

                    {/* Left Side: Branding & Hero */}
                    <div className="flex-1 space-y-8 text-center lg:text-left animate-in slide-in-from-left-5 fade-in duration-700">
                        <Badge variant="outline" className="py-1.5 px-4 rounded-full border-primary/20 bg-primary/5 text-primary animate-in fade-in zoom-in duration-700 delay-100">
                            <Sparkles className="w-3.5 h-3.5 mr-2" />
                            Next Generation Academic Management
                        </Badge>

                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
                                Empowering <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Excellence</span>
                            </h1>
                            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                                Streamline administration, track student performance, and celebrate achievements with our integrated e-Governance platform.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                            <Button size="lg" className="h-12 px-8 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-base" onClick={() => navigate('/student/login')}>
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button size="lg" variant="ghost" className="h-12 px-8 rounded-full text-base" onClick={() => navigate('/leaderboard')}>
                                View Public Rankings
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-8 border-t border-border/50">
                            <div>
                                <h4 className="text-2xl font-bold text-foreground">100%</h4>
                                <p className="text-sm text-muted-foreground">Digital Workflow</p>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-foreground">24/7</h4>
                                <p className="text-sm text-muted-foreground">Access Anywhere</p>
                            </div>
                            <div>
                                <h4 className="text-2xl font-bold text-foreground">Real-time</h4>
                                <p className="text-sm text-muted-foreground">Updates</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Portal Cards */}
                    <div className="flex-1 w-full max-w-md lg:max-w-full relative">
                        {/* Decorative background blob for cards */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-blue-500/10 rounded-[3rem] blur-2xl -z-10" />

                        <div className="grid gap-4 relative animate-in slide-in-from-right-5 fade-in duration-700 delay-200">
                            {/* Staff Portal Card */}
                            <Card
                                onClick={() => navigate('/staff/login')}
                                className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl hover:bg-background/80 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                                        <Users className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Staff Portal
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-blue-500" />
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Manage duties, reports, and academic records.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Student Portal Card */}
                            <Card
                                onClick={() => navigate('/student/login')}
                                className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl hover:bg-background/80 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                                        <GraduationCap className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Student Portal
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-green-500" />
                                        </h3>
                                        <p className="text-sm text-muted-foreground">View progress, marks, and personal achievements.</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Leaderboard Card */}
                            <Card
                                onClick={() => navigate('/leaderboard')}
                                className="group relative overflow-hidden border-border/50 bg-background/60 backdrop-blur-xl hover:bg-background/80 transition-all cursor-pointer hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                            >
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                                        <Trophy className="h-8 w-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold flex items-center gap-2">
                                            Public Leaderboard
                                            <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-amber-500" />
                                        </h3>
                                        <p className="text-sm text-muted-foreground">Check the top performers and hall of fame.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                <div className="py-6 text-center text-sm text-muted-foreground border-t border-border/40 mt-auto">
                    <p>© 2025 Darul Huda Islamic College. Powered by eGov.</p>
                </div>
            </div>
        </div>
    );
}
