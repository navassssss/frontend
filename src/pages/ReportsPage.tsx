import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Filter,
  ChevronRight,
  Calendar,
  Paperclip,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import api from "@/lib/api";
import { toast } from "sonner";

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

export default function ReportsPage() {
  const [reports, setReports] = useState<ApiReport[]>([]);
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedDuty, setSelectedDuty] = useState<string>("all");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const loadReports = () => {
    setIsLoading(true);

    const statusMap =
      activeFilter === "pending"
        ? "pending"
        : activeFilter === "reviewed"
          ? "reviewed"
          : "";

    const query = statusMap ? `?status=${statusMap}` : "";

    api
      .get(`/reports${query}`)
      .then((res) => setReports(res.data))
      .catch(() => toast.error("Failed to load reports"))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadReports, [activeFilter]);

  const filterReports = reports.filter((r) => {
    const duty = r.duty?.name || r.task?.title;
    const teacher = r.teacher?.name;
    return (
      (selectedDuty === "all" || duty === selectedDuty) &&
      (selectedTeacher === "all" || teacher === selectedTeacher)
    );
  });

  const uniqueDuties = [...new Set(reports.map((r) => r.duty?.name || r.task?.title))];
  const uniqueTeachers = [...new Set(reports.map((r) => r.teacher?.name))];

  const pendingCount = reports.filter((r) => r.status === "submitted").length;
  const reviewedCount = reports.filter((r) =>
    ["approved", "rejected"].includes(r.status)
  ).length;

  const getFormattedDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

  const getFormattedTime = (date: string) =>
    new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <AppLayout title="Reports">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h2 className="text-xl font-bold text-foreground">Duty Reports</h2>
            <p className="text-sm text-muted-foreground">
              {pendingCount} pending • {reviewedCount} reviewed
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowFilterModal(true)}>
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>

        <div className="flex gap-2 animate-slide-up">
          {["all", "pending", "reviewed"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab as ReportFilter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${activeFilter === tab
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-3">
            {filterReports.length === 0 ? (
              <Card className="animate-fade-in">
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium text-foreground">No reports found</p>
                </CardContent>
              </Card>
            ) : (
              filterReports.map((r, i) => (
                <Card
                  key={r.id}
                  variant="interactive"
                  className="animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-primary-foreground">
                          {r.teacher?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {r.duty?.name || r.task?.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">{r.teacher?.name}</p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {r.description}
                        </p>

                        <div className="flex items-center gap-3 mt-2">
                          <Badge
                            variant={r.status === "submitted" ? "warning" : "success"}
                            className="text-xs"
                          >
                            {r.status === "submitted" ? "Pending" : "Reviewed"}
                          </Badge>

                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {getFormattedDate(r.created_at)} • {getFormattedTime(r.created_at)}
                          </span>

                          {r.attachments?.length > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {r.attachments.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md rounded-3xl animate-slide-up p-0 overflow-hidden">
            <CardContent className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Filter Reports</h3>
                <Button variant="ghost" size="icon-sm" onClick={() => setShowFilterModal(false)}>
                  ✕
                </Button>
              </div>

              {/* Filter by Duty */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Filter by Duty
                </label>
                <div className="space-y-2">
                  {['all', ...uniqueDuties].map((duty) => (
                    <button
                      key={duty}
                      onClick={() => setSelectedDuty(duty)}
                      className={`w-full px-4 py-3 rounded-full text-sm font-medium border ${selectedDuty === duty
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                        } transition-all`}
                    >
                      {duty === 'all' ? 'All Duties' : duty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter by Teacher */}
              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Filter by Teacher
                </label>
                <div className="space-y-2">
                  {['all', ...uniqueTeachers].map((teacher) => (
                    <button
                      key={teacher}
                      onClick={() => setSelectedTeacher(teacher)}
                      className={`w-full px-4 py-3 rounded-full text-sm font-medium border ${selectedTeacher === teacher
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                        } transition-all`}
                    >
                      {teacher === 'all' ? 'All Teachers' : teacher}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <Button
                variant="touch"
                className="w-full mt-4 rounded-full"
                onClick={() => setShowFilterModal(false)}
              >
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

    </AppLayout>
  );
}
