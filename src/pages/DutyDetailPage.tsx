import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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

// Helper to convert name to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

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
        <div className="flex items-center h-14 px-4 max-w-2xl lg:max-w-4xl mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Duty Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl lg:max-w-4xl mx-auto pb-32 space-y-3">

        {/* Main Info Card */}
        <Card variant="elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${duty.type === 'rotational'
                ? 'bg-accent/10'
                : 'bg-primary/10'
                }`}>
                {duty.type === 'rotational'
                  ? <RotateCcw className="w-6 h-6 text-accent" />
                  : <Briefcase className="w-6 h-6 text-primary" />}
              </div>
              <div>
                <Badge
                  variant={duty.type === 'rotational' ? 'accent' : 'default'}
                  className="font-medium px-2.5 py-0.5"
                >
                  {toTitleCase(duty.type)}
                </Badge>
                <h2 className="text-lg font-bold text-foreground mt-1">{toTitleCase(duty.name)}</h2>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{duty.description}</p>
          </CardContent>
        </Card>

        {/* Frequency Card - Consistent badge styling */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Frequency</p>
                <p className="font-bold text-foreground">{toTitleCase(duty.frequency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Members - Lighter backgrounds */}
        <div>
          <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Assigned Members ({duty.teachers.length})
          </h3>
          <Card>
            <CardContent className="p-3">
              <div className="divide-y divide-border">
                {duty.teachers.map(teacher => (
                  <div
                    key={teacher.id}
                    className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {teacher.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <span className="text-sm font-medium text-foreground flex-1">
                      {toTitleCase(teacher.name)}
                    </span>

                    {/* Remove button only for Principal */}
                    {isPrincipal && (
                      <button
                        onClick={() => handleRemoveTeacher(teacher.id)}
                        className="text-destructive text-xs font-semibold hover:underline"
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
              variant="outline"
              className="w-full mt-2"
              onClick={() => setShowTeacherSelector(true)}
            >
              + Add Teachers
            </Button>
          )}
        </div>

        {/* Submit Report Button */}
        <div className="flex justify-end mt-3">
          <Button
            onClick={() => navigate(`/reports/new?dutyId=${duty.id}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all px-6"
          >
            <FileText className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>

      </main>

      {/* Teacher Selector Modal */}
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
                  className={`p-3 rounded-xl flex justify-between border transition-all
              ${selectedNewTeachers.includes(teacher.id)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/30"
                    }`}
                >
                  <span className="font-medium">{toTitleCase(teacher.name)}</span>
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

    </div>
  );
}
