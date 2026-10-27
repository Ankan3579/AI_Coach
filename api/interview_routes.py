import asyncio
import json
import uuid
from typing import Literal

from fastapi import APIRouter, HTTPException, Request
from openai import OpenAI, OpenAIError
from pydantic import BaseModel, Field, field_validator

from agent.interviewer.recommender import InterviewRecommender
from agent.interviewer.evaluator import AnswerEvaluator
from config import OPENAI_API_KEY
from tools.guardrails import check_user_input_safety, validate_user_text


router = APIRouter(
    prefix="/interview",
    tags=["Interview"],
)


recommender = InterviewRecommender()
evaluator = AnswerEvaluator()


# Temporary in-memory storage.
# Later we will replace this with Supabase.
INTERVIEW_SESSIONS = {}

MAX_AUDIO_BYTES = 25 * 1024 * 1024
AUDIO_EXTENSIONS = {
    "audio/flac": ".flac",
    "audio/m4a": ".m4a",
    "audio/mp3": ".mp3",
    "audio/mp4": ".mp4",
    "audio/mpeg": ".mp3",
    "audio/mpga": ".mpga",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/webm": ".webm",
    "audio/x-wav": ".wav",
}


class StartInterviewRequest(BaseModel):

    candidate_name: str = Field(min_length=1, max_length=100)
    target_role: str = Field(default="AI Engineer", min_length=1, max_length=120)

    interview_type: Literal["technical", "coding", "behavioral"] = "technical"

    selected_topic: str | None = Field(default=None, max_length=160)

    duration_minutes: int = Field(default=45, ge=5, le=120)

    difficulty: Literal["easy", "medium", "hard"] = "medium"

    programming_language: Literal[
        "python", "javascript", "cpp", "java", "c"
    ] = "python"

    @field_validator("candidate_name", "target_role")
    @classmethod
    def validate_required_text(cls, value: str, info) -> str:
        return validate_user_text(
            value,
            field=info.field_name.replace("_", " ").capitalize(),
            max_length=100 if info.field_name == "candidate_name" else 120,
        )

    @field_validator("selected_topic")
    @classmethod
    def validate_topic(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return validate_user_text(
            value,
            field="Selected topic",
            max_length=160,
        )


class AnswerRequest(BaseModel):

    session_id: str = Field(min_length=1, max_length=64)
    answer: str = Field(default="", max_length=20000)
    code: str = Field(default="", max_length=50000)

    @field_validator("answer", "code")
    @classmethod
    def validate_answer_text(cls, value: str, info) -> str:
        return validate_user_text(
            value,
            field=info.field_name.capitalize(),
            max_length=20000 if info.field_name == "answer" else 50000,
            allow_empty=True,
            strip_whitespace=info.field_name != "code",
        )


import logging
import os
import requests

logger = logging.getLogger(__name__)


def _transcribe_audio(audio: bytes, content_type: str) -> str:
    mime_type = content_type.split(";", 1)[0].strip().lower()
    extension = AUDIO_EXTENSIONS.get(mime_type)
    if not extension:
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio type. Send a supported audio recording.",
        )

    transcript = ""
    # Try OpenAI Whisper first if key is configured
    if OPENAI_API_KEY:
        try:
            response = OpenAI(api_key=OPENAI_API_KEY).audio.transcriptions.create(
                model="whisper-1",
                file=(f"answer{extension}", audio, mime_type),
            )
            transcript = (response.text or "").strip()
        except OpenAIError as exc:
            logger.warning("OpenAI Whisper transcription failed (%s), falling back to Sarvam STT: %s", type(exc).__name__, exc)

    # Fallback to Sarvam STT if Whisper failed or was not configured
    if not transcript:
        sarvam_key = os.getenv("SARVAM_API_KEY")
        if sarvam_key:
            try:
                sarvam_resp = requests.post(
                    "https://api.sarvam.ai/speech-to-text",
                    headers={"api-subscription-key": sarvam_key},
                    files={"file": (f"answer{extension}", audio, mime_type)},
                    data={
                        "model": os.getenv("SARVAM_STT_MODEL", "saaras:v4"),
                        "language_code": os.getenv("SARVAM_LANGUAGE", "en-IN"),
                    },
                    timeout=30,
                )
                if sarvam_resp.status_code == 200:
                    data = sarvam_resp.json()
                    transcript = (data.get("transcript") or "").strip()
                else:
                    logger.warning("Sarvam STT returned status %d: %s", sarvam_resp.status_code, sarvam_resp.text[:200])
            except Exception as sarvam_err:
                logger.warning("Sarvam STT fallback failed: %s", sarvam_err)

    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="Speech could not be detected or transcribed in the recording. Please speak clearly into your microphone.",
        )
    if len(transcript) > 20000:
        raise HTTPException(
            status_code=422,
            detail="The transcribed answer exceeds the 20000-character limit.",
        )

    return transcript


