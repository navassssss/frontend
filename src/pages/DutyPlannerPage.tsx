import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, X, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const teachers = [
  { id: '1', name: 'John Smith', initials: 'JS' },
  { id: '2', name: 'Jane Doe', initials: 'JD' },
  { id: '3', name: 'Mike Johnson', initials: 'MJ' },
  { id: '4', name: 'Sarah Williams', initials: 'SW' },
  { id: '5', name: 'David Brown', initials: 'DB' },
  { id: '6', name: 'Emily Davis', initials: 'ED' },
];

interface Assignment {
  teacherId: string;
  teacherName: string;
  initials: string;
}

type WeekAssignments = {
  [key: string]: Assignment[];
};

const initialAssignments: WeekAssignments = {
  Sun: [],
  Mon: [{ teacherId: '1', teacherName: 'John Smith', initials: 'JS' }],
  Tue: [{ teacherId: '2', teacherName: 'Jane Doe', initials: 'JD' }],
  Wed: [{ teacherId: '3', teacherName: 'Mike Johnson', initials: 'MJ' }],
  Thu: [{ teacherId: '4', teacherName: 'Sarah Williams', initials: 'SW' }],
  Fri: [{ teacherId: '5', teacherName: 'David Brown', initials: 'DB' }],
  Sat: [],
};

export default function DutyPlannerPage() {
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState('Dec 2 - Dec 8, 2024');
  const [assignments, setAssignments] = useState<WeekAssignments>(initialAssignments);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  const handleAddTeacher = (day: string) => {
    setSelectedDay(day);
    setShowTeacherPicker(true);
  };

  const handleSelectTeacher = (teacher: typeof teachers[0]) => {
    if (selectedDay) {
      const currentAssignments = assignments[selectedDay] || [];
      if (currentAssignments.find(a => a.teacherId === teacher.id)) {
        toast.error('Teacher already assigned for this day');
        return;
      }
      setAssignments({
        ...assignments,
        [selectedDay]: [...currentAssignments, {
          teacherId: teacher.id,
          teacherName: teacher.name,
          initials: teacher.initials
        }]
      });
      setShowTeacherPicker(false);
      setSelectedDay(null);
      toast.success(`${teacher.name} assigned to ${selectedDay}`);
    }
  };

  const handleRemoveTeacher = (day: string, teacherId: string) => {
    setAssignments({
      ...assignments,
      [day]: assignments[day].filter(a => a.teacherId !== teacherId)
    });
    toast.success('Teacher removed');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Weekly Planner</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-8">
        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <Button variant="ghost" size="icon-sm">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="font-semibold text-foreground">{currentWeek}</span>
          <Button variant="ghost" size="icon-sm">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Week Grid */}
        <div className="space-y-3 animate-slide-up">
          {days.map((day, index) => (
            <Card 
              key={day}
              className={`animate-slide-up ${day === 'Sun' || day === 'Sat' ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{day}</p>
                    <p className="text-xs text-muted-foreground">
                      {assignments[day]?.length || 0} assigned
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => handleAddTeacher(day)}
                    disabled={day === 'Sun' || day === 'Sat'}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                {assignments[day]?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {assignments[day].map((assignment) => (
                      <div 
                        key={assignment.teacherId}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-light"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-[10px] font-medium text-primary-foreground">
                            {assignment.initials}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {assignment.teacherName.split(' ')[0]}
                        </span>
                        <button
                          onClick={() => handleRemoveTeacher(day, assignment.teacherId)}
                          className="ml-1 p-0.5 hover:bg-primary/10 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-primary" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No teachers assigned</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Teacher Picker Modal */}
      {showTeacherPicker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg rounded-t-3xl rounded-b-none animate-slide-up">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">
                  Assign teacher for {selectedDay}
                </h3>
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={() => setShowTeacherPicker(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-auto">
                {teachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => handleSelectTeacher(teacher)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {teacher.initials}
                      </span>
                    </div>
                    <span className="font-medium text-foreground">{teacher.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
