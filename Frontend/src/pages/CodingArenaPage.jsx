import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  Code2, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Terminal, 
  Clock, 
  Cpu, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import { api } from '../api/client';
import { SAMPLE_CODING_PROBLEMS } from '../api/mockData';

export default function CodingArenaPage() {
  const [selectedProblem, setSelectedProblem] = useState(SAMPLE_CODING_PROBLEMS[0]);
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState(selectedProblem.defaultCode.python);
  const [customStdin, setCustomStdin] = useState(selectedProblem.sampleInput);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [activeTab, setActiveTab] = useState('testcases'); // 'testcases' | 'stdin'

  const handleProblemChange = (problem) => {
    setSelectedProblem(problem);
    setCode(problem.defaultCode[language] || problem.defaultCode.python);
    setCustomStdin(problem.sampleInput);
    setEvaluationResult(null);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (selectedProblem.defaultCode[newLang]) {
      setCode(selectedProblem.defaultCode[newLang]);
    }
  };

  const handleRunCode = async () => {
    setIsSubmitting(true);
    setEvaluationResult(null);
    try {
      const result = await api.submitCode({
        source_code: code,
        language: language,
        question_id: selectedProblem.id,
        stdin: customStdin
      });

      setEvaluationResult(result);
      if (result.all_passed) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 }
        });
      }
    } catch (err) {
      alert('Code execution failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Code2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Judge0 Coding Platform
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SANDBOX EXECUTOR
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Submit code to the backend execution engine with automated test case validation
            </p>
          </div>
        </div>

        {/* Problem Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-400">Select Problem:</label>
          <select
            value={selectedProblem.id}
            onChange={(e) => {
              const p = SAMPLE_CODING_PROBLEMS.find((prob) => prob.id === e.target.value);
              if (p) handleProblemChange(p);
            }}
            className="bg-slate-950 border border-slate-700 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 font-medium"
          >
            {SAMPLE_CODING_PROBLEMS.map((prob) => (
              <option key={prob.id} value={prob.id}>
                {prob.title} ({prob.difficulty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Problem Description & Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Problem Details (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedProblem.title}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {selectedProblem.difficulty}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {selectedProblem.description}
            </p>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sample Input (stdin)</span>
                <code className="text-emerald-400 font-mono">{selectedProblem.sampleInput}</code>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Expected Output (stdout)</span>
                <code className="text-indigo-400 font-mono">{selectedProblem.sampleOutput}</code>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Backend evaluates via FastAPI route <code className="text-indigo-200 font-mono">/api/code/submit</code> against predefined hidden test vectors.
              </span>
            </div>
          </div>

          {/* Execution Results View */}
          {evaluationResult && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Execution Score</span>
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                  evaluationResult.all_passed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  {evaluationResult.score_percentage}% Passed
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${
                    evaluationResult.all_passed ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ width: `${evaluationResult.score_percentage}%` }}
                />
              </div>

              {/* Test Cases List */}
              <div className="space-y-2 pt-1">
                {evaluationResult.results?.map((res, i) => (
                  <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        Test Case #{res.test_case || i + 1}
                      </span>
                      <span className={`text-[10px] font-mono font-bold ${
                        res.passed ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {res.status || (res.passed ? 'Accepted' : 'Failed')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Expected:</span>
                        <span className="text-slate-300">{res.expected_output}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">Actual:</span>
                        <span className={res.passed ? 'text-emerald-300' : 'text-rose-300'}>
                          {res.actual_output || '(Empty)'}
                        </span>
                      </div>
                    </div>

                    {res.execution_time && (
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {res.execution_time}
                        </span>
                        {res.memory && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" /> {res.memory}
                          </span>
                        )}
                      </div>
                    )}

                    {res.stderr && (
                      <div className="p-2 bg-rose-950/30 text-rose-300 font-mono text-[10px] rounded border border-rose-900/50">
                        {res.stderr}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Col: Code Editor & Execution Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <CodeEditor
            code={code}
            onChange={setCode}
            language={language}
            onLanguageChange={handleLanguageChange}
            minLines={16}
          />

          {/* Stdin tester box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                Standard Input (stdin)
              </span>
              <button
                type="button"
                onClick={() => setCustomStdin(selectedProblem.sampleInput)}
                className="text-[11px] text-slate-400 hover:text-indigo-400 transition-colors"
              >
                Reset to sample input
              </button>
            </div>
            <textarea
              value={customStdin}
              onChange={(e) => setCustomStdin(e.target.value)}
              rows={2}
              placeholder="Provide standard input for testing..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setCode(selectedProblem.defaultCode[language] || '')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Template</span>
            </button>

            <button
              onClick={handleRunCode}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-xl shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{isSubmitting ? 'Executing in Judge0 Sandbox...' : 'Run & Submit Code'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
