import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ChevronRight, RotateCcw, Briefcase, Users, Library, Bus, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

type DutyCategory = 'all' | 'responsibility';
type ViewMode = 'mine' | 'all';

interface Duty {
  id: string;
  name: string;
  description: string;
  category: 'responsibility';
  frequency: string;
  assignedCount: number;
  nextDue?: string;
  assignedTo?: string;
}

// Helper to convert name to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

// Helper to get icon based on duty name
const getDutyIcon = (dutyName: string) => {
  const name = dutyName.toLowerCase();
  if (name.includes('library')) return Library;
  if (name.includes('bus')) return Bus;
  if (name.includes('assembly')) return Users;
  if (name.includes('sports') || name.includes('coordinator')) return Award;
  if (name.includes('lab')) return Briefcase;
  return RotateCcw; // Default for rotational duties
};

export default function DutiesPage() {
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get('/duties')
      .then(res => {
        const formatted = res.data.map((duty: any) => ({
          id: duty.id.toString(),
          name: duty.name,
          description: duty.description || '',
          category: duty.type || 'responsibility',
          frequency: duty.frequency,
          assignedCount: duty.teachers?.length || 0,
          assignedTo: duty.teachers?.map((t: any) => t.name).join(', ') ?? '',
        }));
        setDuties(formatted);
      })
      .catch(() => toast.error("Failed to load duties"))
      .finally(() => setLoading(false));
  }, []);

  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const navigate = useNavigate();
  const { user } = useAuth();

  const isPrincipal = user?.role === 'principal' || user?.role === 'manager';

  const filteredDuties = duties.filter((duty) => {
    if (isPrincipal) {
      return viewMode === 'all' || duty.assignedTo?.includes(user?.name);
    } else {
      return duty.assignedTo?.includes(user?.name);
    }
  });

  if (loading) {
    return (
      <AppLayout title="Duties">
        <div className="p-4 text-center text-muted-foreground">Loading duties...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Duties">

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {isPrincipal ? (viewMode === 'all' ? 'All Duties' : 'My Duties') : 'My Duties'}
            </h2>
            <p className="text-sm text-muted-foreground">{filteredDuties.length} duties</p>
          </div>
          {isPrincipal && (
            <Button variant="default" size="sm" onClick={() => navigate('/duties/new')}>
              <Plus className="w-4 h-4 mr-1" />
              Create
            </Button>
          )}
        </div>

        {/* View Mode Toggle for Principal */}
        {isPrincipal && (
          <div className="flex gap-2 animate-slide-up">
            <button
              onClick={() => setViewMode('mine')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'mine'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <Briefcase className="w-4 h-4" />
              My Duties
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${viewMode === 'all'
                ? 'bg-accent text-accent-foreground shadow-md'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              <Users className="w-4 h-4" />
              All Teachers
            </button>
          </div>
        )}

        {/* Duties List */}
        <div className="space-y-2">
          {filteredDuties.map((duty, index) => {
            const DutyIcon = getDutyIcon(duty.name);
            const isNoneFrequency = duty.frequency.toLowerCase() === 'none';

            return (
              <Card
                key={duty.id}
                variant="interactive"
                onClick={() => navigate(`/duties/${duty.id}`)}
                className="animate-slide-up hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <DutyIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-base text-foreground leading-tight">{toTitleCase(duty.name)}</h3>
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {duty.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge
                          variant={isNoneFrequency ? "secondary" : "default"}
                          className={`font-medium px-2.5 py-0.5 ${isNoneFrequency ? 'bg-muted text-muted-foreground' : ''}`}
                        >
                          {toTitleCase(duty.frequency)}
                        </Badge>
                        {isPrincipal && viewMode === 'all' && duty.assignedTo && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {duty.assignedCount} assigned
                          </span>
                        )}
                        {duty.nextDue && (
                          <span className="text-xs text-muted-foreground">
                            Next: {duty.nextDue}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

      </div>
    </AppLayout>
  );
}
