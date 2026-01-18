import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Duty {
  id: number;
  name: string;
  type: string;
}

// Helper to convert name to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function SubmitReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dutyIdFromUrl = searchParams.get('dutyId');
  const [duties, setDuties] = useState<Duty[]>([]);
  const [selectedDuty, setSelectedDuty] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDuties();
  }, []);

  const loadDuties = async () => {
    try {
      const { data } = await api.get('/duties');
      setDuties(data);

      // Pre-select duty if dutyId is in URL
      if (dutyIdFromUrl) {
        setSelectedDuty(dutyIdFromUrl);
      }
    } catch (error) {
      console.error('Failed to load duties', error);
      toast.error('Failed to load duties');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDuty) {
      toast.error("Please select a duty");
      return;
    }

    if (!description.trim()) {
      toast.error("Please add a description");
      return;
    }

    const formData = new FormData();
    formData.append("duty_id", selectedDuty);
    formData.append("description", description);

    files.forEach((file) => {
      formData.append("attachments[]", file);
    });

    setIsSubmitting(true);

    api.post("/reports", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
      .then(() => {
        setIsSuccess(true);
        toast.success("Report Submitted!");
        setTimeout(() => navigate("/duties"), 1500);
      })
      .catch(() => toast.error("Failed to submit report"))
      .finally(() => setIsSubmitting(false));
  };


  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Report Submitted!</h2>
          <p className="text-muted-foreground mt-2">Your report has been recorded successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-2xl lg:max-w-4xl mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold text-foreground ml-3">Submit Report</h1>
        </div>
      </header>

      <main className="p-3 max-w-2xl lg:max-w-4xl mx-auto pb-20">
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in">
          {/* Duty Selection */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Select Duty <span className="text-destructive">*</span>
            </label>
            {isLoading ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : duties.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No duties available</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {duties.map((duty) => (
                  <button
                    key={duty.id}
                    type="button"
                    onClick={() => setSelectedDuty(String(duty.id))}
                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-200 text-left ${selectedDuty === String(duty.id)
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-card border border-border hover:border-primary/30 text-foreground'
                      }`}
                  >
                    {toTitleCase(duty.name)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what was accomplished..."
              className="w-full h-28 px-4 py-3 rounded-xl border border-input bg-card text-base resize-none transition-all duration-200 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Attachments</label>

            <div className="flex gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <div className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-foreground">Upload files</span>
                </div>
              </label>
              <label className="flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center w-11 h-11 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-all">
                  <Camera className="w-4 h-4 text-teal-600" />
                </div>
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                {files.map((file, index) => (
                  <Card key={index} variant="flat">
                    <CardContent className="p-2.5 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground flex-1 truncate">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-destructive-light rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-background border-t border-border">
            <div className="max-w-2xl lg:max-w-4xl mx-auto">
              <Button
                type="submit"
                variant="touch"
                className="w-full"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
