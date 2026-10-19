import os
import uuid

from dotenv import load_dotenv

from services.supabase_service import (
    supabase
)


load_dotenv()


BUCKET_NAME = (
    "interview-recordings"
)


def upload_audio(
    user_id: str,
    interview_id: str,
    audio_bytes: bytes,
):

    filename = (
        f"{user_id}/"
        f"{interview_id}/"
        f"{uuid.uuid4()}.webm"
    )

    response = (
        supabase
        .storage
        .from_(BUCKET_NAME)
        .upload(
            filename,
            audio_bytes,
            {
                "content-type":
                    "audio/webm"
            }
        )
    )

    public_url = (
        supabase
        .storage
        .from_(BUCKET_NAME)
        .get_public_url(
            filename
        )
    )

    return public_url