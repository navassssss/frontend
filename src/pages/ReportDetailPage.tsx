import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Image,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Flag,
  Download,
  Calendar,
  CheckCircle,
  FileClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { toast } from "sonner";
import api from "@/lib/api";

interface ApiAttachment {
  id: number;
  file_name: string;
  file_url: string;
  file_path?: string;
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
  comments: any[];
  review_note?: string;
  task: any;
}

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getInitials = (name?: string) => {
  if (!name) return "TR";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState<ApiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState<ApiReport[]>([]);

  const loadReport = () => {
    api.get(`/reports/${id}`)
      .then((res) => {
        setReport(res.data.report);
        setHistory(res.data.history || []);
      })
      .catch(() => toast.error("Failed to load report details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReport(); }, [id]);

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setIsSubmitting(true);
    api.post(`/reports/${id}/comment`, { comment: newComment })
      .then(() => {
        setReport(prev => prev ? { ...prev, review_note: newComment } : null);
        setNewComment('');
        toast.success("Review note saved");
        loadReport();
      })
      .catch(() => toast.error("Failed to add comment"))
      .finally(() => setIsSubmitting(false));
  };

  const handleApprove = () => {
    setIsSubmitting(true);
    api.post(`/reports/${id}/approve`)
      .then(() => {
        toast.success("Report Approved");
        loadReport();
      })
      .catch(() => toast.error("Failed to approve"))
      .finally(() => setIsSubmitting(false));
  };

  const handleReject = () => {
    if (!newComment.trim() && !report?.review_note) {
      toast.error("Please add a review note before rejecting");
      return;
    }
    setIsSubmitting(true);
    api.post(`/reports/${id}/reject`, { review_note: newComment || report?.review_note })
      .then((res) => {
        toast.success("Report Rejected for Revision");
        loadReport();
      })
      .catch(() => toast.error("Failed to reject"))
      .finally(() => setIsSubmitting(false));
  };

  if (loading) {
    return (
      <AppLayout title="Report Details">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted-foreground font-medium">Loading report data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!report) {
    return (
      <AppLayout title="Report Not Found">
        <div className="text-center mt-20 text-muted-foreground">Report not found.</div>
      </AppLayout>
    );
  }

  const cleanDutyTitle = report.duty?.name || report.task?.title?.replace('Report: ', '') || "General Report";
  const teacherName = report.teacher?.name || "Unknown Educator";
  const teacherRole = report.teacher?.role || "Faculty Member";

  const formattedDate = new Date(report.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

  return (
    <AppLayout title="Report Details">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-28 animate-fade-in">

        {/* Top Header Section */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-medium mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all reports
          </button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-2">
                CASE ID: #RPT-{report.id.toString().padStart(4, '0')}-01
              </p>
              <h1 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight mb-2">
                {toTitleCase(cleanDutyTitle)}
              </h1>
              <p className="text-base text-muted-foreground max-w-2xl">
                Detailed performance review for {toTitleCase(cleanDutyTitle)} initiative.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${report.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-emerald-100 text-emerald-800'
                }`}>
                {report.status === 'submitted' ? 'Under Review' :
                  report.status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
              <span className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-sm font-bold shadow-sm">
                Submitted {formattedDate}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">

          {/* LEFT COLUMN (Narrative & Teacher) */}
          <div className="xl:col-span-2 space-y-6">

            {/* Teacher Context Card */}
            <div className="bg-card border border-border shadow-sm rounded-3xl p-6 lg:p-8 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-700 flex items-center justify-center shrink-0 shadow-md">
                  <span className="text-xl sm:text-2xl font-black text-white">{getInitials(teacherName)}</span>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-1">{toTitleCase(teacherName)}</h2>
                  <p className="text-sm font-semibold text-emerald-700">
                    {toTitleCase(teacherRole)}
                  </p>
                </div>
              </div>
              <div className="bg-muted/40 rounded-2xl px-5 py-3 border border-border text-center shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Reports</p>
                <p className="text-2xl font-bold text-emerald-700 leading-none">{history.length + 1}</p>
              </div>
            </div>

            {/* Report Narrative Card */}
            <div className="bg-card border border-border shadow-sm rounded-3xl p-6 lg:p-8">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-3 mb-6">
                <FileText className="w-5 h-5 text-emerald-700" /> Report Narrative
              </h3>

              <div className="prose prose-sm max-w-none text-muted-foreground font-medium leading-relaxed mb-8 whitespace-pre-wrap">
                {report.description || "No narrative provided."}
              </div>

              {/* Attachments Section */}
              {report.attachments && report.attachments.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-4">Attachments</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {report.attachments.map((file) => (
                      <div key={file.id} className="flex items-center gap-4 bg-muted/30 border border-border rounded-2xl p-4 transition-colors hover:bg-muted/50">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                          {file.type === 'document' ? <FileText className="w-5 h-5 text-red-500" /> : <Image className="w-5 h-5 text-emerald-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{file.file_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">Document FILE</p>
                        </div>
                        <button
                          onClick={() => window.open(`http://127.0.0.1:8000/storage/${file.file_path}`, "_blank")}
                          className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center transition-colors"
                        >
                          <Download className="w-4 h-4 text-muted-foreground hover:text-emerald-700 transition-colors" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COLUMN (Actions & Notes) */}
          <div className="space-y-6">

            {/* Action Card */}
            <div className="bg-emerald-700 text-white shadow-lg rounded-3xl p-6 lg:p-8">
              <h3 className="text-xl font-bold mb-6">Administrative Action</h3>

              {report.status === "submitted" ? (
                <div className="space-y-3">
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-white text-emerald-800 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-emerald-50 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" /> Approve Report
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    className="w-full h-12 bg-red-500 text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" /> Reject for Revision
                  </button>

                </div>
              ) : (
                <div className="bg-white/10 rounded-2xl p-6 text-center border border-white/20">
                  {report.status === 'approved' ? (
                    <>
                      <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                      <p className="font-bold text-lg">Report Approved</p>
                      <p className="text-sm text-emerald-100/70 mt-1">This submission has been finalized by administration.</p>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-10 h-10 text-red-300 mx-auto mb-3" />
                      <p className="font-bold text-lg text-white">Report Rejected</p>
                      <p className="text-sm text-red-100/70 mt-1">Returned to faculty for mandatory revision.</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Review Notes Card */}
            <div className="bg-card border border-border shadow-sm rounded-3xl p-6 lg:p-8">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-3 mb-6">
                <MessageSquare className="w-5 h-5 text-emerald-700" /> Review Notes
              </h3>

              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Internal Feedback</p>

              {(report.review_note || newComment) ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-medium text-emerald-800 leading-relaxed whitespace-pre-wrap">
                    {report.review_note || newComment}
                  </p>
                </div>
              ) : null}

              {report.status === "submitted" && (
                <>
                  <textarea
                    className="w-full h-32 p-4 rounded-2xl bg-muted/30 border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60 font-medium mb-4"
                    placeholder="Enter your detailed observations or requested changes here..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />

                  <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500/20" />
                    <span className="text-xs font-semibold text-muted-foreground">Keep these notes private to admins</span>
                  </label>

                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || isSubmitting}
                    className="w-full h-11 bg-white border-2 border-emerald-700 text-emerald-800 hover:bg-emerald-50 rounded-full font-bold text-sm shadow-sm transition-colors"
                  >
                    Save Draft Notes
                  </Button>
                </>
              )}

              {/* Previous Comments / History History */}
              {report.comments && report.comments.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Previous Discussions</p>
                  {report.comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-emerald-800">{getInitials(c.user?.name)}</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {c.user?.name} <span className="font-medium text-muted-foreground ml-1">{new Date(c.created_at).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm font-medium text-muted-foreground mt-1">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </div>

        </div>
      </div>
    </AppLayout>
  );
}
