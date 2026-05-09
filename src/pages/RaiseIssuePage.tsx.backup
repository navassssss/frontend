import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, Loader2, CheckCircle2, ChevronDown, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface ApiCategory {
  id: number;
  name: string;
}

interface ApiUser {
  id: number;
  name: string;
  role: string;
}

const priorities = [
  { id: 'low', label: 'Low' },
  { id: 'medium', label: 'Medium' },
  { id: 'high', label: 'High' },
];

export default function RaiseIssuePage() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [staff, setStaff] = useState<ApiUser[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [responsibleUserId, setResponsibleUserId] = useState<number | null>(null);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);

  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories & staff
  useEffect(() => {
    api.get('/issue-categories')
      .then(res => setCategories(res.data))
      .catch(() => toast.error("Failed to load categories"));

    api.get('/teachers?scope=assignable')
      .then(res => setStaff(res.data))
      .catch(() => toast.error("Failed to load responsible persons"));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles([...files, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return toast.error("Enter issue title");
    if (!description.trim()) return toast.error("Enter issue description");
    if (!categoryId) return toast.error("Select a category");

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("priority", priority);
      formData.append("category_id", String(categoryId));
      if (responsibleUserId) {
        formData.append("responsible_user_id", String(responsibleUserId));
      }

      files.forEach(file => formData.append("attachments[]", file));

      await api.post('/issues', formData);

      toast.success("Issue created successfully!");
      navigate('/issues');

    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.response?.data?.errors?.description?.[0] || "Failed to submit issue";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/10 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/issues')} className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">Raise New Issue</h1>
            <p className="text-muted-foreground">Submit a ticket for maintenance or improvements</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="border-muted shadow-sm">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Details Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">Issue Details</h3>
                </div>

                <div className="grid gap-5">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Issue Title <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Brief summary of the problem..."
                      className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full min-h-[120px] p-3 rounded-md border border-muted-foreground/20 bg-muted/30 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      placeholder="Please provide specific details..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Classification Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold tracking-tight">Classification</h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Category */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Category <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCategory(!isCreatingCategory);
                          setNewCategory("");
                          setShowCategoryDropdown(false);
                        }}
                        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className="w-full h-10 bg-muted/30 border border-muted-foreground/20 rounded-md px-3 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className={!categoryId ? "text-muted-foreground" : ""}>
                          {categoryId ? categories.find(c => c.id === categoryId)?.name : "Select category"}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </button>

                      {showCategoryDropdown && (
                        <Card className="absolute w-full z-40 mt-1 shadow-md border-muted">
                          <CardContent className="p-1">
                            {categories.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                className="block w-full px-3 py-2 text-sm text-left hover:bg-muted rounded-md transition-colors"
                                onClick={() => {
                                  setCategoryId(c.id);
                                  setShowCategoryDropdown(false);
                                }}
                              >
                                {c.name}
                              </button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>

                  {/* Responsible Person */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Assign To
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                        className="w-full h-10 bg-muted/30 border border-muted-foreground/20 rounded-md px-3 flex items-center justify-between text-sm hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <span className={!responsibleUserId ? "text-muted-foreground" : ""}>
                          {responsibleUserId ? staff.find(s => s.id === responsibleUserId)?.name : "Select person (optional)"}
                        </span>
                        <ChevronDown className="w-4 h-4 opacity-50" />
                      </button>

                      {showStaffDropdown && (
                        <Card className="absolute w-full z-40 mt-1 max-h-40 overflow-auto shadow-md border-muted">
                          <CardContent className="p-1">
                            {staff.map(s => (
                              <button
                                key={s.id}
                                type="button"
                                className="block w-full px-3 py-2 text-sm text-left hover:bg-muted rounded-md transition-colors"
                                onClick={() => {
                                  setResponsibleUserId(s.id);
                                  setShowStaffDropdown(false);
                                }}
                              >
                                {s.name}
                              </button>
                            ))}
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                </div>

                {/* Create Category Card - Appears right after Category/Responsible grid */}
                {isCreatingCategory && (
                  <Card className="border-2 border-primary/20 shadow-lg animate-slide-up">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">Create New Category</h3>
                          <p className="text-xs text-muted-foreground">Add a custom category for your issue</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Category Name</label>
                        <Input
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g., Maintenance, IT Support, Facilities..."
                          className="h-12 border-2 focus:border-primary"
                          autoFocus
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1 h-11 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-md"
                          onClick={async () => {
                            if (!newCategory.trim()) return toast.error("Category name required");

                            try {
                              const res = await api.post('/issue-categories', { name: newCategory });

                              setCategories([...categories, res.data]);
                              setCategoryId(res.data.id);
                              setIsCreatingCategory(false);
                              setShowCategoryDropdown(false);
                              toast.success("Category added!");
                            } catch {
                              toast.error("Failed to create category");
                            }
                          }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Save Category
                        </Button>

                        <Button
                          variant="outline"
                          className="flex-1 h-11 border-2"
                          onClick={() => setIsCreatingCategory(false)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}


                {/* Priority */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {priorities.map(p => (
                      <label key={p.id} className="cursor-pointer group">
                        <input
                          type="radio"
                          name="priority"
                          checked={priority === p.id}
                          onChange={() => setPriority(p.id as any)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg border transition-all",
                          priority === p.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-muted hover:border-primary/50 hover:bg-muted/50"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full mb-2 transition-transform group-hover:scale-110",
                            p.id === 'high' ? "bg-destructive shadow-sm shadow-destructive/40" :
                              p.id === 'medium' ? "bg-warning shadow-sm shadow-warning/40" : "bg-primary shadow-sm shadow-primary/40"
                          )} />
                          <span className={cn(
                            "text-xs font-medium uppercase tracking-wider",
                            priority === p.id ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {p.label}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

              </div>


              {/* Attachments Section */}
              {/* Attachments Section */}
              <div className="space-y-4 pt-4 border-t border-dashed">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">Attachments</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf"
                      />
                      <div className="h-12 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                        <Upload className="w-4 h-4" />
                        Drop files here or click to upload
                      </div>
                    </label>

                    <label>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Camera className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </label>
                  </div>

                  {files.map((file, i) => (
                    <Card key={i} className="p-3 flex justify-between items-center bg-muted/30">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <button type="button" onClick={() => removeFile(i)}>
                        <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" className="px-8" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Submit Issue
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
