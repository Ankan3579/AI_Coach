import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { api } from '../api/client';

export default function LiveKitVoiceRoomPage() {
  const [candidateName, setCandidateName] = useState('');
  const [targetRole, setTargetRole] = useState('AI Engineer');
  const [selectedTopic, setSelectedTopic] = useState('System Design');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState('');
  const roomRef = useRef(null);
  const audioContainerRef = useRef(null);

  useEffect(() => () => {
    roomRef.current?.disconnect();
  }, []);

  const handleConnect = async (event) => {
    event.preventDefault();
    setError('');
    setIsConnecting(true);

    let room;
    try {
      const credentials = await api.createLiveKitToken({
        candidate_name: candidateName,
        target_role: targetRole,
        selected_topic: selectedTopic,
      });

      room = new Room();
      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          const audioElement = track.attach();
          audioElement.autoplay = true;
          audioElement.volume = 1.0;
          if (audioContainerRef.current) {
            audioContainerRef.current.appendChild(audioElement);
          }
        }
      });
      room.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });
      room.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setIsMicEnabled(false);
      });

      await room.connect(credentials.livekit_url, credentials.token);
      await room.startAudio();
      await room.localParticipant.setMicrophoneEnabled(true);

      // Attach any remote tracks already present upon connection
      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((pub) => {
          if (pub.track && pub.track.kind === Track.Kind.Audio) {
            const audioElement = pub.track.attach();
            audioElement.autoplay = true;
            audioElement.volume = 1.0;
            if (audioContainerRef.current) {
              audioContainerRef.current.appendChild(audioElement);
            }
          }
        });
      });

      roomRef.current = room;
      setIsConnected(true);
      setIsMicEnabled(true);
    } catch (connectError) {
      room?.disconnect();
      setError(connectError.message || 'Could not connect to the voice room.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setIsConnected(false);
    setIsMicEnabled(false);
  };

  const toggleMicrophone = async () => {
    const room = roomRef.current;
    if (!room) return;

    try {
      const nextState = !room.localParticipant.isMicrophoneEnabled;
      await room.localParticipant.setMicrophoneEnabled(nextState);
      setIsMicEnabled(nextState);
    } catch (micError) {
      setError(micError.message || 'Could not update microphone access.');
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            LiveKit + Sarvam
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Real-time voice interview
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Speak naturally with the interviewer. Your microphone audio is
            streamed over a LiveKit WebRTC room.
          </p>
        </div>

        {!isConnected ? (
          <form onSubmit={handleConnect} className="space-y-5">
            <label className="block text-sm text-slate-300">
              Candidate name
              <input
                required
                maxLength={100}
                value={candidateName}
                onChange={(event) => setCandidateName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Target role
              <input
                value={targetRole}
                maxLength={120}
                onChange={(event) => setTargetRole(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Interview topic
              <input
                value={selectedTopic}
                maxLength={160}
                onChange={(event) => setSelectedTopic(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-indigo-500"
              />
            </label>
            {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={isConnecting || !candidateName.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Phone className="h-4 w-4" />
              {isConnecting ? 'Connecting…' : 'Start voice interview'}
            </button>
          </form>
        ) : (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
              {isMicEnabled ? <Mic className="h-12 w-12" /> : <MicOff className="h-12 w-12" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Connected</h2>
              <p className="mt-1 text-sm text-slate-400">
                The interviewer will speak when ready. Speak after the question.
              </p>
            </div>
            {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={toggleMicrophone}
                className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-white hover:bg-slate-800"
              >
                {isMicEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                {isMicEnabled ? 'Mute microphone' : 'Enable microphone'}
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 font-semibold text-white hover:bg-rose-500"
              >
                <PhoneOff className="h-4 w-4" />
                End interview
              </button>
            </div>
          </div>
        )}
        <div ref={audioContainerRef} className="absolute -top-[9999px] -left-[9999px] w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true" />
      </section>
    </main>
  );
}
