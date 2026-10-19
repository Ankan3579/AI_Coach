from typing import Literal, Optional

from pydantic import BaseModel, Field


# ==========================================
# 1. Start Interview Request
# ==========================================

class StartInterviewRequest(BaseModel):
    user_id: str = Field(
        ...,
        min_length=1,
        description="Unique ID of the authenticated user",
    )

    interview_type: Literal[
        "technical",
        "coding",
        "behavioral",
    ] = Field(
        ...,
        description="Type of interview",
    )

    topic: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Selected interview topic",
    )

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = Field(
        default="medium",
        description="Interview difficulty",
    )

    duration_minutes: int = Field(
        default=45,
        ge=5,
        le=180,
        description="Duration of the interview in minutes",
    )

    programming_language: Literal[
        "python",
        "java",
        "cpp",
        "javascript",
        "c",
    ] = Field(
        default="python",
        description="Programming language for coding interviews",
    )

    resume_summary: Optional[str] = Field(
        default=None,
        max_length=10000,
        description="Relevant information extracted from the resume",
    )


# ==========================================
# 2. Submit Interview Answer
# ==========================================

class SubmitAnswerRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
        description="Current interview session ID",
    )

    question_id: str = Field(
        ...,
        min_length=1,
        description="ID of the question being answered",
    )

    answer: str = Field(
        ...,
        min_length=1,
        max_length=20000,
        description="User's text answer",
    )


# ==========================================
# 3. Interview Question Response
# ==========================================

class InterviewResponse(BaseModel):
    session_id: str

    question_id: str

    question: str

    question_type: Literal[
        "technical",
        "coding",
        "behavioral",
    ]

    difficulty: Literal[
        "easy",
        "medium",
        "hard",
    ] = "medium"


# ==========================================
# 4. Code Submission Request
# ==========================================

class CodeSubmissionRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
    )

    question_id: str = Field(
        ...,
        min_length=1,
    )

    source_code: str = Field(
        ...,
        min_length=1,
        max_length=50000,
    )

    language: Literal[
        "python",
        "java",
        "cpp",
        "javascript",
        "c",
    ] = "python"


# ==========================================
# 5. Coding Evaluation Response
# ==========================================

class CodingEvaluationResponse(BaseModel):
    session_id: str

    question_id: str

    total_tests: int = Field(ge=0)

    passed_tests: int = Field(ge=0)

    failed_tests: int = Field(ge=0)

    score_percentage: float = Field(
        ge=0,
        le=100,
    )

    all_passed: bool


# ==========================================
# 6. Interview Feedback Response
# ==========================================

class InterviewFeedbackResponse(BaseModel):
    session_id: str

    overall_score: float = Field(
        ge=0,
        le=100,
    )

    strengths: list[str] = Field(
        default_factory=list,
    )

    weaknesses: list[str] = Field(
        default_factory=list,
    )

    improvement_suggestions: list[str] = Field(
        default_factory=list,
    )

    final_feedback: str