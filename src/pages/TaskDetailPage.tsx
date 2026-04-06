import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Upload,
  Camera,
  Loader2,
  X,
  ChevronRight,
  User,
  Info,
  Bold,
  Italic,
  List,
  AlignLeft,
  School,
  BookOpen,
  Share2,
  MoreVertical,
  CloudUpload,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
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

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: '#b45309', bg: '#fef3c7', icon: <AlertCircle className="w-3 h-3" /> },
  completed: { label: 'Completed', color: '#065f46', bg: '#d1fae5', icon: <CheckCircle2 className="w-3 h-3" /> },
  missed: { label: 'Missed', color: '#991b1b', bg: '#fee2e2', icon: <XCircle className="w-3 h-3" /> },
  submitted: { label: 'Submitted', color: '#1e40af', bg: '#dbeafe', icon: <CheckCircle2 className="w-3 h-3" /> },
  approved: { label: 'Approved', color: '#065f46', bg: '#d1fae5', icon: <CheckCircle2 className="w-3 h-3" /> },
  rejected: { label: 'Rejected', color: '#991b1b', bg: '#fee2e2', icon: <XCircle className="w-3 h-3" /> },
};

function StatusPill({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: '#374151', bg: '#f3f4f6', icon: null };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
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
  const [charCount, setCharCount] = useState(0);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [reports, setReports] = useState<any[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const execFormat = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    // Sync state
    const html = editorRef.current?.innerHTML ?? '';
    const text = editorRef.current?.innerText ?? '';
    setDescription(html);
    setCharCount(text.replace(/\n/g, '').length);
    // Update active formats
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('insertUnorderedList')) formats.add('list');
    setActiveFormats(formats);
  }, []);

  const handleEditorInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    const text = editorRef.current?.innerText ?? '';
    setDescription(html);
    setCharCount(text.replace(/\n/g, '').length);
    const formats = new Set<string>();
    if (document.queryCommandState('bold')) formats.add('bold');
    if (document.queryCommandState('italic')) formats.add('italic');
    if (document.queryCommandState('insertUnorderedList')) formats.add('list');
    setActiveFormats(formats);
  }, []);

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
    return (
      <AppLayout title="Task Details">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm text-muted-foreground font-medium">Loading task details...</p>
          </div>
        </div>
      </AppLayout>
    );
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
    const plainText = editorRef.current?.innerText?.trim() ?? '';
    if (!plainText) {
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

  const latestReport = reports[0] ?? null;

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <AppLayout title="Task Details">
      <div className="min-h-screen bg-slate-50/60 p-4 md:p-6 pb-28">
        <div className="max-w-6xl mx-auto space-y-5">

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <button onClick={() => navigate('/')} className="hover:text-emerald-700 transition-colors">Dashboard</button>
            <ChevronRight className="w-3 h-3" />
            <button onClick={() => navigate('/tasks')} className="hover:text-emerald-700 transition-colors">Tasks</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Task Details</span>
          </div>

          {/* Main Grid: Left (main) + Right (sidebar) */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5">

            {/* ═══════════════════════════════════════ LEFT COLUMN */}
            <div className="space-y-4">

              {/* ── Header Card ── */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                {/* Top row: title + action icons */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusPill status={task.status} />
                      {task.duty?.name && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {task.duty.name}
                        </span>
                      )}
                    </div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
                      {task.title}
                    </h1>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-500">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Meta info row */}
                <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                  {/* Scheduled Date */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Schedule Date</p>
                      <p className="text-sm font-black text-slate-700">{task.scheduled_date}</p>
                    </div>
                  </div>

                  {/* Scheduled Time */}
                  {task.scheduled_time && (
                    <>
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Schedule Time</p>
                          <p className="text-sm font-black text-slate-700">{task.scheduled_time.slice(0, 5)}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Assigned To */}
                  {task.assigned_to?.name && (
                    <>
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center text-white text-[10px] font-black shrink-0">
                          {getInitials(task.assigned_to.name)}
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Assigned To</p>
                          <p className="text-sm font-black text-slate-700">{task.assigned_to.name}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* ── Instructions ── */}
              {task.instructions && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-slate-100">
                    <Info className="w-4 h-4 text-blue-500" />
                    <h3 className="font-bold text-slate-700 text-sm">Instructions</h3>
                  </div>
                  <div className="px-5 py-4">
                    <div className="bg-blue-50/60 border-l-4 border-blue-400 rounded-r-xl px-4 py-3">
                      <p className="text-sm text-slate-600 leading-relaxed">{task.instructions}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Submit Report Section ── */}
              {isMine && !isCompleted && (
                <div className="space-y-4">
                  {/* CTA Banner */}
                  <div className="bg-emerald-700 rounded-2xl px-5 py-4 text-white">
                    <h2 className="font-black text-base">Submit Daily Report</h2>
                    <p className="text-emerald-100 text-xs mt-0.5">Fill in the sections below to finalize your task.</p>
                  </div>

                  {/* Step 1: Description */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Step 1</p>
                        <h2 className="font-bold text-slate-800 text-sm">
                          Report Description <span className="text-red-500">*</span>
                        </h2>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">RICH TEXT FORMAT</span>
                    </div>
                    <div className="p-4">
                      {/* Rich text toolbar — functional */}
                      <div className="flex items-center gap-0.5 mb-2 p-1 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors text-slate-500 hover:text-slate-800 ${
                            activeFormats.has('bold') ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-white'
                          }`}
                          title="Bold (Ctrl+B)"
                        >
                          <Bold className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); execFormat('italic'); }}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors text-slate-500 hover:text-slate-800 ${
                            activeFormats.has('italic') ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-white'
                          }`}
                          title="Italic (Ctrl+I)"
                        >
                          <Italic className="w-3.5 h-3.5" />
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-0.5" />
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); execFormat('insertUnorderedList'); }}
                          className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors text-slate-500 hover:text-slate-800 ${
                            activeFormats.has('list') ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-white'
                          }`}
                          title="Bullet list"
                        >
                          <List className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); execFormat('justifyLeft'); }}
                          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white transition-colors text-slate-500 hover:text-slate-800"
                          title="Align left"
                        >
                          <AlignLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* contentEditable editor */}
                      <div
                        ref={editorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handleEditorInput}
                        onKeyUp={handleEditorInput}
                        onMouseUp={handleEditorInput}
                        data-placeholder="Provide a detailed account of the academic or administrative activities conducted."
                        className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_strong]:font-bold [&_em]:italic empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                      <p className="text-[10px] text-slate-400 mt-1.5 text-right">{charCount} characters</p>
                    </div>
                  </div>

                  {/* Step 2: Attachments */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Step 2</p>
                      <h2 className="font-bold text-slate-800 text-sm">
                        Attachments <span className="text-slate-400 font-normal">(Optional)</span>
                      </h2>
                    </div>
                    <div className="p-4 space-y-3">
                      <label className="block cursor-pointer">
                        <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                        <div className="flex flex-col items-center justify-center gap-2.5 py-8 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CloudUpload className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-bold text-slate-600">Drag & drop files here</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              or{' '}
                              <span className="text-emerald-600 font-bold hover:underline">browse your computer</span>
                            </p>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">Supported: PDF, PNG, JPEG, JPG, DOC</p>
                        </div>
                      </label>

                      <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                          <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                          <div className="flex items-center justify-center gap-2 h-10 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-xs font-bold text-slate-500">
                            <Upload className="w-3.5 h-3.5" /> Upload Files
                          </div>
                        </label>
                        <label className="cursor-pointer">
                          <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                          <div className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-xs font-bold text-slate-500">
                            <Camera className="w-3.5 h-3.5" /> Camera
                          </div>
                        </label>
                      </div>

                      {files.length > 0 && (
                        <div className="space-y-2">
                          {files.map((file, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="text-sm text-slate-700 flex-1 truncate font-medium">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                                className="w-6 h-6 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors"
                              >
                                <X className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 rounded-xl font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => toast.info("Draft saved")}
                    >
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !description.trim()}
                      className="flex-[2] h-11 rounded-xl font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm hover:shadow-md transition-all"
                    >
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit Report</>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* If not mine or completed — show read-only state */}
              {(!isMine || isCompleted) && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">Task {task.status === 'completed' ? 'Completed' : 'Assigned'}</p>
                  <p className="text-sm text-slate-400 mt-1">
                    {task.status === 'completed'
                      ? 'This task has been marked as completed.'
                      : 'You are not assigned to submit a report for this task.'}
                  </p>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════ RIGHT COLUMN (Sidebar) */}
            <div className="space-y-4">

              {/* ── Latest Submission ── */}
              {latestReport ? (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-700 text-sm">Latest Submission</h3>
                    <StatusPill status={latestReport.status} />
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-medium">Submitted On</span>
                      <span className="font-bold text-slate-700">
                        {new Date(latestReport.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>

                    {latestReport.review_note && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">Feedback</p>
                        <p className="text-xs text-red-700 leading-relaxed">{latestReport.review_note}</p>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      onClick={() => navigate(`/reports/${latestReport.id}`)}
                    >
                      View Full Report
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">No submissions yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Submit your first report below</p>
                </div>
              )}

              {/* ── Revision History ── */}
              {reports.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h3 className="font-bold text-slate-700 text-sm">Revision History</h3>
                  </div>
                  <div className="p-4">
                    <div className="relative pl-4 space-y-4">
                      <div className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-slate-200" />
                      {reports.map((rep, index) => {
                        const dotColor =
                          rep.status === 'approved' ? 'bg-emerald-500' :
                          rep.status === 'rejected' ? 'bg-red-500' :
                          'bg-amber-400';
                        return (
                          <div key={rep.id} className="relative">
                            <div className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white ${dotColor} shadow-sm`} />
                            <div className="space-y-0.5 mb-1.5">
                              <p className="text-xs font-black text-slate-700">
                                {rep.status === 'rejected' ? 'Submission Rejected' :
                                 rep.status === 'approved' ? 'Report Approved' :
                                 index === reports.length - 1 ? 'Draft Created' : 'Report Submitted'}
                              </p>
                              {rep.review_note && (
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                  By Authority: Supervisor<br />"{rep.review_note}"
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400 font-medium">
                                {new Date(rep.created_at).toLocaleString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/reports/${rep.id}`)}
                              className="text-[11px] text-emerald-600 font-bold hover:underline"
                            >
                              View Details →
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Academic Context ── */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-700 text-sm">Academic Context</h3>
                </div>
                <div className="p-4 space-y-3">
                  {task.duty?.name && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        <School className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Faculty of Arts</p>
                        <p className="text-xs font-bold text-slate-700">Library Department</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {task.duty?.name ?? 'Standard Academic'}
                      </p>
                      <p className="text-xs font-bold text-slate-700">Report Category</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
            {/* END RIGHT COLUMN */}

          </div>
        </div>
      </div>
    </AppLayout>
  );
}
