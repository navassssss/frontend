import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronRight, Clock, User, Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import api from '@/lib/api';
import { toast } from 'sonner';

type IssueFilter = 'all' | 'open' | 'resolved';

interface ApiIssue {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved' | 'forwarded';
  created_at: string;
  updated_at: string;
  category?: { id: number; name: string };
  responsible_user?: { id: number; name: string };
}

const filterTabs: { id: IssueFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'resolved', label: 'Resolved' },
];

export default function IssuesPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<IssueFilter>('all');
  const [issues, setIssues] = useState<ApiIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadIssues = () => {
    setLoading(true);

    const statusQuery =
      activeFilter === 'all' ? '' : `?status=${activeFilter}`;

    api.get(`/issues${statusQuery}`)
      .then(res => setIssues(res.data))
      .catch(() => toast.error("Failed to load issues"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadIssues();
  }, [activeFilter]);

  const getPriorityColor = (priority: ApiIssue['priority']) => {
    return priority; // matches badge variant names e.g. 'low', 'medium', 'high'
  };

  const getStatusBadge = (status: ApiIssue['status']) => {
    switch (status) {
      case 'open': return 'open';
      case 'resolved': return 'resolved';
      case 'forwarded': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <AppLayout title="Issues">
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Issues</h2>
            <p className="text-sm text-muted-foreground">{issues.length} total</p>
          </div>
          <Button size="sm" onClick={() => navigate('/issues/new')}>
            <Plus className="w-4 h-4" />
            Raise
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium ${
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Issues List */}
        {loading ? (
          <p className="text-sm text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => (
              <Card
                key={issue.id}
                variant="interactive"
                onClick={() => navigate(`/issues/${issue.id}`)}
              >
                <CardContent className="p-4 space-y-2">
                  
                  <div className="flex justify-between">
                    <h3 className="font-semibold line-clamp-1">{issue.title}</h3>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {issue.description}
                  </p>

                  <div className="flex gap-2 flex-wrap text-xs">
                    <Badge variant={getStatusBadge(issue.status)}>
                      {issue.status}
                    </Badge>
                    <Badge variant={getPriorityColor(issue.priority)}>
                      {issue.priority}
                    </Badge>

                    {issue.category && (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Tag className="w-3 h-3" />
                        {issue.category.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {issue.responsible_user?.name ?? "Unassigned"}
                    </span>

                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(issue.created_at).toLocaleDateString()}
                    </span>
                  </div>

                </CardContent>
              </Card>
            ))}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
