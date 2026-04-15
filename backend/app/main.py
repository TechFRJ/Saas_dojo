from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import Base, engine
from app.models import (  # noqa: F401 — ensure all models are registered before create_all
    Academy,
    Achievement,
    AvatarConfig,
    Attendance,
    BeltHistory,
    Goal,
    Payment,
    StudentAchievement,
    StudentProfile,
    User,
)
from app.routes import auth, student, teacher
from app.routes import reports

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FightClub SaaS",
    description="Sistema SaaS para academias de luta",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    code = "INTERNAL_ERROR"
    if exc.headers and "code" in exc.headers:
        code = exc.headers["code"]
    elif exc.status_code == 401:
        code = "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 409:
        code = "CONFLICT"
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": code},
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor.", "code": "INTERNAL_ERROR"},
    )


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok", "version": "1.0.0"}


app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(reports.router)
