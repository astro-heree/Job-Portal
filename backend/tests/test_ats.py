from app.core.ats import compute_ats_score, score_to_rating


def test_full_skill_and_experience_match_scores_100():
    score = compute_ats_score(
        candidate_skills=["Python", "FastAPI"],
        candidate_experience_years=3,
        job_skills=["Python", "FastAPI"],
        job_min_experience_years=2,
        job_max_experience_years=5,
    )
    assert score == 100


def test_no_skill_overlap_scores_low():
    score = compute_ats_score(
        candidate_skills=["Cobol"],
        candidate_experience_years=3,
        job_skills=["Python", "FastAPI"],
        job_min_experience_years=2,
        job_max_experience_years=5,
    )
    assert score < 50


def test_job_with_no_required_skills_gives_full_skill_credit():
    score = compute_ats_score(
        candidate_skills=[],
        candidate_experience_years=3,
        job_skills=[],
        job_min_experience_years=2,
        job_max_experience_years=5,
    )
    assert score == 100


def test_job_with_no_experience_requirement_gives_full_experience_credit():
    score = compute_ats_score(
        candidate_skills=["Python"],
        candidate_experience_years=None,
        job_skills=["Python"],
        job_min_experience_years=None,
        job_max_experience_years=None,
    )
    assert score == 100


def test_missing_candidate_experience_against_a_requirement_scores_lower():
    with_experience = compute_ats_score(
        candidate_skills=["Python"],
        candidate_experience_years=3,
        job_skills=["Python"],
        job_min_experience_years=2,
        job_max_experience_years=5,
    )
    without_experience = compute_ats_score(
        candidate_skills=["Python"],
        candidate_experience_years=None,
        job_skills=["Python"],
        job_min_experience_years=2,
        job_max_experience_years=5,
    )
    assert without_experience < with_experience


def test_experience_outside_range_penalized_but_bounded_at_zero():
    score = compute_ats_score(
        candidate_skills=["Python"],
        candidate_experience_years=50,
        job_skills=["Python"],
        job_min_experience_years=0,
        job_max_experience_years=2,
    )
    assert 0 <= score <= 100


def test_score_is_case_insensitive_on_skills():
    score = compute_ats_score(
        candidate_skills=["python", "FASTAPI"],
        candidate_experience_years=None,
        job_skills=["Python", "FastAPI"],
        job_min_experience_years=None,
        job_max_experience_years=None,
    )
    assert score == 100


def test_score_to_rating_boundaries():
    assert score_to_rating(100) == 5
    assert score_to_rating(90) == 5
    assert score_to_rating(89) == 4
    assert score_to_rating(70) == 4
    assert score_to_rating(69) == 3
    assert score_to_rating(50) == 3
    assert score_to_rating(49) == 2
    assert score_to_rating(25) == 2
    assert score_to_rating(24) == 1
    assert score_to_rating(0) == 1
