import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  User, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Bot, 
  FileText, 
  Code2, 
  Edit3, 
  Save, 
  X, 
  Sparkles, 
  BarChart3, 
  ChevronRight,
  Target,
  Calendar,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export default function UserDashboardPage({ onNavigate }) {
  // Load or initialize real user profile
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('ai_coach_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Jishu Bhaskar',
      targetRole: 'Web Developer',
      level: 'Mid-Level',
      email: 'jishubhaskar00@gmail.com'
    };
  });

  // Load real completed interview history (no demo fake data)
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('ai_coach_interview_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    return [];
  });

  // Latest resume ATS score (loaded from real analysis runs)
  const [latestResumeAts, setLatestResumeAts] = useState(() => {
    const saved = localStorage.getItem('ai_coach_latest_ats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  // Edit Profile Modal
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(profile);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfile(editForm);
    localStorage.setItem('ai_coach_user_profile', JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all your recorded interview session history?')) {
      setHistory([]);
      localStorage.removeItem('ai_coach_interview_history');
    }
  };

  // Calculate real platform statistics
  const totalInterviews = history.length;
  const overallAverage = totalInterviews > 0 
    ? (history.reduce((acc, curr) => acc + (Number(curr.averageScore) || 0), 0) / totalInterviews).toFixed(1)
    : null;
  
  const highestScore = totalInterviews > 0
    ? Math.max(...history.map((h) => Number(h.averageScore) || 0)).toFixed(1)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* User Avatar with Initials */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-600/30 shrink-0">
              {profile.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'JB'}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {profile.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Active Candidate
                </span>
              </div>
              <p className="text-sm text-indigo-300 font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-400" />
                Targeting: {profile.targetRole} • {profile.level} Level
              </p>
              <p className="text-xs text-slate-400">
                {profile.email} • Candidate Dashboard
              </p>
            </div>
          </div>

          {/* Quick Edit Profile Button */}
          <button
            onClick={() => {
              setEditForm(profile);
              setIsEditing(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Average Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Overall Average</span>
            <div className="text-3xl font-extrabold text-indigo-400">
              {overallAverage ? `${overallAverage}` : '--'} 
              {overallAverage && <span className="text-sm text-slate-500"> / 10</span>}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {overallAverage ? 'Calculated from completed sessions' : 'Complete an interview to see avg'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Completed Interviews */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Interviews Completed</span>
            <div className="text-3xl font-extrabold text-white">
              {totalInterviews}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Real session records
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Bot className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Highest Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Highest Score</span>
            <div className="text-3xl font-extrabold text-emerald-400">
              {highestScore ? `${highestScore}` : '--'}
              {highestScore && <span className="text-sm text-slate-500"> / 10</span>}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Personal best score
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Latest Resume ATS Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold text-slate-400">Resume ATS Score</span>
            <div className="text-3xl font-extrabold text-pink-400">
              {latestResumeAts ? `${latestResumeAts.score}` : '--'}
              {latestResumeAts && <span className="text-sm text-slate-500"> / 100</span>}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              {latestResumeAts ? `Role: ${latestResumeAts.targetRole}` : 'Audit a resume to view score'}
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Interview History + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Real Session Records */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span>Your Interview Performance History</span>
            </h2>
            {history.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="text-xs text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear History</span>
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
                <Bot className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white">No Mock Interviews Taken Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Take your first AI interview practice session. Your questions, scores, and evaluations will be tracked and displayed here.
                </p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('interview')}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Start Practice Interview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.topic}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800 capitalize">
                        {item.difficulty || 'Adaptive'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {item.role} • {item.questionsCount || 1} Questions • {item.date || 'Recent'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-indigo-400">
                        {Number(item.averageScore).toFixed(1)} <span className="text-xs text-slate-500">/ 10</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        item.averageScore >= 8.0 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.rating || (item.averageScore >= 8.0 ? 'Strong Hire' : 'Hire')}
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate && onNavigate('interview')}
                      className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Practice this topic again"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Action Launchers */}
        <div className="lg:col-span-5 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Platform Modules</span>
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <button
              onClick={() => onNavigate && onNavigate('interview')}
              className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white block">AI Interviewer</span>
                  <span className="text-[11px] text-slate-400">Adaptive technical & coding interview with live score</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('resume')}
              className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/10 text-pink-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white block">Resume ATS Analyzer</span>
                  <span className="text-[11px] text-slate-400">Upload PDF resume & audit match against your target role</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('coding')}
              className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white block">Judge0 Coding Arena</span>
                  <span className="text-[11px] text-slate-400">Execute code and run automated test cases</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate && onNavigate('career')}
              className="w-full p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-semibold text-xs text-white block">Career Roadmap Planner</span>
                  <span className="text-[11px] text-slate-400">Generate learning milestones tailored to your timeline</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Edit Candidate Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Role
                </label>
                <input
                  type="text"
                  required
                  value={editForm.targetRole}
                  onChange={(e) => setEditForm({ ...editForm, targetRole: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Experience Level
                </label>
                <select
                  value={editForm.level}
                  onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Entry / Junior">Entry / Junior</option>
                  <option value="Mid-Level">Mid-Level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead / Staff">Lead / Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
