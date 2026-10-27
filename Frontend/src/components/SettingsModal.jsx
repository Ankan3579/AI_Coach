import React, { useState } from 'react';
import { X, Server, RefreshCw, CheckCircle2, AlertCircle, ExternalLink, Zap } from 'lucide-react';
import { api } from '../api/client';

export default function SettingsModal({ isOpen, onClose, backendStatus, onStatusChange }) {
  const [url, setUrl] = useState(api.baseUrl);
  const [forceMock, setForceMock] = useState(api.forceMock);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      api.setBaseUrl(url);
      const isHealthy = await api.checkHealth();
      setTestResult({
        success: isHealthy,
        message: isHealthy 
          ? 'FastAPI Backend connected successfully!' 
          : 'Could not reach backend at this address. Check if uvicorn is running on port 8000.'
      });
      onStatusChange();
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    api.setBaseUrl(url);
    api.setForceMock(forceMock);
    onStatusChange();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Backend Configuration</h3>
              <p className="text-xs text-slate-400">FastAPI Connection & Fallback Settings</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* URL Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              FastAPI Base URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Testing...' : 'Test'}
              </button>
            </div>
          </div>

          {/* Test Status feedback */}
          {testResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">{testResult.success ? 'Success' : 'Connection Notice'}</p>
                <p className="opacity-90">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Toggle Offline/Demo Mode */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Always Use Demo/Mock Mode</span>
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Instant Preview
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Use built-in simulated responses without requiring local Ollama or Judge0 servers.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={forceMock}
                onChange={(e) => setForceMock(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Backend Endpoints reference */}
          <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800 text-xs space-y-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Connected Backend Endpoints
            </span>
            <div className="font-mono text-[11px] text-slate-400 space-y-1">
              <div><span className="text-emerald-400">POST</span> /interview/start</div>
              <div><span className="text-emerald-400">POST</span> /interview/answer</div>
              <div><span className="text-emerald-400">POST</span> /interview/{'{session_id}'}/answer-audio</div>
              <div><span className="text-emerald-400">POST</span> /interview/end/{'{session_id}'}</div>
              <div><span className="text-emerald-400">POST</span> /api/code/submit (Judge0)</div>
              <div><span className="text-emerald-400">POST</span> /api/livekit/token</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
