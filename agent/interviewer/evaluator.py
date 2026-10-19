import json
import math

from langchain_ollama import ChatOllama

from agent.interviewer.prompt import ANSWER_EVALUATION_PROMPT


DIFFICULTY_LEVELS = ("easy", "medium", "hard")


def _recommended_difficulty(score, current_difficulty):
    if current_difficulty not in DIFFICULTY_LEVELS:
        current_difficulty = "medium"

    current_index = DIFFICULTY_LEVELS.index(current_difficulty)

    if score >= 8:
        current_index = min(current_index + 1, len(DIFFICULTY_LEVELS) - 1)
    elif score <= 4:
        current_index = max(current_index - 1, 0)

    return DIFFICULTY_LEVELS[current_index]


class AnswerEvaluator:

    def __init__(self):

        self.llm = ChatOllama(
            model="qwen2.5:7b",
            temperature=0.2,
        )

    def evaluate(self, state):
        question_type = state.get(
            "current_question_type",
            state.get("question_type", "technical")
        )

        candidate_answer = state.get("candidate_answer", "")
        code = state.get("code", "")

        if question_type == "coding" and not code:
            code = candidate_answer
            candidate_answer = ""

        prompt = ANSWER_EVALUATION_PROMPT.format(

            question=state.get(
                "current_question",
                ""
            ),

            question_type=question_type,

            programming_language=state.get(
                "programming_language",
                "not specified"
            ),

            topic=state.get(
                "current_topic",
                state.get("selected_topic", "")
            ),

            difficulty=state.get(
                "current_difficulty",
                "medium"
            ),

            code=code,

            answer=candidate_answer,
        )

        response = self.llm.invoke(prompt)

        content = response.content

        if isinstance(content, list):

            content = "".join(
                item.get("text", "")
                for item in content
                if isinstance(item, dict)
            )

        content = content.strip()

        if content.startswith("```"):

            content = content.replace(
                "```json",
                ""
            )

            content = content.replace(
                "```",
                ""
            )

            content = content.strip()

        try:

            evaluation = json.loads(content)

        except json.JSONDecodeError as exc:

            raise ValueError(
                f"Answer evaluator returned invalid JSON:\n{content}"
            ) from exc

        if not isinstance(evaluation, dict):
            raise ValueError(
                "Answer evaluator returned JSON that is not an object"
            )

        score = evaluation.get("score")
        if (
            isinstance(score, bool)
            or not isinstance(score, (int, float))
            or not math.isfinite(score)
        ):
            raise ValueError(
                "Answer evaluator returned a non-numeric score"
            )

        if not 0 <= score <= 10:
            raise ValueError(
                f"Answer evaluator returned a score outside 0-10: {score}"
            )

        evaluation["recommended_difficulty"] = _recommended_difficulty(
            score,
            state.get("current_difficulty", "medium")
        )

        return evaluation