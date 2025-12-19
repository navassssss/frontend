import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Camera,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import api from '@/lib/api';

type TaskStatus = 'pending' | 'completed' | 'missed';

interface Task {
  id: number;
  title: string;
  instructions?: string;
  scheduled_date: string;
  scheduled_time?: string;
  status: TaskStatus;
  duty?: { name: string };
  assigned_to?: { id: number; name: string };
}

export default function TaskDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [description, setDescription] = useState('');
  const [reports, setReports] = useState<any[]>([]);

  // Fetch task details
  useEffect(() => {
    api.get(`/tasks/${id}`)
      .then((res) => setTask(res.data))
      .catch(() => {
        toast.error("Task not found");
        navigate("/tasks");
      })
      .finally(() => setIsLoading(false));
  }, [id, navigate]);
  useEffect(() => {
    api.get(`/tasks/${id}/reports`)
      .then(res => setReports(res.data))
      .catch(() => { });
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Loading task...
    </div>;
  }

  if (!task) return null;

  const isMine = task.assigned_to?.id === user?.id;
  const isCompleted = task.status === "completed";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      return toast.error("Please enter a report description");
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("task_id", String(id));
    formData.append("description", description);
    files.forEach((file) => formData.append("attachments[]", file));

    api.post("/reports", formData)
      .then(() => {
        toast.success("Report submitted successfully!");
        navigate("/tasks");
      })
      .catch(() => toast.error("Failed to submit report"))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold ml-3">Task Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-32 space-y-4">

        {/* Task Section */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <Badge variant={task.status}>{task.status}</Badge>
            <p className="text-sm text-muted-foreground">{task.duty?.name}</p>
            <h2 className="text-xl font-bold">{task.title}</h2>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {task.scheduled_date}
              </div>
              {task.scheduled_time && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {task.scheduled_time.slice(0, 5)}
                </div>
              )}
            </div>

            {task.assigned_to?.name && (
              <p className="text-xs text-muted-foreground">
                Assigned to: <span className="font-medium text-foreground">{task.assigned_to.name}</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        {task.instructions && (
          <Card>
            <CardContent className="p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-primary" /> Instructions
              </h3>
              <p className="text-sm text-muted-foreground">{task.instructions}</p>
            </CardContent>
          </Card>
        )}
        {reports.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold">Latest Submission</h3>

              <p className="text-sm text-muted-foreground">
                {reports[0].description}
              </p>

              {reports[0].review_note && (
                <p className="text-xs text-destructive">
                  Review: {reports[0].review_note}
                </p>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(`/reports/${reports[0].id}`)}
              >
                View Full Report
              </Button>
            </CardContent>
          </Card>
        )}
        {reports.length > 0 && (
          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold mb-2">Revision History</h3>

              <div className="border-l-2 border-muted-foreground/30 pl-4 space-y-4">
                {reports.map((rep, index) => (
                  <div key={rep.id} className="relative">
                    {/* Timeline Dot */}
                    <div className={`absolute -left-2 top-1.5 w-3 h-3 rounded-full ${rep.status === "submitted"
                        ? "bg-yellow-500"
                        : rep.status === "approved"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`} />

                    <p className="text-sm ms-2 font-semibold">
                      V{reports.length - index} — {rep.status}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {new Date(rep.created_at).toLocaleString()}
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => navigate(`/reports/${rep.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}



        {/* Report Submission - Only My Pending Tasks */}
        {isMine && !isCompleted && (
          <div className="space-y-4">
            <h3 className="font-semibold">Submit Report</h3>

            <textarea
              className="w-full h-28 border rounded-xl p-3"
              placeholder="Describe what you completed..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" multiple onChange={handleFileChange} className="hidden" />
                <div className="h-12 border-2 border-dashed rounded-xl flex justify-center items-center gap-2">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Upload</span>
                </div>
              </label>

              <label className="cursor-pointer">
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                <div className="w-12 h-12 border-2 border-dashed rounded-xl flex justify-center items-center">
                  <Camera className="w-5 h-5" />
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <p className="text-xs text-muted-foreground">{files.length} file(s) selected</p>
            )}
          </div>
        )}
      </main>

      {/* Bottom Action Button */}
      {isMine && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
          <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
