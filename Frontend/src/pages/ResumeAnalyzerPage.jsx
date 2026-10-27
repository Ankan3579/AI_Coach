import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  TrendingUp, 
  Briefcase,
  Layers,
  ArrowRight,
  FileCheck,
  X,
  File,
  RefreshCw,
  Eye,
  Check,
  Code,
  Server
} from 'lucide-react';
import { extractTextFromFile, fileToBase64 } from '../utils/resumeParser';
import { api } from '../api/client';

export default function ResumeAnalyzerPage() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileBase64Data, setFileBase64Data] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedTextPreview, setExtractedTextPreview] = useState('');
  const [targetJobRole, setTargetJobRole] = useState('Web Developer');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState(null);

  const fileInputRef = useRef(null);

  // Resume text state (populated from file or typed directly)
  const [resumeText, setResumeText] = useState(
`Jishu Bhaskar
Web & Frontend Developer | jishubhaskar00@gmail.com

EXPERIENCE
Frontend Developer (2023 - Present)
- Developed responsive web applications using React, HTML5, CSS3, and JavaScript.
- Integrated RESTful APIs with Axios and modernized state management.
- Implemented Tailwind CSS design system components ensuring full mobile cross-browser compatibility.

PROJECTS
- E-Commerce Web Platform: Built shopping app with React, Stripe checkout, and Tailwind CSS.
- Real-Time Dashboard: Developed live analytics dashboard with WebSocket connections and responsive charts.

SKILLS
- Languages: JavaScript, TypeScript, HTML5, CSS3, SQL
- Frameworks & Tools: React, Tailwind CSS, Vite, Git, REST APIs
`
  );

  // Handle File selection
  const handleFileChange = async (file) => {
    if (!file) return;

    setUploadedFile({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type || 'application/pdf'
    });

    try {
      // 1. Extract real text using PDF.js
      const extracted = await extractTextFromFile(file);
      if (extracted && extracted.length > 20) {
        setResumeText(extracted);
        setExtractedTextPreview(
          extracted.length > 280 ? extracted.slice(0, 280) + '...' : extracted
        );
      }

      // 2. Convert to Base64 for FastAPI PyMuPDF backend processing
      const b64 = await fileToBase64(file);
      setFileBase64Data(b64);
    } catch (err) {
      console.warn('Text extraction issue:', err);
      setExtractedTextPreview(`Uploaded ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFileBase64Data(null);
    setExtractedTextPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!uploadedFile && !resumeText.trim()) {
      alert('Please upload a resume file or paste your resume text.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Call FastAPI /api/resume/analyze with extracted text AND base64
      const result = await api.analyzeResume({
        resume_text: resumeText,
        file_base64: fileBase64Data,
        file_name: uploadedFile ? uploadedFile.name : 'Pasted Resume Text',
        target_role: targetJobRole
      });

      if (result) {
        setReport({
          ...result,
          targetRole: targetJobRole,
          fileName: uploadedFile ? uploadedFile.name : 'Pasted Resume Text'
        });

        // Persist real ATS score to localStorage for User Dashboard sync
        try {
          localStorage.setItem('ai_coach_latest_ats', JSON.stringify({
            score: result.atsScore || 75,
            targetRole: targetJobRole,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }));
        } catch (err) {
          console.warn('Could not persist ATS score:', err);
        }
      }
    } catch (err) {
      alert('Analysis error: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-semibold">
          <FileText className="w-3.5 h-3.5" />
          AI Resume Analyzer & Dynamic ATS Auditor
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Inspect, Score & Optimize Your Resume
        </h1>
        <p className="text-sm text-slate-400">
          Upload any resume (PDF / DOCX / TXT) or paste text to evaluate your ATS compatibility score against your target role.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAnalyze} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Target Job Role
          </label>
          <input
            type="text"
            required
            value={targetJobRole}
            onChange={(e) => setTargetJobRole(e.target.value)}
            placeholder="e.g. Web Developer, Frontend Engineer, AI Engineer, Python Backend..."
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-pink-500 font-medium"
          />
          {/* Preset Role Suggestions */}
          <div className="flex flex-wrap gap-2 mt-2">
            {['Web Developer', 'Frontend Engineer', 'Backend Engineer', 'Full-Stack Developer', 'AI / ML Engineer', 'Data Scientist'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setTargetJobRole(role)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  targetJobRole.toLowerCase() === role.toLowerCase()
                    ? 'bg-pink-600 border-pink-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Input Mode Selector: Upload File vs Paste Text */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Resume Input Method
            </span>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'upload'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Upload File (PDF / DOCX)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'paste'
                    ? 'bg-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Paste Plain Text
              </button>
            </div>
          </div>

          {/* TAB 1: File Upload Zone */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-pink-500 bg-pink-500/10 scale-[1.01]'
                      : 'border-slate-800 hover:border-pink-500/50 bg-slate-950/60 hover:bg-slate-950'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center mb-1">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1">
                      Click to upload or drag & drop your resume file
                    </h3>
                    <p className="text-xs text-slate-400">
                      Supports PDF, DOCX, DOC, TXT, or MD
                    </p>
                  </div>
                  <span className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 mt-2">
                    Browse Files
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20 shrink-0">
                      <File className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">{uploadedFile.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Extracted
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono">{uploadedFile.size}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
                    >
                      Change File
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {extractedTextPreview && (
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
                  <Eye className="w-3.5 h-3.5 text-pink-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-slate-500 font-mono text-[10px] uppercase block mb-0.5">Parsed Resume Content:</span>
                    <p className="truncate italic">{extractedTextPreview}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Direct Text Input */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Resume Content
                </label>
                <span className="text-[11px] text-slate-500">
                  {resumeText.length} characters
                </span>
              </div>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={9}
                placeholder="Paste your plain text resume or work history here..."
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-2xl text-xs sm:text-sm text-slate-200 font-mono focus:outline-none focus:border-pink-500 leading-relaxed"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isAnalyzing || (!uploadedFile && !resumeText.trim())}
            className="px-8 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-pink-600 to-indigo-600 hover:opacity-95 text-white shadow-xl shadow-pink-600/25 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? `Analyzing with FastAPI Backend for "${targetJobRole}"...` : `Run ATS Analysis for ${targetJobRole}`}</span>
          </button>
        </div>
      </form>

      {/* Analysis Results Display */}
      {report && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Score Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className={`w-20 h-20 rounded-2xl border flex flex-col items-center justify-center font-bold shadow-lg shrink-0 ${
                report.atsScore >= 80 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : report.atsScore >= 65
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                <span className="text-3xl leading-none">{report.atsScore}</span>
                <span className="text-[10px] uppercase text-slate-400">/ 100</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">ATS Compatibility Match</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    report.atsScore >= 80 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {report.matchTier || 'Evaluated'}
                  </span>
                  {report.source && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                      <Server className="w-3 h-3" /> {report.source}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 max-w-lg">
                  {report.overall_assessment}
                </p>
                {report.fileName && (
                  <p className="text-[11px] text-pink-400 font-medium">
                    Audited Document: {report.fileName}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-right">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Target Role
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-pink-400 inline-block capitalize">
                {report.targetRole || targetJobRole}
              </span>
            </div>
          </div>

          {/* Extracted Technical Skills Inventory */}
          {report.technical_skills && report.technical_skills.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-4 h-4" />
                Verified Skills Extracted from Your Resume ({report.technical_skills.length})
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.technical_skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-950 text-indigo-300 border border-slate-800">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Missing Skills Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Resume Strengths for {targetJobRole}
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Role-Specific Missing Skills */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Missing Core Skills for "{targetJobRole}"
              </h4>
              <p className="text-[11px] text-slate-400">
                Adding these competencies to your resume will boost your recruiter match rate:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {report.missing_skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-rose-950/40 text-rose-300 border border-rose-800/50">
                    + {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ATS Recommendations & Role Matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                ATS Optimization Advice
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {report.ats_recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
              <h4 className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                Recommended Target Roles
              </h4>
              <div className="space-y-1.5">
                {report.recommended_roles.map((role, i) => (
                  <div key={i} className="p-2.5 bg-slate-950 rounded-xl text-xs font-medium text-slate-200 border border-slate-800/80 flex items-center justify-between">
                    <span>{role}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Matched</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
