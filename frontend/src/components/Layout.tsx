import { useState, type ReactNode } from "react";
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

function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        J
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900">Job Portal</span>
    </Link>
  );
}

function UserBadge({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
        {initial}
      </span>
      <span className="hidden text-sm font-medium text-slate-700 sm:inline">{name}</span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const links = user?.role === "HR" ? HR_LINKS : CANDIDATE_LINKS;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <BrandMark />
            <nav className="hidden gap-1 lg:flex">
              {links.map((link) => {
                const isActive = location.pathname.startsWith(link.to);
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">{user && <UserBadge name={user.full_name} />}</div>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 lg:inline-flex"
            >
              Log out
            </button>
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
                {isMobileNavOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileNavOpen && (
          <nav className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            {user && (
              <div className="mb-2 flex items-center gap-2 px-1">
                <UserBadge name={user.full_name} />
              </div>
            )}
            {links.map((link) => {
              const isActive = location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Log out
            </button>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
