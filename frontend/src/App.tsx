import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, homePathForRole, useAuth } from "./context/AuthContext";
import { CandidateDashboardPage } from "./pages/candidate/CandidateDashboardPage";
import { InboxPage } from "./pages/candidate/InboxPage";
import { JobDetailsPage } from "./pages/candidate/JobDetailsPage";
import { JobSearchPage } from "./pages/candidate/JobSearchPage";
import { MyApplicationsPage } from "./pages/candidate/MyApplicationsPage";
import { CandidateProfilePage } from "./pages/candidate/ProfilePage";
import { ApplicantsPage } from "./pages/hr/ApplicantsPage";
import { CandidateDetailPage } from "./pages/hr/CandidateDetailPage";
import { CandidateDirectoryPage } from "./pages/hr/CandidateDirectoryPage";
import { CreateJobPage } from "./pages/hr/CreateJobPage";
import { EditJobPage } from "./pages/hr/EditJobPage";
import { HRDashboardPage } from "./pages/hr/HRDashboardPage";
import { HRProfilePage } from "./pages/hr/HRProfilePage";
import { MyJobsPage } from "./pages/hr/MyJobsPage";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicRoute } from "./routes/PublicRoute";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>;
  }
  return <Navigate to={user ? homePathForRole(user.role) : "/login"} replace />;
}

// A plain page, not a redirect: an authenticated user landing on an
// unmatched URL (stale link, typo, a route not built yet) must not bounce
// between here and PublicRoute's own redirect -- that pairing is exactly
// what produced an infinite-redirect loop during manual testing.
function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-600">
      <p>Page not found.</p>
      <Link to="/" className="font-medium text-blue-600 hover:underline">
        Go home
      </Link>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <CandidateDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/jobs"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <JobSearchPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/jobs/:jobId"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <JobDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/applications"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <MyApplicationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/inbox"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <InboxPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute allowedRole="CANDIDATE">
              <CandidateProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/dashboard"
          element={
            <ProtectedRoute allowedRole="HR">
              <HRDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs"
          element={
            <ProtectedRoute allowedRole="HR">
              <MyJobsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs/new"
          element={
            <ProtectedRoute allowedRole="HR">
              <CreateJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs/:jobId/edit"
          element={
            <ProtectedRoute allowedRole="HR">
              <EditJobPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/jobs/:jobId/applicants"
          element={
            <ProtectedRoute allowedRole="HR">
              <ApplicantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidates"
          element={
            <ProtectedRoute allowedRole="HR">
              <CandidateDirectoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/candidates/:candidateId"
          element={
            <ProtectedRoute allowedRole="HR">
              <CandidateDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr/profile"
          element={
            <ProtectedRoute allowedRole="HR">
              <HRProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
