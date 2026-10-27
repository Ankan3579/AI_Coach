import unittest
from types import SimpleNamespace
from unittest.mock import patch

import config


def _response(content: str) -> SimpleNamespace:
    return SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content=content),
            )
        ]
    )


class LLMFallbackTests(unittest.TestCase):
    def setUp(self):
        self.models = [
            {
                "provider": "openai",
                "model": "openai/test-model",
                "api_key": "openai-test-key",
                "timeout": 1,
            },
            {
                "provider": "groq",
                "model": "groq/test-model",
                "api_key": "groq-test-key",
                "api_base": "https://groq.example/v1",
                "timeout": 1,
            },
            {
                "provider": "local",
                "model": "ollama_chat/test-model",
                "api_key": None,
                "api_base": "http://localhost:11434",
                "timeout": 1,
            },
        ]
        self.models_patch = patch.object(config, "LLM_MODELS", self.models)
        self.order_patch = patch.object(
            config,
            "FALLBACK_ORDER",
            ["openai", "groq", "local"],
        )
        self.enabled_patch = patch.object(config, "FALLBACK_ENABLED", True)
        self.local_patch = patch.object(config, "LOCAL_LLM_ENABLED", True)
        for patcher in (
            self.models_patch,
            self.order_patch,
            self.enabled_patch,
            self.local_patch,
        ):
            patcher.start()
            self.addCleanup(patcher.stop)

    def test_falls_through_failed_provider_and_returns_next_response(self):
        with patch.object(
            config,
            "completion",
            side_effect=[TimeoutError(), _response("  answer  ")],
        ) as completion:
            result = config.invoke_llm("test prompt", temperature=0.4)

        self.assertEqual(result, "answer")
        self.assertEqual(completion.call_count, 2)
        self.assertEqual(completion.call_args_list[0].kwargs["model"], "openai/test-model")
        self.assertEqual(completion.call_args_list[1].kwargs["model"], "groq/test-model")
        self.assertEqual(completion.call_args_list[1].kwargs["api_base"], "https://groq.example/v1")

    def test_tries_local_model_after_cloud_providers_fail(self):
        with patch.object(
            config,
            "completion",
            side_effect=[
                TimeoutError(),
                ConnectionError(),
                _response("local answer"),
            ],
        ) as completion:
            result = config.invoke_llm("test prompt")

        self.assertEqual(result, "local answer")
        self.assertEqual(completion.call_count, 3)
        self.assertEqual(
            completion.call_args_list[2].kwargs["model"],
            "ollama_chat/test-model",
        )
        self.assertNotIn("api_key", completion.call_args_list[2].kwargs)

    def test_reports_all_provider_failures_without_exposing_credentials(self):
        with patch.object(
            config,
            "completion",
            side_effect=TimeoutError("secret must not appear"),
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                "All configured LLM providers failed: openai \\(TimeoutError\\), "
                "groq \\(TimeoutError\\), local \\(TimeoutError\\)",
            ) as error:
                config.invoke_llm("test prompt")

        self.assertNotIn("secret", str(error.exception))

    def test_guardrails_prefer_groq_and_fall_back_to_next_provider(self):
        with patch.object(config, "FALLBACK_ENABLED", False), patch.object(
            config,
            "completion",
            side_effect=[TimeoutError(), _response('{"decision":"allow"}')],
        ) as completion:
            result = config.invoke_guardrail_llm("safety check")

        self.assertEqual(result, '{"decision":"allow"}')
        self.assertEqual(completion.call_count, 2)
        self.assertEqual(
            completion.call_args_list[0].kwargs["model"],
            "groq/test-model",
        )
        self.assertEqual(
            completion.call_args_list[1].kwargs["model"],
            "openai/test-model",
        )


if __name__ == "__main__":
    unittest.main()
