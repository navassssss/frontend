import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '../lib/api';

type DutyType = 'responsibility';
type Frequency = 'none' | 'daily' | 'weekly' | 'monthly';

interface Teacher {
  id: string;
  name: string;
  initials: string;
  department: string;
}

// const availableTeachers: Teacher[] = [
//   { id: '1', name: 'John Smith', initials: 'JS', department: 'Science' },
//   { id: '2', name: 'Jane Doe', initials: 'JD', department: 'Mathematics' },
//   { id: '3', name: 'Mike Johnson', initials: 'MJ', department: 'English' },
//   { id: '4', name: 'Sarah Williams', initials: 'SW', department: 'Arts' },
//   { id: '5', name: 'David Brown', initials: 'DB', department: 'Physical Education' },
//   { id: '6', name: 'Emily Davis', initials: 'ED', department: 'History' },
// ];




export default function CreateDutyPage() {
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    api.get('/teachers')
      .then(res => {
        const teachers = res.data.map((t: any) => ({
          ...t,
          initials: t.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        }));
        setAvailableTeachers(teachers);
      })
      .catch(() => toast.error("Failed to load teachers"));
  }, []);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    type: 'responsibility' as DutyType,
    frequency: 'none' as Frequency,
    description: '',
  });
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const removeTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
  };

  const typeOptions: { value: DutyType; label: string }[] = [
    { value: 'responsibility', label: 'Responsibility' },
  ];

  const frequencyOptions: { value: Frequency; label: string }[] = [
    { value: 'none', label: 'None' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a duty name');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    // await new Promise(resolve => setTimeout(resolve, 500));

    // toast.success('Duty created successfully');
    // navigate('/duties');

    api.post('/duties', {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      frequency: formData.frequency,
      teacher_ids: selectedTeachers,
    })
      .then(() => {
        toast.success("Duty created successfully!");
        navigate("/duties");
      })
      .catch(() => toast.error("Failed to create duty"))
      .finally(() => setIsSubmitting(false));

  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Create Duty</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-8">
        <Card className="animate-fade-in">
          <CardContent className="p-6 space-y-6">
            {/* Duty Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Duty Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="Enter duty name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Duty Type */}

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Type <span className="text-destructive">*</span>
              </label>
              <div className="flex gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, type: option.value })}
                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${formData.type === option.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frequency */}
            {/*formData.frequency === "custom" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Custom Schedule (To be configured later)
                </label>
                <p className="text-xs text-muted-foreground">
                  The system will allow specifying exact repeat days soon.
                </p>
              </div>
            )*/}

            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Frequency <span className="text-destructive">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {frequencyOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setFormData({ ...formData, frequency: option.value })}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${formData.frequency === option.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Description (Optional)
              </label>
              <textarea
                placeholder="Enter duty description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Assign to Teachers */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">
                Assign to Teachers (Optional)
              </label>

              {/* Selected Teachers */}
              {selectedTeachers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTeachers.map(teacherId => {
                    const teacher = availableTeachers.find(t => t.id === teacherId);
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

            {/* Submit Button */}
            <Button
              variant="touch"
              className="w-full"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Duty'}
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
                {availableTeachers.map(teacher => (
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
                      <p className="text-xs text-muted-foreground">{teacher.department}</p>
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
