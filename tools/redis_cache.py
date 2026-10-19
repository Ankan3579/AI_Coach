import os
import json
import hashlib

import redis
from dotenv import load_dotenv

load_dotenv()

redis_client = redis.Redis.from_url(
    os.getenv("REDIS_URL"),
    decode_responses=True,
)


def generate_cache_key(
    user_id: str,
    resume_text: str,
    job_description: str = "",
) -> str:
    """
    Generate a cache key based on the user,
    resume content, and target job description.
    """

    content = json.dumps(
        {
            "user_id": user_id,
            "resume": resume_text,
            "job_description": job_description,
            "analysis_version": "v1",
        },
        sort_keys=True,
    )

    digest = hashlib.sha256(
        content.encode("utf-8")
    ).hexdigest()

    return f"resume_analysis:{digest}"


def get_cached_result(cache_key: str):
    """
    Return the cached result if available.
    """

    cached_data = redis_client.get(cache_key)

    if cached_data is None:
        return None

    return json.loads(cached_data)


def set_cached_result(
    cache_key: str,
    result: dict,
    ttl: int = 3600,
):
    """
    Cache the analysis result for one hour by default.
    """

    redis_client.set(
        cache_key,
        json.dumps(result),
        ex=ttl,
    )
