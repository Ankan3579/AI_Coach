import json
import unittest
from types import SimpleNamespace

from agent.interviewer.evaluator import AnswerEvaluator
from agent.interviewer.recommender import InterviewRecommender


class FakeLLM:
    def __init__(self, content):
        self.content = content
        self.prompt = None

    def invoke(self, prompt):
        self.prompt = prompt
        return SimpleNamespace(content=self.content)


class AnswerEvaluatorTests(unittest.TestCase):
    def evaluate(self, score, state):
        llm = FakeLLM(json.dumps({"score": score}))
        evaluator = AnswerEvaluator.__new__(AnswerEvaluator)
        evaluator.llm = llm

        evaluation = evaluator.evaluate(state)
        return evaluation, llm.prompt

    def test_coding_answer_is_sent_to_code_rubric(self):
        evaluation, prompt = self.evaluate(
            8,
            {
                "current_question": "Find the two numbers that add to target.",
                "current_question_type": "coding",
                "current_difficulty": "medium",
                "programming_language": "python",
                "candidate_answer": "I would use a hash map.",
                "code": "def two_sum(nums, target): return []",
            },
        )

        self.assertIn("Question Type:\ncoding", prompt)
        self.assertIn("def two_sum(nums, target): return []", prompt)
        self.assertIn("I would use a hash map.", prompt)
        self.assertEqual(evaluation["recommended_difficulty"], "hard")

    def test_answer_only_coding_client_passes_answer_as_code(self):
        _, prompt = self.evaluate(
            6,
            {
                "current_question_type": "coding",
                "current_difficulty": "medium",
                "candidate_answer": "def solve():\n    return 42",
            },
        )

        self.assertIn("Candidate Code:\ndef solve():", prompt)
        self.assertIn("Candidate Answer:\n\n", prompt)

    def test_difficulty_changes_by_one_level_and_clamps(self):
        self.assertEqual(
            self.evaluate(9, {"current_difficulty": "hard"})[0][
                "recommended_difficulty"
            ],
            "hard",
        )
        self.assertEqual(
            self.evaluate(3, {"current_difficulty": "easy"})[0][
                "recommended_difficulty"
            ],
            "easy",
        )
        self.assertEqual(
            self.evaluate(5, {"current_difficulty": "medium"})[0][
                "recommended_difficulty"
            ],
            "medium",
        )

    def test_coding_recommendation_uses_adaptive_difficulty(self):
        llm = FakeLLM(
            json.dumps(
                {
                    "question": "Implement binary search.",
                    "question_type": "technical",
                    "difficulty": "easy",
                }
            )
        )
        recommender = InterviewRecommender.__new__(InterviewRecommender)
        recommender.llm = llm

        recommendation = recommender.recommend(
            {
                "interview_type": "coding",
                "current_difficulty": "hard",
            }
        )

        self.assertEqual(recommendation["question_type"], "coding")
        self.assertEqual(recommendation["difficulty"], "hard")


if __name__ == "__main__":
    unittest.main()
