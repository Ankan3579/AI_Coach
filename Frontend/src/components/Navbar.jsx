import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Code2, 
  Compass, 
  FileText, 
  Settings, 
  LayoutDashboard,
  Mic,
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, backendStatus, onOpenSettings }) {
  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('ai_coach_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) return parsed.name;
      } catch {}
    }
    return 'Jishu Bhaskar';
  });

  useEffect(() => {
    const saved = localStorage.getItem('ai_coach_user_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setUserName(parsed.name);
      } catch {}
    }
  }, [activeTab]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Overview' },
    { id: 'interview', label: 'AI Interviewer', icon: Bot, badge: 'Adaptive' },
    { id: 'voice', label: 'Live Voice', icon: Mic, badge: 'WebRTC' },
    { id: 'coding', label: 'Coding Arena', icon: Code2, badge: 'Judge0' },
    { id: 'career', label: 'Career Planner', icon: Compass },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText, badge: 'ATS' },
  ];

  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'JB';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                AI Coach
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Multi-Agent Career & Technical Interview Hub
            </p>
          </div>
        </div>

        {/* Center Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-3">
          {/* User Profile Pill */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
            title="User Dashboard"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
              {initials}
            </div>
            <span className="text-xs font-medium hidden sm:inline max-w-[120px] truncate">{userName}</span>
          </button>

          {/* Backend Connection Pill */}
          <div 
            onClick={onOpenSettings}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-colors ${
              backendStatus.online
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="Click to configure backend API connection"
          >
            {backendStatus.online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">FastAPI Online</span>
                <span className="sm:hidden">8000</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{backendStatus.forceMock ? 'Mock Demo' : 'Offline'}</span>
              </>
            )}
          </div>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Backend Settings & Connection"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="lg:hidden flex items-center justify-around border-t border-slate-800/80 bg-slate-950 px-2 py-2 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap cursor-pointer ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
