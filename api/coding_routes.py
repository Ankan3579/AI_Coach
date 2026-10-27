from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Literal
import traceback

from services.coding_service import evaluate_code
from tools.guardrails import check_user_input_safety, validate_user_text


router = APIRouter(
    prefix="/api/code",
    tags=["Coding Platform"],
)


class CodeSubmission(BaseModel):

    source_code: str = Field(
        min_length=1,
        max_length=50000,
    )

    language: Literal["python", "java", "cpp", "javascript", "c"] = "python"

    question_id: str = Field(min_length=1, max_length=100)

    stdin: str = Field(default="", max_length=10000)

    @field_validator("source_code", "stdin")
    @classmethod
    def validate_code_input(cls, value: str, info) -> str:
        return validate_user_text(
            value,
            field="Source code" if info.field_name == "source_code" else "Input",
            max_length=50000 if info.field_name == "source_code" else 10000,
            allow_empty=info.field_name == "stdin",
            strip_whitespace=False,
        )


@router.post("/submit")
def submit_code(request: CodeSubmission):
    check_user_input_safety(
        request.source_code,
        context="coding submission",
    )

    # Temporary test cases
    test_cases = [
        {
            "input": "10 20\n",
            "expected_output": "30",
        },
        {
            "input": "-2 8\n",
            "expected_output": "6",
        },
    ]

    # Check question
    if request.question_id != "sum_two_numbers":
        raise HTTPException(
            status_code=404,
            detail="Coding question not found",
        )

    try:

        result = evaluate_code(
            source_code=request.source_code,
            language=request.language,
            test_cases=test_cases,
        )

        return {
            "question_id": request.question_id,
            **result,
        }

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:

        traceback.print_exc()

        raise HTTPException(
            status_code=502,
            detail=f"Code execution failed: {str(exc)}",
        )