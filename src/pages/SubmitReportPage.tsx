import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, Loader2, CheckCircle2, ClipboardList, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Duty { id: number; name: string; type: string; }

const toTitleCase = (str: string) =>
  str?.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || str;

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dutyIdFromUrl = searchParams.get('dutyId');

  const [duties, setDuties] = useState<Duty[]>([]);
  const [selectedDuty, setSelectedDuty] = useState(dutyIdFromUrl || '');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get('/duties')
      .then(({ data }) => {
        setDuties(data);
        if (dutyIdFromUrl) setSelectedDuty(dutyIdFromUrl);
      })
      .catch(() => toast.error('Failed to load duties'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDuty) return toast.error('Please select a duty');
    if (!description.trim()) return toast.error('Please add a description');

    const formData = new FormData();
    formData.append('duty_id', selectedDuty);
    formData.append('description', description);
    files.forEach(f => formData.append('attachments[]', f));

    setIsSubmitting(true);
    api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(() => {
        setIsSuccess(true);
        toast.success('Report submitted successfully');
        setTimeout(() => navigate('/duties'), 1500);
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to submit report'))
      .finally(() => setIsSubmitting(false));
  };

  if (isSuccess) {
    return (
      <AppLayout title="Submit Report">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-scale-in max-w-sm px-6">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Report Submitted</h2>
            <p className="text-muted-foreground mt-2 text-sm">Your operational report has been securely recorded.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedDutyObj = duties.find(d => String(d.id) === selectedDuty);

  return (
    <AppLayout title="Submit Report">
      <div className="max-w-xl mx-auto pb-32">
        {/* Header */}
        <div className="p-4 lg:p-6 lg:pb-2 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Duties
          </button>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Submit Duty Report</h1>
          <p className="text-xs text-muted-foreground mt-1">Select an active assignment to submit your operational update.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-6 space-y-8">
          
          {/* Section: Duty Selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" /> Assignment Context
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : duties.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border text-center">
                <p className="text-sm text-muted-foreground">No active duties assigned to you.</p>
              </div>
            ) : (
              <div className="grid gap-2">
                {duties.map((duty) => {
                  const isSelected = selectedDuty === String(duty.id);
                  return (
                    <button
                      key={duty.id}
                      type="button"
                      onClick={() => setSelectedDuty(String(duty.id))}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-primary/50 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                          : 'border-border bg-card hover:bg-muted/30'
                      }`}
                    >
                      <div className="flex flex-col">
                        <p className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {toTitleCase(duty.name)}
                        </p>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide mt-0.5">
                          {duty.type || 'Responsibility'}
                        </p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-input bg-transparent'}`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Report Description */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Report Summary
            </h2>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Summarize completed work, issues encountered, outcomes, and pending actions."
                rows={6}
                className="w-full p-4 rounded-xl border border-input bg-card text-sm resize-none transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-medium text-muted-foreground bg-card px-1">
                {description.length} chars
              </div>
            </div>
          </div>

          {/* Section: Attachments */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-primary" /> Attachments
              </h2>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer">
                <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-card hover:bg-muted/50 transition-colors shadow-sm">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Upload Files</span>
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-card hover:bg-muted/50 transition-colors shadow-sm">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">Take Photo</span>
                </div>
              </label>
            </div>

            {files.length > 0 && (
              <div className="grid gap-2 mt-3">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-muted/30 rounded-lg border border-border/50 group">
                    <div className="w-8 h-8 rounded bg-background border border-border flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                      className="w-7 h-7 rounded hover:bg-destructive/10 flex items-center justify-center transition-colors opacity-70 hover:opacity-100 group-hover:opacity-100">
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Sticky Submit Footer */}
        <div className="fixed bottom-0 left-0 lg:left-60 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-20">
          <div className="max-w-xl mx-auto flex items-center gap-4">
            <div className="flex-1 hidden sm:block">
              {selectedDutyObj ? (
                <p className="text-xs text-muted-foreground truncate">Reporting on <span className="font-semibold text-foreground">{selectedDutyObj.name}</span></p>
              ) : (
                <p className="text-xs text-muted-foreground">Please select an assignment</p>
              )}
            </div>
            <Button
              type="submit"
              onClick={handleSubmit}
              className="w-full sm:w-auto px-8 h-11 rounded-lg font-semibold shadow-md transition-all"
              disabled={isSubmitting || isLoading || !selectedDuty || !description.trim()}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing</>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

