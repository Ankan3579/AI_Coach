import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  ChevronRight, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  BookOpen, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export default function EvaluationCard({ evaluation, onNextQuestion, isLastQuestion = false }) {
  const [showImprovedAnswer, setShowImprovedAnswer] = useState(false);

  if (!evaluation) return null;

  const score = evaluation.score ?? 0;
  const rating = evaluation.rating || (score >= 8 ? 'excellent' : score >= 6 ? 'good' : score >= 4 ? 'average' : 'poor');
  const isCorrect = evaluation.correct ?? (score >= 5);
  const strengths = evaluation.strengths || [];
  const weaknesses = evaluation.weaknesses || [];
  const missingPoints = evaluation.missing_points || [];
  const feedback = evaluation.technical_feedback || '';
  const improvedAnswer = evaluation.improved_answer || '';
  const recommendedDifficulty = evaluation.recommended_difficulty || 'medium';

  const getScoreColor = (sc) => {
    if (sc >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (sc >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
  };

  const getRatingBadge = (rat) => {
    switch (rat.toLowerCase()) {
      case 'excellent':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'good':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'average':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-6 animate-fadeIn">
      {/* Top Banner: Score & Rating */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          {/* Circular Score Badge */}
          <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-bold ${getScoreColor(score)}`}>
            <span className="text-2xl leading-none">{score}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400">/ 10</span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getRatingBadge(rating)}`}>
                {rating}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${
                isCorrect ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
              }`}>
                {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {isCorrect ? 'Answer Passed' : 'Needs Work'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              AI Evaluator Assessment
            </p>
          </div>
        </div>

        {/* Adaptive Difficulty Alert */}
        <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="text-slate-400">Next Difficulty:</span>
          <span className="font-semibold capitalize text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
            {recommendedDifficulty}
          </span>
        </div>
      </div>

      {/* Technical Feedback summary */}
      {feedback && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Technical Analysis
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            {feedback}
          </p>
        </div>
      )}

      {/* Grid: Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
            <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Strengths
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses / Gaps */}
        {weaknesses.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-2">
            <h5 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Areas to Improve
            </h5>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Missing Points (if any) */}
      {missingPoints.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
          <h5 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Key Points Missing from Response
          </h5>
          <ul className="space-y-1 text-xs text-slate-300">
            {missingPoints.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Improved Model Answer Toggle */}
      {improvedAnswer && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80">
          <button
            onClick={() => setShowImprovedAnswer(!showImprovedAnswer)}
            className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-indigo-300 hover:bg-slate-900 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span>Recommended / Model Answer Breakdown</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showImprovedAnswer ? 'rotate-180' : ''}`} />
          </button>
          {showImprovedAnswer && (
            <div className="p-4 pt-2 border-t border-slate-800 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {improvedAnswer}
            </div>
          )}
        </div>
      )}

      {/* Next Question CTA */}
      <div className="pt-2 flex justify-end">
        <button
          onClick={onNextQuestion}
          className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer group"
        >
          <span>{isLastQuestion ? 'Complete Interview & View Report' : 'Proceed to Next Adaptive Question'}</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
