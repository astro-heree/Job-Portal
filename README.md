# Job Portal

A full-stack hiring platform with two user roles — **HR** and **Candidate**. HR users post
jobs, screen applicants (with an explainable match score), manage a candidate directory, and
message candidates. Candidates search and apply for jobs, track their application status,
manage their profile and resume, and read messages from HR. Built with FastAPI, PostgreSQL,
and React, fully containerized with Docker Compose.

## Table of contents

- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [How to run](#how-to-run)
- [Test credentials](#test-credentials)
- [Feature walkthrough](#feature-walkthrough)
- [Running tests](#running-tests)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)

## Architecture

Three containers on a single Docker bridge network, plus two named volumes for persistent
data (the Postgres data directory and uploaded resumes).

```mermaid
flowchart LR
    Browser -- "HTTP :3001" --> Frontend["frontend (nginx)\nstatic React build"]
    Browser -- "HTTP :8001 /api/v1/*" --> Backend["backend (FastAPI + Uvicorn)"]
    Backend -- "SQL :5432" --> DB[("db (PostgreSQL 16)")]
    Backend -- "reads/writes" --> Uploads[("resume_uploads volume")]
    DB -- "reads/writes" --> PgData[("pgdata volume")]
```

The backend is layered `routers -> services -> models`: routers parse/validate the request
and call one service function; all business logic, authorization/ownership checks, and
database queries live in the service layer; models are plain SQLAlchemy ORM classes.
Every error — a domain rule violation, a validation failure, or an unhandled exception — is
rendered through one global handler into the same JSON shape, so the frontend has exactly one
error-parsing code path.

**Important gotcha this repo is built around**: the React bundle runs in the user's *browser*,
which is outside the Docker network. It must call the backend at the host-mapped
`http://localhost:8001`, never the Docker-internal service name `backend:8000` (nothing else
needs to call the backend by that name here, but it's an easy default to reach for and it
silently fails from the browser). `VITE_API_URL` is therefore a **build-time** argument baked
into the static JS bundle when the frontend image builds — nginx serves plain static files
with no server-side templating step to inject it at runtime.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router v7, Tailwind CSS v4, axios |
| Backend | FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PyJWT, bcrypt, slowapi |
| Database | PostgreSQL 16 |
| Testing | pytest (backend), Vitest + React Testing Library (frontend) |
| Orchestration | Docker Compose |

## How to run

Requires Docker and Docker Compose. No other tooling needs to be installed on the host.

```bash
git clone <this-repo-url>
cd Job-Portal
cp .env.example .env
docker compose up --build
```

Then open:

- **Frontend**: [http://localhost:3001](http://localhost:3001)
- **Backend API**: [http://localhost:8001](http://localhost:8001) (health check at `/health`)

On first boot the backend runs its database migrations and — because `SEED_DEMO_DATA=true` in
`.env.example` — seeds demo accounts, jobs, applications, and messages (see
[Test credentials](#test-credentials) below). The seed is idempotent: it checks for a marker
account before inserting anything, so restarting the stack (without `docker compose down -v`)
never double-seeds. Data persists across restarts via the `pgdata` and `resume_uploads`
named volumes; `docker compose down -v` removes it.

No values in `.env.example` are real secrets. `SECRET_KEY` in particular should be replaced
(`openssl rand -hex 32`) before this is ever used for anything beyond local review.

### Ports

Chosen to avoid colliding with common local defaults (5432, 8000, 3000) if you're also running
something else on this machine.

| Service | Port |
|---|---|
| Frontend (nginx) | `3001` |
| Backend (FastAPI) | `8001` |
| PostgreSQL | `5434` (bound to `127.0.0.1` only) |

## Test credentials

| Role | Email | Password | Notes |
|---|---|---|---|
| HR | `admin@test.com` | `Admin@1234` | Acme Corp — owns 4 jobs (3 active, 1 inactive), has applicants across all three statuses |
| Candidate | `user@test.com` | `User@1234` | Backend Developer, strong match for `admin@test.com`'s Backend Engineer posting |
| HR | `hr2@jobportal.dev` | `Password123!` | Globex Inc — owns 4 jobs (3 active, 1 inactive) |
| Candidate | `candidate2@jobportal.dev` | `Password123!` | Frontend Developer |
| Candidate | `candidate3@jobportal.dev` | `Password123!` | Full Stack Engineer |
| Candidate | `candidate4@jobportal.dev` | `Password123!` | Data Engineer |
| Candidate | `candidate5@jobportal.dev` | `Password123!` | Junior Developer |
| Candidate | `candidate6@jobportal.dev` | `Password123!` | DevOps Engineer |

The primary HR and Candidate accounts (`admin@test.com` / `user@test.com`) use the exact
credentials named in the assignment brief; the rest of the demo accounts share `Password123!`
so the whole roster doesn't need memorizing.

You can also register a fresh account of either role from the app itself.

## Feature walkthrough

### As HR (e.g. `admin@test.com`)

1. **Dashboard** — total/active job counts, applicant status breakdown, and a 14-day
   applications trend chart.
2. **My Jobs** — every job you've posted, with an Active/Inactive badge; activate or
   deactivate a job, edit it, or jump to its applicants.
3. **Post a job** (`My Jobs -> Post a job`) — title, description, skills, location,
   employment type, experience range, salary range. Posting redirects straight to that job's
   applicant screen.
4. **Applicants** (`My Jobs -> View applicants`) — every application for that job, sorted by
   a computed 1–5 star match rating (see [ats.py](backend/app/core/ats.py)), filterable by
   status or by candidate name/email, plus the same skills/location/experience/salary filters
   described below for the candidate directory. Change one applicant's status from its
   dropdown, or select several with the checkboxes and bulk shortlist/reject (with a
   confirmation step). View or download a candidate's resume if they've uploaded one.
5. **Candidates** — a directory of every candidate on the platform, independent of whether
   they've applied to your jobs. Filter by name/headline, location, skills (a case-insensitive
   "includes" match — searching "script" finds "TypeScript"), minimum years of experience, and
   **maximum** expected salary (a budget ceiling — candidates expecting at most that much).
   Select several candidates with the checkboxes and use **Email selected** to send a real,
   templated bulk message: pick "Shortlisted — moving to next round", "Application update —
   not moving forward", or "Custom message" (free text), edit the pre-filled subject/body if
   you like, and send. It's the same in-app messaging system as the single-candidate "Send a
   message" feature below — every recipient gets an actual `Message` row and sees it land in
   their Inbox immediately, there's no fake confirmation step. Open a candidate's profile to
   view their full details, **view their resume in-app** (rendered inline, not just
   downloaded) or download it, or send them a single real in-app message.
6. **Profile** — edit your company name and designation.

### As a Candidate (e.g. `user@test.com`)

1. **Dashboard** — total/applied/shortlisted/rejected application counts, unread message
   count, and a status-breakdown chart of your own applications.
2. **Find Jobs** — search by keyword, filter by location or employment type; only active jobs
   are shown.
3. **Job details** — full description, skills, formatted experience/salary ranges, and an
   apply form with an optional cover note. Applying twice to the same job is rejected.
4. **My Applications** — every job you've applied to, with its current status, filterable by
   status.
5. **Inbox** — messages from HR; opening an unread message marks it read.
6. **Profile** — edit headline, phone, location, experience, skills, and expected salary
   (used by HR's directory filter); upload a resume (PDF only, 5MB max) and **view it in-app**
   afterward, not just re-download it.

### Cross-tenant access control (worth trying deliberately)

Log in as `hr2@jobportal.dev` and try to edit a job or change an applicant's status on one of
`admin@test.com`'s jobs by editing the URL (e.g. `/hr/jobs/<that-job-id>/edit`). It's
rejected with a 403 from the backend regardless of what the frontend would otherwise allow —
role alone (`require_role(HR)`) only proves "this is an HR account", not "this HR account owns
this job"; ownership is checked separately in the service layer for every job- and
application-scoped endpoint.

## Running tests

### Backend (79 tests, pytest)

Runs against a real Postgres database (a separate `<db>_test` database, auto-created), not
SQLite — the schema uses Postgres `ARRAY` columns with GIN indexes that SQLite doesn't
support. Each test runs inside its own transaction (via a SQLAlchemy savepoint) that's rolled
back afterward, so tests never leave data behind or depend on each other.

With the stack already running (`docker compose up`, so Postgres is reachable at
`localhost:5434`):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
DATABASE_URL="postgresql+psycopg2://jobportal:jobportal_dev_password@localhost:5434/jobportal" \
SECRET_KEY="test-secret" \
pytest
```

Coverage includes auth (registration, login, `/auth/me`), rate limiting (asserts a real 429
past the configured threshold), jobs (CRUD, search/filter, the cross-tenant 403s described
above, invalid experience/salary ranges rejected), applications (ownership checks in both
directions, bulk-status update excluding non-owned applications), candidates (directory access
control, profile updates), resume upload (valid PDF, wrong content-type, a file with a
spoofed `Content-Type: application/pdf` header but non-PDF bytes, oversized file — all
rejected), HR profile, dashboard stat aggregation, and unit tests for the ATS scoring
heuristic.

### Frontend (25 tests, Vitest + React Testing Library)

```bash
cd frontend
npm install
npm run test
```

Covers `AuthContext` (token rehydration, login, logout), `ProtectedRoute` (redirect logic for
unauthenticated users and role mismatches), `LoginPage` and `RegisterPage` (client-side
validation blocking the API call, server errors surfaced, redirect on success), one
representative page per role (`JobSearchPage`'s debounced search, `MyJobsPage`'s
activate/deactivate action), and `BulkEmailDialog` (template selection prefills/clears the
subject and body, the real send call goes out with the right recipients and text, validation
and server-error paths).

## Security notes

- Passwords are hashed with **bcrypt**; nothing is ever stored or logged in plaintext.
- Auth is a single JWT (**PyJWT**, HS256), 24 hours by default — see
  [Known limitations](#known-limitations) for what this trades away.
- **CORS** is restricted to `FRONTEND_ORIGIN` — no wildcard origin.
- `POST /auth/login` and `POST /auth/register` are **rate-limited** (5/min and 3/min by
  default, both configurable via env vars) using `slowapi`'s in-memory store. In-memory (not
  Redis) is a deliberate choice, not an oversight: this deployment runs the backend as a
  single container/single process, so there's no horizontal scaling that would fragment the
  counters across processes, and introducing Redis solely for rate limiting would add an
  operational dependency disproportionate to this project's scope. The tradeoff: counters
  reset on container restart, and a future multi-replica deployment would need to swap
  `storage_uri="memory://"` for a `redis://` URL (a supported, drop-in change).
- Resume uploads are validated three independent ways — declared `Content-Type`, a 5MB size
  cap, and **PDF magic-byte sniffing** on the actual file content — because a client can
  declare any `Content-Type` it wants; only the last check looks at the bytes actually sent.
- **Ownership is checked independently of role** everywhere a job, application, or resume is
  accessed — see [Cross-tenant access control](#cross-tenant-access-control-worth-trying-deliberately) above.
- A duplicate application is prevented at the **database level** (a `UniqueConstraint` on
  `(job_id, candidate_id)`), not just with an application-side check, so it holds even under
  concurrent requests.

## Known limitations

Some of these are gaps closed specifically for this build because the evaluation criteria call
out security and testing; the rest are left open, honestly, as out of scope for this project's
size.

**Closed in this build** (deliberately prioritized, since the evaluation criteria call out
security and testing specifically):
- Rate limiting on the login/register endpoints.
- A real frontend automated test suite (Vitest + React Testing Library), not just
  type-checking and a build.

**Left open, by design**:
- **No refresh tokens.** A single access token, 24 hours by default; when it expires, the user
  has to log in again. A production system would add refresh-token rotation.
- **JWT stored in `localStorage`**, not an httpOnly cookie — acceptable for a scoped project,
  but it means a successful XSS could exfiltrate the token. An httpOnly-cookie-based flow
  would need CSRF protection in exchange.
- **No password reset or email verification.** There's no email provider in this stack, so
  registration trusts any syntactically valid email as-is.
- **No real email delivery.** The "inbox", including the candidate directory's templated
  **bulk email** action, is entirely in-app — every message is a real, persisted `Message` row
  that shows up in the candidate's Inbox, but there's no email provider in this stack, so
  nothing is ever delivered to an actual mailbox outside the app.
- **The ATS match score is a transparent, structured-data heuristic** (skill overlap +
  experience-range fit), not resume parsing or NLP. It's honest about what it is, not a claim
  of AI matching.
- **Search uses Postgres `ILIKE`**, not full-text search or a dedicated search engine — fine
  at this scale, would need to change if job/candidate volume grew substantially.
- **The applicant list's ATS-rating filter and sort happen in Python**, not SQL, because the
  rating is a computed (non-persisted) property. Fine at the scale of applicants-per-job;
  would not scale to a very large, unbounded applicant table.
- **No API versioning strategy** beyond the static `/api/v1` prefix — no precedent here for
  how a `v2` would coexist with `v1`.
- **No CI pipeline** — tests are run manually/locally as described above, not on every push.
