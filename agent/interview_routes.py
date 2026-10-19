from uuid import uuid4

from fastapi import APIRouter

from schemas.interview_schemas import (
    StartInterviewRequest,
)

from agent.interviewer_agent import get_next_question


router = APIRouter(
    prefix="/api/interviews",
    tags=["AI Interviewer"],
)


@router.post("/start")
def start_interview(
    request: StartInterviewRequest,
):

    session_id = str(uuid4())
    question_id = str(uuid4())

    question_result = get_next_question(
        topic=request.topic,
        difficulty=request.difficulty,
        interview_type=request.interview_type,
        programming_language=request.programming_language,
        resume_summary=request.resume_summary or "",
    )

    return {
        "session_id": session_id,
        "question_id": question_id,
        "duration_minutes": request.duration_minutes,
        "question": question_result["question"],
        "question_type": question_result["question_type"],
        "expected_skills": question_result.get(
            "expected_skills", []
        ),
    }