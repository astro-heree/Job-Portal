from datetime import datetime, timedelta, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.enums import ApplicationStatus
from app.models.job import Job
from app.models.message import Message
from app.models.user import User
from app.schemas.candidate import CandidateStatsOut
from app.schemas.dashboard import ApplicationsTrendPoint, HRDashboardStatsOut

TREND_WINDOW_DAYS = 14


def get_hr_dashboard_stats(db: Session, hr_user: User) -> HRDashboardStatsOut:
    total_jobs = db.query(func.count(Job.id)).filter(Job.hr_id == hr_user.id).scalar() or 0
    active_jobs = (
        db.query(func.count(Job.id))
        .filter(Job.hr_id == hr_user.id, Job.is_active.is_(True))
        .scalar()
        or 0
    )

    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.hr_id == hr_user.id)
        .group_by(Application.status)
        .all()
    )
    counts_by_status = {status: count for status, count in status_counts}
    total_applicants = sum(counts_by_status.values())

    # Bucket by UTC calendar date explicitly -- func.date() alone truncates
    # in the DB session's configured timezone, which can differ from the
    # UTC dates used on the Python side below and silently misplace rows
    # into the wrong (or no) bucket.
    applied_at_utc_date = func.date(func.timezone("UTC", Application.applied_at))
    window_start = datetime.now(timezone.utc) - timedelta(days=TREND_WINDOW_DAYS - 1)
    trend_rows = (
        db.query(applied_at_utc_date, func.count(Application.id))
        .join(Job, Application.job_id == Job.id)
        .filter(Job.hr_id == hr_user.id, Application.applied_at >= window_start)
        .group_by(applied_at_utc_date)
        .all()
    )
    trend_by_date = {row_date: count for row_date, count in trend_rows}
    today = datetime.now(timezone.utc).date()
    trend = [
        ApplicationsTrendPoint(
            date=today - timedelta(days=offset),
            count=trend_by_date.get(today - timedelta(days=offset), 0),
        )
        for offset in range(TREND_WINDOW_DAYS - 1, -1, -1)
    ]

    return HRDashboardStatsOut(
        total_jobs=total_jobs,
        active_jobs=active_jobs,
        total_applicants=total_applicants,
        applied_count=counts_by_status.get(ApplicationStatus.APPLIED, 0),
        shortlisted_count=counts_by_status.get(ApplicationStatus.SHORTLISTED, 0),
        rejected_count=counts_by_status.get(ApplicationStatus.REJECTED, 0),
        applications_trend=trend,
    )


def get_candidate_stats(db: Session, candidate_user: User) -> CandidateStatsOut:
    status_counts = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.candidate_id == candidate_user.id)
        .group_by(Application.status)
        .all()
    )
    counts_by_status = {status: count for status, count in status_counts}

    unread = (
        db.query(func.count(Message.id))
        .filter(Message.recipient_candidate_id == candidate_user.id, Message.read_at.is_(None))
        .scalar()
        or 0
    )

    return CandidateStatsOut(
        total_applications=sum(counts_by_status.values()),
        applied_count=counts_by_status.get(ApplicationStatus.APPLIED, 0),
        shortlisted_count=counts_by_status.get(ApplicationStatus.SHORTLISTED, 0),
        rejected_count=counts_by_status.get(ApplicationStatus.REJECTED, 0),
        unread_messages=unread,
    )
