import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';


// || user?.role === 'manager';
import {
  ArrowLeft,
  Calendar,
  Users,
  Clock,
  FileText,
  RotateCcw,
  Briefcase
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Duty {
  id: number;
  name: string;
  description: string;
  type: 'responsibility' | 'rotational';
  frequency: string;
  teachers: { id: number; name: string }[];
}

export default function DutyDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal';
  const [duty, setDuty] = useState<Duty | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [teacherList, setTeacherList] = useState<any[]>([]);
  const [selectedNewTeachers, setSelectedNewTeachers] = useState<number[]>([]);
  useEffect(() => {
    if (!showTeacherSelector || !duty) return;

    // Set already assigned teachers as selected
    setSelectedNewTeachers(duty.teachers.map(t => t.id));

    api.get("/teachers")
      .then(res => setTeacherList(res.data))
      .catch(() => toast.error("Failed to load teachers"));
  }, [showTeacherSelector, duty]);

  // useEffect(() => {
  //   if (!showTeacherSelector) return;

  //   api.get("/teachers")
  //     .then(res => setTeacherList(res.data))
  //     .catch(() => toast.error("Failed to load teachers"));
  // }, [showTeacherSelector]);

  const handleAssignTeachers = () => {
    api.post(`/duties/${id}/assign-teachers`, {
      teacher_ids: selectedNewTeachers
    })
      .then(() => {
        toast.success("Teachers assigned successfully");
        setDuty(prev => prev ? {
          ...prev,
          teachers: [
            ...prev.teachers,
            ...teacherList.filter(t => selectedNewTeachers.includes(t.id))
          ]
        } : prev);
        setShowTeacherSelector(false);
        setSelectedNewTeachers([]);
      })
      .catch(() => toast.error("Failed to assign teachers"));
  };


  const handleRemoveTeacher = (teacherId: number) => {
    api.post(`/duties/${id}/remove-teacher`, { teacher_id: teacherId })
      .then(() => {
        setDuty(prev =>
          prev
            ? { ...prev, teachers: prev.teachers.filter(t => t.id !== teacherId) }
            : prev
        );
        toast.success('Teacher removed');
      })
      .catch(() => toast.error('Failed to remove teacher'));
  };


  useEffect(() => {
    api.get(`/duties/${id}`)
      .then(res => setDuty(res.data))
      .catch(() => {
        toast.error("Failed to load duty details");
        navigate("/duties");
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!duty) return null;

  return (
    <div className="min-h-screen bg-background">

      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Duty Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-32 space-y-4">

        <Card variant="elevated">
          <CardContent className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${duty.type === 'rotational'
                ? 'bg-accent-light'
                : 'bg-primary-light'
                }`}>
                {duty.type === 'rotational'
                  ? <RotateCcw className="w-7 h-7 text-accent" />
                  : <Briefcase className="w-7 h-7 text-primary" />}
              </div>
              <div>
                <Badge variant={duty.type === 'rotational' ? 'accent' : 'default'}>
                  {duty.type}
                </Badge>
                <h2 className="text-xl font-bold text-foreground mt-1">{duty.name}</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{duty.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-light flex items-center justify-center">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Frequency</p>
                <p className="font-medium text-foreground">{duty.frequency}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Assigned Members ({duty.teachers.length})
          </h3>
          <Card>
            <CardContent className="p-3">
              <div className="space-y-2">
                {duty.teachers.map(teacher => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 p-2 rounded-xl bg-secondary"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">
                        {teacher.name.charAt(0)}
                      </span>
                    </div>

                    <span className="text-sm font-medium text-foreground flex-1">
                      {teacher.name}
                    </span>

                    {/* Remove button only for Principal */}
                    {isPrincipal && (
                      <button
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="text-destructive text-xs font-medium"
                      >
                        Remove
                      </button>
                    )}



                  </div>
                ))}
              </div>

            </CardContent>

          </Card>
          {isPrincipal && (
            <Button
              variant="secondary"
              className="w-full mt-3"
              onClick={() => setShowTeacherSelector(true)}
            >
              + Add Teachers
            </Button>
          )}
        </div>


      </main>
      {showTeacherSelector && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[80vh] overflow-hidden rounded-2xl">
            <CardContent className="p-5 flex flex-col gap-3 overflow-y-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select Teachers
              </h3>

              {teacherList.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() =>
                    setSelectedNewTeachers((prev) =>
                      prev.includes(teacher.id)
                        ? prev.filter((id) => id !== teacher.id)
                        : [...prev, teacher.id]
                    )
                  }
                  className={`p-3 rounded-xl flex justify-between border 
              ${selectedNewTeachers.includes(teacher.id)
                      ? "border-primary bg-primary/10"
                      : "border-border"
                    }`}
                >
                  <span>{teacher.name}</span>
                  {selectedNewTeachers.includes(teacher.id) && (
                    <span className="text-primary font-bold">✓</span>
                  )}
                </button>
              ))}

              <Button
                variant="touch"
                disabled={selectedNewTeachers.length === 0}
                onClick={handleAssignTeachers}
              >
                Assign {selectedNewTeachers.length} Teachers
              </Button>

              <Button
                variant="ghost"
                onClick={() => setShowTeacherSelector(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}


      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            variant="touch"
            className="w-full"
            onClick={() => navigate('/reports/new')}
          >
            <FileText className="w-5 h-5" />
            Submit Report
          </Button>
        </div>
      </div>
    </div>
  );
}
