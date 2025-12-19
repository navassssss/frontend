import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Teacher {
  id: number;
  name: string;
  initials: string;
}

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    title: '',
    instructions: '',
  });

  // Fetch all teachers from backend
  useEffect(() => {
    api.get("/teachers")
      .then(res => {
        const teachersData = res.data.map((t: any) => ({
          ...t,
          initials: t.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        }));
        setTeachers(teachersData);
      })
      .catch(() => toast.error("Failed to load teachers"))
      .finally(() => setIsLoading(false));
  }, []);

  const toggleTeacher = (teacherId: number) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const removeTeacher = (teacherId: number) => {
    setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
  };

  const handleSubmit = () => {
    if (!formData.title.trim()) return toast.error("Enter task title");
    if (selectedTeachers.length === 0) return toast.error("Select at least one teacher");
    if (!formData.scheduled_date) return toast.error("Select a date");

    setIsSubmitting(true);

    api.post("/tasks", {
      teacher_ids: selectedTeachers,
      title: formData.title,
      instructions: formData.instructions,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time,
    })
      .then(() => {
        toast.success("Task created successfully!");
        navigate("/tasks");
      })
      .catch(() => toast.error("Failed to create task"))
      .finally(() => setIsSubmitting(false));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Create Task</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-8">
        <Card className="animate-fade-in">
          <CardContent className="p-6 space-y-6">

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Task Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            {/* Assign to Teachers */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Assign to Teachers <span className="text-destructive">*</span>
              </label>

              {/* Selected Teachers */}
              {selectedTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTeachers.map(teacherId => {
                    const teacher = teachers.find(t => t.id === teacherId);
                    return teacher ? (
                      <Badge key={teacherId} variant="default" className="gap-1 pr-1">
                        {teacher.name}
                        <button
                          onClick={() => removeTeacher(teacherId)}
                          className="ml-1 p-0.5 rounded-full hover:bg-primary-foreground/20"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => setShowTeacherSelector(true)}
              >
                {selectedTeachers.length > 0 ? 'Edit Assigned Teachers' : 'Select Teachers'}
              </Button>
            </div>

            {/* Date + Time */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Schedule Date & Time <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={`${formData.scheduled_date}T${formData.scheduled_time}`}
                onChange={(e) => {
                  const [date, time] = e.target.value.split("T");
                  setFormData({
                    ...formData,
                    scheduled_date: date,
                    scheduled_time: time,
                  });
                }}
              />
            </div>

            {/* Instructions Textarea */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground resize-none"
                placeholder="Enter task instructions..."
              ></textarea>
            </div>

            {/* Submit Button */}
            <Button
              variant="touch"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>

          </CardContent>
        </Card>
      </main>

      {/* Teacher Selector Modal */}
      {showTeacherSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in p-4">
          <Card className="w-full max-w-md max-h-[85vh] overflow-hidden animate-scale-in rounded-2xl flex flex-col">
            <CardContent className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Select Teachers</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowTeacherSelector(false)}>
                  ✕
                </Button>
              </div>

              {/* Teacher List */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {teachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => toggleTeacher(teacher.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedTeachers.includes(teacher.id)
                      ? 'bg-primary/10 border-2 border-primary'
                      : 'bg-secondary border-2 border-transparent hover:bg-secondary/80'
                      }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary-foreground">
                        {teacher.initials}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-foreground">{teacher.name}</p>
                    </div>
                    {selectedTeachers.includes(teacher.id) && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>

              <Button
                variant="touch"
                className="w-full"
                onClick={() => setShowTeacherSelector(false)}
              >
                Done ({selectedTeachers.length} selected)
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
