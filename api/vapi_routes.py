from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from agent.interviewer.recommender import InterviewRecommender


router = APIRouter(
    prefix="/api/vapi",
    tags=["Vapi"]
)


# ---------------------------------------------------------
# Interview recommender
# ---------------------------------------------------------

recommender = InterviewRecommender()


# ---------------------------------------------------------
# Temporary session storage
# Later replace this with Supabase/Redis
# ---------------------------------------------------------

sessions = {}


# ---------------------------------------------------------
# REQUEST MODEL
# ---------------------------------------------------------

class NextQuestionRequest(BaseModel):
    session_id: str

    candidate_name: Optional[str] = "Candidate"
    target_role: Optional[str] = "AI Engineer"

    interview_type: Optional[str] = "technical"

    programming_language: Optional[str] = "python"

    selected_topic: Optional[str] = "data structures"

    current_difficulty: Optional[str] = "medium"

    question_number: Optional[int] = 1

    remaining_time: Optional[float] = 45

    resume_text: Optional[str] = ""

    skills: Optional[list] = []

    candidate_answer: Optional[str] = ""


# ---------------------------------------------------------
# NEXT QUESTION
# ---------------------------------------------------------

@router.post("/next-question")
async def next_question(data: NextQuestionRequest):

    try:

        # ---------------------------------------------
        # Get existing session
        # ---------------------------------------------

        state = sessions.get(data.session_id)

        if state is None:

            state = {
                "session_id": data.session_id,

                "candidate_name": data.candidate_name,

                "target_role": data.target_role,

                "interview_type": data.interview_type,

                "programming_language":
                    data.programming_language,

                "selected_topic":
                    data.selected_topic,

                "current_difficulty":
                    data.current_difficulty,

                "question_number":
                    data.question_number,

                "remaining_time":
                    data.remaining_time,

                "resume_text":
                    data.resume_text,

                "skills":
                    data.skills,

                "strong_skills": [],

                "weak_skills": [],

                "interview_history": [],

                "questions_asked": [],

            }

        else:

            # Update dynamic values

            if data.current_difficulty:
                state["current_difficulty"] = \
                    data.current_difficulty

            if data.remaining_time is not None:
                state["remaining_time"] = \
                    data.remaining_time

            if data.question_number:
                state["question_number"] = \
                    data.question_number

            if data.candidate_answer:
                state["candidate_answer"] = \
                    data.candidate_answer


        # ---------------------------------------------
        # Ask your existing AI recommender
        # ---------------------------------------------

        recommendation = recommender.recommend(state)


        # ---------------------------------------------
        # Store generated question
        # ---------------------------------------------

        state["current_question"] = \
            recommendation.get("question", "")

        state["question_type"] = \
            recommendation.get(
                "question_type",
                "technical"
            )

        state["current_topic"] = \
            recommendation.get(
                "topic",
                state.get("selected_topic", "")
            )

        state["current_difficulty"] = \
            recommendation.get(
                "difficulty",
                state.get(
                    "current_difficulty",
                    "medium"
                )
            )

        state["coding_problem"] = \
            recommendation.get("coding_problem")


        # ---------------------------------------------
        # Save session
        # ---------------------------------------------

        sessions[data.session_id] = state


        # ---------------------------------------------
        # Return response to Vapi
        # ---------------------------------------------

        return {
            "success": True,

            "session_id":
                data.session_id,

            "question":
                state["current_question"],

            "question_type":
                state["question_type"],

            "topic":
                state["current_topic"],

            "difficulty":
                state["current_difficulty"],

            "reason":
                recommendation.get(
                    "reason",
                    ""
                )
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )