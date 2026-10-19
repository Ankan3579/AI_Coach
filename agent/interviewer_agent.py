from typing import TypedDict

from langgraph.graph import StateGraph, END


class InterviewState(TypedDict, total=False):

    topic: str
    difficulty: str
    interview_type: str
    programming_language: str

    resume_summary: str
    previous_questions: list[str]
    previous_scores: list[float]

    question: str
    question_type: str
    expected_skills: list[str]


def generate_question(
    state: InterviewState,
) -> InterviewState:

    topic = state.get(
        "topic", "Data Structures and Algorithms"
    )

    difficulty = state.get(
        "difficulty", "medium"
    )

    interview_type = state.get(
        "interview_type", "technical"
    )

    language = state.get(
        "programming_language", "python"
    )

    previous_questions = state.get(
        "previous_questions", []
    )

    if interview_type == "coding":

        question = (
            f"Solve a {difficulty}-level coding problem "
            f"related to {topic}. Use {language}. "
            "Explain your approach, implement your solution, "
            "and consider edge cases and complexity."
        )

        question_type = "coding"

    elif interview_type == "behavioral":

        question = (
            f"Describe a real situation in which you "
            f"demonstrated a skill relevant to {topic}. "
            "Explain the situation, your actions, and the result."
        )

        question_type = "behavioral"

    else:

        question = (
            f"Explain {topic} at a {difficulty} interview level. "
            "Give an example and discuss relevant trade-offs."
        )

        question_type = "technical"

    if question in previous_questions:
        question += (
            " Include a different example or a deeper "
            "follow-up than in previous questions."
        )

    return {
        **state,
        "question": question,
        "question_type": question_type,
        "expected_skills": [
            topic,
            "problem-solving",
            "communication",
        ],
    }


graph_builder = StateGraph(InterviewState)

graph_builder.add_node(
    "generate_question",
    generate_question,
)

graph_builder.set_entry_point(
    "generate_question"
)

graph_builder.add_edge(
    "generate_question",
    END,
)

interviewer_graph = graph_builder.compile()


def get_next_question(
    topic: str,
    difficulty: str = "medium",
    interview_type: str = "technical",
    programming_language: str = "python",
    resume_summary: str = "",
    previous_questions: list[str] | None = None,
    previous_scores: list[float] | None = None,
) -> dict:

    result = interviewer_graph.invoke({
        "topic": topic,
        "difficulty": difficulty,
        "interview_type": interview_type,
        "programming_language": programming_language,
        "resume_summary": resume_summary,
        "previous_questions": previous_questions or [],
        "previous_scores": previous_scores or [],
    })

    return result


if __name__ == "__main__":

    result = get_next_question(
        topic="Data Structures and Algorithms",
        difficulty="medium",
        interview_type="coding",
        programming_language="python",
    )

    print(result["question"])