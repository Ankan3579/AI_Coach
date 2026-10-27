import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SettingsModal from './components/SettingsModal';
import UserDashboardPage from './pages/UserDashboardPage';
import InterviewPage from './pages/InterviewPage';
import LiveKitVoiceRoomPage from './pages/LiveKitVoiceRoomPage';
import CodingArenaPage from './pages/CodingArenaPage';
import CareerPlannerPage from './pages/CareerPlannerPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import { api } from './api/client';
import { Bot, Sparkles, Terminal, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    forceMock: api.forceMock,
  });

  const checkConnection = async () => {
    const isOnline = await api.checkHealth();
    setBackendStatus({
      online: isOnline,
      forceMock: api.forceMock,
    });
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Page Content */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <UserDashboardPage onNavigate={setActiveTab} />
        )}
        {activeTab === 'interview' && (
          <InterviewPage 
            onOpenSettings={() => setIsSettingsOpen(true)} 
            backendStatus={backendStatus} 
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'voice' && <LiveKitVoiceRoomPage />}
        {activeTab === 'coding' && <CodingArenaPage />}
        {activeTab === 'career' && <CareerPlannerPage />}
        {activeTab === 'resume' && <ResumeAnalyzerPage />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendStatus={backendStatus}
        onStatusChange={checkConnection}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">AI Coach Platform</span>
            <span>•</span>
            <span>FastAPI Backend + React Frontend</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              API Status: {backendStatus.online ? 'FastAPI Online (8000)' : 'Offline'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
