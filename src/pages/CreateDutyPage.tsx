import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, X, Check, Info, FileText, Calendar as CalendarIcon,
  Bold, Italic, List, Link as LinkIcon, Users, Clock, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import api from '../lib/api';
import { AppLayout } from '@/components/layout/AppLayout';

type DutyType = 'responsibility';
type Frequency = 'none' | 'daily' | 'weekly' | 'monthly';

interface Teacher {
  id: string;
  name: string;
  initials: string;
  department: string;
}

export default function CreateDutyPage() {
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/teachers')
      .then(res => {
        const teachers = res.data.map((t: any) => ({
          ...t,
          initials: t.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        }));
        setAvailableTeachers(teachers);
      })
      .catch(() => toast.error("Failed to load teachers"));
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    type: 'responsibility' as DutyType,
    frequency: 'none' as Frequency,
    description: '',
  });

  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [showTeacherSelector, setShowTeacherSelector] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTeacher = (teacherId: string) => {
    setSelectedTeachers(prev =>
      prev.includes(teacherId)
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  const removeTeacher = (teacherId: string) => {
    setSelectedTeachers(prev => prev.filter(id => id !== teacherId));
  };

  const typeOptions: { value: DutyType; label: string }[] = [
    { value: 'responsibility', label: 'Responsibility' },
  ];

  const frequencyOptions: { value: Frequency; label: string }[] = [
    { value: 'none', label: 'One-time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a duty name');
      return;
    }

    setIsSubmitting(true);

    api.post('/duties', {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      frequency: formData.frequency,
      teacher_ids: selectedTeachers,
    })
      .then(() => {
        toast.success("Duty created successfully!");
        navigate("/duties");
      })
      .catch(() => toast.error("Failed to create duty"))
      .finally(() => setIsSubmitting(false));
  };

  return (
    <AppLayout title="Create Duty">
      <div className="min-h-screen bg-slate-50/50 pb-24">
        
        {/* Top Header Match */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-emerald-900 tracking-tight">Create New Institutional Duty</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Save Draft
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-full shadow-sm transition-colors disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Create Duty'}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* General Information Card */}
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
                    <Info className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">General Information</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-8">Define the core identity of this institutional assignment.</p>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                      DUTY NAME
                    </label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 rounded-2xl px-5 py-4 text-sm font-semibold text-slate-900 transition-all placeholder:text-slate-400"
                      placeholder="e.g. Senior Examination Invigilation"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        DUTY TYPE
                      </label>
                      <div className="flex bg-slate-50 rounded-2xl p-1.5 border border-slate-100">
                        {typeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setFormData({ ...formData, type: option.value })}
                            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              formData.type === option.value
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">
                        TEACHER ASSIGNMENT
                      </label>
                      <div 
                        onClick={() => setShowTeacherSelector(true)}
                        className="w-full bg-slate-50 hover:bg-slate-100 cursor-pointer border border-slate-100 rounded-2xl px-5 py-3 flex items-center justify-between text-sm font-semibold text-slate-600 transition-all"
                      >
                         <span>
                           {selectedTeachers.length > 0 
                             ? `${selectedTeachers.length} staff selected` 
                             : 'Select faculty'}
                         </span>
                         <span className="text-emerald-700 text-xs font-bold">Edit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Duty Description Card */}
              <div className="bg-white rounded-[2rem] p-6 lg:p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
                    <FileText className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">Duty Description</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-8">Detailed expectations and responsibilities for the assigned staff.</p>

                <div className="border border-slate-100 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all bg-slate-50">
                  {/* Fake Rich Text Toolbar */}
                  <div className="bg-slate-100/50 border-b border-slate-100 px-4 py-3 flex items-center gap-4">
                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><Bold className="w-4 h-4" /></button>
                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><Italic className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><List className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <button className="text-slate-500 hover:text-slate-900 transition-colors"><LinkIcon className="w-4 h-4" /></button>
                  </div>
                  
                  <textarea
                    placeholder="Outline the primary objectives and key deliverables of this role..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={8}
                    className="w-full bg-transparent p-5 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none resize-y"
                  />
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
              
              {/* Schedule & Frequency */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center">
                    <CalendarIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-emerald-900">Schedule & Frequency</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-6">Configure when this duty recurs.</p>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">
                    RECURRING PATTERN
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {frequencyOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFormData({ ...formData, frequency: option.value })}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                          formData.frequency === option.value
                            ? 'bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-100'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
        
        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 p-4 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-4 z-40">
          <div className="text-xs font-medium text-slate-400 italic text-center md:text-left">
            Last autosaved at {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Draft is visible to the<br className="hidden md:block" /> department head.
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-3 md:py-2.5 text-slate-700 font-bold text-sm rounded-full hover:bg-slate-100 transition-colors flex-1 md:flex-none"
            >
              Cancel & Discard
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 md:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-full shadow-lg shadow-emerald-700/20 transition-all flex-1 md:flex-none disabled:opacity-70"
            >
              {isSubmitting ? 'Creating...' : 'Confirm & Create Duty'}
            </button>
          </div>
        </div>

      </div>

      {/* Teacher Selector Modal */}
      {showTeacherSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in p-4">
          <Card className="w-full max-w-md max-h-[85vh] overflow-hidden animate-scale-in rounded-[2rem] border-0 shadow-2xl flex flex-col bg-white">
            <CardContent className="p-6 flex flex-col flex-1 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Select Faculty</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-1">Assign staff to this duty.</p>
                </div>
                <button 
                  onClick={() => setShowTeacherSelector(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Teacher List */}
              <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2">
                {availableTeachers.map(teacher => (
                  <button
                    key={teacher.id}
                    onClick={() => toggleTeacher(teacher.id)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl transition-all border ${
                      selectedTeachers.includes(teacher.id)
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-white/10"></div>
                      <span className="text-xs font-bold text-white relative z-10">
                        {teacher.initials}
                      </span>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-sm text-slate-900">{teacher.name}</p>
                      <p className="text-xs font-medium text-slate-500">{teacher.department}</p>
                    </div>
                    {selectedTeachers.includes(teacher.id) && (
                      <div className="w-6 h-6 rounded-full bg-emerald-700 flex items-center justify-center shadow-sm">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-700/20 transition-all"
                  onClick={() => setShowTeacherSelector(false)}
                >
                  Done ({selectedTeachers.length} selected)
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}
