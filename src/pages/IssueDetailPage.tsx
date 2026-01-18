import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  MessageSquare,
  Send,
  Forward,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ApiIssue {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved' | 'forwarded';
  created_at: string;
  category: { id: number; name: string };
  responsible_user?: { id: number; name: string };
  timeline: {
    id: number;
    action_type: string;
    created_at: string;
    performer: { name: string };
    to_user?: { name: string };
    note?: string;
  }[];
  comments: any[];
  created_by: number;
  responsible_user_id?: number;
}

// Helper to convert name to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function IssueDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [issue, setIssue] = useState<ApiIssue | null>(null);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user is allowed to comment
  const canComment = issue && user && (
    ['principal', 'manager'].includes(user.role) ||
    Number(user.id) === Number(issue.created_by) ||
    Number(user.id) === Number(issue.responsible_user_id)
  );

  const loadIssue = () => {
    api.get(`/issues/${id}`)
      .then(res => {
        setIssue({
          ...res.data.issue,
          comments: res.data.comments,
          timeline: res.data.timeline
        });
      })
      .catch(() => {
        toast.error("Issue not found");
        navigate("/issues");
      });
  };

  useEffect(() => {
    loadIssue();
  }, [id]);

  const handleAddComment = () => {
    if (!comment.trim()) return toast.error("Enter a comment");

    setIsSubmitting(true);
    api.post(`/issues/${id}/comment`, { comment })
      .then(() => {
        toast.success("Comment added");
        setComment("");
        loadIssue();
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleResolve = () => {
    api.post(`/issues/${id}/resolve`)
      .then(() => {
        toast.success("Issue resolved");
        loadIssue();
      })
      .catch(() => toast.error("Failed"));
  };

  const handleForward = () => {
    navigate(`/issues/${id}/forward`);
  };

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

  if (!issue) return <p className="text-center mt-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 border-b bg-background/95 backdrop-blur z-10">
        <div className="flex items-center h-14 px-4 max-w-2xl lg:max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-3 font-semibold">Issue Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-2xl lg:max-w-4xl mx-auto space-y-4 pb-32">

        {/* Main Info Card - Reduced padding */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Badges */}
            <div className="flex gap-2 flex-wrap">
              <Badge className={`${getStatusBadgeStyle(issue.status)} font-medium px-2.5 py-0.5 border`}>
                {issue.status}
              </Badge>
              <Badge className={`${getPriorityBadgeStyle(issue.priority)} font-medium px-2.5 py-0.5 border`}>
                {issue.priority} priority
              </Badge>
            </div>

            {/* Title - Bolder */}
            <h2 className="text-lg font-bold leading-tight">{issue.title}</h2>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{issue.description}</p>

            {/* Category & Assignee - No separator, tighter spacing */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span className="font-medium">{issue.category.name}</span>
              </div>

              {issue.responsible_user && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4 text-teal-600 flex-shrink-0" />
                  <span className="font-medium">{toTitleCase(issue.responsible_user.name)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Card - Matching header style */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {issue.timeline.map((item) => (
              <div key={item.id} className="border-l-2 border-primary/30 pl-3 py-1">
                <p className="font-semibold text-sm capitalize">
                  {item.action_type.replace('_', ' ')}
                  {item.action_type === 'forwarded' && item.to_user && (
                    <span className="text-muted-foreground font-normal ml-1">
                      to {toTitleCase(item.to_user.name)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {toTitleCase(item.performer?.name || 'Unknown')} • {new Date(item.created_at).toLocaleString()}
                </p>
                {item.note && (
                  <p className="mt-2 text-sm bg-muted/50 p-2 rounded-lg">{item.note}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comment Section - Inside a card like Activity */}
        {canComment ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Add Comment</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="rounded-xl"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={isSubmitting}
                  className="rounded-full flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="text-center p-4 text-muted-foreground text-sm border rounded-xl bg-muted/20">
            You are not authorized to comment on this issue.
          </div>
        )}

        {/* Actions */}
        {(user?.role === "principal" || user?.role === "manager") && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleForward}>
              <Forward className="w-4 h-4 mr-2" />
              Forward
            </Button>
            <Button className="flex-1 bg-success hover:bg-success/90" onClick={handleResolve}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Resolve
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}
