import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { Plus, Filter, ChevronRight, RotateCcw, Briefcase, Users } from 'lucide-react';
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

// const duties: Duty[] = [
//   {
//     id: '1',
//     name: 'Morning Assembly',
//     description: 'Conduct morning assembly and announcements',
//     category: 'rotational',
//     frequency: 'Weekly',
//     assignedCount: 5,
//     nextDue: 'Tomorrow',
//     assignedTo: 'John Smith',
//   },
//   {
//     id: '2',
//     name: 'Lab Supervision',
//     description: 'Supervise science lab during practical sessions',
//     category: 'responsibility',
//     frequency: 'Daily',
//     assignedCount: 2,
//     assignedTo: 'Jane Doe',
//   },
//   {
//     id: '3',
//     name: 'Library Duty',
//     description: 'Manage library during break hours',
//     category: 'rotational',
//     frequency: 'Weekly',
//     assignedCount: 4,
//     nextDue: 'Wed, Dec 4',
//     assignedTo: 'Mike Johnson',
//   },
//   {
//     id: '4',
//     name: 'Sports Coordinator',
//     description: 'Coordinate sports activities and events',
//     category: 'responsibility',
//     frequency: 'As needed',
//     assignedCount: 1,
//     assignedTo: 'Principal',
//   },
//   {
//     id: '5',
//     name: 'Bus Duty',
//     description: 'Monitor student boarding and departure',
//     category: 'rotational',
//     frequency: 'Daily',
//     assignedCount: 6,
//     nextDue: 'Today',
//     assignedTo: 'Sarah Williams',
//   },
// ];





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

  // const filteredDuties = duties.filter(duty => {
  //   const categoryMatch = activeCategory === 'all' || duty.category === activeCategory;
  //   // For principals: show all or filter by "mine" (assigned to Principal)
  //   // For teachers: always show their own
  //   const ownerMatch = isPrincipal
  //     ? (viewMode === 'all' || duty.assignedTo === 'Principal')
  //     : true;
  //   return categoryMatch && ownerMatch;
  // });
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

      <div className="p-4 space-y-4">
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
              <Plus className="w-4 h-4" />
              Create Duty
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
        <div className="space-y-3">
          {filteredDuties.map((duty, index) => (
            <Card
              key={duty.id}
              variant="interactive"
              onClick={() => navigate(`/duties/${duty.id}`)}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-light">
                    <Briefcase className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{duty.name}</h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {duty.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant="default">
                        {duty.frequency}
                      </Badge>
                      {isPrincipal && viewMode === 'all' && duty.assignedTo && (
                        <Badge variant="secondary">
                          {duty.assignedTo}
                        </Badge>
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
          ))}
        </div>


      </div>
    </AppLayout>
  );
}
