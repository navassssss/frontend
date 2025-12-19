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
        <div className="flex items-center justify-between p-4">
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

      <main className="p-4 pb-24 space-y-6">
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
                    <div className="flex justify-center items-end gap-2 py-4">
                      {/* 2nd Place */}
                      {studentData[1] && (
                        <div className="flex flex-col items-center">
                          <Avatar className="h-14 w-14 border-2 border-muted">
                            <AvatarFallback className="bg-muted text-lg font-bold">
                              {studentData[1].name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-muted rounded-t-lg mt-2 p-2 w-20 h-16 flex flex-col items-center justify-center">
                            <Medal className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs font-semibold">2nd</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {studentData[0] && (
                        <div className="flex flex-col items-center -mt-4">
                          <div className="relative">
                            <Trophy className="h-6 w-6 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                            <Avatar className="h-16 w-16 border-4 border-yellow-500">
                              <AvatarFallback className="bg-yellow-500/20 text-xl font-bold text-yellow-700">
                                {studentData[0].name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="bg-yellow-500/20 rounded-t-lg mt-2 p-2 w-24 h-20 flex flex-col items-center justify-center">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-bold text-yellow-700">1st</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {studentData[2] && (
                        <div className="flex flex-col items-center">
                          <Avatar className="h-12 w-12 border-2 border-orange-300">
                            <AvatarFallback className="bg-orange-100 font-bold">
                              {studentData[2].name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-orange-100 rounded-t-lg mt-2 p-2 w-18 h-14 flex flex-col items-center justify-center">
                            <Medal className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-700">3rd</span>
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
                    <div className="flex justify-center items-end gap-2 py-4">
                      {/* 2nd Place */}
                      {classData[1] && (
                        <div className="flex flex-col items-center">
                          <div className="h-14 w-14 rounded-full border-2 border-muted bg-muted flex items-center justify-center">
                            <School className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="bg-muted rounded-t-lg mt-2 p-2 w-20 h-16 flex flex-col items-center justify-center">
                            <Medal className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs font-semibold">2nd</span>
                          </div>
                        </div>
                      )}

                      {/* 1st Place */}
                      {classData[0] && (
                        <div className="flex flex-col items-center -mt-4">
                          <div className="relative">
                            <Trophy className="h-6 w-6 text-yellow-500 absolute -top-6 left-1/2 -translate-x-1/2" />
                            <div className="h-16 w-16 rounded-full border-4 border-yellow-500 bg-yellow-500/20 flex items-center justify-center">
                              <School className="h-7 w-7 text-yellow-700" />
                            </div>
                          </div>
                          <div className="bg-yellow-500/20 rounded-t-lg mt-2 p-2 w-24 h-20 flex flex-col items-center justify-center">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-bold text-yellow-700">1st</span>
                          </div>
                        </div>
                      )}

                      {/* 3rd Place */}
                      {classData[2] && (
                        <div className="flex flex-col items-center">
                          <div className="h-12 w-12 rounded-full border-2 border-orange-300 bg-orange-100 flex items-center justify-center">
                            <School className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="bg-orange-100 rounded-t-lg mt-2 p-2 w-18 h-14 flex flex-col items-center justify-center">
                            <Medal className="h-4 w-4 text-orange-600" />
                            <span className="text-xs font-semibold text-orange-700">3rd</span>
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
      case 1: return 'bg-yellow-500 text-yellow-950';
      case 2: return 'bg-gray-300 text-gray-700';
      case 3: return 'bg-orange-400 text-orange-950';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)}`}>
            {entry.rank}
          </div>

          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {entry.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{entry.name}</p>
            <p className="text-xs text-muted-foreground">{entry.class_name}</p>
          </div>

          <div className="text-right">
            <p className="font-bold text-primary">{entry.points} pts</p>
            <div className="flex items-center gap-1 justify-end">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{entry.stars}</span>
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
      case 1: return 'bg-yellow-500 text-yellow-950';
      case 2: return 'bg-gray-300 text-gray-700';
      case 3: return 'bg-orange-400 text-orange-950';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)}`}>
            {entry.rank}
          </div>

          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <School className="h-5 w-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{entry.class_name}</p>
            <p className="text-xs text-muted-foreground">
              {entry.department}
              {entry.student_count ? ` • ${entry.student_count} students` : ''}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold text-primary">{entry.points} pts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
