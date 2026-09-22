from datetime import date

from pydantic import BaseModel


class ApplicationsTrendPoint(BaseModel):
    date: date
    count: int


class HRDashboardStatsOut(BaseModel):
    total_jobs: int
    active_jobs: int
    total_applicants: int
    applied_count: int
    shortlisted_count: int
    rejected_count: int
    applications_trend: list[ApplicationsTrendPoint]
