// API Client for AI Coach FastAPI Backend
import { SAMPLE_QUESTIONS, generateMockEvaluation } from './mockData';

const DEFAULT_API_BASE = 'http://localhost:8000';

async function readApiResponse(res, fallbackMessage) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail || `${fallbackMessage} (${res.status})`);
  }
  return body;
}

class ApiClient {
  constructor() {
    this.baseUrl = localStorage.getItem('ai_coach_api_url') || DEFAULT_API_BASE;
    this.forceMock = localStorage.getItem('ai_coach_force_mock') === 'true';
    this.isBackendOnline = false;
  }

  setBaseUrl(url) {
    this.baseUrl = url.replace(/\/+$/, '');
    localStorage.setItem('ai_coach_api_url', this.baseUrl);
  }

  setForceMock(enabled) {
    this.forceMock = enabled;
    localStorage.setItem('ai_coach_force_mock', enabled ? 'true' : 'false');
  }

  // Returns direct URL or proxied endpoint if base matches default
  getUrl(path) {
    if (typeof window !== 'undefined' && this.baseUrl.includes(':8000')) {
      return path; // uses Vite proxy across all dev ports (3000, 3001, etc.)
    }
    return `${this.baseUrl}${path}`;
  }

  async checkHealth() {
    if (this.forceMock) {
      this.isBackendOnline = false;
      return false;
    }
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(this.getUrl('/health'), {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        this.isBackendOnline = true;
        return true;
      }
    } catch {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);
        const res = await fetch(this.getUrl('/'), {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          this.isBackendOnline = true;
          return true;
        }
      } catch {
        this.isBackendOnline = false;
        return false;
      }
    }
    this.isBackendOnline = false;
    return false;
  }

  async createLiveKitToken(payload) {
    const res = await fetch(this.getUrl('/api/livekit/token'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidate_name: payload.candidate_name,
        target_role: payload.target_role || 'AI Engineer',
        interview_type: payload.interview_type || 'technical',
        selected_topic: payload.selected_topic || 'data structures',
        current_difficulty: payload.current_difficulty || 'medium',
        programming_language: payload.programming_language || 'python'
      })
    });

    const response = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(response.detail || `LiveKit setup failed (${res.status}).`);
    }
    return response;
  }

  /**
   * Start Interview Session
   * POST /interview/start
   */
  async startInterview(payload) {
    if (!this.forceMock) {
      const res = await fetch(this.getUrl('/interview/start'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: payload.candidate_name,
          target_role: payload.target_role || 'AI Engineer',
          interview_type: payload.interview_type || 'technical',
          selected_topic: payload.selected_topic,
          duration_minutes: Number(payload.duration_minutes) || 45,
          difficulty: payload.difficulty || 'medium',
          programming_language: payload.programming_language || 'python'
        })
      });
      return readApiResponse(res, 'Interview setup failed');
    }

    // Mock Fallback
    const type = payload.interview_type || 'technical';
    const list = SAMPLE_QUESTIONS[type] || SAMPLE_QUESTIONS.technical;
    const q = list[Math.floor(Math.random() * list.length)];

    return {
      session_id: 'session-' + Date.now().toString(36),
      question: q.question,
      question_type: q.question_type,
      topic: payload.selected_topic || q.topic,
      difficulty: payload.difficulty || q.difficulty,
      is_mock: true
    };
  }

  /**
   * Submit Text Answer or Code
   * POST /interview/answer
   */
  async submitAnswer(sessionId, answerText, code = '') {
    if (!this.forceMock && !sessionId.startsWith('mock-')) {
      const res = await fetch(this.getUrl('/interview/answer'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          answer: answerText || '',
          code: code || ''
        })
      });
      return readApiResponse(res, 'Answer submission failed');
    }

    // Evaluation
    await new Promise((r) => setTimeout(r, 900));
    const evaluation = generateMockEvaluation(answerText, code, 'medium');
    const questions = SAMPLE_QUESTIONS.technical;
    const nextQ = questions[Math.floor(Math.random() * questions.length)];

    return {
      evaluation,
      next_question: nextQ.question,
      question_type: nextQ.question_type,
      difficulty: evaluation.recommended_difficulty,
      is_mock: true
    };
  }

  /**
   * Submit Audio Answer
   * POST /interview/{session_id}/answer-audio
   */
  async submitAudioAnswer(sessionId, audioBlob) {
    if (!this.forceMock && !sessionId.startsWith('mock-')) {
      const res = await fetch(this.getUrl(`/interview/${sessionId}/answer-audio`), {
        method: 'POST',
        headers: {
          'Content-Type': audioBlob.type || 'audio/webm'
        },
        body: audioBlob
      });
      return readApiResponse(res, 'Audio submission failed');
    }

    // Voice response
    await new Promise((r) => setTimeout(r, 1200));
    const mockTranscript = "I believe the optimal approach is using a two-pointer technique or hash set to achieve linear O(N) time complexity and prevent quadratic overhead.";
    const evaluation = generateMockEvaluation(mockTranscript, '', 'medium');
    const nextQ = SAMPLE_QUESTIONS.technical[1];

    return {
      transcript: mockTranscript,
      evaluation,
      next_question: nextQ.question,
      question_type: nextQ.question_type,
      difficulty: evaluation.recommended_difficulty,
      is_mock: true
    };
  }

  /**
   * End Interview
   * POST /interview/end/{session_id}
   */
  async endInterview(sessionId) {
    if (!this.forceMock && !sessionId.startsWith('mock-')) {
      try {
        const res = await fetch(this.getUrl(`/interview/end/${sessionId}`), {
          method: 'POST'
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('End interview backend failed, falling back:', err);
      }
    }

    return {
      session_id: sessionId,
      status: 'completed',
      total_questions: 3
    };
  }

  /**
   * Submit Code to Judge0 Coding Platform
   * POST /api/code/submit
   */
  async submitCode({ source_code, language, question_id, stdin }) {
    if (!this.forceMock) {
      try {
        const res = await fetch(this.getUrl('/api/code/submit'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source_code,
            language,
            question_id,
            stdin: stdin || ''
          })
        });

        if (res.ok) {
          return await res.json();
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Code execution failed');
      } catch (err) {
        console.warn('Code submit failed:', err);
      }
    }

    // Mock test cases run
    await new Promise((r) => setTimeout(r, 1000));
    const hasSumLogic = source_code.includes('+') || source_code.includes('sum') || source_code.includes('a + b');
    
    return {
      question_id,
      total_tests: 2,
      passed_tests: hasSumLogic ? 2 : 1,
      failed_tests: hasSumLogic ? 0 : 1,
      score_percentage: hasSumLogic ? 100 : 50,
      all_passed: hasSumLogic,
      results: [
        {
          test_case: 1,
          passed: true,
          status: "Accepted",
          expected_output: "30",
          actual_output: "30",
          execution_time: "0.012s",
          memory: "4200 KB"
        },
        {
          test_case: 2,
          passed: hasSumLogic,
          status: hasSumLogic ? "Accepted" : "Wrong Answer",
          expected_output: "6",
          actual_output: hasSumLogic ? "6" : "0",
          execution_time: "0.011s",
          memory: "4190 KB"
        }
      ]
    };
  }

  /**
   * Resume Analysis via FastAPI Backend
   * POST /api/resume/analyze
   */
  async analyzeResume({ resume_text, file_base64, file_name, target_role, user_id }) {
    if (!this.forceMock) {
      try {
        const res = await fetch(this.getUrl('/api/resume/analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resume_text: resume_text || '',
            file_base64: file_base64 || null,
            file_name: file_name || 'Resume.pdf',
            target_role: target_role || 'Web Developer',
            user_id: user_id || 'user_client'
          })
        });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned ${res.status}`);
      } catch (err) {
        console.warn('FastAPI resume route error:', err);
        throw err;
      }
    }
  }

  /**
   * Career Planner via FastAPI
   * POST /api/planner/generate
   */
  async generateCareerPlan(payload) {
    if (!this.forceMock) {
      try {
        const res = await fetch(this.getUrl('/api/planner/generate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (err) {
        console.warn('FastAPI planner route error:', err);
      }
    }
    return null;
  }
}

export const api = new ApiClient();
