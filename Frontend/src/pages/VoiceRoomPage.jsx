import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  Sparkles, 
  Play, 
  Square, 
  RotateCcw, 
  Send,
  MessageCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit
} from 'lucide-react';
import { api } from '../api/client';

export default function VoiceRoomPage() {
  const [inCall, setInCall] = useState(false);
  const [candidateName, setCandidateName] = useState('Alex Chen');
  const [selectedTopic, setSelectedTopic] = useState('System Design & Distributed Systems');
  const [difficulty, setDifficulty] = useState('medium');
  const [sessionId, setSessionId] = useState('');
  
  // Conversation state
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionReason, setQuestionReason] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isCandidateRecording, setIsCandidateRecording] = useState(false);
  const [transcriptDraft, setTranscriptDraft] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0.8);

  const recognitionRef = useRef(null);

  // Initialize Web Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setTranscriptDraft((prev) => (finalTranscript ? prev + ' ' + finalTranscript : interimTranscript));
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsCandidateRecording(false);
      };

      recognition.onend = () => {
        setIsCandidateRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-To-Speech function
  const speakText = (text, onComplete) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = voiceVolume;
      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => {
        setIsAiSpeaking(false);
        if (onComplete) onComplete();
      };
      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (onComplete) onComplete();
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (onComplete) onComplete();
    }
  };

  // Start Call
  const handleStartCall = async () => {
    const newSessionId = 'vapi-' + Math.random().toString(36).substring(2, 9);
    setSessionId(newSessionId);
    setInCall(true);
    setIsProcessing(true);

    try {
      const data = await api.getVapiNextQuestion({
        session_id: newSessionId,
        candidate_name: candidateName,
        selected_topic: selectedTopic,
        current_difficulty: difficulty,
        question_number: 1
      });

      const firstQ = data.question || "Hello Alex, welcome to your technical interview. Let's start: Can you explain how you approach designing a resilient distributed system?";
      setCurrentQuestion(firstQ);
      setQuestionReason(data.reason || "Opening calibration question");

      setMessages([
        {
          sender: 'ai',
          text: firstQ,
          reason: data.reason
        }
      ]);

      speakText(firstQ);
    } catch (err) {
      alert('Failed to connect to Vapi route: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Candidate Microphone
  const toggleRecording = () => {
    if (isCandidateRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsCandidateRecording(false);
    } else {
      setTranscriptDraft('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsCandidateRecording(true);
        } catch {
          setIsCandidateRecording(false);
        }
      } else {
        // Fallback simulate speech
        setIsCandidateRecording(true);
        setTimeout(() => {
          setTranscriptDraft("In a distributed architecture, I prioritize idempotency, circuit breakers, and eventual consistency using an event broker like Kafka.");
          setIsCandidateRecording(false);
        }, 3000);
      }
    }
  };

  // Send Candidate Answer & Get Next Question
  const handleSendAnswer = async () => {
    if (!transcriptDraft.trim()) return;

    if (recognitionRef.current && isCandidateRecording) {
      recognitionRef.current.stop();
      setIsCandidateRecording(false);
    }

    const answer = transcriptDraft.trim();
    setTranscriptDraft('');
    setMessages((prev) => [...prev, { sender: 'candidate', text: answer }]);

    setIsProcessing(true);

    try {
      const data = await api.getVapiNextQuestion({
        session_id: sessionId,
        candidate_name: candidateName,
        selected_topic: selectedTopic,
        current_difficulty: difficulty,
        candidate_answer: answer,
        question_number: messages.length + 1
      });

      const nextQ = data.question;
      setCurrentQuestion(nextQ);
      setQuestionReason(data.reason || 'Follow-up exploration');

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: nextQ,
          reason: data.reason
        }
      ]);

      speakText(nextQ);
    } catch (err) {
      alert('Error fetching next question: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // End Call
  const handleEndCall = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) recognitionRef.current.stop();
    setInCall(false);
    setIsAiSpeaking(false);
    setIsCandidateRecording(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Real-Time Voice Interview
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">
                VAPI & WHISPER
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Low-latency conversational voice agent powered by <code className="text-pink-300">/api/vapi/next-question</code>
            </p>
          </div>
        </div>

        {inCall && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE CALL ACTIVE</span>
            </div>
            <button
              onClick={handleEndCall}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Hang Up
            </button>
          </div>
        )}
      </div>

      {!inCall ? (
        /* Setup / Enter Room View */
        <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-600 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-xl shadow-pink-600/30">
            <BrainCircuit className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-white">Join Voice Interview Room</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              The AI interviewer will ask questions aloud using speech synthesis, and transcribe your voice answers in real-time.
            </p>
          </div>

          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Technical Field
              </label>
              <input
                type="text"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          <button
            onClick={handleStartCall}
            disabled={isProcessing}
            className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white shadow-xl shadow-pink-600/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Connect Voice Interview</span>
          </button>
        </div>
      ) : (
        /* Live Voice Call View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Animated Avatar & Live Question (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Visualizer & Avatar Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
              <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                {/* Glow rings */}
                {isAiSpeaking && (
                  <div className="absolute inset-0 rounded-full bg-pink-500/20 animate-ping opacity-75" />
                )}
                {isCandidateRecording && (
                  <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping opacity-75" />
                )}

                <div className={`w-28 h-28 rounded-3xl flex items-center justify-center transition-all ${
                  isAiSpeaking
                    ? 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white shadow-2xl shadow-pink-600/50 scale-105'
                    : isCandidateRecording
                    ? 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-2xl shadow-indigo-600/50 scale-105'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  <Bot className="w-14 h-14" />
                </div>
              </div>

              {/* Status Indicator */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
                  {isAiSpeaking ? 'AI Interviewer Speaking...' : isCandidateRecording ? 'Listening to You...' : 'Your Turn to Answer'}
                </span>
                <p className="text-base sm:text-lg font-medium text-white max-w-lg mx-auto">
                  "{currentQuestion}"
                </p>
                {questionReason && (
                  <p className="text-xs text-slate-400 italic pt-1">
                    AI Intent: {questionReason}
                  </p>
                )}
              </div>

              {/* Real-time wave bars */}
              <div className="flex items-center justify-center gap-1.5 h-10">
                <div className={`w-1.5 rounded-full ${isAiSpeaking || isCandidateRecording ? 'bg-pink-500 animate-wave-1' : 'bg-slate-700 h-2'}`}></div>
                <div className={`w-1.5 rounded-full ${isAiSpeaking || isCandidateRecording ? 'bg-indigo-500 animate-wave-2' : 'bg-slate-700 h-2'}`}></div>
                <div className={`w-1.5 rounded-full ${isAiSpeaking || isCandidateRecording ? 'bg-violet-500 animate-wave-3' : 'bg-slate-700 h-2'}`}></div>
                <div className={`w-1.5 rounded-full ${isAiSpeaking || isCandidateRecording ? 'bg-rose-500 animate-wave-4' : 'bg-slate-700 h-2'}`}></div>
                <div className={`w-1.5 rounded-full ${isAiSpeaking || isCandidateRecording ? 'bg-pink-500 animate-wave-5' : 'bg-slate-700 h-2'}`}></div>
              </div>

              {/* Candidate Microphone & Answer Input */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="relative">
                  <textarea
                    value={transcriptDraft}
                    onChange={(e) => setTranscriptDraft(e.target.value)}
                    rows={3}
                    placeholder="Click microphone below to speak, or type your answer here..."
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={toggleRecording}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
                      isCandidateRecording
                        ? 'bg-rose-600 border-rose-500 text-white animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                    }`}
                  >
                    {isCandidateRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isCandidateRecording ? 'Stop Mic' : 'Speak via Mic'}</span>
                  </button>

                  <button
                    onClick={handleSendAnswer}
                    disabled={isProcessing || !transcriptDraft.trim()}
                    className="py-2.5 px-6 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-pink-600/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isProcessing ? 'Processing AI...' : 'Submit Response'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Live Transcript Feed (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[560px]">
            <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-pink-400" />
              <span>Live Dialogue Stream</span>
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 py-3 pr-1">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'ai'
                      ? 'bg-slate-950 border border-slate-800 text-slate-200 mr-4'
                      : 'bg-indigo-600/20 border border-indigo-500/30 text-indigo-200 ml-4'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {msg.sender === 'ai' ? 'AI Interviewer' : candidateName}
                  </span>
                  <p>{msg.text}</p>
                  {msg.reason && (
                    <span className="text-[10px] text-pink-400/80 block mt-1">
                      Target: {msg.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
