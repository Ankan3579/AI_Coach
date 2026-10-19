from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import traceback

from services.coding_service import evaluate_code


router = APIRouter(
    prefix="/api/code",
    tags=["Coding Platform"],
)


class CodeSubmission(BaseModel):

    source_code: str = Field(
        min_length=1,
        max_length=50000,
    )

    language: str = "python"

    question_id: str

    stdin: str = ""


@router.post("/submit")
def submit_code(request: CodeSubmission):

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