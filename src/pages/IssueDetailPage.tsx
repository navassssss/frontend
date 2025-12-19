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
import { Card, CardContent } from "@/components/ui/card";
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

  if (!issue) return <p className="text-center mt-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-3 font-semibold">Issue Details</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto space-y-4 pb-32">

        {/* Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2">
              <Badge variant={issue.status as any}>{issue.status}</Badge>
              <Badge variant={issue.priority as any}>{issue.priority} priority</Badge>
            </div>

            <h2 className="text-lg font-bold">{issue.title}</h2>
            <p className="text-muted-foreground">{issue.description}</p>

            <div className="flex gap-3 text-sm border-t pt-3 text-muted-foreground">
              <Tag className="w-4 h-4" />
              {issue.category.name}
            </div>

            {issue.responsible_user && (
              <div className="flex gap-3 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                {issue.responsible_user.name}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Activity</h3>
            {issue.timeline.map((item) => (
              <div key={item.id} className="border-l pl-3">
                <p className="font-medium capitalize">
                  {item.action_type.replace('_', ' ')}
                  {item.action_type === 'forwarded' && item.to_user && (
                    <span className="text-muted-foreground ml-1">
                      to {item.to_user.name}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.performer?.name || 'Unknown'} • {new Date(item.created_at).toLocaleString()}
                </p>
                {item.note && (
                  <p className="mt-1 text-sm bg-muted p-2 rounded-md">{item.note}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Comment box */}
        {canComment ? (
          <div className="space-y-2">
            <h3 className="font-semibold">Add Comment</h3>
            <div className="flex gap-2">
              <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Write comment..." />
              <Button size="icon" onClick={handleAddComment} disabled={isSubmitting}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 text-muted-foreground text-sm border rounded-lg bg-muted/20">
            You are not authorized to comment on this issue.
          </div>
        )}

        {/* Actions */}
        {(user?.role === "principal" || user?.role === "manager") && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleForward}>
              <Forward className="w-5 h-5" />
              Forward
            </Button>
            <Button className="flex-1 bg-success" onClick={handleResolve}>
              <CheckCircle2 className="w-5 h-5" />
              Resolve
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}
