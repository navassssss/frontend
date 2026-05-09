import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, AlertCircle, Info, Clock, CheckCheck, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notification {
    id: string;
    type: string;
    data: {
        title: string;
        message: string;
        action_url?: string;
        type?: "info" | "success" | "warning" | "error" | "issue";
    };
    read_at: string | null;
    created_at: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const loadNotifications = () => {
        setIsLoading(true);
        api.get("/notifications")
            .then((res) => setNotifications(res.data))
            .catch((err) => console.error(err))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    const markAsRead = async (id: string, actionUrl?: string) => {
        try {
            // Optimistically update UI
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));

            await api.post(`/notifications/${id}/read`);

            if (actionUrl) {
                navigate(actionUrl);
            }
        } catch (error) {
            console.error("Failed to mark as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            await api.post("/notifications/read-all");
            toast.success("All notifications marked as read");
        } catch (error) {
            toast.error("Failed to mark all as read");
        }
    };

    const getIcon = (type?: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-5 h-5 text-success" />;
            case "warning": return <AlertCircle className="w-5 h-5 text-warning" />;
            case "issue": return <AlertCircle className="w-5 h-5 text-destructive" />;
            default: return <Info className="w-5 h-5 text-primary" />;
        }
    };

    return (
        <AppLayout title="Notifications">
            <div className="p-4 space-y-4 max-w-2xl mx-auto">
                <div className="flex items-center justify-between animate-fade-in">
                    <h2 className="text-xl font-bold text-foreground">Notifications</h2>
                    {notifications.some(n => !n.read_at) && (
                        <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                            <CheckCheck className="w-4 h-4 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-center text-muted-foreground py-8">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground">No new notifications</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            You're all caught up! Check back later.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((n, i) => (
                            <Card
                                key={n.id}
                                variant={n.read_at ? "flat" : "elevated"}
                                className={`transition-all duration-300 animate-slide-up ${!n.read_at ? "border-l-4 border-l-primary" : "opacity-75"
                                    }`}
                                style={{ animationDelay: `${i * 0.05}s` }}
                                onClick={() => markAsRead(n.id, n.data.action_url)}
                            >
                                <CardContent className="p-4 cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <div className="flex gap-4">
                                        <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!n.read_at ? "bg-primary/10" : "bg-secondary"
                                            }`}>
                                            {getIcon(n.data.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <h4 className={`text-sm ${!n.read_at ? "font-bold text-foreground" : "font-medium text-muted-foreground"}`}>
                                                    {n.data.title}
                                                </h4>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-1 line-clamp-2 ${!n.read_at ? "text-foreground/90" : "text-muted-foreground"}`}>
                                                {n.data.message}
                                            </p>
                                        </div>
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
