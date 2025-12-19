import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Camera, FileText, X, Loader2, CheckCircle2, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
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

    } catch {
      toast.error("Failed to submit issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 border-b">
        <div className="h-14 px-4 flex items-center max-w-lg mx-auto">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold ml-3">Raise Issue</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto pb-24">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue Title"
          />

          {/* Description */}
          <textarea
            className="w-full h-28 p-3 rounded-xl bg-secondary"
            placeholder="Describe the issue..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm">Category *</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full h-12 bg-secondary rounded-xl px-4 flex items-center justify-between"
              >
                {categoryId
                  ? categories.find(c => c.id === categoryId)?.name
                  : "Select category"}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showCategoryDropdown && (
                <Card className="absolute w-full z-40 mt-1">
                  <CardContent className="p-1">
                    {categories.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-secondary"
                        onClick={() => {
                          setCategoryId(c.id);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {c.name}
                      </button>
                    ))}

                    {/* Add New Category Option */}
                    <button
                      type="button"
                      className="block w-full px-3 py-2 mt-1 text-left bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                      onClick={() => {
                        setIsCreatingCategory(true);
                        setNewCategory("");
                      }}
                    >
                      ➕ Add New Category
                    </button>

                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Responsible Person */}
          <div>
            <label className="text-sm">Responsible</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStaffDropdown(!showStaffDropdown)}
                className="w-full h-12 bg-secondary rounded-xl px-4 flex items-center justify-between"
              >
                {responsibleUserId
                  ? staff.find(s => s.id === responsibleUserId)?.name
                  : "Select person/team"}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showStaffDropdown && (
                <Card className="absolute w-full z-40 mt-1 max-h-40 overflow-auto">
                  <CardContent className="p-1">
                    {staff.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        className="block w-full px-3 py-2 text-left hover:bg-secondary"
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
          {isCreatingCategory && (
            <div className="mt-2 p-3 bg-card border rounded-lg space-y-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter new category"
              />

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={async () => {
                    if (!newCategory.trim()) return toast.error("Category name required");

                    try {
                      const res = await api.post('/issue-categories', { name: newCategory });

                      setCategories([...categories, res.data]);
                      setCategoryId(res.data.id);
                      setIsCreatingCategory(false);
                      toast.success("Category added!");
                    } catch {
                      toast.error("Failed to create category");
                    }
                  }}
                >
                  Save
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreatingCategory(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}


          {/* Priority */}
          <div className="flex gap-2">
            {priorities.map(p => (
              <Button
                key={p.id}
                type="button"
                variant={priority === p.id ? "default" : "secondary"}
                className="flex-1"
                onClick={() => setPriority(p.id as any)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {/* Attachments */}
          <label className="text-sm">Attachments</label>
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf"
              />
              <div className="h-12 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-5 h-5" />
                Upload
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
              <div className="w-12 h-12 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer">
                <Camera className="w-5 h-5" />
              </div>
            </label>
          </div>

          {files.map((file, i) => (
            <Card key={i} className="p-3 flex justify-between">
              <span>{file.name}</span>
              <button onClick={() => removeFile(i)}>
                <X className="w-4 h-4 text-red-500" />
              </button>
            </Card>
          ))}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : "Submit Issue"}
          </Button>

        </form>
      </main>
    </div>
  );
}
