import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar,
    Award,
    FileText,
    Clock,
    Edit,
    User,
    Download,
    CheckSquare,
    Users,
    CheckCircle,
    ClipboardCheck,
    Search,
    Filter,
    ArrowUpDown,
    ArrowLeft,
    X,
    Layers
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/layout/AppLayout';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import api from '@/lib/api';

interface Submission {
    id: number;
    studentId: number;
    studentName: string;
    email: string;
    rollNumber: string;
    status: 'pending' | 'submitted' | 'evaluated';
    submittedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
    fileUrl: string | null;
}

interface WorkDetail {
    id: number;
    title: string;
    description: string;
    level: number;
    week: number;
    subjectName: string;
    className: string;
    toolMethod: string;
    issuedDate: string;
    dueDate: string;
    maxMarks: number;
    submissionType: string;
    submissions: Submission[];
}

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getStatusPill = (status: string, marks?: number, maxMarks?: number) => {
    if (status === 'evaluated' && marks !== undefined && maxMarks) {
        const percent = (marks / maxMarks) * 100;
        let grade = 'C';
        if (percent >= 90) grade = 'A';
        else if (percent >= 80) grade = 'B';
        else if (percent < 50) grade = 'F';
        
        return (
            <span className="inline-flex items-center px-3 py-1 bg-[#4ade80] text-emerald-900 text-[11px] font-black rounded-full whitespace-nowrap">
                Graded ({grade})
            </span>
        );
    }
    
    if (status === 'submitted') {
        return (
            <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase tracking-wider rounded-full whitespace-nowrap">
                Submitted
            </span>
        );
    }
    
    return (
        <span className="inline-flex items-center px-3 py-1 bg-slate-200 text-slate-500 text-[11px] font-black uppercase tracking-wider rounded-full whitespace-nowrap">
            Pending
        </span>
    );
};

