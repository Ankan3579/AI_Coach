import React, { useState } from 'react';
import { Copy, Check, RotateCcw, Code2 } from 'lucide-react';

export default function CodeEditor({ 
  code, 
  onChange, 
  language = 'python', 
  onLanguageChange,
  readOnly = false,
  minLines = 10
}) {
  const [copied, setCopied] = useState(false);

  const languages = [
    { id: 'python', label: 'Python 3' },
    { id: 'javascript', label: 'JavaScript' },
    { id: 'cpp', label: 'C++ (g++)' },
    { id: 'java', label: 'Java' },
    { id: 'c', label: 'C (gcc)' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const indent = '    ';
      const newCode = code.substring(0, start) + indent + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + indent.length;
      }, 0);
    }
  };

  // Generate line numbers
  const lines = code ? code.split('\n') : [''];
  const lineCount = Math.max(lines.length, minLines);

  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl flex flex-col">
      {/* Editor Header Bar */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>

          {onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-mono text-slate-400 uppercase">{language}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs flex items-center gap-1.5 transition-colors"
            title="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Area with Line Numbers */}
      <div className="relative flex font-mono text-xs sm:text-sm bg-slate-950 min-h-[220px]">
        {/* Line Numbers Gutter */}
        <div className="select-none py-3 px-3 text-right text-slate-600 bg-slate-950/70 border-r border-slate-800/80 w-12 font-mono text-xs shrink-0">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Input / Code Area */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={readOnly}
          spellCheck="false"
          placeholder="// Type or paste your code solution here..."
          className="flex-1 w-full py-3 px-4 bg-transparent text-emerald-300 font-mono text-xs sm:text-sm leading-6 resize-y focus:outline-none placeholder-slate-600"
          rows={lineCount}
        />
      </div>
    </div>
  );
}
