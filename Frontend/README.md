# AI Coach - Frontend Platform

A React + Tailwind CSS frontend interface designed for the **AI Coach** FastAPI backend.

Built strictly using **React**, **JavaScript**, and **Tailwind CSS**.

---

## 🚀 Key Features

### 1. 🤖 Adaptive AI Interviewer (`/interview`)
- **Configurable Interview Setup**: Candidate name, target role (AI Engineer, Full-Stack, ML, etc.), type (Technical, Coding, Behavioral), duration (15–60m), starting difficulty, and language.
- **Adaptive Question Flow**: Connects to `POST /interview/start` and `POST /interview/answer`. The AI dynamically scales question difficulty (Easy ↔ Medium ↔ Hard) based on evaluated performance.
- **Multi-Modal Candidate Input**:
  - **Text Answer**: Rich multiline editor with word count and shortcut support (Ctrl+Enter).
  - **Voice / Audio Answer**: In-browser `MediaRecorder` recording `audio/webm;codecs=opus` with real-time waveform animation, submitted to `POST /interview/{session_id}/answer-audio` for Whisper transcription.
  - **Code Editor**: Clean dark code editor with language picker, line numbers, and tab indentation.
- **Instant AI Feedback**:
  - Score (0–10) & performance rating badge (Excellent, Good, Average, Poor).
  - Strengths bullet points with checkmarks.
  - Areas to improve & missing technical concepts.
  - Technical feedback analysis.
  - Expandable model/exemplary answer.
- **Comprehensive Final Scorecard**: Triggered on `POST /interview/end/{session_id}` with confetti celebration, question-by-question review, and JSON report export.

### 2. ⚡ Judge0 Coding Arena (`/api/code/submit`)
- Practice coding problems evaluated against Judge0 sandbox runner.
- Problem selector with descriptions, constraints, sample input/output.
- Standard Input (`stdin`) interactive testing.
- Real-time test-case scoring: status description, actual vs expected stdout, execution time, memory usage, stderr output.

### 3. 🎙️ Real-Time Voice Interview Room (`/api/vapi/next-question`)
- Conversational voice agent simulation interfacing with the backend Vapi router.
- Visualizer with pulsing wave bars and speaker state.
- Web Speech API integration for continuous hands-free speech-to-text.

### 4. 🧭 AI Career Planner Agent (`agent/planner_agent.py`)
- Input career goals, current proficiency, and timeline to generate a multi-phase personalized curriculum with practical milestones and capstone projects.

### 5. 📄 AI Resume Analyzer & ATS Auditor (`agent/resume_agent.py`)
- Ingests resume text to generate an ATS compatibility score, technical/soft skill inventories, missing skills for target roles, and tailored career role recommendations.

---

## 🛠️ Getting Started

### 1. Start the FastAPI Backend
In your backend project directory:
```bash
# Activate your python virtual environment
uvicorn main:app --reload --port 8000
```
> **Backend Tip:** Ensure `coding_routes` is included in `main.py` if testing coding submissions directly:
> ```python
> from api.coding_routes import router as coding_router
> app.include_router(coding_router)
> ```

### 2. Start the Frontend
In the frontend directory:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ⚙️ Vite Proxy & CORS
The frontend comes pre-configured with a Vite reverse proxy in `vite.config.js`:
- `/interview` ➔ `http://127.0.0.1:8000`
- `/api` ➔ `http://127.0.0.1:8000`
- `/health` ➔ `http://127.0.0.1:8000`

This ensures calls connect without CORS errors during local development. If connecting directly from a remote host, you can also add FastAPI's `CORSMiddleware`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 Project Structure
```
ai-coach-frontend/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── api/
    │   ├── client.js          # Unified FastAPI client + fallback simulation
    │   └── mockData.js        # Problem sets & offline test data
    ├── components/
    │   ├── Navbar.jsx         # Header & backend status pill
    │   ├── SettingsModal.jsx  # Backend connection configuration
    │   ├── AudioRecorder.jsx  # Microphone recorder + audio wave visualizer
    │   ├── CodeEditor.jsx     # Dark code editor with line numbers
    │   ├── EvaluationCard.jsx # AI evaluation, score & model answers
    │   └── Timer.jsx          # Live countdown timer
    └── pages/
        ├── InterviewPage.jsx  # Adaptive AI technical & coding interview
        ├── CodingArenaPage.jsx# Judge0 code execution playground
        ├── VoiceRoomPage.jsx  # Real-time voice room (Vapi)
        ├── CareerPlannerPage.jsx # AI career roadmap generator
        └── ResumeAnalyzerPage.jsx# ATS resume auditor
```
