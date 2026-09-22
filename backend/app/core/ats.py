"""A transparent, structured-data ATS match heuristic.

This is deliberately *not* resume parsing or NLP — it compares the candidate's
declared skills/experience against the job's declared requirements and
produces an explainable 0-100 score. See README "Known Limitations".
"""


def compute_ats_score(
    *,
    candidate_skills: list[str] | None,
    candidate_experience_years: float | None,
    job_skills: list[str] | None,
    job_min_experience_years: float | None,
    job_max_experience_years: float | None,
) -> int:
    skill_score = _skill_score(candidate_skills, job_skills)
    experience_score = _experience_score(
        candidate_experience_years, job_min_experience_years, job_max_experience_years
    )
    score = round(skill_score * 0.7 + experience_score * 0.3)
    return max(0, min(100, score))


def score_to_rating(score: int) -> int:
    """Map a 0-100 score onto a 1-5 star rating for display."""
    if score >= 90:
        return 5
    if score >= 70:
        return 4
    if score >= 50:
        return 3
    if score >= 25:
        return 2
    return 1


def _skill_score(candidate_skills: list[str] | None, job_skills: list[str] | None) -> float:
    if not job_skills:
        return 100.0

    candidate_set = {s.strip().lower() for s in (candidate_skills or []) if s.strip()}
    job_set = {s.strip().lower() for s in job_skills if s.strip()}
    if not job_set:
        return 100.0

    overlap = len(candidate_set & job_set)
    return (overlap / len(job_set)) * 100


def _experience_score(
    candidate_experience_years: float | None,
    job_min_experience_years: float | None,
    job_max_experience_years: float | None,
) -> float:
    if job_min_experience_years is None and job_max_experience_years is None:
        return 100.0
    if candidate_experience_years is None:
        return 0.0

    lo = float(job_min_experience_years) if job_min_experience_years is not None else 0.0
    hi = float(job_max_experience_years) if job_max_experience_years is not None else lo + 100.0
    experience = float(candidate_experience_years)

    if lo <= experience <= hi:
        return 100.0

    distance = min(abs(experience - lo), abs(experience - hi))
    return max(0.0, 100.0 - distance * 20.0)
