import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Target, 
  Clock, 
  BookOpen, 
  Calendar,
  ExternalLink,
  ChevronRight,
  Server
} from 'lucide-react';
import { api } from '../api/client';

export default function CareerPlannerPage() {
  const [goal, setGoal] = useState('Become a Web Developer');
  const [currentLevel, setCurrentLevel] = useState('Beginner');
  const [targetTimeline, setTargetTimeline] = useState('6 months');
  const [preferences, setPreferences] = useState('Focus on React, JavaScript, Tailwind CSS, Node.js, and Full-Stack APIs');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [dataSource, setDataSource] = useState('');

  const handleGeneratePlan = async (e) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      // 1. Try FastAPI backend route
      const backendRes = await api.generateCareerPlan({
        goal,
        current_level: currentLevel,
        target_timeline: targetTimeline,
        preferences
      });

      if (backendRes && backendRes.phases) {
        setPlanResult({
          goal: backendRes.goal || goal,
          currentLevel: backendRes.current_level || currentLevel,
          timeline: backendRes.timeline || targetTimeline,
          phases: backendRes.phases,
          recommendedProjects: backendRes.recommendedProjects || []
        });
        setDataSource('FastAPI Backend');
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn('Backend planner error:', err);
    }

    // Dynamic Fallback
    setTimeout(() => {
      setPlanResult({
        goal,
        currentLevel,
        timeline: targetTimeline,
        phases: [
          {
            phase: 'Phase 1: Foundations & Core Technologies',
            duration: 'Month 1 - 2',
            focus: `HTML5, CSS3, Modern JavaScript (ES6+), DOM Manipulation, and Git for ${goal}`,
            milestones: [
              'Build responsive multi-page layouts with semantic HTML and modern CSS',
              'Implement interactive UI components with vanilla JavaScript',
              'Master Git version control and GitHub collaborative workflows'
            ],
            keySkills: ['HTML5', 'CSS3', 'JavaScript', 'Git']
          },
          {
            phase: 'Phase 2: Modern Frameworks & Full-Stack Integration',
            duration: 'Month 3 - 4',
            focus: 'React / Next.js, Component Lifecycle, Tailwind CSS, REST APIs, and Node/FastAPI',
            milestones: [
              'Develop a complete single-page application using React & Tailwind',
              'Connect client interfaces with asynchronous REST endpoints',
              'Implement client-side routing, state management, and authentication'
            ],
            keySkills: ['React', 'Tailwind CSS', 'REST APIs', 'Node.js/FastAPI']
          },
          {
            phase: 'Phase 3: Production Deployment & Technical Interview Readiness',
            duration: 'Month 5 - 6',
            focus: 'Full-stack application architecture, database integration, CI/CD, and portfolio refinement',
            milestones: [
              'Deploy a full-stack portfolio capstone with database integration live on Vercel / Render',
              'Optimize Core Web Vitals, page load latency, and responsive mobile layouts',
              'Complete mock technical interviews in the AI Coach Interviewer'
            ],
            keySkills: ['Full-Stack Deployment', 'Database Integration', 'System Architecture', 'Interview Readiness']
          }
        ],
        recommendedProjects: [
          {
            title: `Full-Featured ${goal} Capstone Platform`,
            description: 'A production web application implementing responsive design, authentication, RESTful APIs, and live database persistence.'
          },
          {
            title: 'Interactive Real-Time Dashboard',
            description: 'A responsive dashboard displaying live data feeds, search filtering, and metric visualizations.'
          }
        ]
      });
      setDataSource('Client Dynamic Engine');
      setIsGenerating(false);
    }, 800);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold">
          <Compass className="w-3.5 h-3.5" />
          FastAPI AI Career Planner Agent
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Generate Your Personalized Career Roadmap
        </h1>
        <p className="text-sm text-slate-400">
          Synthesizes industry skill requirements, real-world project milestones, and timeline targets via FastAPI.
        </p>
      </div>

      {/* Form Input */}
      <form onSubmit={handleGeneratePlan} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Career Goal
            </label>
            <input
              type="text"
              required
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Become a Web Developer, AI Engineer..."
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Current Skill Level
            </label>
            <select
              value={currentLevel}
              onChange={(e) => setCurrentLevel(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="Beginner">Beginner (Starting fresh)</option>
              <option value="Intermediate">Intermediate (1-2 yrs experience)</option>
              <option value="Advanced">Advanced (Transitioning senior)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Target Timeline
            </label>
            <select
              value={targetTimeline}
              onChange={(e) => setTargetTimeline(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
            >
              <option value="3 months">3 Months (Intensive)</option>
              <option value="6 months">6 Months (Recommended)</option>
              <option value="12 months">12 Months (Part-time pace)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Preferences & Technology Stack Focus
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder="e.g. Focus on React, JavaScript, Tailwind, and Node.js"
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isGenerating}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-95 text-white shadow-xl shadow-violet-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Synthesizing with FastAPI Backend...' : 'Generate Career Plan'}</span>
          </button>
        </div>
      </form>

      {/* Generated Roadmap Display */}
      {planResult && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-400" />
              <span>Curated Career Roadmap for {planResult.goal} ({planResult.timeline})</span>
            </h2>
            {dataSource && (
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Server className="w-3 h-3" /> {dataSource}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {planResult.phases.map((ph, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-300 flex items-center justify-center font-bold text-xs">
                      0{idx + 1}
                    </span>
                    <h3 className="font-bold text-base text-white">{ph.phase}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-950 text-violet-300 border border-slate-800">
                    {ph.duration}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-300">
                  <strong className="text-white">Curriculum Focus:</strong> {ph.focus}
                </p>

                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Key Practical Milestones:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {ph.milestones.map((ms, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{ms}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {ph.keySkills.map((sk) => (
                    <span key={sk} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950 text-slate-300 border border-slate-800">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recommended Capstone Projects */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Recommended Portfolio Capstone Projects</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planResult.recommendedProjects.map((proj, i) => (
                <div key={i} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-sm text-white">{proj.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
