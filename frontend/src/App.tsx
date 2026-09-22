import { Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, homePathForRole, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/public/LoginPage";
import { RegisterPage } from "./pages/public/RegisterPage";
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
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
