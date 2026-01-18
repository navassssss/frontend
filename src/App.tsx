import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StudentAuthProvider, useStudentAuth } from "@/contexts/StudentAuthContext";

// Landing Page
import LandingPage from "./pages/LandingPage";

// Staff Pages
import LoginPage from "./pages/LoginPage";
import SelectRolePage from "./pages/SelectRolePage";
import DashboardPage from "./pages/DashboardPage";
import DutiesPage from "./pages/DutiesPage";
import DutyDetailPage from "./pages/DutyDetailPage";
import CreateDutyPage from "./pages/CreateDutyPage";
import TasksPage from "./pages/TasksPage";
import TaskDetailPage from "./pages/TaskDetailPage";
import CreateTaskPage from "./pages/CreateTaskPage";
import IssuesPage from "./pages/IssuesPage";
import IssueDetailPage from "./pages/IssueDetailPage";
import ForwardIssuePage from "./pages/ForwardIssuePage";
import SubmitReportPage from "./pages/SubmitReportPage";
import RaiseIssuePage from "./pages/RaiseIssuePage";
import ProfilePage from "./pages/ProfilePage";
import TeachersPage from "./pages/TeachersPage";
import TeacherDetailPage from "./pages/TeacherDetailPage";
import ReportsPage from "./pages/ReportsPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import NotificationsPage from "./pages/NotificationsPage";
import StudentAchievementReviewPage from "./pages/StudentAchievementReviewPage";
import StudentsPage from "./pages/StudentsPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import StudentAttendanceOverviewPage from "./pages/StudentAttendanceOverviewPage";
import ClassesPage from "./pages/ClassesPage";
import ClassPerformanceReportPage from "./pages/ClassPerformanceReportPage";
import NotFound from "./pages/NotFound";

// Academic Pages
import AttendancePage from "./pages/AttendancePage";
import TakeAttendancePage from "./pages/TakeAttendancePage";
import CCEWorksPage from "./pages/CCEWorksPage";
import CreateCCEWorkPage from "./pages/CreateCCEWorkPage";
import CCEWorkDetailPage from "./pages/CCEWorkDetailPage";
import CCEMarksPage from "./pages/CCEMarksPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import StudentMarksPage from "./pages/StudentMarksPage";
import ClassReportPage from "./pages/ClassReportPage";

// Fee Management Pages
import FeeManagementPage from "./pages/FeeManagementPage";
import FeeReportsPage from "./pages/FeeReportsPage";
import StudentFeeDetailPage from './pages/StudentFeeDetailPage';

// Student Pages
import StudentLoginPage from "./pages/student/StudentLoginPage";
import StudentDashboardPage from "./pages/student/StudentDashboardPage";
import StudentAccountPage from "./pages/student/StudentAccountPage";
import StudentAchievementsPage from "./pages/student/StudentAchievementsPage";
import AddAchievementPage from "./pages/student/AddAchievementPage";
import StudentLeaderboardPage from "./pages/student/StudentLeaderboardPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";
import PublicLeaderboardPage from "./pages/student/PublicLeaderboardPage";
import StudentCCEPage from "./pages/student/StudentCCEPage";
import StudentAttendancePage from "./pages/student/StudentAttendancePage";
import StudentFeePage from "./pages/student/StudentFeePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.role) {
    return <Navigate to="/select-role" replace />;
  }

  return <>{children}</>;
}

function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function StudentProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStudentAuth();

  if (!isAuthenticated) {
    return <Navigate to="/student/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/staff/login"
        element={
          isAuthenticated && user?.role
            ? <Navigate to="/dashboard" replace />
            : <LoginPage />
        }
      />
      <Route
        path="/select-role"
        element={
          <AuthenticatedRoute>
            <SelectRolePage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/duties"
        element={
          <ProtectedRoute>
            <DutiesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/duties/new"
        element={
          <ProtectedRoute>
            <CreateDutyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/duties/:id"
        element={
          <ProtectedRoute>
            <DutyDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <TasksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/new"
        element={
          <ProtectedRoute>
            <CreateTaskPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers"
        element={
          <ProtectedRoute>
            <TeachersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teachers/:id"
        element={
          <ProtectedRoute>
            <TeacherDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedRoute>
            <StudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedRoute>
            <StudentDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/students/:id/attendance"
        element={
          <ProtectedRoute>
            <StudentAttendanceOverviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedRoute>
            <ClassesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:id/performance"
        element={
          <ProtectedRoute>
            <ClassPerformanceReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/:id/forward"
        element={
          <ProtectedRoute>
            <ForwardIssuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/:id"
        element={
          <ProtectedRoute>
            <IssueDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues"
        element={
          <ProtectedRoute>
            <IssuesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/issues/new"
        element={
          <ProtectedRoute>
            <RaiseIssuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/new"
        element={
          <ProtectedRoute>
            <SubmitReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <ReportDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student-achievements"
        element={
          <ProtectedRoute>
            <StudentAchievementReviewPage />
          </ProtectedRoute>
        }
      />

      {/* Academic Module Routes */}
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance/take"
        element={
          <ProtectedRoute>
            <TakeAttendancePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/works"
        element={
          <ProtectedRoute>
            <CCEWorksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/works/new"
        element={
          <ProtectedRoute>
            <CreateCCEWorkPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/subjects/:subjectId"
        element={
          <ProtectedRoute>
            <SubjectDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/works/:id"
        element={
          <ProtectedRoute>
            <CCEWorkDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/marks"
        element={
          <ProtectedRoute>
            <CCEMarksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <SubjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/student-marks"
        element={
          <ProtectedRoute>
            <StudentMarksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cce/class-report"
        element={
          <ProtectedRoute>
            <ClassReportPage />
          </ProtectedRoute>
        }
      />

      {/* Fee Management Routes */}
      <Route
        path="/fees"
        element={
          <ProtectedRoute>
            <FeeManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees/:id"
        element={
          <ProtectedRoute>
            <StudentFeeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fees/reports"
        element={
          <ProtectedRoute>
            <FeeReportsPage />
          </ProtectedRoute>
        }
      />

      {/* Public Route - Leaderboard Only */}
      <Route path="/leaderboard" element={<PublicLeaderboardPage />} />

      {/* Student Portal Routes - All Protected */}
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route
        path="/student/dashboard"
        element={
          <StudentProtectedRoute>
            <StudentDashboardPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/account"
        element={
          <StudentProtectedRoute>
            <StudentAccountPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/achievements"
        element={
          <StudentProtectedRoute>
            <StudentAchievementsPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/achievements/new"
        element={
          <StudentProtectedRoute>
            <AddAchievementPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/leaderboard"
        element={
          <StudentProtectedRoute>
            <StudentLeaderboardPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <StudentProtectedRoute>
            <StudentProfilePage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/fees"
        element={
          <StudentProtectedRoute>
            <StudentFeePage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/cce"
        element={
          <StudentProtectedRoute>
            <StudentCCEPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="/student/attendance"
        element={
          <StudentProtectedRoute>
            <StudentAttendancePage />
          </StudentProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StudentAuthProvider>
            <AppRoutes />
          </StudentAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;