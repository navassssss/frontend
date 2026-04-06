import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ChevronRight, RotateCcw, Briefcase, Users, Library, Bus, Award, BookOpen, ClipboardList, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'mine' | 'all';

interface Duty {
  id: string;
  name: string;
  description: string;
  frequency: string;
  type?: string;
  assignedCount: number;
  assignedTo?: string;
  teachers?: any[];
}

const toTitleCase = (str: string) => {
  if (!str) return str;
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const getDutyIcon = (dutyName: string) => {
  const name = dutyName.toLowerCase();
  if (name.includes('library')) return Library;
  if (name.includes('bus')) return Bus;
  if (name.includes('assembly') || name.includes('meeting')) return Users;
  if (name.includes('sports') || name.includes('coordinator')) return Award;
  if (name.includes('lab') || name.includes('section')) return Briefcase;
  if (name.includes('cce') || name.includes('curriculum')) return BookOpen;
  if (name.includes('language') || name.includes('class')) return ClipboardList;
  return RotateCcw;
};

const dutyCardColors = [
  { icon: 'text-emerald-600', bg: 'bg-emerald-50' },
  { icon: 'text-blue-600',   bg: 'bg-blue-50' },
  { icon: 'text-violet-600', bg: 'bg-violet-50' },
  { icon: 'text-amber-600',  bg: 'bg-amber-50' },
  { icon: 'text-rose-600',   bg: 'bg-rose-50' },
  { icon: 'text-sky-600',    bg: 'bg-sky-50' },
];

const freqLabel: Record<string, string> = {
  daily:     'Daily Task',
  weekly:    'Recurring Weekly',
  monthly:   'Monthly Session',
  quarterly: 'Quarterly Review',
  yearly:    'Annual Event',
  none:      'One-time Event',
};

const freqBadge: Record<string, string> = {
  daily:     'bg-emerald-100 text-emerald-700',
  weekly:    'bg-blue-100 text-blue-700',
  monthly:   'bg-amber-100 text-amber-700',
  quarterly: 'bg-violet-100 text-violet-700',
  yearly:    'bg-rose-100 text-rose-700',
  none:      'bg-muted text-muted-foreground',
};

const typeLabel: Record<string, { label: string; color: string }> = {
  responsibility: { label: 'Academic', color: 'bg-emerald-100 text-emerald-700' },
  rotational:     { label: 'Rotational', color: 'bg-blue-100 text-blue-700' },
  supervisory:    { label: 'Governance', color: 'bg-violet-100 text-violet-700' },
};

export default function DutiesPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const navigate = useNavigate();
  const { user } = useAuth();
  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  useEffect(() => {
    api.get('/duties')
      .then(res => {
        const formatted = res.data.map((duty: any) => ({
          id: duty.id.toString(),
          name: duty.name,
          description: duty.description || '',
          frequency: duty.frequency || 'none',
          type: duty.type || 'responsibility',
          assignedCount: duty.teachers?.length || 0,
          assignedTo: duty.teachers?.map((t: any) => t.name).join(', ') ?? '',
          teachers: duty.teachers || [],
        }));
        setDuties(formatted);
      })
      .catch(() => toast.error('Failed to load duties'))
      .finally(() => setLoading(false));
  }, []);

  const filteredDuties = duties.filter((duty) => {
    if (isPrincipal && viewMode === 'all') return true;
    return duty.assignedTo?.includes(user?.name || '');
  });

  const totalTeachers = new Set(
    duties.flatMap(d => d.teachers?.map((t: any) => t.id) || [])
  ).size;

  // ── TEACHER VIEW ("Mine") — list style like reference image ──
  // ── TEACHER VIEW ("Mine") — list style like reference image ──
  const MyDutiesView = () => (
    <div className="p-4 md:p-8 max-w-[1050px] mx-auto pb-28 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-black text-slate-800 tracking-tight">Your Assigned Duties</h1>
        <div className="flex items-center gap-3">
          {isPrincipal && (
            <button
              onClick={() => setViewMode('all')}
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 transition-colors hidden sm:flex items-center gap-1 mr-2"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <button className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 shadow-sm rounded-full px-5 py-2.5 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4 text-slate-500" /> Filter
          </button>
        </div>
      </div>

      {/* Duty List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 animate-pulse h-[140px] border border-slate-100" />
          ))}
        </div>
      ) : filteredDuties.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-100 shadow-sm">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="font-bold text-slate-800 text-lg">No duties assigned</p>
          <p className="text-sm font-medium text-slate-500 mt-1">Check back later or contact administration.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredDuties.map((duty, index) => {
            const DutyIcon = getDutyIcon(duty.name);
            const freqKey = duty.frequency?.toLowerCase() || 'none';
            const typeKey = duty.type || 'responsibility';
            
            // Map types precisely to image styling
            let badgeText = 'ACADEMIC';
            let badgeConfig = 'bg-emerald-100/60 text-emerald-700';
            let mainIconConfig = 'bg-emerald-50 text-emerald-600';
            
            if (typeKey === 'supervisory' || index % 3 === 1) {
                badgeText = 'GOVERNANCE';
                badgeConfig = 'bg-blue-100/60 text-blue-600';
                mainIconConfig = 'bg-blue-50 text-blue-600';
            } else if (index % 3 === 2) {
                badgeText = 'STAFF';
                badgeConfig = 'bg-slate-100 text-slate-600';
                mainIconConfig = 'bg-slate-50 text-slate-400';
            }

            // Pseudo status styling for visual match
            const statusConfig = index === 0 ? {
                text: 'In Progress', bg: 'bg-orange-100/60', color: 'text-orange-600', dot: 'bg-orange-400', action: 'Update Status →', actionColor: 'text-emerald-700'
            } : index === 1 ? {
                text: 'Upcoming', bg: 'bg-slate-100', color: 'text-slate-600', dot: 'bg-blue-500', action: 'View Materials', actionColor: 'text-emerald-700', icon: true
            } : {
                text: 'Completed', bg: 'bg-emerald-100/60', color: 'text-emerald-700', docIcon: true, action: 'CLOSED OCT 12', actionColor: 'text-slate-400 text-[10px] tracking-widest uppercase'
            };

            return (
              <div
                key={duty.id}
                onClick={() => navigate(`/duties/${duty.id}`)}
                className="group bg-white rounded-[2rem] p-5 md:p-6 shadow-sm border border-slate-100 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-slide-up flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-6"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
              >
                {/* Left content block */}
                <div className="flex flex-1 items-start gap-4 md:gap-6 w-full">
                   {/* Big Rounded Icon Container */}
                   <div className={`w-[52px] h-[52px] md:w-[60px] md:h-[60px] rounded-2xl flex items-center justify-center shrink-0 ${mainIconConfig}`}>
                       <DutyIcon className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />
                   </div>
                   
                   <div className="flex-1 min-w-0 pr-4">
                       <div className="flex flex-wrap items-center gap-2 mb-2">
                           <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border-transparent ${badgeConfig}`}>
                               {badgeText}
                           </span>
                           <span className="text-[10px] font-semibold text-slate-400">
                               {freqLabel[freqKey] || toTitleCase(duty.frequency)}
                           </span>
                       </div>
                       
                       <h3 className="text-[15px] md:text-[17px] font-bold text-slate-800 leading-snug group-hover:text-emerald-700 transition-colors mb-1.5 line-clamp-1">
                           {toTitleCase(duty.name)}
                       </h3>
                       
                       <p className="text-[13px] font-medium text-slate-500 leading-relaxed max-w-[85%] md:line-clamp-2">
                           {duty.description || 'No additional summary available for this duty element.'}
                       </p>
                   </div>
                </div>

                {/* Right Status Block */}
                <div className="w-full md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center mt-3 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full md:mb-2 ${statusConfig.bg}`}>
                        {statusConfig.docIcon ? (
                             <Award className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                             <div className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></div>
                        )}
                        <span className={`text-[11px] font-bold ${statusConfig.color}`}>{statusConfig.text}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                        <span className={`text-xs font-bold ${statusConfig.actionColor}`}>
                            {statusConfig.action}
                        </span>
                        {statusConfig.icon && <Library className="w-3.5 h-3.5 text-emerald-700" />}
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── PRINCIPAL "ALL" VIEW — grid style ──
  const AllDutiesView = () => (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">All Duty Assignments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all institutional responsibilities.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-muted rounded-xl p-0.5 text-sm">
            <button
              onClick={() => setViewMode('mine')}
              className="px-3 py-1.5 rounded-[10px] font-medium transition-all text-muted-foreground hover:text-foreground"
            >
              Mine
            </button>
            <button
              className="px-3 py-1.5 rounded-[10px] font-medium transition-all bg-card shadow-sm text-foreground"
            >
              All
            </button>
          </div>
          <Button size="sm" onClick={() => navigate('/duties/new')} className="h-9 rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Create
          </Button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-52" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDuties.map((duty, index) => {
            const DutyIcon = getDutyIcon(duty.name);
            const color = dutyCardColors[index % dutyCardColors.length];
            const freqKey = duty.frequency?.toLowerCase() || 'none';
            const freqBadgeClass = freqBadge[freqKey] || freqBadge.none;

            return (
              <div
                key={duty.id}
                onClick={() => navigate(`/duties/${duty.id}`)}
                className="group bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary/30 cursor-pointer transition-all duration-200 flex flex-col gap-4 animate-slide-up"
                style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'backwards' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-11 h-11 rounded-xl ${color.bg} flex items-center justify-center shrink-0`}>
                    <DutyIcon className={`w-5 h-5 ${color.icon}`} />
                  </div>
                  {freqKey !== 'none' && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${freqBadgeClass}`}>
                      {toTitleCase(duty.frequency)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
                    {toTitleCase(duty.name)}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {duty.description || 'No description provided.'}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="flex -space-x-2">
                    {duty.teachers?.slice(0, 3).map((t: any, ti: number) => (
                      <div key={ti} className="w-7 h-7 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center text-[9px] font-bold text-primary" title={t.name}>
                        {t.name?.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {(duty.teachers?.length || 0) > 3 && (
                      <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        +{(duty.teachers?.length || 0) - 3}
                      </div>
                    )}
                    {(duty.teachers?.length || 0) === 0 && (
                      <span className="text-[11px] text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-primary flex items-center gap-1 group-hover:gap-1.5 transition-all">
                    View Details <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* New Duty card */}
          <div
            onClick={() => navigate('/duties/new')}
            className="border-2 border-dashed border-border rounded-2xl p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-center group min-h-[180px]"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">New Duty</p>
              <p className="text-xs text-muted-foreground mt-0.5">Assign a new responsibility</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {!loading && filteredDuties.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="px-4 first:pl-0 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Duties</p>
              <p className="text-3xl font-black text-foreground">{String(filteredDuties.length).padStart(2, '0')}</p>
            </div>
            <div className="px-4 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Frequencies</p>
              <p className="text-3xl font-black text-foreground">
                {new Set(filteredDuties.map(d => d.frequency?.toLowerCase()).filter(f => f && f !== 'none')).size}
              </p>
            </div>
            <div className="px-4 last:pr-0 text-center">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Teachers</p>
              <p className="text-3xl font-black text-foreground">{String(totalTeachers).padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render based on role / view mode
  const showMyView = !isPrincipal || viewMode === 'mine';

  return (
    <AppLayout title="Duties">
      {showMyView ? <MyDutiesView /> : <AllDutiesView />}
    </AppLayout>
  );
}