export default function CCEWorkDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [work, setWork] = useState<WorkDetail | null>(null);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [marks, setMarks] = useState('');
    const [feedback, setFeedback] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkMarks, setBulkMarks] = useState('');
    const [bulkFeedback, setBulkFeedback] = useState('');
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkLoading, setBulkLoading] = useState(false);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

    // Drive indeterminate state on the select-all checkbox (after each render)
    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const total = work?.submissions?.length ?? 0;
            const some = selectedIds.size > 0 && selectedIds.size < total;
            selectAllCheckboxRef.current.indeterminate = some;
        }
    });

    useEffect(() => {
        if (id) loadWork();
    }, [id]);

    const loadWork = async () => {
        try {
            const { data } = await api.get(`/cce/works/${id}`);
            setWork(data);
        } catch (error) {
            toast.error('Failed to load work details');
        } finally {
            setLoading(false);
        }
    };

    const handleEvaluate = async () => {
        if (!selectedSubmission || !marks) {
            toast.error('Please enter marks');
            return;
        }

        const marksNum = parseFloat(marks);
        if (marksNum < 0 || marksNum > (work?.maxMarks || 100)) {
            toast.error(`Marks must be between 0 and ${work?.maxMarks}`);
            return;
        }

        try {
            await api.post(`/cce/submissions/${selectedSubmission.id}/evaluate`, {
                marks_obtained: marksNum,
                feedback: feedback
            });
            toast.success('Submission evaluated successfully');
            setDialogOpen(false);
            setSelectedSubmission(null);
            setMarks('');
            setFeedback('');
            loadWork();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to evaluate');
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredSubmissions.length && filteredSubmissions.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredSubmissions.map(s => s.id)));
        }
    };

    const toggleSelectOne = (subId: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(subId) ? next.delete(subId) : next.add(subId);
            return next;
        });
    };

    const handleBulkEvaluate = async () => {
        if (!bulkMarks) { toast.error('Enter marks'); return; }
        const marksNum = parseFloat(bulkMarks);
        if (marksNum < 0 || marksNum > (work?.maxMarks || 100)) {
            toast.error(`Marks must be 0–${work?.maxMarks}`);
            return;
        }
        setBulkLoading(true);
        try {
            await api.post('/cce/submissions/bulk-evaluate', {
                submission_ids: [...selectedIds],
                marks_obtained: marksNum,
                feedback: bulkFeedback || null,
            });
            toast.success(`${selectedIds.size} student${selectedIds.size > 1 ? 's' : ''} evaluated!`);
            setBulkDialogOpen(false);
            setBulkMarks('');
            setBulkFeedback('');
            setSelectedIds(new Set());
            loadWork();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Bulk evaluation failed');
        } finally {
            setBulkLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout title="CCE Work" showBack>
                <div className="p-4 text-center">Loading...</div>
            </AppLayout>
        );
    }

    if (!work) {
        return (
            <AppLayout title="CCE Work" showBack>
                <div className="p-4">
                    <Card className="rounded-[2rem] border-0 shadow-sm text-center p-8 bg-white">
                        <p className="text-muted-foreground font-semibold">Work not found</p>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const stats = {
        total: work.submissions.length,
        evaluated: work.submissions.filter(s => s.status === 'evaluated').length,
        submitted: work.submissions.filter(s => s.status !== 'pending').length, // All received files
        pending: work.submissions.filter(s => s.status === 'pending').length
    };

    const evalData = work.submissions.filter(s => s.status === 'evaluated' && s.marksObtained !== null);
    const avgScore = evalData.length > 0 
        ? evalData.reduce((acc, curr) => acc + (curr.marksObtained || 0), 0) / evalData.length 
        : 0;
    const avgScoreStr = work.maxMarks > 0 ? ((avgScore / work.maxMarks) * 100).toFixed(1) : "0.0";
    
    // Top performing submission logic
    let topSubmission = null;
    if (evalData.length > 0) {
        topSubmission = [...evalData].sort((a, b) => (b.marksObtained || 0) - (a.marksObtained || 0))[0];
    }
    const topSubmissionPercent = topSubmission && topSubmission.marksObtained !== null && work.maxMarks > 0 
        ? Math.round((topSubmission.marksObtained / work.maxMarks) * 100) 
        : 0;

    const participationRate = stats.total > 0 ? Math.round((stats.submitted / stats.total) * 100) : 0;
    const markingRate = stats.submitted > 0 ? Math.round((stats.evaluated / stats.submitted) * 100) : 0;
    const pendingMarking = stats.submitted - stats.evaluated;

    const filteredSubmissions = work.submissions.filter(s => 
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
        const order = { submitted: 0, pending: 1, evaluated: 2 };
        return order[a.status] - order[b.status];
    });

    const handleExport = () => {
        const headers = ['Student Name', 'Roll Number', 'Email', 'Status', 'Date Submitted', 'Marks Obtained', 'Max Marks', 'Feedback'];
        const csvContent = [
            headers.join(','),
            ...filteredSubmissions.map(s => {
                const dateSub = s.submittedAt ? format(new Date(s.submittedAt), 'yyyy-MM-dd HH:mm') : 'Not Uploaded';
                const fdbk = s.feedback ? `"${s.feedback.replace(/"/g, '""')}"` : '';
                return `"${s.studentName}","${s.rollNumber}","${s.email}","${s.status}","${dateSub}","${s.marksObtained ?? ''}","${work.maxMarks}",${fdbk}`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${work.title.replace(/\s+/g, '_')}_Submissions.csv`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Export successful!");
    };

    return (
        <AppLayout title="CCE Work Details" showBack={true}>
            <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 pb-24 min-h-screen bg-slate-50/50">
                
                {/* Header Layout */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 pt-2">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <button 
                                onClick={() => navigate('/cce/works')}
                                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 transition-colors -ml-2"
                                title="Back to CCE Works"
                            >
                                <ArrowLeft className="w-5 h-5" strokeWidth={2.5} />
                            </button>
                            <h1 className="text-3xl md:text-[40px] font-black text-slate-800 tracking-tight leading-none">
                                {work.title}
                            </h1>
                        </div>
                        <p className="text-[15px] font-medium text-slate-500 max-w-xl leading-relaxed pl-9">
                            <span className="font-bold text-slate-700">{work.subjectName} ({work.className})</span> · Submissions & Grading Review · Due {format(new Date(work.dueDate), 'MMM d, yyyy')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExport}
                            className="h-11 px-5 rounded-full border border-slate-200 bg-white text-[13px] font-black text-slate-700 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" /> Export Data
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
                    {/* Total Students */}
                    <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden relative group">
                        <div className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Students</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl md:text-[44px] font-black text-slate-800 leading-none">{stats.total}</span>
                                <Users className="w-12 h-12 text-slate-100 absolute right-6 top-8 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                            </div>
                            <p className="text-[12px] font-bold text-emerald-600 mt-4 flex items-center gap-1">
                                ↑ 100% Enrollment
                            </p>
                        </div>
                    </Card>

                    {/* Submissions Received */}
                    <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden relative group">
                        <div className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Submissions Received</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl md:text-[44px] font-black text-slate-800 leading-none">{stats.submitted}</span>
                                <CheckCircle className="w-12 h-12 text-slate-100 absolute right-6 top-8 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                     <div className="h-full bg-[#00a67e] rounded-full" style={{ width: `${participationRate}%` }}></div>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-500 mt-2">
                                    {participationRate}% Participation rate
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Evaluations Done */}
                    <Card className="border-0 shadow-sm rounded-3xl bg-white overflow-hidden relative group">
                        <div className="p-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Evaluations Done</p>
                            <div className="flex items-end justify-between">
                                <span className="text-4xl md:text-[44px] font-black text-slate-800 leading-none">{stats.evaluated}</span>
                                <ClipboardCheck className="w-12 h-12 text-slate-100 absolute right-6 top-8 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                            </div>
                            <div className="mt-4">
                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                     <div className="h-full bg-slate-800 rounded-full" style={{ width: `${markingRate}%` }}></div>
                                </div>
                                <p className="text-[11px] font-semibold text-slate-500 mt-2">
                                    {pendingMarking} pending marking
                                </p>
                            </div>
                        </div>
                    </Card>

                    {/* Average Score */}
                    <Card className="border-0 shadow-sm rounded-3xl bg-[#008f6c] overflow-hidden relative text-white">
                        <div className="p-6 h-full flex flex-col justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100 mb-2">Avg. Class Score</p>
                                <span className="text-4xl md:text-[48px] font-black leading-none">{avgScoreStr}%</span>
                            </div>
                            {topSubmission && (
                                <p className="text-[12px] font-semibold text-white mt-4 leading-snug">
                                    Top performing submission:<br/>
                                    {topSubmissionPercent}% by {topSubmission.studentName}
                                </p>
                            )}
                            {!topSubmission && (
                                <p className="text-[12px] font-medium text-emerald-100 mt-4">
                                    Scores will calculate here once evaluated.
                                </p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Submissions Table Layout */}
                <Card className="border border-slate-100 shadow-sm rounded-[1.5rem] bg-white overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50 space-y-3">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="relative w-full md:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by student name or roll number..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-[13px] font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a67e]/20"
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Filter className="w-4 h-4" /> All Status
                                </button>
                                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 h-11 px-4 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                                    <ArrowUpDown className="w-4 h-4" /> Sort
                                </button>
                                <div className="hidden lg:block text-[13px] font-medium text-slate-500 min-w-max ml-2">
                                    Showing <strong className="text-slate-800">{filteredSubmissions.length}</strong> of <strong className="text-slate-800">{stats.total}</strong> Students
                                </div>
                            </div>
                        </div>

                        {/* Selection Bar */}
                        {selectedIds.size > 0 && (
                            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#00a67e]/8 border border-[#00a67e]/20 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#00a67e] text-white text-[11px] font-black">{selectedIds.size}</span>
                                    <span className="text-[13px] font-bold text-slate-700">
                                        student{selectedIds.size > 1 ? 's' : ''} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setBulkMarks(''); setBulkFeedback(''); setBulkDialogOpen(true); }}
                                        className="flex items-center gap-2 h-9 px-4 bg-[#00a67e] text-white text-[12px] font-black rounded-xl hover:bg-[#008f6c] transition-colors"
                                    >
                                        <Layers className="w-3.5 h-3.5" /> Bulk Evaluate
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="flex items-center justify-center w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors"
                                        title="Clear selection"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="border-b border-slate-100 bg-white">
                                    <th className="py-5 pl-6 pr-2 w-10">
                                        <input
                                            ref={selectAllCheckboxRef}
                                            type="checkbox"
                                            checked={filteredSubmissions.length > 0 && selectedIds.size === filteredSubmissions.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded accent-[#00a67e] cursor-pointer"
                                            title="Select all"
                                        />
                                    </th>
                                    <th className="py-5 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[28%]">Student Details</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roll Number</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Status</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Submitted</th>
                                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center">
                                            <p className="text-sm font-semibold text-slate-400">No submissions found matching criteria.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((submission) => {
                                        const isSelected = selectedIds.has(submission.id);
                                        return (
                                        <tr key={submission.id} className={`hover:bg-slate-50/50 transition-colors group ${isSelected ? 'bg-[#00a67e]/5' : ''}`}>
                                            {/* Checkbox */}
                                            <td className="py-4 pl-6 pr-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelectOne(submission.id)}
                                                    className="w-4 h-4 rounded accent-[#00a67e] cursor-pointer"
                                                />
                                            </td>
                                            {/* Details */}
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-[42px] h-[42px] rounded-full bg-[#00a67e]/10 text-[#00a67e] font-black flex items-center justify-center text-sm shrink-0 border border-[#00a67e]/20">
                                                        {getInitials(submission.studentName)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-slate-800">{submission.studentName}</p>
                                                        <p className="text-[11px] font-medium text-slate-400 mt-0.5 lowercase">{submission.email}</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Roll */}
                                            <td className="py-4 px-6">
                                                <span className="text-[13px] font-bold text-slate-600">
                                                    #{submission.rollNumber}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-4 px-6">
                                                {getStatusPill(submission.status, submission.marksObtained ?? undefined, work.maxMarks)}
                                            </td>

                                            {/* Date */}
                                            <td className="py-4 px-6">
                                                {submission.submittedAt ? (
                                                    <div>
                                                        <p className="text-[13px] font-bold text-slate-700">
                                                            {format(new Date(submission.submittedAt), 'MMM dd, yyyy')}
                                                        </p>
                                                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                                                            {format(new Date(submission.submittedAt), 'hh:mm a')}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-[13px] font-bold text-slate-400">
                                                        Not Uploaded
                                                    </span>
                                                )}
                                            </td>

                                            {/* Action */}
                                            <td className="py-4 px-6 text-right">
                                                {submission.status === 'evaluated' ? (
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedSubmission(submission);
                                                            setMarks(submission.marksObtained?.toString() || '');
                                                            setFeedback(submission.feedback || '');
                                                            setDialogOpen(true);
                                                        }}
                                                        className="inline-flex flex-col items-end text-[#00a67e] hover:text-[#008f6c] transition-colors"
                                                    >
                                                        <span className="text-[13px] font-black">View</span>
                                                        <span className="text-[13px] font-black leading-none">Grade</span>
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedSubmission(submission);
                                                            setMarks('');
                                                            setFeedback('');
                                                            setDialogOpen(true);
                                                        }}
                                                        className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[12px] font-black rounded-lg transition-colors"
                                                    >
                                                        Evaluate
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Marking Guidelines Footer */}
                <div className="pt-8 flex flex-col md:flex-row items-start justify-between gap-6 border-t border-slate-200 mt-8">
                    <div className="max-w-xl">
                        <h4 className="text-[13px] font-bold text-slate-700 mb-1">Marking Guidelines (Spring 2024)</h4>
                        <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                            Please ensure all evaluations follow the rubric established in January. Late submissions should be marked according to the standard 5% penalty per hour.
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer">Academic Integrity Policy</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 cursor-pointer">System Support</span>
                    </div>
                </div>

                {/* Evaluate Dialog */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent className="rounded-3xl border-0 overflow-hidden sm:max-w-md p-0">
                        <div className="bg-[#00a67e] px-6 py-8 relative">
                            <h2 className="text-2xl font-black text-white">Evaluate Submission</h2>
                            {selectedSubmission && (
                                <p className="text-emerald-100 font-medium mt-1">
                                    {selectedSubmission.studentName} ({selectedSubmission.rollNumber})
                                </p>
                            )}
                        </div>
                        {selectedSubmission && (
                            <div className="p-6 space-y-5 bg-white">
                                {selectedSubmission.fileUrl && (
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[13px] font-bold text-slate-800">Attached Document</p>
                                            <a
                                                href={selectedSubmission.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-[11px] font-bold text-blue-600 hover:underline"
                                            >
                                                Click to view and download
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Score Achieved (Max {work.maxMarks})</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0"
                                            max={work.maxMarks}
                                            step="0.5"
                                            value={marks}
                                            onChange={(e) => setMarks(e.target.value)}
                                            placeholder="Enter score"
                                            className="h-14 font-black text-lg bg-slate-50 border-0 rounded-xl px-4"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-400">/ {work.maxMarks}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Instructor Feedback</Label>
                                    <Textarea
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        placeholder="Add constructive notes for the student..."
                                        rows={4}
                                        className="resize-none font-medium text-[14px] bg-slate-50 border-0 rounded-xl px-4 py-3"
                                    />
                                </div>
                                <div className="pt-2">
                                    <Button onClick={handleEvaluate} className="w-full h-14 rounded-full font-black text-[14px] bg-[#00a67e] hover:bg-[#008f6c] shadow-sm">
                                        {selectedSubmission.status === 'evaluated' ? 'Update Evaluation' : 'Submit Evaluation'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Bulk Evaluate Dialog */}
                <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                    <DialogContent className="rounded-3xl border-0 overflow-hidden sm:max-w-md p-0">
                        <div className="bg-[#00a67e] px-6 py-8">
                            <h2 className="text-2xl font-black text-white">Bulk Evaluate</h2>
                            <p className="text-emerald-100 font-medium mt-1">
                                Applying same score to {selectedIds.size} student{selectedIds.size > 1 ? 's' : ''}
                            </p>
                            {/* Mini name preview */}
                            <p className="text-emerald-200 text-[11px] font-medium mt-2 leading-relaxed">
                                {work && (() => {
                                    const names = work.submissions
                                        .filter(s => selectedIds.has(s.id))
                                        .map(s => s.studentName);
                                    const preview = names.slice(0, 3).join(', ');
                                    return names.length > 3 ? `${preview} +${names.length - 3} more` : preview;
                                })()}
                            </p>
                        </div>
                        <div className="p-6 space-y-5 bg-white">
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Score for All (Max {work?.maxMarks})</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        max={work?.maxMarks}
                                        step="0.5"
                                        value={bulkMarks}
                                        onChange={(e) => setBulkMarks(e.target.value)}
                                        placeholder="Enter score"
                                        className="h-14 font-black text-lg bg-slate-50 border-0 rounded-xl px-4"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-black text-slate-400">/ {work?.maxMarks}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Shared Feedback (optional)</Label>
                                <Textarea
                                    value={bulkFeedback}
                                    onChange={(e) => setBulkFeedback(e.target.value)}
                                    placeholder="Common feedback for all selected students..."
                                    rows={3}
                                    className="resize-none font-medium text-[14px] bg-slate-50 border-0 rounded-xl px-4 py-3"
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    onClick={handleBulkEvaluate}
                                    disabled={bulkLoading || !bulkMarks}
                                    className="w-full h-14 rounded-full font-black text-[14px] bg-[#00a67e] hover:bg-[#008f6c] shadow-sm disabled:opacity-60"
                                >
                                    {bulkLoading ? 'Evaluating...' : `Evaluate ${selectedIds.size} Student${selectedIds.size > 1 ? 's' : ''}`}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}