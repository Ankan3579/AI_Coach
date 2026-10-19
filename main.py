from fastapi import FastAPI

from api.interview_routes import router as interview_router
from api.vapi_routes import router as vapi_router



app = FastAPI(
    title="AI Coach Backend",
    version="1.0.0",
)


app.include_router(interview_router)
app.include_router(vapi_router)

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