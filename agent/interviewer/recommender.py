import json

from langchain_ollama import ChatOllama

from agent.interviewer.prompt import (
    QUESTION_RECOMMENDATION_PROMPT
)


class InterviewRecommender:

    def __init__(self):

        self.llm = ChatOllama(
            model="qwen2.5:7b",
            temperature=0.2,
        )

    def recommend(self, state):

        history = state.get(
            "interview_history",
            []
        )

        history_text = json.dumps(
            history,
            indent=2,
            ensure_ascii=False,
        )

        prompt = QUESTION_RECOMMENDATION_PROMPT.format(

            candidate_name=state.get(
                "candidate_name",
                "Candidate"
            ),

            target_role=state.get(
                "target_role",
                "AI Engineer"
            ),

            interview_type=state.get(
                "interview_type",
                "technical"
            ),

            programming_language=state.get(
                "programming_language",
                "python"
            ),

            selected_topic=state.get(
                "selected_topic",
                ""
            ),

            current_difficulty=state.get(
                "current_difficulty",
                "medium"
            ),

            question_number=state.get(
                "question_number",
                1
            ),

            remaining_time=state.get(
                "remaining_time",
                "unknown"
            ),

            resume_text=state.get(
                "resume_text",
                ""
            ),

            skills=state.get(
                "skills",
                []
            ),

            strong_skills=state.get(
                "strong_skills",
                []
            ),

            weak_skills=state.get(
                "weak_skills",
                []
            ),

            interview_history=history_text,

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

            recommendation = json.loads(content)

            if state.get("interview_type") == "coding":
                recommendation["question_type"] = "coding"
                recommendation["difficulty"] = state.get(
                    "current_difficulty",
                    "medium"
                )

            return recommendation

        except json.JSONDecodeError as exc:

            raise ValueError(
                f"Question recommender returned invalid JSON:\n{content}"
            ) from exc