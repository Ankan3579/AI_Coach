import uuid

from fastapi import APIRouter, HTTPException, Request
from openai import OpenAI, OpenAIError
from pydantic import BaseModel

from agent.interviewer.recommender import InterviewRecommender
from agent.interviewer.evaluator import AnswerEvaluator
from config import OPENAI_API_KEY


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

    candidate_name: str
    target_role: str = "AI Engineer"

    interview_type: str = "technical"

    selected_topic: str | None = None

    duration_minutes: int = 45

    difficulty: str = "medium"

    programming_language: str = "python"


class AnswerRequest(BaseModel):

    session_id: str
    answer: str = ""
    code: str = ""


def _transcribe_audio(audio: bytes, content_type: str) -> str:
    mime_type = content_type.split(";", 1)[0].strip().lower()
    extension = AUDIO_EXTENSIONS.get(mime_type)
    if not extension:
        raise HTTPException(
            status_code=415,
            detail="Unsupported audio type. Send a supported audio recording.",
        )

    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Set OPENAI_API_KEY to enable Whisper transcription.",
        )

    try:
        response = OpenAI(api_key=OPENAI_API_KEY).audio.transcriptions.create(
            model="whisper-1",
            file=(f"answer{extension}", audio, mime_type),
        )
    except OpenAIError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Whisper transcription failed: {exc}",
        ) from exc

    transcript = response.text.strip()
    if not transcript:
        raise HTTPException(
            status_code=422,
            detail="Whisper could not detect speech in the recording.",
        )

    return transcript


def _process_answer(state: dict, answer: str, code: str = "") -> dict:
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

    question = recommender.recommend(
        state
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

    return _process_answer(state, request.answer, request.code)


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
    result = _process_answer(state, transcript)
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