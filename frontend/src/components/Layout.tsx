import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavLink {
  to: string;
  label: string;
}

const CANDIDATE_LINKS: NavLink[] = [
  { to: "/candidate/dashboard", label: "Dashboard" },
  { to: "/candidate/jobs", label: "Find Jobs" },
  { to: "/candidate/applications", label: "My Applications" },
  { to: "/candidate/inbox", label: "Inbox" },
  { to: "/candidate/profile", label: "Profile" },
];

const HR_LINKS: NavLink[] = [
  { to: "/hr/dashboard", label: "Dashboard" },
  { to: "/hr/jobs", label: "My Jobs" },
  { to: "/hr/candidates", label: "Candidates" },
  { to: "/hr/profile", label: "Profile" },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = user?.role === "HR" ? HR_LINKS : CANDIDATE_LINKS;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold text-slate-900">Job Portal</span>
            <nav className="flex gap-1">
              {links.map((link) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-600">{user?.full_name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
