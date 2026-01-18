import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Users, Medal, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api from '@/lib/api';

interface StudentLeaderboardEntry {
  rank: number;
  name: string;
  username: string;
  class_name: string;
  points: number;
  stars: number;
}

interface ClassLeaderboardEntry {
  rank: number;
  class_name: string;
  department: string;
  student_count?: number;
  points: number;
}

export default function PublicLeaderboardPage() {
  const navigate = useNavigate();
  const [leaderboardType, setLeaderboardType] = useState<'students' | 'classes'>('students');
  const [timeFilter, setTimeFilter] = useState<'monthly' | 'overall'>('monthly');

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Leaderboard</h1>
              <p className="text-xs text-muted-foreground">Public Rankings</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/student/login')}
          >
            Student Login
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
        {/* Leaderboard Type Tabs */}
        <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as 'students' | 'classes')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Students
            </TabsTrigger>
            <TabsTrigger value="classes" className="flex items-center gap-2">
              <School className="h-4 w-4" />
              Classes
            </TabsTrigger>
          </TabsList>

          {/* Time Filter */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={timeFilter === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter('monthly')}
              className="flex-1"
            >
              This Month
            </Button>
            <Button
              variant={timeFilter === 'overall' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter('overall')}
              className="flex-1"
            >
              All Time
            </Button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <>
                {/* Student Leaderboard */}
                <TabsContent value="students" className="mt-0 space-y-4">
                  {/* Top 3 Podium */}
                  {studentData.length >= 3 && (
                    <div className="flex justify-center items-end gap-2 py-4 mt-12 relative">
                      {/* 2nd Place */}
                      {studentData[1] && (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                          <Avatar className="h-16 w-16 border-4 border-gray-300 shadow-lg shadow-gray-400/50 ring-4 ring-gray-100">
                            <AvatarFallback className="bg-gradient-to-br from-gray-200 to-gray-300 text-xl font-bold text-gray-700">
                              {studentData[1].name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl mt-3 p-3 w-24 h-20 flex flex-col items-center justify-center shadow-lg border-t-4 border-gray-400">
                            <Medal className="h-6 w-6 text-gray-600 mb-1" />
                            <span className="text-sm font-bold text-gray-700">2nd</span>
                            <span className="text-xs text-gray-600">{studentData[1].points} pts</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {studentData[0] && (
                        <div className="flex flex-col items-center -mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                          <div className="relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                              <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
                            </div>
                            <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-2xl shadow-yellow-500/50 ring-4 ring-yellow-100">
                              <AvatarFallback className="bg-gradient-to-br from-yellow-300 to-yellow-500 text-2xl font-bold text-yellow-900">
                                {studentData[0].name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-t-xl mt-3 p-4 w-28 h-24 flex flex-col items-center justify-center shadow-2xl border-t-4 border-yellow-600">
                            <Trophy className="h-6 w-6 text-yellow-900 mb-1" />
                            <span className="text-base font-bold text-yellow-900">1st</span>
                            <span className="text-sm font-semibold text-yellow-800">{studentData[0].points} pts</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {studentData[2] && (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                          <Avatar className="h-14 w-14 border-4 border-orange-400 shadow-lg shadow-orange-500/50 ring-4 ring-orange-100">
                            <AvatarFallback className="bg-gradient-to-br from-orange-300 to-orange-400 text-lg font-bold text-orange-900">
                              {studentData[2].name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-t-xl mt-3 p-3 w-22 h-18 flex flex-col items-center justify-center shadow-lg border-t-4 border-orange-500">
                            <Medal className="h-5 w-5 text-orange-800 mb-1" />
                            <span className="text-sm font-bold text-orange-900">3rd</span>
                            <span className="text-xs text-orange-700">{studentData[2].points} pts</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full Rankings */}
                  <div className="space-y-2">
                    {studentData.map((entry) => (
                      <StudentLeaderboardCard key={entry.username} entry={entry} />
                    ))}
                    {studentData.length === 0 && <div className="text-center py-4 text-muted-foreground">No students found</div>}
                  </div>
                </TabsContent>

                {/* Class Leaderboard */}
                <TabsContent value="classes" className="mt-0 space-y-4">
                  {/* Top 3 Classes Podium */}
                  {classData.length >= 3 && (
                    <div className="flex justify-center items-end gap-2 py-4 mt-12 relative">
                      {/* 2nd Place */}
                      {classData[1] && (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                          <div className="h-16 w-16 rounded-full border-4 border-gray-300 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-lg shadow-gray-400/50 ring-4 ring-gray-100">
                            <School className="h-7 w-7 text-gray-600" />
                          </div>
                          <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-xl mt-3 p-3 w-24 h-20 flex flex-col items-center justify-center shadow-lg border-t-4 border-gray-400">
                            <Medal className="h-6 w-6 text-gray-600 mb-1" />
                            <span className="text-sm font-bold text-gray-700">2nd</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {classData[0] && (
                        <div className="flex flex-col items-center -mt-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                          <div className="relative">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce">
                              <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-lg" />
                            </div>
                            <div className="h-20 w-20 rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-2xl shadow-yellow-500/50 ring-4 ring-yellow-100">
                              <School className="h-9 w-9 text-yellow-900" />
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-t-xl mt-3 p-4 w-28 h-24 flex flex-col items-center justify-center shadow-2xl border-t-4 border-yellow-600">
                            <Trophy className="h-6 w-6 text-yellow-900 mb-1" />
                            <span className="text-base font-bold text-yellow-900">1st</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {classData[2] && (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                          <div className="h-14 w-14 rounded-full border-4 border-orange-400 bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/50 ring-4 ring-orange-100">
                            <School className="h-6 w-6 text-orange-800" />
                          </div>
                          <div className="bg-gradient-to-br from-orange-300 to-orange-400 rounded-t-xl mt-3 p-3 w-22 h-18 flex flex-col items-center justify-center shadow-lg border-t-4 border-orange-500">
                            <Medal className="h-5 w-5 text-orange-800 mb-1" />
                            <span className="text-sm font-bold text-orange-900">3rd</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Full Class Rankings */}
                  <div className="space-y-2">
                    {classData.map((entry, idx) => (
                      <ClassLeaderboardCard key={idx} entry={entry} />
                    ))}
                    {classData.length === 0 && <div className="text-center py-4 text-muted-foreground">No classes found</div>}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        {/* Info Notice */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Points are earned through verified achievements.
              Monthly leaderboards reset at the start of each month.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function StudentLeaderboardCard({ entry }: { entry: StudentLeaderboardEntry }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/50';
      case 2: return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-lg shadow-gray-400/50';
      case 3: return 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950 shadow-lg shadow-orange-500/50';
      default: return 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4" style={{
      borderLeftColor: entry.rank === 1 ? '#eab308' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#fb923c' : 'transparent'
    }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)} transition-transform hover:scale-110`}>
            {entry.rank}
          </div>

          <Avatar className="h-12 w-12 ring-2 ring-primary/10">
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-lg">
              {entry.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-base">{entry.name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
              {entry.class_name}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {entry.points} pts
            </p>
            <div className="flex items-center gap-1 justify-end mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
              <span className="text-sm font-medium text-yellow-600">{entry.stars}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ClassLeaderboardCard({ entry }: { entry: ClassLeaderboardEntry }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-950 shadow-lg shadow-yellow-500/50';
      case 2: return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700 shadow-lg shadow-gray-400/50';
      case 3: return 'bg-gradient-to-br from-orange-400 to-orange-600 text-orange-950 shadow-lg shadow-orange-500/50';
      default: return 'bg-gradient-to-br from-muted to-muted/80 text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4" style={{
      borderLeftColor: entry.rank === 1 ? '#eab308' : entry.rank === 2 ? '#9ca3af' : entry.rank === 3 ? '#fb923c' : 'transparent'
    }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)} transition-transform hover:scale-110`}>
            {entry.rank}
          </div>

          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/10">
            <School className="h-6 w-6 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate text-base">{entry.class_name}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
              {entry.department}
              {entry.student_count ? ` • ${entry.student_count} students` : ''}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {entry.points} pts
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
