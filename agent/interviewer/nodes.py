from datetime import datetime, timezone

from agent.interviewer.recommender import (
    InterviewRecommender,
)

from agent.interviewer.evaluator import (
    AnswerEvaluator,
)


recommender = InterviewRecommender()

evaluator = AnswerEvaluator()


# ============================================================
# NODE 1
# Recommend next question
# ============================================================

def recommend_question(
    state
):

    recommendation = recommender.recommend(
        state
    )

    state["next_action"] = (
        recommendation.get(
            "next_action",
            "technical"
        )
    )

    state["question_type"] = (
        recommendation.get(
            "question_type",
            "technical"
        )
    )

    state["current_topic"] = (
        recommendation.get(
            "topic",
            state.get(
                "selected_topic",
                ""
            )
        )
    )

    state["current_difficulty"] = (
        recommendation.get(
            "difficulty",
            state.get(
                "current_difficulty",
                "medium"
            )
        )
    )

    state["current_question"] = (
        recommendation.get(
            "question",
            ""
        )
    )

    state["coding_problem"] = (
        recommendation.get(
            "coding_problem"
        )
    )

    return state


# ============================================================
# NODE 2
# Evaluate candidate answer
# ============================================================

def evaluate_answer(
    state
):

    evaluation = evaluator.evaluate(
        state
    )

    state["current_score"] = float(
        evaluation.get(
            "score",
            0
        )
    )

    state["technical_score"] = float(
        evaluation.get(
            "technical_score",
            0
        )
    )

    state["communication_score"] = float(
        evaluation.get(
            "communication_score",
            0
        )
    )

    state["confidence_score"] = float(
        evaluation.get(
            "confidence_score",
            0
        )
    )

    state["current_feedback"] = (
        evaluation.get(
            "feedback",
            ""
        )
    )

    state["strengths"] = (
        evaluation.get(
            "strengths",
            []
        )
    )

    state["weaknesses"] = (
        evaluation.get(
            "weaknesses",
            []
        )
    )

    state["next_difficulty"] = (
        evaluation.get(
            "recommended_difficulty",
            state.get(
                "current_difficulty",
                "medium"
            )
        )
    )

    state["next_action"] = (
        evaluation.get(
            "recommended_next_action",
            "technical"
        )
    )

    return state


# ============================================================
# NODE 3
# Update skill scores
# ============================================================

def update_skills(
    state
):

    skill = state.get(
        "current_topic",
        "general"
    )

    score = state.get(
        "current_score",
        0
    )

    skill_scores = state.get(
        "skill_scores",
        {}
    ).copy()

    previous_score = skill_scores.get(
        skill,
        None
    )

    if previous_score is None:

        skill_scores[skill] = score

    else:

        skill_scores[skill] = round(
            (previous_score + score) / 2,
            2
        )

    state["skill_scores"] = (
        skill_scores
    )

    strong_skills = []

    weak_skills = []

    for skill_name, skill_score in (
        skill_scores.items()
    ):

        if skill_score >= 7:

            strong_skills.append(
                skill_name
            )

        elif skill_score < 5:

            weak_skills.append(
                skill_name
            )

    state["strong_skills"] = (
        strong_skills
    )

    state["weak_skills"] = (
        weak_skills
    )

    return state


# ============================================================
# NODE 4
# Save current answer to history
# ============================================================

def save_interview_history(
    state
):

    history = state.get(
        "interview_history",
        []
    ).copy()

    history.append({

        "question_number":
            state.get(
                "question_number",
                1
            ),

        "question":
            state.get(
                "current_question",
                ""
            ),

        "question_type":
            state.get(
                "question_type",
                ""
            ),

        "topic":
            state.get(
                "current_topic",
                ""
            ),

        "difficulty":
            state.get(
                "current_difficulty",
                ""
            ),

        "candidate_answer":
            state.get(
                "candidate_answer",
                ""
            ),

        "score":
            state.get(
                "current_score",
                0
            ),

        "technical_score":
            state.get(
                "technical_score",
                0
            ),

        "communication_score":
            state.get(
                "communication_score",
                0
            ),

        "confidence_score":
            state.get(
                "confidence_score",
                0
            ),

        "feedback":
            state.get(
                "current_feedback",
                ""
            ),

        "timestamp":
            datetime.now(
                timezone.utc
            ).isoformat(),

    })

    state["interview_history"] = history

    state["questions_asked"] = history

    state["question_number"] = (
        state.get(
            "question_number",
            1
        ) + 1
    )

    return state


# ============================================================
# NODE 5
# Adaptive decision
# ============================================================

def adaptive_decision(
    state
):

    duration = state.get(
        "interview_duration",
        30
    )

    question_number = state.get(
        "question_number",
        1
    )

    # Approximate safety limit.
    # Actual production version will use
    # the frontend/session timer.

    maximum_questions = max(
        3,
        duration // 4
    )

    if question_number > maximum_questions:

        state["continue_interview"] = False

    else:

        state["continue_interview"] = True

    return state


# ============================================================
# NODE 6
# Final report
# ============================================================

def generate_final_report(
    state
):

    history = state.get(
        "interview_history",
        []
    )

    scores = [
        item.get("score", 0)
        for item in history
        if isinstance(
            item.get("score"),
            (int, float)
        )
    ]

    technical_scores = [
        item.get(
            "technical_score",
            0
        )
        for item in history
        if isinstance(
            item.get(
                "technical_score"
            ),
            (int, float)
        )
    ]

    communication_scores = [
        item.get(
            "communication_score",
            0
        )
        for item in history
        if isinstance(
            item.get(
                "communication_score"
            ),
            (int, float)
        )
    ]

    final_score = (
        sum(scores) / len(scores)
        if scores
        else 0
    )

    technical_score = (
        sum(technical_scores)
        / len(technical_scores)
        if technical_scores
        else 0
    )

    communication_score = (
        sum(communication_scores)
        / len(communication_scores)
        if communication_scores
        else 0
    )

    state["final_score"] = round(
        final_score,
        2
    )

    state["final_feedback"] = (
        f"Overall interview score: "
        f"{round(final_score, 2)}/10. "
        f"Technical score: "
        f"{round(technical_score, 2)}/10. "
        f"Communication score: "
        f"{round(communication_score, 2)}/10."
    )

    state["study_plan"] = [
        f"Improve: {skill}"
        for skill in state.get(
            "weak_skills",
            []
        )
    ]

    state["continue_interview"] = False

    return state