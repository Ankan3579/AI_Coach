import os

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()


SUPABASE_URL = os.getenv(
    "SUPABASE_URL"
)

SUPABASE_SECRET_KEY = os.getenv(
    "SUPABASE_SECRET_KEY"
)


if not SUPABASE_URL:
    raise RuntimeError(
        "SUPABASE_URL is missing."
    )


if not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY is missing."
    )


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


def create_interview(
    data: dict
):

    response = (
        supabase
        .table("interviews")
        .insert(data)
        .execute()
    )

    return response.data


def save_question(
    data: dict
):

    response = (
        supabase
        .table("interview_questions")
        .insert(data)
        .execute()
    )

    return response.data


def save_answer(
    data: dict
):

    response = (
        supabase
        .table("interview_answers")
        .insert(data)
        .execute()
    )

    return response.data


def save_coding_submission(
    data: dict
):

    response = (
        supabase
        .table("coding_submissions")
        .insert(data)
        .execute()
    )

    return response.data


def save_skill_score(
    data: dict
):

    response = (
        supabase
        .table("skill_scores")
        .insert(data)
        .execute()
    )

    return response.data


def save_report(
    data: dict
):

    response = (
        supabase
        .table("interview_reports")
        .insert(data)
        .execute()
    )

    return response.data