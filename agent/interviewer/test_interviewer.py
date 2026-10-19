from agent.interviewer.recommender import (
    InterviewRecommender
)

from agent.interviewer.evaluator import (
    AnswerEvaluator
)

from agent.interviewer.adaptive_engine import (
    update_adaptive_state,
    save_interview_history,
)


state = {

    "candidate_name": "Ankan",

    "target_role": "AI Engineer",

    "interview_type": "technical",

    "selected_topic": "Machine Learning",

    "current_topic": "Machine Learning",

    "current_difficulty": "medium",

    "question_number": 1,

    "resume_text": """
    Python, Machine Learning,
    FastAPI, LangGraph and AI projects.
    """,

    "resume_feedback": """
    Candidate has experience with
    machine learning and AI projects.
    """,

    "plan_result": """
    Candidate wants to become an AI Engineer.
    """,

    "skills": [
        "Python",
        "Machine Learning",
        "FastAPI",
        "LangGraph"
    ],

    "strong_skills": [],

    "weak_skills": [],

    "skill_scores": {},

    "interview_history": [],

    "remaining_time": 30,
}


recommender = InterviewRecommender()
evaluator = AnswerEvaluator()


# ============================================================
# QUESTION 1
# ============================================================

recommendation = recommender.recommend(
    state
)

state["current_question"] = (
    recommendation["question"]
)

state["current_topic"] = (
    recommendation["topic"]
)

state["current_difficulty"] = (
    recommendation["difficulty"]
)

state["question_type"] = (
    recommendation["question_type"]
)


print("\n==============================")
print("QUESTION 1")
print("==============================")

print(
    state["current_question"]
)


# ============================================================
# SIMULATE CANDIDATE ANSWER
# ============================================================

state["candidate_answer"] = """

Supervised learning is a machine learning approach where the
model learns from labeled data. The input data is associated
with the correct output, and the model learns the relationship
between them.

For example, in a house price prediction system, we can train
the model using historical house data where the features include
area, number of rooms, and location, while the target is the
actual house price.

Unsupervised learning works with unlabeled data. The model tries
to discover hidden patterns or structures in the data.

For example, a company can use clustering to group customers
based on their purchasing behavior without having predefined
customer categories.

Supervised learning is commonly used for classification and
regression, while unsupervised learning is useful for clustering,
customer segmentation, and discovering patterns in large
datasets.
"""



# ============================================================
# EVALUATE QUESTION 1
# ============================================================

evaluation = evaluator.evaluate(
    state
)


print("\n==============================")
print("EVALUATION")
print("==============================")

print(evaluation)


# ============================================================
# ADAPTIVE UPDATE
# ============================================================

state = update_adaptive_state(
    state,
    evaluation
)


# ============================================================
# SAVE QUESTION + ANSWER + EVALUATION
# ============================================================

state = save_interview_history(
    state,
    evaluation
)


print("\n==============================")
print("ADAPTIVE STATE")
print("==============================")

print(
    "Current score:",
    state["current_score"]
)

print(
    "Next difficulty:",
    state["next_difficulty"]
)

print(
    "Next action:",
    state["next_action"]
)

print(
    "Weak skills:",
    state["weak_skills"]
)

print(
    "Strong skills:",
    state["strong_skills"]
)

print(
    "Skill scores:",
    state["skill_scores"]
)

print(
    "Question number:",
    state["question_number"]
)


# ============================================================
# QUESTION 2
# ============================================================

state["current_difficulty"] = (
    state["next_difficulty"]
)

state["current_question"] = ""

state["candidate_answer"] = ""


recommendation = recommender.recommend(
    state
)


state["current_question"] = (
    recommendation["question"]
)

state["current_topic"] = (
    recommendation["topic"]
)

state["current_difficulty"] = (
    recommendation["difficulty"]
)

state["question_type"] = (
    recommendation["question_type"]
)


print("\n==============================")
print("QUESTION 2")
print("==============================")

print(
    state["current_question"]
)

print(
    "Topic:",
    state["current_topic"]
)

print(
    "Difficulty:",
    state["current_difficulty"]
)

print(
    "Question Type:",
    state["question_type"]
)