import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Bot, 
  Sparkles, 
  Play, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  Code2, 
  MessageSquare, 
  Mic, 
  RotateCcw, 
  Download, 
  Award, 
  Layers, 
  Check, 
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  FileText,
  TrendingUp,
  BarChart3,
  Clock,
  Printer,
  ChevronDown,
  ChevronUp,
  UserCheck
} from 'lucide-react';
import { api } from '../api/client';
import Timer from '../components/Timer';
import AudioRecorder from '../components/AudioRecorder';
import CodeEditor from '../components/CodeEditor';
import EvaluationCard from '../components/EvaluationCard';

export default function InterviewPage({ onOpenSettings, backendStatus, onNavigate }) {
  // Stages: 'setup' | 'session' | 'report'
  const [stage, setStage] = useState('setup');

  // Setup Form
  const [candidateName, setCandidateName] = useState(() => {
    const saved = localStorage.getItem('ai_coach_user_profile');
    if (saved) {
      try { return JSON.parse(saved).name || 'Alex Chen'; } catch {}
    }
    return 'Alex Chen';
  });
  const [targetRole, setTargetRole] = useState('AI Engineer');
  const [interviewType, setInterviewType] = useState('technical');
  const [selectedTopic, setSelectedTopic] = useState('Machine Learning & Neural Architectures');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [difficulty, setDifficulty] = useState('medium');
  const [programmingLanguage, setProgrammingLanguage] = useState('python');

  // Session State
  const [sessionId, setSessionId] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentQuestionType, setCurrentQuestionType] = useState('technical');
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [currentTopic, setCurrentTopic] = useState('');
  
  // Answering Mode
  const [answerMode, setAnswerMode] = useState('text'); // 'text' | 'voice' | 'code'
  const [textAnswer, setTextAnswer] = useState('');
  const [codeAnswer, setCodeAnswer] = useState('');
  
  // Loading & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [transcriptNotice, setTranscriptNotice] = useState('');
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Topic presets
  const topicPresets = {
    technical: [
      'Machine Learning & Neural Architectures',
      'System Design & Distributed Scalability',
      'Python Runtime & Memory Internals',
      'REST & Microservices Architecture',
      'Database Optimization & Concurrency'
    ],
    coding: [
      'Data Structures & Algorithms',
      'Dynamic Programming & Recursion',
      'Graph Traversal & Shortest Path',
      'Tree & Trie Operations',
      'Sliding Window & Two Pointers'
    ],
    behavioral: [
      'Technical Leadership & Conflict Resolution',
      'Project Ownership & Architecture Decisions',
      'Navigating Production Outages',
      'Cross-functional Team Collaboration'
    ]
  };

  // Start Interview
  const handleStartInterview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await api.startInterview({
        candidate_name: candidateName,
        target_role: targetRole,
        interview_type: interviewType,
        selected_topic: selectedTopic,
        duration_minutes: durationMinutes,
        difficulty: difficulty,
        programming_language: programmingLanguage
      });

      setSessionId(data.session_id);
      setCurrentQuestion(data.question);
      setCurrentQuestionType(data.question_type || interviewType);
      setCurrentTopic(data.topic || selectedTopic);
      setCurrentDifficulty(data.difficulty || difficulty);
      setQuestionNumber(1);
      setInterviewHistory([]);
      setEvaluation(null);
      setTextAnswer('');
      setCodeAnswer(
        interviewType === 'coding' || data.question_type === 'coding'
          ? `# Write your solution for: ${data.question.slice(0, 40)}...\n\ndef solution():\n    pass\n`
          : ''
      );
      setAnswerMode(interviewType === 'coding' ? 'code' : 'text');
      setStage('session');
    } catch (err) {
      alert('Error starting interview: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Text / Code Submission
  const handleSubmitAnswer = async () => {
    if (!textAnswer.trim() && !codeAnswer.trim()) {
      alert('Please enter a response or write code before submitting.');
      return;
    }

    setIsSubmitting(true);
    setTranscriptNotice('');
    try {
      const result = await api.submitAnswer(sessionId, textAnswer, codeAnswer);
      handleEvaluationResult(result, textAnswer, codeAnswer);
    } catch (err) {
      alert('Submission failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Audio Voice Submission
  const handleAudioRecorded = async (blob) => {
    setIsSubmitting(true);
    try {
      const result = await api.submitAudioAnswer(sessionId, blob);
      if (result.transcript) {
        setTranscriptNotice(result.transcript);
        setTextAnswer(result.transcript);
      }
      handleEvaluationResult(result, result.transcript || '(Spoken Audio Answer)', codeAnswer);
    } catch (err) {
      alert('Audio answer failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Common Evaluation Handler
  const handleEvaluationResult = (result, answeredText, answeredCode) => {
    setEvaluation(result.evaluation);
    
    // Append to local history
    const updatedHistory = [
      ...interviewHistory,
      {
        questionNumber,
        question: currentQuestion,
        question_type: currentQuestionType,
        difficulty: currentDifficulty,
        topic: currentTopic,
        answer: answeredText,
        code: answeredCode,
        evaluation: result.evaluation
      }
    ];

    setInterviewHistory(updatedHistory);

    // Store next question prepared by backend
    if (result.next_question) {
      window._pendingNextQuestion = {
        question: result.next_question,
        question_type: result.question_type || currentQuestionType,
        difficulty: result.difficulty || currentDifficulty
      };
    }
  };

  // Proceed to next question
  const handleProceedNext = () => {
    if (window._pendingNextQuestion) {
      setCurrentQuestion(window._pendingNextQuestion.question);
      setCurrentQuestionType(window._pendingNextQuestion.question_type);
      setCurrentDifficulty(window._pendingNextQuestion.difficulty);
      setQuestionNumber((prev) => prev + 1);
      window._pendingNextQuestion = null;
    }
    setEvaluation(null);
    setTextAnswer('');
    setCodeAnswer('');
    setTranscriptNotice('');
  };

  // End Interview & View Detailed Report
  const handleEndInterview = async () => {
    setIsSubmitting(true);
    try {
      await api.endInterview(sessionId);
    } catch (err) {
      console.warn('Backend end interview error:', err);
    } finally {
      setStage('report');
      setIsSubmitting(false);

      // Trigger Celebration Confetti
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Persist session to LocalStorage for User Dashboard
      saveSessionToDashboard();
    }
  };

  // Persist session into Dashboard
  const saveSessionToDashboard = () => {
    try {
      const existing = localStorage.getItem('ai_coach_interview_history');
      const list = existing ? JSON.parse(existing) : [];

      const scores = interviewHistory.map((h) => Number(h.evaluation?.score) || 7.5);
      const avg = scores.length > 0 
        ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
        : '8.0';

      const newRecord = {
        id: 'session-' + Date.now().toString(36),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        role: targetRole,
        topic: selectedTopic,
        questionsCount: interviewHistory.length || 1,
        averageScore: Number(avg),
        rating: Number(avg) >= 8.5 ? 'Strong Hire' : Number(avg) >= 7.0 ? 'Hire' : 'Needs Practice',
        difficulty: currentDifficulty
      };

      list.unshift(newRecord);
      localStorage.setItem('ai_coach_interview_history', JSON.stringify(list.slice(0, 15)));
    } catch (e) {
      console.warn('Could not save to dashboard:', e);
    }
  };

  // Text-To-Speech for AI Question
  const handleSpeakQuestion = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        window._activeUtterance = null;
        return;
      }
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => {
        setIsSpeaking(false);
        window._activeUtterance = null;
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        window._activeUtterance = null;
      };
      window._activeUtterance = utterance;
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Download Transcript / Report JSON
  const handleDownloadReport = () => {
    const scores = interviewHistory.map((h) => Number(h.evaluation?.score) || 7);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / (scores.length || 1)).toFixed(1);

    const reportData = {
      candidateName,
      targetRole,
      topic: selectedTopic,
      overallAverageScore: avgScore,
      totalQuestions: interviewHistory.length,
      maxDifficulty: currentDifficulty,
      timestamp: new Date().toISOString(),
      questionHistory: interviewHistory
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ai-interview-report-${candidateName.replace(/\s+/g, '_')}-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // -------------------------------------------------------------
  // RENDER: SETUP STAGE
  // -------------------------------------------------------------
  if (stage === 'setup') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Intro Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive Multi-Agent Technical Interviewer
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Practice Real-Time AI Interviews
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Experience questions that dynamically adapt to your performance. Receive in-depth evaluation on correctness, complexity, and communication.
          </p>
        </div>

        {/* Configuration Card */}
        <form onSubmit={handleStartInterview} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Candidate Name
              </label>
              <input
                type="text"
                required
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="e.g. Alex Chen"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Target Role */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Target Role
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="AI Engineer">AI Engineer</option>
                <option value="Machine Learning Scientist">Machine Learning Scientist</option>
                <option value="Full-Stack Developer">Full-Stack Developer</option>
                <option value="Backend Software Engineer">Backend Software Engineer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="System Architect">System Architect</option>
              </select>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Interview Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'technical', label: 'Technical' },
                  { id: 'coding', label: 'Coding' },
                  { id: 'behavioral', label: 'Behavioral' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => {
                      setInterviewType(type.id);
                      setSelectedTopic(topicPresets[type.id][0]);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      interviewType === type.id
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Difficulty */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Starting Difficulty
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['easy', 'medium', 'hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize border transition-all ${
                      difficulty === diff
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Interview Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Programming Language */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Primary Programming Language
              </label>
              <select
                value={programmingLanguage}
                onChange={(e) => setProgrammingLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="c">C</option>
              </select>
            </div>
          </div>

          {/* Selected Topic */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Specific Topic or Skill Focus
            </label>
            <input
              type="text"
              required
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="e.g. Data Structures and Algorithms, Machine Learning..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 mb-2"
            />
            {/* Topic Suggestions */}
            <div className="flex flex-wrap gap-2">
              {topicPresets[interviewType]?.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSelectedTopic(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Voice recording, code sandbox, and live adaptive scoring ready.</span>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 hover:opacity-95 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Initializing Interviewer...' : 'Start Mock Interview'}</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: SESSION STAGE
  // -------------------------------------------------------------
  if (stage === 'session') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Top Session Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Question #{questionNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                  {currentQuestionType}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                  currentDifficulty === 'hard' 
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                    : currentDifficulty === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}>
                  {currentDifficulty}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">{currentTopic}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Timer durationMinutes={durationMinutes} onTimeUp={handleEndInterview} />
            <button
              onClick={handleEndInterview}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Finish & View Result
            </button>
          </div>
        </div>

        {/* AI Question Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-600/30">
                <Bot className="w-7 h-7" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  AI Interviewer Prompt
                </span>
                <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                  {currentQuestion}
                </p>
              </div>
            </div>

            {/* Read Aloud Button */}
            <button
              onClick={handleSpeakQuestion}
              className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                isSpeaking 
                  ? 'bg-pink-500/20 border-pink-500/40 text-pink-300 animate-pulse' 
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Speak Question aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time Evaluation Card (if evaluated) */}
        {evaluation && (
          <EvaluationCard
            evaluation={evaluation}
            onNextQuestion={handleProceedNext}
            isLastQuestion={questionNumber >= 5}
          />
        )}

        {/* Answering Controls (shown before submitting) */}
        {!evaluation && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAnswerMode('text')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    answerMode === 'text'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Text Explanation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnswerMode('code')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    answerMode === 'code'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code Solution</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnswerMode('voice')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    answerMode === 'voice'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Voice / Audio</span>
                </button>
              </div>

              <span className="text-xs text-slate-500 hidden sm:inline">
                Press Ctrl+Enter to submit
              </span>
            </div>

            {/* Answer Input depending on Mode */}
            {answerMode === 'text' && (
              <div className="relative">
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.ctrlKey && e.key === 'Enter') {
                      handleSubmitAnswer();
                    }
                  }}
                  rows={8}
                  placeholder="Explain your approach, architectural trade-offs, algorithms, or behavioral experience in detail..."
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
                <div className="absolute bottom-3 right-3 text-[11px] text-slate-500">
                  {textAnswer.split(/\s+/).filter(Boolean).length} words
                </div>
              </div>
            )}

            {answerMode === 'code' && (
              <div className="space-y-3">
                <CodeEditor
                  code={codeAnswer}
                  onChange={setCodeAnswer}
                  language={programmingLanguage}
                  onLanguageChange={setProgrammingLanguage}
                />
                <textarea
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  rows={2}
                  placeholder="Optional brief notes or algorithmic complexity explanation (e.g. O(N) time, O(1) space)..."
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {answerMode === 'voice' && (
              <div className="space-y-3">
                <AudioRecorder
                  onAudioRecorded={handleAudioRecorded}
                  isSubmitting={isSubmitting}
                />
                {transcriptNotice && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                    <span className="font-semibold text-pink-400 block mb-1">Whisper Transcription:</span>
                    "{transcriptNotice}"
                  </div>
                )}
              </div>
            )}

            {/* Submit Action Bar */}
            {answerMode !== 'voice' && (
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTextAnswer('');
                    setCodeAnswer('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Response</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Evaluating Response...' : 'Submit Answer for AI Review'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: COMPREHENSIVE RESULT & AVERAGE REPORT STAGE
  // -------------------------------------------------------------
  if (stage === 'report') {
    const totalQuestions = interviewHistory.length || 1;
    const scores = interviewHistory.map((h) => Number(h.evaluation?.score) || 7.5);
    const avgScore = (scores.reduce((a, b) => a + b, 0) / totalQuestions).toFixed(1);
    const percentage = Math.round((Number(avgScore) / 10) * 100);

    // Hiring Verdict
    let verdict = 'Hire';
    let verdictColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (Number(avgScore) >= 8.5) {
      verdict = 'Strong Hire';
      verdictColor = 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40';
    } else if (Number(avgScore) < 6.0) {
      verdict = 'Needs Further Practice';
      verdictColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    // Category Averages
    const technicalAccuracy = Math.min(10, Math.max(1, (Number(avgScore) * 1.02))).toFixed(1);
    const problemSolving = Math.min(10, Math.max(1, (Number(avgScore) * 0.98))).toFixed(1);
    const communication = Math.min(10, Math.max(1, (Number(avgScore) * 1.04))).toFixed(1);

    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {/* Circular Average Gauge */}
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex flex-col items-center justify-center text-white shadow-xl shadow-indigo-600/30 shrink-0">
                <span className="text-3xl font-extrabold leading-none">{avgScore}</span>
                <span className="text-[11px] uppercase font-semibold text-indigo-200 mt-0.5">/ 10 AVG</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                    Interview Evaluation Result
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${verdictColor}`}>
                    {verdict}
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  Candidate: <strong className="text-white">{candidateName}</strong> • Target Role: <strong className="text-indigo-400">{targetRole}</strong>
                </p>
                <p className="text-xs text-slate-500">
                  Field: {selectedTopic} • Adaptive Level Reached: <span className="capitalize text-slate-300">{currentDifficulty}</span>
                </p>
              </div>
            </div>

            {/* Quick Link to Dashboard */}
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>View In User Dashboard</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Row: Average & Category Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Average Performance</span>
            <div className="text-3xl font-extrabold text-indigo-400">
              {percentage}%
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Across {totalQuestions} evaluated responses
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Technical Depth</span>
            <div className="text-3xl font-extrabold text-white">
              {technicalAccuracy} <span className="text-sm text-slate-500">/ 10</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Architectural & Core Concepts
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Problem Solving</span>
            <div className="text-3xl font-extrabold text-emerald-400">
              {problemSolving} <span className="text-sm text-slate-500">/ 10</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Logic & Complexity Bounds
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Communication</span>
            <div className="text-3xl font-extrabold text-pink-400">
              {communication} <span className="text-sm text-slate-500">/ 10</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Structure & Clarity
            </p>
          </div>
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Question-by-Question Score Progression</span>
            </h3>
            <span className="text-xs text-slate-400">
              Session Baseline Target: 8.0 / 10
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
            {interviewHistory.map((item, idx) => {
              const sc = Number(item.evaluation?.score) || 7.5;
              const barHeight = `${Math.round((sc / 10) * 100)}%`;
              return (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center space-y-2">
                  <span className="text-xs font-bold text-slate-400 block">Q{idx + 1}</span>
                  <div className="h-24 flex items-end justify-center py-1">
                    <div
                      className={`w-10 rounded-t-lg transition-all duration-700 ${
                        sc >= 8.0 ? 'bg-emerald-500' : sc >= 6.0 ? 'bg-indigo-500' : 'bg-amber-500'
                      }`}
                      style={{ height: barHeight }}
                    />
                  </div>
                  <div className="text-sm font-extrabold text-white">
                    {sc} <span className="text-[10px] text-slate-500">/10</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block truncate">
                    {item.difficulty || 'Med'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Question History Breakdown Accordion */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Detailed Question Evaluations</span>
          </h3>

          <div className="space-y-3">
            {interviewHistory.map((item, idx) => {
              const isExpanded = expandedQuestion === idx;
              const sc = Number(item.evaluation?.score) || 7.5;
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all">
                  <div 
                    onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                    className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <span className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-200 truncate">
                        {item.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                        sc >= 8.0 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        Score: {sc}/10
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 space-y-4 text-xs">
                      {item.answer && (
                        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Your Submitted Response:</span>
                          {item.answer}
                        </div>
                      )}

                      {item.code && (
                        <div className="p-3 bg-slate-950 rounded-xl font-mono text-emerald-300 border border-slate-800 whitespace-pre overflow-x-auto">
                          <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Code Solution:</span>
                          {item.code}
                        </div>
                      )}

                      {item.evaluation?.technical_feedback && (
                        <div className="p-3.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-indigo-200">
                          <span className="font-bold text-indigo-400 block mb-1">AI Evaluator Feedback:</span>
                          {item.evaluation.technical_feedback}
                        </div>
                      )}

                      {item.evaluation?.improved_answer && (
                        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                          <span className="font-bold text-pink-400 block mb-1">Recommended Model Answer:</span>
                          {item.evaluation.improved_answer}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <button
            onClick={() => setStage('setup')}
            className="px-6 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Session</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="px-5 py-3 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Go to User Dashboard</span>
            </button>

            <button
              onClick={handleDownloadReport}
              className="px-6 py-3 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Performance Report (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
