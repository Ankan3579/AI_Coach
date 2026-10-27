import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, RefreshCw, Volume2, AlertCircle, VolumeX, CheckCircle } from 'lucide-react';

export default function AudioRecorder({ onAudioRecorded, isSubmitting }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [micError, setMicError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 1 real-time voice volume
  const [hasDetectedAudio, setHasDetectedAudio] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null;
        recorder.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const cleanupAudioNodes = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  const startRecording = async () => {
    setMicError(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setHasDetectedAudio(false);
    chunksRef.current = [];

    let stream;
    try {
      // Standard audio constraints that work reliably on Windows/Edge/Chrome
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Setup Web Audio Analyser for live visual feedback of microphone volume
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyser.smoothingTimeConstant = 0.5;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(1, avg / 128); // 0.0 to 1.0
            setAudioLevel(normalized);
            if (normalized > 0.08) {
              setHasDetectedAudio(true);
            }
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        }
      } catch (audioCtxErr) {
        console.warn('AudioContext visualization initialization note:', audioCtxErr);
      }

      // Detect supported mime-types in priority order
      let mimeType = '';
      const candidateTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav'
      ];
      for (const t of candidateTypes) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        cleanupAudioNodes();
        const finalType = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all audio tracks to release microphone hardware
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start(250); // flush audio slices every 250ms
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      cleanupAudioNodes();
      stream?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      console.error('Microphone access denied or error:', err);
      setMicError('Microphone access denied or not available. Please allow mic permissions in your browser and check your input device.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
      } catch (err) {
        console.warn('MediaRecorder requestData notice:', err);
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    cleanupAudioNodes();
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setRecordingTime(0);
    setMicError(null);
    setHasDetectedAudio(false);
  };

  const handleSendAudio = () => {
    if (!audioBlob) return;
    onAudioRecorded(audioBlob);
  };

  const formatSeconds = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">Voice Answer (Speech Recognition)</h4>
            <p className="text-[11px] text-slate-400">Speak your answer directly to the AI interviewer</p>
          </div>
        </div>

        {isRecording && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-medium animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>REC {formatSeconds(recordingTime)}</span>
          </div>
        )}
      </div>

      {micError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Real-time Voice Wave Visualizer */}
      {isRecording && (
        <div className="py-5 px-4 bg-slate-950/70 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-1.5 h-10">
            {[0.4, 0.7, 1.0, 0.8, 0.5, 0.9, 0.6, 0.3].map((multiplier, i) => {
              const heightPct = Math.max(15, Math.min(100, (audioLevel * multiplier * 120) + 15));
              return (
                <div
                  key={i}
                  className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-pink-500 transition-all duration-75"
                  style={{ height: `${heightPct}%` }}
                />
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs">
            {hasDetectedAudio ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium text-[11px]">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Microphone capturing voice
              </span>
            ) : (
              <span className="text-amber-400/90 text-[11px] flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> Please speak into your microphone...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Audio Playback Preview */}
      {audioUrl && !isRecording && (
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
              <Volume2 className="w-4 h-4" /> Listen to your recorded answer:
            </span>
            <span className="font-mono text-slate-400">
              {formatSeconds(recordingTime)} ({audioBlob ? `${(audioBlob.size / 1024).toFixed(1)} KB` : ''})
            </span>
          </div>

          <div className="flex items-center gap-3">
            <audio
              src={audioUrl}
              controls
              autoPlay={false}
              className="w-full h-9 rounded-lg outline-none"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 transition-all cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>Start Voice Recording</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Recording</span>
          </button>
        )}

        {audioBlob && !isRecording && (
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={resetRecording}
              disabled={isSubmitting}
              className="py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-record</span>
            </button>
            <button
              onClick={handleSendAudio}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transcribing & Evaluating...' : 'Submit Audio Answer'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
