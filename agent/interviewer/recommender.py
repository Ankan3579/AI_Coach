from typing import Annotated, Literal

from config import invoke_llm
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from agent.interviewer.prompt import (
    QUESTION_RECOMMENDATION_PROMPT
)
from tools.guardrails import (
    check_model_output_safety,
    serialize_untrusted,
    strip_json_fence,
)


class QuestionRecommendation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    question: Annotated[str, Field(min_length=1, max_length=4000)]
    question_type: Literal[
        "technical", "behavioral", "resume", "coding", "follow_up"
    ] = "technical"
    topic: Annotated[str, Field(max_length=160)] = ""
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    reason: Annotated[str, Field(max_length=2000)] = ""

    @field_validator("question", "topic", "reason")
    @classmethod
    def strip_output_text(cls, value: str, info) -> str:
        normalized = value.strip()
        if info.field_name == "question" and not normalized:
            raise ValueError("The generated question cannot be blank.")
        return normalized


class InterviewRecommender:

    def recommend(self, state):

        history = state.get(
            "interview_history",
            []
        )

        prompt = QUESTION_RECOMMENDATION_PROMPT.format(
            candidate_name=serialize_untrusted(
                state.get("candidate_name", "Candidate")
            ),

            target_role=serialize_untrusted(
                state.get("target_role", "AI Engineer")
            ),

            interview_type=serialize_untrusted(
                state.get("interview_type", "technical")
            ),

            programming_language=serialize_untrusted(
                state.get("programming_language", "python")
            ),

            selected_topic=serialize_untrusted(
                state.get("selected_topic", "")
            ),

            current_difficulty=state.get(
                "current_difficulty",
                "medium"
            ),

            question_number=state.get(
                "question_number",
                1
            ),

            remaining_time=state.get(
                "remaining_time",
                "unknown"
            ),

            resume_text=serialize_untrusted(
                state.get("resume_text", "")
            ),

            skills=serialize_untrusted(state.get("skills", [])),

            strong_skills=serialize_untrusted(
                state.get("strong_skills", [])
            ),

            weak_skills=serialize_untrusted(
                state.get("weak_skills", [])
            ),

            interview_history=serialize_untrusted(history),

        )

        content = invoke_llm(prompt, temperature=0.2)
        content = strip_json_fence(content)

        try:
            recommendation = QuestionRecommendation.model_validate_json(
                content
            ).model_dump()
        except ValidationError as exc:
            print("\n========== RECOMMENDER VALIDATION ERROR ==========")
            print("RAW LLM OUTPUT:")
            print(content)
            print("\nPYDANTIC ERROR:")
            print(exc)
            print("=================================================\n")

            raise ValueError(
        "Question recommender returned invalid output."
        ) from exc

        if state.get("interview_type") == "coding":
            recommendation["question_type"] = "coding"
            recommendation["difficulty"] = state.get(
                "current_difficulty",
                "medium"
            )

        check_model_output_safety(
            recommendation,
            context="interview question",
        )
        return recommendation