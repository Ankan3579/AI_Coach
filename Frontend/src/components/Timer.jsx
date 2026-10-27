import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

export default function Timer({ durationMinutes = 45, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
  }, [durationMinutes]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onTimeUp) onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 300; // less than 5 minutes

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-medium transition-colors ${
      isLowTime
        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
        : 'bg-slate-900 border-slate-800 text-slate-300'
    }`}>
      {isLowTime ? (
        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
      ) : (
        <Clock className="w-3.5 h-3.5 text-indigo-400" />
      )}
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
}
