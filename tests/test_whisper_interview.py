import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from starlette.requests import Request

from api import interview_routes


class WhisperInterviewTests(unittest.IsolatedAsyncioTestCase):
    def make_audio_request(self, audio):
        async def receive():
            return {
                "type": "http.request",
                "body": audio,
                "more_body": False,
            }

        return Request(
            {
                "type": "http",
                "asgi": {"version": "3.0"},
                "http_version": "1.1",
                "method": "POST",
                "scheme": "http",
                "path": "/interview/test-session/answer-audio",
                "raw_path": b"/interview/test-session/answer-audio",
                "query_string": b"",
                "headers": [(b"content-type", b"audio/webm;codecs=opus")],
                "client": ("test", 123),
                "server": ("test", 80),
            },
            receive,
        )

    async def test_audio_answer_is_transcribed_and_evaluated(self):
        session_id = "whisper-test-session"
        state = {
            "current_question": "Explain a hash map.",
            "current_question_type": "technical",
            "current_difficulty": "medium",
            "current_topic": "data structures",
            "selected_topic": "data structures",
            "interview_history": [],
            "question_number": 1,
        }
        interview_routes.INTERVIEW_SESSIONS[session_id] = state
        self.addCleanup(
            interview_routes.INTERVIEW_SESSIONS.pop,
            session_id,
            None,
        )

        transcribe = MagicMock(
            return_value=SimpleNamespace(
                text="A hash map stores key-value pairs."
            )
        )
        openai_client = SimpleNamespace(
            audio=SimpleNamespace(
                transcriptions=SimpleNamespace(
                    create=transcribe,
                )
            )
        )
        with (
            patch.object(interview_routes, "OPENAI_API_KEY", "test-key"),
            patch.object(interview_routes, "OpenAI", return_value=openai_client) as openai,
            patch.object(
                interview_routes.evaluator,
                "evaluate",
                return_value={
                    "score": 8,
                    "recommended_difficulty": "hard",
                },
            ) as evaluate,
            patch.object(
                interview_routes.recommender,
                "recommend",
                return_value={
                    "question": "What is a collision?",
                    "question_type": "technical",
                    "difficulty": "hard",
                    "topic": "data structures",
                },
            ),
        ):
            result = await interview_routes.submit_audio_answer(
                session_id,
                self.make_audio_request(b"recorded audio"),
            )

        self.assertEqual(
            result["transcript"],
            "A hash map stores key-value pairs.",
        )
        self.assertEqual(result["next_question"], "What is a collision?")
        self.assertEqual(
            state["candidate_answer"],
            "A hash map stores key-value pairs.",
        )
        evaluate.assert_called_once_with(state)
        openai.assert_called_once_with(api_key="test-key")
        transcribe.assert_called_once_with(
            model="whisper-1",
            file=("answer.webm", b"recorded audio", "audio/webm"),
        )
