import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Filter,
  Calendar as CalendarIcon,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type ReportFilter = "all" | "pending" | "reviewed";

interface ApiReport {
  id: number;
  description: string;
  status: "submitted" | "approved" | "rejected";
  created_at: string;
  attachments?: string[];
  teacher?: { id: number; name: string };
  duty?: { id: number; name: string };
  task?: { id: number; title: string; duty_id?: number };
}

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function ReportsPage() {
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    if (!isPrincipal) {
      toast.error('Access denied. This page is for principals only.');
      navigate('/duties');
    }
  }, [isPrincipal, navigate]);

  const loadReports = () => {
    setIsLoading(true);
    const statusMap = activeFilter === "pending" ? "pending" : activeFilter === "reviewed" ? "reviewed" : "";
    const query = statusMap ? `?status=${statusMap}` : "";

    api.get(`/reports${query}`)
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadReports, [activeFilter]);

  const filteredReports = reports.filter((r) => {
    const rawDutyTitle = r.duty?.name || r.task?.title || '';
    const cleanDutyTitle = rawDutyTitle.startsWith('Report: ') ? rawDutyTitle.slice(8) : rawDutyTitle;
    const matchesDuty = selectedDuty === "all" || cleanDutyTitle === selectedDuty;
    const matchesSearch = r.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cleanDutyTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDuty && matchesSearch;
  });

  // Reset to page 1 if filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, selectedDuty, searchQuery]);

  // Pagination Logic
  const itemsPerPage = 8;
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const currentReports = filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const startEntry = filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endEntry = Math.min(currentPage * itemsPerPage, filteredReports.length);

  const uniqueDuties = Array.from(new Set(reports.map(r => {
    const raw = r.duty?.name || r.task?.title || '';
    return raw.startsWith('Report: ') ? raw.slice(8) : raw;
  }))).filter(Boolean);

  const pendingCount = reports.filter((r) => r.status === "submitted").length;
  const reviewedCount = reports.filter((r) => ["approved", "rejected"].includes(r.status)).length;
  const totalCount = reports.length;
  const completionRate = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  const getFormattedDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return date;
    }
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'submitted') return { label: 'PENDING', color: 'text-amber-600', dot: 'bg-amber-500' };
    if (status === 'approved') return { label: 'REVIEWED', color: 'text-emerald-600', dot: 'bg-emerald-500' };
    if (status === 'rejected') return { label: 'REJECTED', color: 'text-red-600', dot: 'bg-red-500' };
    return { label: status.toUpperCase(), color: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  };

  return (
    <AppLayout title="Reports">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-28">
        
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Duty Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">Review and manage academic faculty submissions</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search reports..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Highlight Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Reports */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Reports</p>
            <p className="text-4xl font-black text-foreground tracking-tight">{totalCount.toLocaleString()}</p>
            <div className="flex items-center gap-1.5 mt-3 text-emerald-600">
              <ArrowUpRight className="w-4 h-4" />
              <span className="text-xs font-bold">12% from last month</span>
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-card border border-border rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
            <div className="p-6">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Pending Review</p>
              <p className="text-4xl font-black text-foreground tracking-tight">{pendingCount}</p>
              <div className="flex items-center gap-1.5 mt-3 text-red-600">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-bold">Average wait: 1.5 days</span>
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Completion Rate</p>
            <p className="text-4xl font-black text-foreground tracking-tight">{completionRate}%</p>
            <div className="flex items-center gap-1.5 mt-3 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">Top performing dept: Library</span>
            </div>
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 lg:p-6 border-b border-border gap-4">
            <h2 className="text-lg font-bold text-foreground tracking-tight">Recent Submissions</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilterModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold text-foreground transition-colors"
              >
                <Filter className="w-4 h-4 text-muted-foreground" /> Filter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-sm font-semibold text-foreground transition-colors hidden sm:flex">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" /> This Week
              </button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Teacher</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Report Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Submission Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="px-6 py-5"><div className="h-10 bg-muted/50 rounded-xl animate-pulse" /></td>
                    </tr>
                  ))
                ) : currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium">No submissions found.</td>
                  </tr>
                ) : (
                  currentReports.map((r) => {
                    const cleanDutyTitle = r.duty?.name || r.task?.title?.replace('Report: ', '') || 'Report';
                    const initials = r.teacher?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || 'TR';
                    const status = getStatusDisplay(r.status);
                    
                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-200/50 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-emerald-800">{initials}</span>
                            </div>
                            <div>
                              <p className="font-bold text-sm text-foreground">{toTitleCase(r.teacher?.name || 'Unknown')}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">Faculty Member</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="inline-flex px-3 py-1 bg-muted rounded-full text-xs font-bold text-foreground">
                            {toTitleCase(cleanDutyTitle)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm font-medium text-muted-foreground whitespace-nowrap">
                          {getFormattedDate(r.created_at)}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                            <span className={`text-[11px] font-bold tracking-wider ${status.color}`}>{status.label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <button 
                            onClick={() => navigate(`/reports/${r.id}`)}
                            className={`text-sm font-bold transition-all ${
                              r.status === 'submitted' ? 'text-primary hover:underline underline-offset-4' : 
                              r.status === 'rejected' ? 'text-primary hover:underline underline-offset-4' : 
                              'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            {r.status === 'submitted' ? 'Review' : r.status === 'rejected' ? 'Resubmit' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Fallback View */}
          <div className="lg:hidden divide-y divide-border">
            {isLoading ? (
               <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : currentReports.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground font-medium">No submissions found.</div>
            ) : (
              currentReports.map((r) => {
                const cleanDutyTitle = r.duty?.name || r.task?.title?.replace('Report: ', '') || 'Report';
                const initials = r.teacher?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || 'TR';
                const status = getStatusDisplay(r.status);
                
                return (
                  <div key={r.id} className="p-4 sm:p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-200/50 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-emerald-800">{initials}</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{toTitleCase(r.teacher?.name || 'Unknown')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{getFormattedDate(r.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                        <span className={`text-[10px] font-bold tracking-wider ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
                      <span className="inline-flex px-3 py-1 bg-muted rounded-full text-xs font-bold text-foreground">
                        {toTitleCase(cleanDutyTitle)}
                      </span>
                      <button 
                        onClick={() => navigate(`/reports/${r.id}`)}
                        className={`text-sm font-bold transition-all px-4 py-1.5 rounded-lg border ${
                          r.status === 'submitted' ? 'border-primary text-primary hover:bg-primary/5' : 
                          r.status === 'rejected' ? 'border-primary text-primary hover:bg-primary/5' : 
                          'border-border text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {r.status === 'submitted' ? 'Review' : r.status === 'rejected' ? 'Resubmit' : 'View Details'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Pagination Footer */}
          <div className="p-5 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/10">
            <p className="text-sm text-muted-foreground">
              Showing {startEntry} to {endEntry} of {filteredReports.length} entries
            </p>
            {totalPages > 1 && (
               <div className="flex items-center gap-2">
                 <button 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   disabled={currentPage === 1}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   &lt;
                 </button>
                 {Array.from({ length: totalPages }).map((_, i) => {
                   const page = i + 1;
                   const isActive = page === currentPage;
                   return (
                     <button 
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm transition-colors ${
                         isActive 
                           ? 'bg-primary text-white shadow-sm' 
                           : 'bg-muted/70 text-foreground hover:bg-muted'
                       }`}
                     >
                       {page}
                     </button>
                   );
                 })}
                 <button 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   disabled={currentPage === totalPages}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-muted/70 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   &gt;
                 </button>
               </div>
            )}
          </div>

        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold text-foreground">Filter Reports</h3>
              <button onClick={() => setShowFilterModal(false)} className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5 space-y-6">
              
              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Status</label>
                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                  {['all', 'pending', 'reviewed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilter(tab as ReportFilter)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                        activeFilter === tab ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

               {/* Duty Filter */}
               <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Report Type</label>
                <div className="space-y-1.5 pt-1">
                   {['all', ...uniqueDuties].map((duty) => {
                     const isSel = selectedDuty === duty;
                     return (
                       <button
                         key={duty}
                         onClick={() => setSelectedDuty(duty)}
                         className={`w-full px-4 py-3 rounded-xl text-sm font-medium transition-all text-left border ${
                           isSel ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/30 text-foreground'
                         }`}
                       >
                         {duty === 'all' ? 'All Types' : toTitleCase(duty)}
                       </button>
                     );
                   })}
                </div>
              </div>

            </div>
            
            <div className="px-5 py-4 border-t border-border flex gap-2">
               <Button variant="ghost" className="flex-1 rounded-xl" onClick={() => {
                 setSelectedDuty('all');
                 setActiveFilter('all');
               }}>Reset</Button>
               <Button className="flex-1 rounded-xl" onClick={() => setShowFilterModal(false)}>Apply</Button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
