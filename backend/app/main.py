from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.error_handlers import register_error_handlers
from app.core.rate_limit import limiter
from app.routers import applications, auth, candidates, health, hr, jobs, messages

app = FastAPI(title="Job Portal API")

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(jobs.router, prefix="/api/v1")
app.include_router(applications.router, prefix="/api/v1")
app.include_router(candidates.router, prefix="/api/v1")
app.include_router(hr.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")
