import React, { useState, useEffect } from 'react';
import { 
  User, 
  Award, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Code2, 
  Bot, 
  Sparkles, 
  Calendar, 
  ArrowUpRight, 
  Edit3, 
  Save, 
  RotateCcw,
  BookOpen
} from 'lucide-react';

export default function DashboardPage({ onNavigateTab }) {
  // Load user profile & past interviews from localStorage
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('ai_coach_user_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Alex Chen',
      title: 'Aspiring AI / Machine Learning Engineer',
      targetRole: 'AI Engineer',
      level: 'Intermediate',
      email: 'alex.chen@example.com',
      avatarSeed: 'alex'
    };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState(userProfile.name);
  const [editedTitle, setEditedTitle] = useState(userProfile.title);
  const [editedTargetRole, setEditedTargetRole] = useState(userProfile.targetRole);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('ai_coach_interview_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    } else {
      // Default sample activity for a new user
      const defaultHistory = [
        {
          id: 'int-101',
          date: 'Yesterday, 4:15 PM',
          topic: 'Machine Learning & Neural Architectures',
          type: 'technical',
          questionsAnswered: 4,
          avgScore: 8.5,
          duration: '35 mins',
          difficulty: 'hard'
        },
        {
          id: 'int-102',
          date: '3 days ago',
          topic: 'Data Structures and Algorithms',
          type: 'coding',
          questionsAnswered: 3,
          avgScore: 7.8,
          duration: '40 mins',
          difficulty: 'medium'
        }
      ];
      setHistory(defaultHistory);
      localStorage.setItem('ai_coach_interview_history', JSON.stringify(defaultHistory));
    }
  }, []);

  const handleSaveProfile = () => {
    const updated = {
      ...userProfile,
      name: editedName,
      title: editedTitle,
      targetRole: editedTargetRole
    };
    setUserProfile(updated);
    localStorage.setItem('ai_coach_user_profile', JSON.stringify(updated));
    setIsEditingProfile(false);
  };

  // Compute aggregate metrics
  const totalInterviews = history.length;
  const avgOverallScore = totalInterviews > 0
    ? (history.reduce((acc, h) => acc + (Number(h.avgScore) || 7), 0) / totalInterviews).toFixed(1)
    : '8.2';

  const skillBreakdown = [
    { skill: 'Machine Learning & AI', score: 88, color: 'bg-indigo-500' },
    { skill: 'Algorithms & Data Structures', score: 76, color: 'bg-emerald-500' },
    { skill: 'System Design & Scalability', score: 82, color: 'bg-violet-500' },
    { skill: 'Technical Communication', score: 90, color: 'bg-pink-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Top Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-indigo-600/30 shrink-0">
              {userProfile.name.charAt(0)}
            </div>

            <div className="space-y-1">
              {!isEditingProfile ? (
                <>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-extrabold text-white">{userProfile.name}</h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Active Candidate
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium">
                    {userProfile.title}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                    <span>Target:</span>
                    <strong className="text-indigo-400 font-semibold">{userProfile.targetRole}</strong>
                    <span>•</span>
                    <span>Level: {userProfile.level}</span>
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white"
                    placeholder="Your Name"
                  />
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white w-full"
                    placeholder="Your Title"
                  />
                  <input
                    type="text"
                    value={editedTargetRole}
                    onChange={(e) => setEditedTargetRole(e.target.value)}
                    className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    placeholder="Target Role"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Edit / Save Button */}
          <div>
            {!isEditingProfile ? (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Interviews Completed</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {totalInterviews}
          </div>
          <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Ready for live mock evaluation</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Interview Score</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {avgOverallScore} <span className="text-sm text-slate-500">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Computed across all sessions
          </p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">ATS Resume Index</span>
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-pink-400">
            84%
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            High ATS keyword match
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Code Challenges Solved</span>
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-violet-400">
            12
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Validated by Judge0 Sandbox
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Activity & Skill Mastery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Interview History (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-base text-white">Your Completed Interviews</h3>
            </div>
            <button
              onClick={() => onNavigateTab('interview')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <span>Start New Interview</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {history.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 bg-slate-950 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{item.topic}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-800 text-slate-300">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.questionsAnswered} Questions</span>
                    <span>•</span>
                    <span className="capitalize text-indigo-300">{item.difficulty} Level</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Score</span>
                    <span className="text-base font-extrabold text-emerald-400 font-mono">
                      {item.avgScore} <span className="text-xs text-slate-500">/ 10</span>
                    </span>
                  </div>
                  <button
                    onClick={() => onNavigateTab('interview')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Review interview"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Technical Skill Competency (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Evaluated Skill Competencies</h3>
          </div>

          <div className="space-y-4">
            {skillBreakdown.map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.skill}</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.score}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* AI Recommendation Alert */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Coach Recommendation</span>
            </div>
            <p className="leading-relaxed">
              Based on your recent sessions, consider practicing <strong>System Design</strong> and <strong>Graph Traversal</strong> to raise your readiness for Tier-1 engineering roles.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
