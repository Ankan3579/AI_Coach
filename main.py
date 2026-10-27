import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Request
from fastapi.responses import JSONResponse

from api.interview_routes import router as interview_router
from api.vapi_routes import router as vapi_router
from tools.guardrails import (
    SafetyServiceUnavailable,
    UnsafeInputError,
    UnsafeModelOutputError,
)

# agent.py
import logging
import traceback

from livekit import agents
# ... your other imports ...

class Trace(logging.Filter):
    def filter(self, record):
        if "Invalid type" in record.getMessage():
            traceback.print_stack(limit=12)
        return True

logging.getLogger("opentelemetry.attributes").addFilter(Trace())

# ... rest of your code (Agent class, entrypoint, cli.run_app) ...


app = FastAPI(
    title="AI Coach Backend",
    version="1.0.0",
)

default_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:5173",
]
env_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]
frontend_origins = list(dict.fromkeys(default_origins + env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)
app.include_router(vapi_router)


@app.exception_handler(UnsafeInputError)
async def unsafe_input_handler(
    request: Request,
    exc: UnsafeInputError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc)},
    )


@app.exception_handler(UnsafeModelOutputError)
async def unsafe_output_handler(
    request: Request,
    exc: UnsafeModelOutputError,
) -> JSONResponse:
    return JSONResponse(
        status_code=502,
        content={"detail": str(exc)},
    )


@app.exception_handler(SafetyServiceUnavailable)
async def safety_service_unavailable_handler(
    request: Request,
    exc: SafetyServiceUnavailable,
) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={"detail": str(exc)},
    )


@app.get("/")
async def root():

    return {
        "message": "AI Coach Backend is running"
    }


@app.get("/health")
async def health():

    return {
        "status": "healthy"
    }