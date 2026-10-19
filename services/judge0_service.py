import requests


JUDGE0_URL = "https://ce.judge0.com"


LANGUAGE_IDS = {
    "python": 71,
    "java": 62,
    "cpp": 54,
    "javascript": 63,
    "c": 50,
}


def execute_code(
    source_code: str,
    language: str,
    stdin: str = "",
):

    language = language.lower()

    if language not in LANGUAGE_IDS:
        raise ValueError(
            f"Unsupported language: {language}"
        )

    payload = {
        "source_code": source_code,
        "language_id": LANGUAGE_IDS[language],
        "stdin": stdin,
    }

    response = requests.post(
        f"{JUDGE0_URL}/submissions",
        params={
            "wait": "true"
        },
        json=payload,
        timeout=30,
    )

    response.raise_for_status()

    return response.json()

