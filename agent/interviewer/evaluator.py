import math
from typing import Annotated, Literal

from config import invoke_llm
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

from agent.interviewer.prompt import ANSWER_EVALUATION_PROMPT
from tools.guardrails import (
    check_model_output_safety,
    serialize_untrusted,
    strip_json_fence,
)


DIFFICULTY_LEVELS = ("easy", "medium", "hard")
FeedbackText = Annotated[str, Field(min_length=1, max_length=2000)]


class AnswerEvaluation(BaseModel):
    model_config = ConfigDict(extra="ignore")

    score: float = Field(ge=0, le=10)
    correct: bool = False
    rating: Literal["excellent", "good", "average", "poor"] = "average"
    strengths: list[FeedbackText] = Field(default_factory=list, max_length=20)
    weaknesses: list[FeedbackText] = Field(default_factory=list, max_length=20)
    missing_points: list[FeedbackText] = Field(default_factory=list, max_length=20)
    technical_feedback: Annotated[str, Field(max_length=4000)] = ""
    improved_answer: Annotated[str, Field(max_length=6000)] = ""
    recommended_difficulty: Literal["easy", "medium", "hard"] = "medium"

    @field_validator("score", mode="before")
    @classmethod
    def reject_boolean_or_non_numeric_score(cls, value):
        if isinstance(value, bool) or not isinstance(value, (int, float)):
            raise ValueError("The score must be a number from 0 to 10.")
        if not math.isfinite(value):
            raise ValueError("The score must be finite.")
        return value

    @field_validator(
        "strengths",
        "weaknesses",
        "missing_points",
        "technical_feedback",
        "improved_answer",
    )
    @classmethod
    def strip_feedback_text(cls, value):
        if isinstance(value, list):
            normalized = [item.strip() for item in value]
            if any(not item for item in normalized):
                raise ValueError("Feedback entries cannot be blank.")
            return normalized
        return value.strip()


def _recommended_difficulty(score, current_difficulty):
    if current_difficulty not in DIFFICULTY_LEVELS:
        current_difficulty = "medium"

    current_index = DIFFICULTY_LEVELS.index(current_difficulty)

    if score >= 8:
        current_index = min(current_index + 1, len(DIFFICULTY_LEVELS) - 1)
    elif score <= 4:
        current_index = max(current_index - 1, 0)

    return DIFFICULTY_LEVELS[current_index]


class AnswerEvaluator:

    def evaluate(self, state):
        question_type = state.get(
            "current_question_type",
            state.get("question_type", "technical")
        )

        candidate_answer = state.get("candidate_answer", "")
        code = state.get("code", "")

        if question_type == "coding" and not code:
            code = candidate_answer
            candidate_answer = ""

        prompt = ANSWER_EVALUATION_PROMPT.format(

            question=serialize_untrusted(
                state.get("current_question", "")
            ),

            question_type=serialize_untrusted(question_type),

            programming_language=serialize_untrusted(
                state.get("programming_language", "not specified")
            ),

            topic=serialize_untrusted(
                state.get(
                    "current_topic",
                    state.get("selected_topic", "")
                )
            ),

            difficulty=serialize_untrusted(
                state.get("current_difficulty", "medium")
            ),

            code=serialize_untrusted(code),

            answer=serialize_untrusted(candidate_answer),

        )

        content = invoke_llm(prompt, temperature=0.2)
        content = strip_json_fence(content)

        try:
            evaluation = AnswerEvaluation.model_validate_json(
                content
            ).model_dump()
        except ValidationError as exc:
            raise ValueError(
                "Answer evaluator returned invalid or unsafe output."
            ) from exc

        evaluation["recommended_difficulty"] = _recommended_difficulty(
            evaluation["score"],
            state.get("current_difficulty", "medium")
        )

        check_model_output_safety(
            evaluation,
            context="interview evaluation",
        )
        return evaluation