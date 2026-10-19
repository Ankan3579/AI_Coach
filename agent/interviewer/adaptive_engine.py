def update_adaptive_state(state, evaluation):
    """
    Update InterviewState using the latest evaluation.
    """

    # ---------------------------------
    # Store evaluation
    # ---------------------------------

    state["current_score"] = evaluation.get(
        "score", 0
    )

    state["current_feedback"] = evaluation.get(
        "feedback", ""
    )

    state["strengths"] = evaluation.get(
        "strengths", []
    )

    state["weaknesses"] = evaluation.get(
        "weaknesses", []
    )

    # ---------------------------------
    # Recommended difficulty
    # ---------------------------------

    state["next_difficulty"] = evaluation.get(
        "recommended_difficulty",
        state.get(
            "current_difficulty",
            "medium"
        )
    )

    # ---------------------------------
    # Recommended next action
    # ---------------------------------

    state["next_action"] = evaluation.get(
        "recommended_next_action",
        "technical"
    )

    # ---------------------------------
    # Skill tracking
    # ---------------------------------

    skill = state.get(
        "current_topic",
        "general"
    )

    score = evaluation.get(
        "score",
        0
    )

    skill_scores = state.get(
        "skill_scores",
        {}
    ).copy()

    skill_scores[skill] = score

    state["skill_scores"] = skill_scores

    # ---------------------------------
    # Weak / strong skills
    # ---------------------------------

    weak_skills = []
    strong_skills = []

    for skill_name, skill_score in skill_scores.items():

        if skill_score < 5:
            weak_skills.append(skill_name)

        elif skill_score >= 8:
            strong_skills.append(skill_name)

    state["weak_skills"] = weak_skills
    state["strong_skills"] = strong_skills

    return state

def save_interview_history(state, evaluation):

    history = state.get(
        "interview_history",
        []
    ).copy()

    history.append({
        "question_number": state.get(
            "question_number",
            1
        ),

        "question": state.get(
            "current_question",
            ""
        ),

        "question_type": state.get(
            "question_type",
            ""
        ),

        "topic": state.get(
            "current_topic",
            ""
        ),

        "difficulty": state.get(
            "current_difficulty",
            ""
        ),

        "candidate_answer": state.get(
            "candidate_answer",
            ""
        ),

        "score": evaluation.get(
            "score",
            0
        ),

        "technical_score": evaluation.get(
            "technical_score",
            0
        ),

        "communication_score": evaluation.get(
            "communication_score",
            0
        ),

        "feedback": evaluation.get(
            "feedback",
            ""
        ),

        "strengths": evaluation.get(
            "strengths",
            []
        ),

        "weaknesses": evaluation.get(
            "weaknesses",
            []
        ),
    })

    state["interview_history"] = history

    state["questions_asked"] = history

    state["question_number"] = (
        state.get("question_number", 1) + 1
    )

    return state