"""Idempotent demo data: HR accounts, candidates, jobs, applications, and
messages. Safe to re-run -- checks for a marker record before inserting
anything, so `docker compose up` never double-seeds.
"""

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.application import Application
from app.models.candidate_profile import CandidateProfile
from app.models.enums import ApplicationStatus, EmploymentType, UserRole
from app.models.hr_profile import HRProfile
from app.models.job import Job
from app.models.message import Message
from app.models.user import User

SEED_PASSWORD = "Password123!"
MARKER_EMAIL = "hr1@jobportal.dev"


def _create_user(db, *, email: str, full_name: str, role: UserRole) -> User:
    user = User(email=email, password_hash=hash_password(SEED_PASSWORD), full_name=full_name, role=role)
    db.add(user)
    db.flush()
    return user


def run() -> None:
    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == MARKER_EMAIL).first() is not None:
            print("Seed data already present, skipping.")
            return

        hr1 = _create_user(db, email="hr1@jobportal.dev", full_name="Priya Sharma", role=UserRole.HR)
        db.add(HRProfile(user_id=hr1.id, company_name="Acme Corp", designation="Talent Acquisition Lead"))

        hr2 = _create_user(db, email="hr2@jobportal.dev", full_name="James Carter", role=UserRole.HR)
        db.add(HRProfile(user_id=hr2.id, company_name="Globex Inc", designation="HR Manager"))
        db.flush()

        candidates_data = [
            ("candidate1@jobportal.dev", "Alex Chen", "Backend Developer",
             ["Python", "FastAPI", "PostgreSQL"], 3, "Remote"),
            ("candidate2@jobportal.dev", "Morgan Lee", "Frontend Developer",
             ["React", "TypeScript", "CSS"], 2, "New York"),
            ("candidate3@jobportal.dev", "Sam Patel", "Full Stack Engineer",
             ["Python", "React", "PostgreSQL"], 5, "Remote"),
            ("candidate4@jobportal.dev", "Jordan Kim", "Data Engineer",
             ["Python", "SQL", "Airflow"], 4, "San Francisco"),
            ("candidate5@jobportal.dev", "Taylor Brooks", "Junior Developer",
             ["JavaScript", "HTML", "CSS"], 0.5, "Remote"),
            ("candidate6@jobportal.dev", "Casey Rivera", "DevOps Engineer",
             ["Docker", "Kubernetes", "AWS"], 6, "Austin"),
        ]
        candidates = []
        for email, full_name, headline, skills, experience, location in candidates_data:
            user = _create_user(db, email=email, full_name=full_name, role=UserRole.CANDIDATE)
            db.add(
                CandidateProfile(
                    user_id=user.id,
                    headline=headline,
                    skills=skills,
                    experience_years=experience,
                    location=location,
                )
            )
            candidates.append(user)
        db.flush()

        jobs_data = [
            (hr1, "Backend Engineer", "Build and scale our API platform using Python and FastAPI.",
             ["Python", "FastAPI", "PostgreSQL"], "Remote", EmploymentType.FULL_TIME,
             2, 6, 90000, 130000, True),
            (hr1, "Frontend Engineer", "Craft delightful user interfaces with React and TypeScript.",
             ["React", "TypeScript"], "New York", EmploymentType.FULL_TIME, 1, 4, 80000, 110000, True),
            (hr1, "DevOps Engineer", "Own our cloud infrastructure and CI/CD pipelines.",
             ["Docker", "Kubernetes", "AWS"], "Austin", EmploymentType.FULL_TIME, 3, 8, 100000, 150000, True),
            (hr1, "Data Analyst Intern", "Support the data team with reporting and analysis.",
             ["SQL", "Excel"], "Remote", EmploymentType.INTERNSHIP, 0, 1, None, None, False),
            (hr2, "Full Stack Developer", "Work across our entire stack, from API to UI.",
             ["Python", "React"], "Remote", EmploymentType.FULL_TIME, 2, 5, 85000, 120000, True),
            (hr2, "Data Engineer", "Design and maintain our data pipelines.",
             ["Python", "SQL", "Airflow"], "San Francisco", EmploymentType.FULL_TIME, 3, 7, 110000, 150000, True),
            (hr2, "Contract QA Engineer", "Own quality across our release cycles.",
             ["Testing", "Automation"], "Remote", EmploymentType.CONTRACT, 1, 4, None, None, True),
            (hr2, "Marketing Coordinator", "Support marketing campaigns and events.",
             [], "New York", EmploymentType.PART_TIME, None, None, None, None, False),
        ]
        jobs = []
        for hr, title, description, skills, location, employment_type, min_exp, max_exp, sal_min, sal_max, is_active in jobs_data:
            job = Job(
                hr_id=hr.id,
                title=title,
                description=description,
                skills=skills,
                location=location,
                employment_type=employment_type,
                min_experience_years=min_exp,
                max_experience_years=max_exp,
                salary_min=sal_min,
                salary_max=sal_max,
                is_active=is_active,
            )
            db.add(job)
            jobs.append(job)
        db.flush()

        applications_data = [
            (jobs[0], candidates[0], ApplicationStatus.SHORTLISTED,
             "I've built several FastAPI services in production."),
            (jobs[0], candidates[2], ApplicationStatus.APPLIED, "Excited about this opportunity."),
            (jobs[1], candidates[1], ApplicationStatus.SHORTLISTED, "React is my primary stack."),
            (jobs[1], candidates[4], ApplicationStatus.REJECTED, None),
            (jobs[2], candidates[5], ApplicationStatus.APPLIED,
             "I manage a Kubernetes cluster at my current job."),
            (jobs[4], candidates[2], ApplicationStatus.APPLIED, None),
            (jobs[5], candidates[3], ApplicationStatus.SHORTLISTED,
             "I've worked with Airflow for 3 years."),
        ]
        for job, candidate, status, cover_note in applications_data:
            db.add(Application(job_id=job.id, candidate_id=candidate.id, status=status, cover_note=cover_note))

        db.add(
            Message(
                sender_hr_id=hr1.id,
                recipient_candidate_id=candidates[0].id,
                subject="Great fit for Backend Engineer",
                body="Hi Alex, we'd love to schedule an interview. Are you available this week?",
            )
        )
        db.add(
            Message(
                sender_hr_id=hr1.id,
                recipient_candidate_id=candidates[1].id,
                subject="Thanks for applying",
                body="Hi Morgan, thank you for your interest in the Frontend Engineer role.",
            )
        )
        db.add(
            Message(
                sender_hr_id=hr2.id,
                recipient_candidate_id=candidates[3].id,
                subject="Interview scheduled",
                body="Hi Jordan, your interview for Data Engineer is confirmed for next Tuesday.",
            )
        )

        db.commit()
        print("Seed data created.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
