"""LiteLLM provider configuration and fallback order."""

import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

# These names follow LiteLLM's provider/model format. Override model names in
# .env if your provider account uses different models.
LLM_MODELS = [
    {
        "provider": "openai",
        "model": os.getenv("OPENAI_MODEL", "openai/gpt-4o-mini"),
        "api_key": OPENAI_API_KEY,
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 30,
    },
    {
        "provider": "groq",
        "model": os.getenv("GROQ_MODEL", "groq/llama-3.3-70b-versatile"),
        "api_key": GROQ_API_KEY,
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 30,
    },
    {
        "provider": "mistral",
        "model": os.getenv("MISTRAL_MODEL", "mistral/mistral-small-latest"),
        "api_key": MISTRAL_API_KEY,
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 30,
    },
]

# Providers are attempted in this order. LiteLLM returns the first successful
# completion; if one provider raises an error, the planner tries the next one.
FALLBACK_ENABLED = os.getenv("LLM_FALLBACK_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}
FALLBACK_ORDER = [
    provider.strip().lower()
    for provider in os.getenv(
        "LLM_FALLBACK_ORDER", "openai,groq,mistral"
    ).split(",")
    if provider.strip()
]


def get_available_models() -> list[dict[str, object]]:
    """Return configured models in fallback order, skipping providers without keys."""
    models_by_provider = {
        model["provider"]: model for model in LLM_MODELS if model["api_key"]
    }
    available = [
        models_by_provider[provider]
        for provider in FALLBACK_ORDER
        if provider in models_by_provider
    ]
    if not FALLBACK_ENABLED:
        return available[:1]
    return available


def show_llm_config() -> None:
    """Print configured model names and fallback order without exposing keys."""
    print("LiteLLM fallback configuration")
    for index, model in enumerate(get_available_models(), start=1):
        print(f"{index}. {model['provider']} -> {model['model']}")
    if not get_available_models():
        print("No configured provider API keys found.")


if __name__ == "__main__":
    show_llm_config()
