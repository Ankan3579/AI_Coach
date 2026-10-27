"""Provider configuration and ordered LLM fallback."""

import logging
import os
from typing import Any

from dotenv import load_dotenv
from litellm import completion


load_dotenv()

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
LOCAL_LLM_ENABLED = os.getenv("LOCAL_LLM_ENABLED", "true").lower() in {
    "1",
    "true",
    "yes",
    "on",
}

LLM_MODELS: list[dict[str, Any]] = [
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
        "api_base": "https://api.groq.com/openai/v1",
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 30,
    },
    {
        "provider": "mistral",
        "model": os.getenv(
            "MISTRAL_MODEL",
            "mistral/mistral-small-latest",
        ),
        "api_key": MISTRAL_API_KEY,
        "api_base": "https://api.mistral.ai/v1",
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 30,
    },
    {
        "provider": "local",
        "model": f"ollama_chat/{os.getenv('OLLAMA_MODEL', 'qwen2.5:7b')}",
        "api_key": None,
        "api_base": os.getenv(
            "OLLAMA_BASE_URL",
            "http://localhost:11434",
        ),
        "livekit_api_base": os.getenv(
            "OLLAMA_OPENAI_BASE_URL",
            "http://localhost:11434/v1",
        ),
        "temperature": 0.2,
        "max_tokens": 2000,
        "timeout": 60,
    },
]

FALLBACK_ENABLED = os.getenv(
    "LLM_FALLBACK_ENABLED",
    "true",
).lower() in {
    "1",
    "true",
    "yes",
    "on",
}
FALLBACK_ORDER = [
    provider.strip().lower()
    for provider in os.getenv(
        "LLM_FALLBACK_ORDER",
        "openai,groq,mistral,local",
    ).split(",")
    if provider.strip()
]


def get_available_models(
    *,
    provider_order: list[str] | None = None,
    use_fallback: bool | None = None,
) -> list[dict[str, Any]]:
    """Return configured models in fallback order, skipping missing credentials."""
    models_by_provider = {
        model["provider"]: model
        for model in LLM_MODELS
        if (
            model["provider"] == "local"
            and LOCAL_LLM_ENABLED
            or model["provider"] != "local"
            and model["api_key"]
        )
    }
    configured_order = list(
        dict.fromkeys(
            provider_order if provider_order is not None else FALLBACK_ORDER
        )
    )
    unknown_providers = [
        provider
        for provider in configured_order
        if provider not in {model["provider"] for model in LLM_MODELS}
    ]
    if unknown_providers:
        raise ValueError(
            "Unknown providers in model provider order: "
            + ", ".join(unknown_providers)
        )

    available = [
        models_by_provider[provider]
        for provider in configured_order
        if provider in models_by_provider
    ]
    fallback_enabled = FALLBACK_ENABLED if use_fallback is None else use_fallback
    if not fallback_enabled:
        return available[:1]
    return available


def invoke_llm(
    prompt: str,
    *,
    temperature: float = 0.2,
    max_tokens: int = 2000,
    provider_order: list[str] | None = None,
    use_fallback: bool | None = None,
) -> str:
    """Call configured chat models in order, failing over on provider errors."""
    models = get_available_models(
        provider_order=provider_order,
        use_fallback=use_fallback,
    )
    if not models:
        raise RuntimeError(
            "No LLM providers are configured. Add API keys or enable the "
            "local model in the environment."
        )

    failures: list[str] = []
    for model_config in models:
        provider = model_config["provider"]
        request: dict[str, Any] = {
            "model": model_config["model"],
            "messages": [{"role": "user", "content": prompt}],
            "temperature": temperature,
            "max_tokens": max_tokens,
            "timeout": model_config["timeout"],
        }
        if model_config.get("api_key"):
            request["api_key"] = model_config["api_key"]
        if model_config.get("api_base"):
            request["api_base"] = model_config["api_base"]

        try:
            response = completion(**request)
            content = response.choices[0].message.content
            if isinstance(content, list):
                content = "".join(
                    part.get("text", "")
                    for part in content
                    if isinstance(part, dict)
                )
            if not isinstance(content, str) or not content.strip():
                raise ValueError("provider returned empty content")
            return content.strip()
        except Exception as exc:
            logger.warning(
                "LLM provider %s failed (%s); trying next configured provider.",
                provider,
                type(exc).__name__,
            )
            failures.append(f"{provider} ({type(exc).__name__})")

    raise RuntimeError(
        "All configured LLM providers failed: " + ", ".join(failures)
    )


def invoke_guardrail_llm(prompt: str) -> str:
    """Run safety checks using configured fallback provider order."""
    configured_providers = {model["provider"] for model in LLM_MODELS}
    provider_order = [
        provider
        for provider in FALLBACK_ORDER
        if provider in configured_providers
    ]
    return invoke_llm(
        prompt,
        temperature=0,
        max_tokens=300,
        provider_order=provider_order,
        use_fallback=True,
    )


def show_llm_config() -> None:
    """Print configured model names without exposing credentials."""
    print("LLM fallback configuration")
    for index, model in enumerate(get_available_models(), start=1):
        print(f"{index}. {model['provider']} -> {model['model']}")
    if not get_available_models():
        print("No configured provider API keys found.")


if __name__ == "__main__":
    show_llm_config()