def _process_answer(state: dict, answer: str, code: str = "") -> dict:
    try:
        answer = validate_user_text(
            answer,
            field="Answer",
            max_length=20000,
            allow_empty=True,
        )
        code = validate_user_text(
            code,
            field="Code",
            max_length=50000,
            allow_empty=True,
            strip_whitespace=False,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if not answer and not code.strip():
        raise HTTPException(
            status_code=422,
            detail="Submit an answer or source code",
        )

    if answer:
        check_user_input_safety(answer, context="interview answer")
    if code.strip():
        check_user_input_safety(code, context="interview code")

    state["candidate_answer"] = answer
    state["code"] = code

    evaluation = evaluator.evaluate(state)
    state["evaluation"] = evaluation
    question_difficulty = state["current_difficulty"]

    state["current_difficulty"] = evaluation.get(
        "recommended_difficulty",
        state["current_difficulty"],
    )

    state["interview_history"].append({
        "question": state["current_question"],
        "question_type": state["current_question_type"],
        "difficulty": question_difficulty,
        "answer": answer,
        "code": code,
        "evaluation": evaluation,
    })

    state["question_number"] += 1
    next_question = recommender.recommend(state)

    state["current_question"] = next_question["question"]
    state["current_question_type"] = next_question.get(
        "question_type",
        "technical",
    )
    state["question_type"] = state["current_question_type"]
    state["current_topic"] = next_question.get(
        "topic",
        state["selected_topic"],
    )
    state["current_difficulty"] = next_question.get(
        "difficulty",
        state["current_difficulty"],
    )

    return {
        "evaluation": evaluation,
        "next_question": next_question["question"],
        "question_type": next_question.get(
            "question_type",
            "technical",
        ),
        "difficulty": state["current_difficulty"],
    }


@router.post("/start")
async def start_interview(
    request: StartInterviewRequest
):

    session_id = str(uuid.uuid4())
    selected_topic = request.selected_topic or (
        "Data Structures and Algorithms"
        if request.interview_type == "coding"
        else "Machine Learning"
    )
    await asyncio.to_thread(
        check_user_input_safety,
        json.dumps(
            {
                "target_role": request.target_role,
                "interview_topic": selected_topic,
            },
            ensure_ascii=False,
        ),
        context="interview setup",
    )

    state = {

        "session_id": session_id,

        "candidate_name": request.candidate_name,

        "target_role": request.target_role,

        "interview_type": request.interview_type,

        "selected_topic": selected_topic,

        "current_difficulty": request.difficulty,

        "programming_language": request.programming_language,

        "question_number": 1,

        "remaining_time": request.duration_minutes,

        "current_question": "",

        "current_question_type": "",
        "question_type": "",
        "current_topic": selected_topic,
        "code": "",

        "candidate_answer": "",

        "evaluation": {},

        "interview_history": [],

        "status": "active",
    }

    # Generate first question

    question = await asyncio.to_thread(
        recommender.recommend,
        state,
    )

    state["current_question"] = question["question"]

    state["current_question_type"] = (
        question.get(
            "question_type",
            "technical"
        )
    )

    state["question_type"] = state["current_question_type"]
    state["current_topic"] = question.get(
        "topic",
        selected_topic
    )
    state["current_difficulty"] = question.get(
        "difficulty",
        request.difficulty
    )

    INTERVIEW_SESSIONS[session_id] = state

    return {

        "session_id": session_id,

        "question": question["question"],

        "question_type": question.get(
            "question_type",
            "technical"
        ),

        "topic": question.get(
            "topic",
            selected_topic
        ),

        "difficulty": question.get(
            "difficulty",
            request.difficulty
        ),
    }


@router.post("/answer")
async def submit_answer(
    request: AnswerRequest
):

    state = INTERVIEW_SESSIONS.get(
        request.session_id
    )

    if not state:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    if not request.answer.strip() and not request.code.strip():
        raise HTTPException(
            status_code=422,
            detail="Submit an answer or source code",
        )

    return await asyncio.to_thread(
        _process_answer,
        state,
        request.answer,
        request.code,
    )


@router.post("/{session_id}/answer-audio")
async def submit_audio_answer(session_id: str, request: Request):
    state = INTERVIEW_SESSIONS.get(session_id)
    if not state:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    audio = bytearray()
    async for chunk in request.stream():
        if len(audio) + len(chunk) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Audio recording must be 25 MB or smaller.",
            )
        audio.extend(chunk)

    if not audio:
        raise HTTPException(
            status_code=422,
            detail="Upload an audio recording containing your answer.",
        )

    transcript = _transcribe_audio(
        bytes(audio),
        request.headers.get("content-type", ""),
    )
    result = await asyncio.to_thread(
        _process_answer,
        state,
        transcript,
    )
    return {
        **result,
        "transcript": transcript,
    }


@router.post("/end/{session_id}")
async def end_interview(
    session_id: str
):

    state = INTERVIEW_SESSIONS.get(
        session_id
    )

    if not state:

        raise HTTPException(
            status_code=404,
            detail="Interview session not found",
        )

    state["status"] = "completed"

    return {

        "session_id": session_id,

        "status": "completed",

        "total_questions": state[
            "question_number"
        ],

        "history": state[
            "interview_history"
        ],
    }