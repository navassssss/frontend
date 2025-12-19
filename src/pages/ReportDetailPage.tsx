import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Paperclip,
  FileText,
  Image,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "@/lib/api";

interface ApiAttachment {
  id: number;
  file_name: string;
  file_url: string;
  type: "image" | "document";
}

interface ApiReport {
  id: number;
  duty?: { name: string };
  teacher?: { name: string; initials: string; role: string };
  created_at: string;
  status: "submitted" | "approved" | "rejected";
  description: string;
  attachments: ApiAttachment[];
  comments: any[]; // or Comment[]
  review_note?: string; // <-- REQUIRED
  task: any; // Because you're accessing report.task.duty
}


export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<ApiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<ApiReport[]>([]);

  const loadReport = () => {
    api
      .get(`/reports/${id}`)
      .then((res) => {
        setReport(res.data.report);
        setHistory(res.data.history); // store previous versions
      })

      .catch(() => toast.error("Failed to load report details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReport();
  }, [id]);

  const handleMarkReviewed = () => {
    setIsSubmitting(true);
    api
      .post(`/reports/${id}/approve`)
      .then(() => {
        toast.success("Report marked as reviewed");
        loadReport();
      })
      .catch(() => toast.error("Action failed"))
      .finally(() => setIsSubmitting(false));
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    api.post(`/reports/${id}/comment`, {
      comment: newComment
    })
      .then(() => {
        setReport({ ...report, review_note: newComment });
        setNewComment('');
        toast.success("Review note saved");

        loadReport();
      })
      .catch(() => toast.error("Failed to add comment"))
      .finally(() => setIsSubmitting(false));
  };

  if (loading) return <p className="text-center mt-6">Loading...</p>;
  if (!report) return <p className="text-center mt-6">Report not found.</p>;

  const teacher = report.teacher ?? {};
  const duty = report.task?.duty || { name: "General Report" };
  const dutyName = report.task?.duty?.name ?? "General Report";
  const capitalize = (text: string) =>
    text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
  const handleApprove = () => {
    api.post(`/reports/${id}/approve`)
      .then(() => {
        toast.success("Report Approved");
        loadReport();
      })

      .catch(() => toast.error("Failed to approve"));
  };
  const handleReject = () => {
    if (!newComment.trim()) {
      toast.error("Please provide a review note before rejecting");
      return;
    }

    api.post(`/reports/${id}/reject`, {
      review_note: newComment
    })
      .then(res => {
        setReport(res.data.report);
        setNewComment('');
        toast.success("Report Rejected");
      })
      .catch(() => toast.error("Failed to reject"));
  };

  console.log(report);
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold ml-3">Report Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-8 space-y-4">
        {/* Header */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                <span className="text-lg font-semibold text-primary-foreground">
                  {teacher?.initials ?? teacher?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}

                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">



                  {capitalize(duty?.name)}
                </h2>
                <p className="text-sm text-muted-foreground">{capitalize(teacher?.name ?? "Unknown")}</p>

                <p className="text-xs text-muted-foreground">{capitalize(teacher?.role ?? "Teacher")}</p>
                <Badge variant={
                  report.status === "approved" ? "success" :
                    report.status === "rejected" ? "destructive" : "warning"
                }>
                  {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                </Badge>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </CardContent>
        </Card>

        {/* Attachments */}
        {report.attachments?.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <h3 className="font-semibold mb-2">Attachments</h3>
              {report.attachments?.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-secondary rounded-xl"
                >
                  {file.type === "image" ? (
                    <Image className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-accent" />
                  )}
                  <span className="text-sm">{file.file_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(
                      `http://127.0.0.1:8000/storage/${file.file_path}`,
                      "_blank"
                    )}
                  >
                    View
                  </Button>

                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Review Notes
            </h3>

            {report.review_note ? (
              <p className="text-sm text-muted-foreground mt-1">{report.review_note}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">No review notes yet</p>
            )}


            {report.comments?.map((c: any) => (
              <div key={c.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xs font-bold">{c.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{c.user.name}</p>
                  <p className="text-xs opacity-70">{c.created_at}</p>
                  <p className="text-sm mt-1">{c.comment}</p>
                </div>
              </div>
            ))}

            {history.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-semibold">Previous Submissions</h3>

                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-secondary transition"
                      onClick={() => navigate(`/reports/${h.id}`)}
                    >
                      <Badge variant={
                        h.status === "approved" ? "success" :
                          h.status === "rejected" ? "destructive" : "warning"
                      }>
                        {h.status}
                      </Badge>

                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(h.created_at).toLocaleString()}
                      </p>

                      <p className="text-sm line-clamp-2 mt-1">
                        {h.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}




            {/* Add comment */}
            <textarea
              className="w-full p-3 rounded-xl border bg-card"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button
              variant="secondary"
              disabled={!newComment.trim() || isSubmitting}
              onClick={handleAddComment}
            >
              Add Comment
            </Button>
          </CardContent>
        </Card>

        {/* Approve button */}
        {report.status === "submitted" && (
          <div className="flex gap-3 animate-slide-up">
            <Button
              className="flex-1 bg-red-500 text-white"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              Reject
            </Button>

            <Button
              className="flex-1 bg-green-600 text-white"
              onClick={handleApprove}
              disabled={isSubmitting}
            >
              Approve
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}
