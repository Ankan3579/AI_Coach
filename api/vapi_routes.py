import asyncio
import json
import logging
import os
from datetime import timedelta
from typing import Literal
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from livekit import api
from tools.guardrails import check_user_input_safety, validate_user_text
from pydantic import BaseModel, Field, field_validator


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/livekit",
    tags=["LiveKit"],
)


class LiveKitTokenRequest(BaseModel):
    candidate_name: str = Field(min_length=1, max_length=100)
    target_role: str = Field(default="AI Engineer", min_length=1, max_length=120)
    interview_type: Literal["technical", "coding", "behavioral"] = "technical"
    programming_language: Literal[
        "python", "javascript", "cpp", "java", "c"
    ] = "python"
    selected_topic: str = Field(
        default="data structures",
        min_length=1,
        max_length=160,
    )
    current_difficulty: Literal["easy", "medium", "hard"] = "medium"

    @field_validator(
        "candidate_name",
        "target_role",
        "interview_type",
        "programming_language",
        "selected_topic",
        "current_difficulty",
    )
    @classmethod
    def trim_and_reject_blank_values(cls, value: str, info) -> str:
        return validate_user_text(
            value,
            field=info.field_name.replace("_", " ").capitalize(),
            max_length={
                "candidate_name": 100,
                "target_role": 120,
                "interview_type": 40,
                "programming_language": 40,
                "selected_topic": 160,
                "current_difficulty": 20,
            }[info.field_name],
        )


@router.post("/token")
async def create_livekit_token(data: LiveKitTokenRequest) -> dict[str, str]:
    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not livekit_url or not api_key or not api_secret:
        raise HTTPException(
            status_code=503,
            detail=(
                "LiveKit is not configured. Set LIVEKIT_URL, "
                "LIVEKIT_API_KEY, and LIVEKIT_API_SECRET."
            ),
        )

    candidate_name = data.candidate_name.strip()
    if not candidate_name:
        raise HTTPException(
            status_code=422,
            detail="Candidate name cannot be blank.",
        )

    await asyncio.to_thread(
        check_user_input_safety,
        json.dumps(
            {
                "target_role": data.target_role,
                "interview_topic": data.selected_topic,
            },
            ensure_ascii=False,
        ),
        context="LiveKit interview setup",
    )

    session_id = str(uuid4())
    room_name = f"ai-coach-{session_id}"
    participant_identity = f"candidate-{session_id}"
    room_metadata = json.dumps(
        {
            "session_id": session_id,
            "candidate_name": candidate_name,
            "target_role": data.target_role,
            "interview_type": data.interview_type,
            "programming_language": data.programming_language,
            "selected_topic": data.selected_topic,
            "current_difficulty": data.current_difficulty,
        }
    )

    livekit_api = api.LiveKitAPI(
        url=livekit_url,
        api_key=api_key,
        api_secret=api_secret,
    )
    try:
        await livekit_api.room.create_room(
            api.CreateRoomRequest(
                name=room_name,
                metadata=room_metadata,
            )
        )
    except Exception as exc:
        logger.exception("Could not create LiveKit room")
        raise HTTPException(
            status_code=502,
            detail="Could not create the LiveKit voice room.",
        ) from exc
    finally:
        await livekit_api.aclose()

    token = (
        api.AccessToken(api_key, api_secret)
        .with_identity(participant_identity)
        .with_name(candidate_name)
        .with_ttl(timedelta(minutes=90))
        .with_grants(
            api.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )

    return {
        "session_id": session_id,
        "room_name": room_name,
        "livekit_url": livekit_url,
        "token": token,
    }
