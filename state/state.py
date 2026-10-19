from typing import TypedDict, List, Dict, Any


class CareerPlannerState(TypedDict, total=False):
    goal: str
    current_level: str
    # hours_per_week: int
    target_timeline: str
    preferences: str
   


class InterviewState(TypedDict, total=False):
    user_query: str
    # =========================
    # Candidate / Resume
    # =========================


    candidate_name: str

    resume_text: str

    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: List[str]
    projects: List[Dict[str, Any]]
    certifications: List[str]

    target_role: str
    interview_type: str


    # =========================
    # Interview Planning
    # =========================

    interview_plan: List[Dict[str, Any]]

    current_topic: str
    current_difficulty: str
    current_question: str
    current_question_type: str
    question_type: str


    # =========================
    # Candidate Answer
    # =========================

    candidate_answer: str


    # =========================
    # Coding Interview
    # =========================

    programming_language: str
    code: str

    execution_status: str

    test_cases_passed: int
    test_cases_failed: int

    execution_time: float
    memory_used: float

    compiler_error: str
    runtime_error: str


    # =========================
    # Evaluation
    # =========================

    current_score: float

    current_feedback: str

    strengths: List[str]
    weaknesses: List[str]


    # =========================
    # Skill Tracking
    # =========================

    skill_scores: Dict[str, float]

    weak_skills: List[str]
    strong_skills: List[str]


    # =========================
    # Interview History
    # =========================

    questions_asked: List[Dict[str, Any]]

    interview_history: List[Dict[str, Any]]


    # =========================
    # Adaptive Decision
    # =========================

    #Interview session

    # user_id: str
    interview_id: str
    selected_topic: str
    interview_duration: int

    #  voice interview 
    answer_transcript: str
    audio_recording_url: str
    tts_audio_url: str
    # question_number: int
    next_action: str

    next_difficulty: str

    continue_interview: bool


    # =========================
    # Final Result
    # =========================
    plan_result: str
    resume_feedback: str
    final_score: float

    final_feedback: str

    study_plan: List[str]