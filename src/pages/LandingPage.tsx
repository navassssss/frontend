import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Hero Section */}
            <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
                {/* Logo and Title */}
                <div className="text-center mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/50 mb-6">
                        <GraduationCap className="h-10 w-10 md:h-12 md:w-12 text-primary-foreground" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                        DHIC eGov
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Digital platform for managing academics and administration
                    </p>
                </div>

                {/* Action Cards */}
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 mb-12">
                    {/* Staff Portal */}
                    <Card
                        className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
                        onClick={() => navigate('/staff/login')}
                    >
                        <CardContent className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 mb-6 group-hover:scale-110 transition-transform">
                                <Users className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Staff Portal</h3>
                            <p className="text-muted-foreground mb-6">
                                Access administrative tools, manage duties, and track reports
                            </p>
                            <Button className="w-full group-hover:bg-primary/90" size="lg">
                                Staff Login
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Student Portal */}
                    <Card
                        className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
                        onClick={() => navigate('/student/login')}
                    >
                        <CardContent className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/50 mb-6 group-hover:scale-110 transition-transform">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Student Portal</h3>
                            <p className="text-muted-foreground mb-6">
                                View your marks, achievements, and academic progress
                            </p>
                            <Button className="w-full group-hover:bg-primary/90" size="lg">
                                Student Login
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Public Leaderboard */}
                    <Card
                        className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
                        onClick={() => navigate('/leaderboard')}
                    >
                        <CardContent className="p-8 text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg shadow-yellow-500/50 mb-6 group-hover:scale-110 transition-transform">
                                <Trophy className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Leaderboard</h3>
                            <p className="text-muted-foreground mb-6">
                                View public rankings and top performers
                            </p>
                            <Button className="w-full group-hover:bg-primary/90" size="lg" variant="outline">
                                View Rankings
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
                    <p>© 2025 DHIC eGov. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
