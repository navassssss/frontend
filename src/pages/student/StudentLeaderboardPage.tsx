import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Star,
  Medal,
  TrendingUp,
  School,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentLayout from '@/components/student/StudentLayout';
import { useStudentAuth } from '@/contexts/StudentAuthContext';
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
  student_count?: number; // Backend might need to add this if missing
  points: number;
}

export default function StudentLeaderboardPage() {
  const navigate = useNavigate();
  const { student } = useStudentAuth();
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
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [leaderboardType, timeFilter]);

  // Find current user's rank in the list
  const currentUserEntry = studentData.find(s => s.username === student?.username);

  return (
    <StudentLayout title="Leaderboard" showBack>
      <div className="space-y-6">
        {/* My Stats Card (Only visible if in student list or always from context) */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">
                  {timeFilter === 'monthly' ? 'Monthly Points' : 'Total Points'}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {timeFilter === 'monthly' ? student?.monthlyPoints : student?.totalPoints} pts
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Your Rank</p>
                <p className="text-xl font-bold">
                  {currentUserEntry ? `#${currentUserEntry.rank}` : '-'}
                </p>
                <p className="text-xs text-muted-foreground">Among all students</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
              <TrendingUp className="w-4 h-4 mr-2" />
              This Month
            </Button>
            <Button
              variant={timeFilter === 'overall' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeFilter('overall')}
              className="flex-1"
            >
              <Trophy className="w-4 h-4 mr-2" />
              All Time
            </Button>
          </div>

          <div className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
            ) : (
              <>
                {/* Student Leaderboard */}
                <TabsContent value="students" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    {studentData.length > 0 ? (
                      studentData.map((entry) => (
                        <StudentLeaderboardCard
                          key={entry.username} // Use username as key since unique
                          entry={entry}
                          isCurrentUser={entry.username === student?.username}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No data found</div>
                    )}
                  </div>
                </TabsContent>

                {/* Class Leaderboard */}
                <TabsContent value="classes" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    {classData.length > 0 ? (
                      classData.map((entry, idx) => (
                        <ClassLeaderboardCard
                          key={idx}
                          entry={entry}
                          isCurrentClass={student?.class === entry.class_name}
                        />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No data found</div>
                    )}
                  </div>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground text-center">
              Points contribute to both your personal and class rankings.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}

function StudentLeaderboardCard({ entry, isCurrentUser }: { entry: StudentLeaderboardEntry; isCurrentUser?: boolean }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-yellow-950';
      case 2: return 'bg-gray-300 text-gray-700';
      case 3: return 'bg-orange-400 text-orange-950';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`overflow-hidden ${isCurrentUser ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
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
            <p className="font-medium truncate">
              {entry.name} {isCurrentUser && <Badge variant="secondary" className="ml-1">You</Badge>}
            </p>
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

function ClassLeaderboardCard({ entry, isCurrentClass }: { entry: ClassLeaderboardEntry; isCurrentClass?: boolean }) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-500 text-yellow-950';
      case 2: return 'bg-gray-300 text-gray-700';
      case 3: return 'bg-orange-400 text-orange-950';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className={`overflow-hidden ${isCurrentClass ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankStyle(entry.rank)}`}>
            {entry.rank}
          </div>
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <School className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">
              {entry.class_name} {isCurrentClass && <Badge variant="secondary" className="ml-1">Your Class</Badge>}
            </p>
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
