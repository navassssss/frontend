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
  responsibleUser?: { id: number; name: string };
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

  const getPriorityBadgeStyle = (priority: ApiIssue['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeStyle = (status: ApiIssue['status']) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-700 border-green-200';
      case 'resolved': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'forwarded': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <AppLayout title="Issues">
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Issues
              <Badge variant="secondary" className="text-xs font-normal">
                {issues.length} total
              </Badge>
            </h2>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/issues/new')}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-1" />
            Raise
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeFilter === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Issues List */}
        {loading ? (
          <p className="text-sm text-center text-muted-foreground py-8">Loading...</p>
        ) : issues.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No issues found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => {
              const assignee = issue.responsibleUser?.name || issue.responsible_user?.name || "Unassigned";
              const truncatedAssignee = assignee.length > 25 ? assignee.substring(0, 25) + '...' : assignee;

              return (
                <Card
                  key={issue.id}
                  variant="interactive"
                  onClick={() => navigate(`/issues/${issue.id}`)}
                  className="hover:border-primary/40 transition-all shadow-sm hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Line 1: Title + Date */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-bold text-base text-foreground leading-tight flex-1">
                            {issue.title}
                          </h3>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                            <Clock className="w-3.5 h-3.5 text-teal-600" />
                            {new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        {/* Line 2: Description + Badges */}
                        <div className="flex items-center gap-2 flex-wrap text-sm">
                          <span className="text-muted-foreground line-clamp-1 flex-shrink">
                            {issue.description}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">•</span>
                          <Badge className={`${getStatusBadgeStyle(issue.status)} font-medium px-2 py-0.5 border flex-shrink-0`}>
                            {issue.status}
                          </Badge>
                          <Badge className={`${getPriorityBadgeStyle(issue.priority)} font-medium px-2 py-0.5 border flex-shrink-0`}>
                            {issue.priority}
                          </Badge>
                          {issue.category && (
                            <>
                              <span className="text-muted-foreground flex-shrink-0">•</span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Tag className="w-3 h-3 text-teal-600" />
                                {issue.category.name}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Line 3: Assignee */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <User className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-medium">{truncatedAssignee}</span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

      </div>
    </AppLayout>
  );
}
