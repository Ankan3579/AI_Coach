# LiveKit voice interviews

The browser joins a LiveKit room over WebRTC. The FastAPI route issues a
room-scoped participant token, and `livekit_worker.py` runs the voice agent.
Sarvam provides speech-to-text and text-to-speech. Chat requests use the shared
provider fallback order configured in `config.py`; the LiveKit worker applies
the same order to the spoken dialogue model.

## Configure

Copy `.env.example` values into the backend environment and set real credentials
for `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, and `SARVAM_API_KEY`.
Never put LiveKit API secrets, the Sarvam key, or the LLM key in frontend
variables. Set `FRONTEND_ORIGINS` to a comma-separated list of the exact
frontend origins allowed to call the backend.

Configure the provider API keys in `.env`; keys are not needed for the local
Ollama fallback. The default order is OpenAI, Groq, Mistral, then local Ollama.
Set `LLM_FALLBACK_ORDER` to change it, or set `LOCAL_LLM_ENABLED=false` to
disable local fallback. `OLLAMA_BASE_URL` is used by LiteLLM for ordinary chat
calls, and `OLLAMA_OPENAI_BASE_URL` must be an OpenAI-compatible endpoint for
LiveKit. For a remote worker, point these URLs at services it can reach.
The same fallback chain is used by resume analysis, interview question
recommendation and evaluation, career planning, and LiveKit voice dialogue.
OpenAI remains the only provider configured for the separate Whisper upload
transcription endpoint.

Install the voice worker dependencies and run the worker from the repository
root:

```powershell
python -m pip install -r livekit-requirements.txt
python livekit_worker.py dev
```

Run the FastAPI app and Vite frontend as usual, then open the **Live Voice** tab.
The worker must stay running and able to reach LiveKit, Sarvam, and the configured
LLM endpoint.

## Deployment security

`POST /api/livekit/token` currently creates a short-lived token scoped to one
room, but this project does not yet authenticate users at that endpoint. Add
your application's real authentication and authorization checks before exposing
it publicly. Deploy FastAPI and the frontend over HTTPS, restrict allowed origins,
and define retention/consent rules before recording or saving interview audio.
