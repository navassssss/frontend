import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, Loader2, CheckCircle2, ClipboardList } from 'lucide-react';
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
        toast.success('Report submitted!');
        setTimeout(() => navigate('/duties'), 1500);
      })
      .catch(() => toast.error('Failed to submit report'))
      .finally(() => setIsSubmitting(false));
  };

  if (isSuccess) {
    return (
      <AppLayout title="Submit Report">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Report Submitted!</h2>
            <p className="text-muted-foreground mt-1 text-sm">Your report has been recorded successfully.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const selectedDutyObj = duties.find(d => String(d.id) === selectedDuty);

  return (
    <AppLayout title="Submit Report">
      <div className="p-4 md:p-6 max-w-2xl mx-auto pb-28 space-y-6">

        {/* Header */}
        <div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Submit Report</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Document your duty completion with details and attachments.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Step 1: Select Duty */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Step 1</p>
              <h2 className="font-bold text-foreground">Select Duty <span className="text-destructive">*</span></h2>
            </div>
            <div className="p-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : duties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No duties available</p>
              ) : (
                <div className="space-y-2">
                  {duties.map((duty) => {
                    const isSelected = selectedDuty === String(duty.id);
                    return (
                      <button
                        key={duty.id}
                        type="button"
                        onClick={() => setSelectedDuty(String(duty.id))}
                        className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-left ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-muted/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-primary/10' : 'bg-muted'}`}>
                            <ClipboardList className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <p className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {toTitleCase(duty.name)}
                            </p>
                            <p className="text-[10px] text-muted-foreground capitalize">{duty.type || 'Responsibility'}</p>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Step 2</p>
              <h2 className="font-bold text-foreground">Report Description <span className="text-destructive">*</span></h2>
            </div>
            <div className="p-4">
              {selectedDutyObj && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <ClipboardList className="w-3.5 h-3.5 text-primary shrink-0" />
                  <p className="text-xs font-semibold text-primary">Reporting for: {toTitleCase(selectedDutyObj.name)}</p>
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what was accomplished, any issues encountered, and overall status..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm resize-none transition-all placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted-foreground mt-1.5 text-right">{description.length} characters</p>
            </div>
          </div>

          {/* Step 3: Attachments */}
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Step 3</p>
              <h2 className="font-bold text-foreground">Attachments <span className="text-muted-foreground font-normal text-sm">(Optional)</span></h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <label className="flex-1 cursor-pointer">
                  <input type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx" />
                  <div className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Upload files</span>
                  </div>
                </label>
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                  <div className="flex items-center justify-center gap-2 h-12 w-14 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Camera className="w-4 h-4 text-muted-foreground" />
                  </div>
                </label>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                      <button type="button" onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                        className="w-6 h-6 rounded-full hover:bg-destructive/10 flex items-center justify-center transition-colors">
                        <X className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-12 rounded-xl font-bold text-base shadow-md hover:shadow-lg transition-all"
            disabled={isSubmitting || isLoading || !selectedDuty || !description.trim()}
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</>
            ) : (
              'Submit Report'
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
