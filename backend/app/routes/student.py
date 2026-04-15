import calendar
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.dependencies import require_student
from app.database import get_db
from app.models.achievement import Achievement, StudentAchievement
from app.models.attendance import Attendance
from app.models.belt import BeltHistory
from app.models.goal import Goal
from app.models.payment import Payment
from app.models.student import StudentProfile
from app.models.user import User
from app.schemas.achievement import AchievementOut, StudentAchievementsOut
from app.schemas.goal import GoalOut
from app.schemas.student import AttendanceOut, AvatarOut, BeltHistoryOut, PaymentOut

router = APIRouter(prefix="/api/student", tags=["student"])


class StudentMeResponse:
    pass


@router.get("/me")
def get_me(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = (
        db.query(StudentProfile)
        .filter(StudentProfile.user_id == current_user.id)
        .first()
    )

    avatar_data = None
    if profile and profile.avatar:
        avatar_data = {
            "belt_color": profile.avatar.belt_color,
            "outfit": profile.avatar.outfit,
            "level": profile.avatar.level,
        }

    return {
        "name": profile.name if profile else "",
        "email": current_user.email,
        "belt": profile.belt if profile else "white",
        "points": profile.points if profile else 0,
        "streak": profile.streak if profile else 0,
        "avatar": avatar_data,
    }


@router.get("/attendance", response_model=list[str])
def get_attendance(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)
    attendances = (
        db.query(Attendance)
        .filter(Attendance.student_id == profile.id)
        .order_by(Attendance.date.desc())
        .all()
    )
    return [str(a.date) for a in attendances]


@router.get("/attendance/calendar")
def get_attendance_calendar(
    year: int = Query(...),
    month: int = Query(...),
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)

    last_day = calendar.monthrange(year, month)[1]
    start = date(year, month, 1)
    end = date(year, month, last_day)

    attendances = (
        db.query(Attendance)
        .filter(
            Attendance.student_id == profile.id,
            Attendance.date >= start,
            Attendance.date <= end,
        )
        .all()
    )
    present_dates = {str(a.date) for a in attendances}

    result = []
    for day in range(1, last_day + 1):
        d = date(year, month, day)
        result.append({"date": str(d), "present": str(d) in present_dates})

    return result


@router.get("/belt-history", response_model=list[BeltHistoryOut])
def get_belt_history(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)
    return (
        db.query(BeltHistory)
        .filter(BeltHistory.student_id == profile.id)
        .order_by(BeltHistory.promoted_at.desc())
        .all()
    )


@router.get("/payments", response_model=list[PaymentOut])
def get_payments(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)
    return (
        db.query(Payment)
        .filter(Payment.student_id == profile.id)
        .order_by(Payment.due_date.desc())
        .all()
    )


@router.get("/achievements", response_model=StudentAchievementsOut)
def get_achievements(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)

    all_achievements = db.query(Achievement).all()
    unlocked_map = {
        sa.achievement_id: sa.unlocked_at
        for sa in db.query(StudentAchievement)
        .filter(StudentAchievement.student_id == profile.id)
        .all()
    }

    unlocked = []
    locked = []
    for ach in all_achievements:
        out = AchievementOut(
            id=ach.id,
            code=ach.code,
            title=ach.title,
            description=ach.description,
            icon=ach.icon,
            category=ach.category,
            points_reward=ach.points_reward,
            unlocked_at=unlocked_map.get(ach.id),
        )
        if ach.id in unlocked_map:
            unlocked.append(out)
        else:
            locked.append(out)

    return StudentAchievementsOut(
        unlocked=unlocked,
        locked=locked,
        total_unlocked=len(unlocked),
        total=len(all_achievements),
    )


@router.get("/goals", response_model=list[GoalOut])
def get_goals(
    current_user: User = Depends(require_student),
    db: Session = Depends(get_db),
):
    profile = _get_my_profile(current_user.id, db)
    return (
        db.query(Goal)
        .filter(Goal.student_id == profile.id)
        .order_by(Goal.created_at.desc())
        .all()
    )


def _get_my_profile(user_id: int, db: Session) -> StudentProfile:
    from fastapi import HTTPException, status

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Perfil de aluno não encontrado.",
            headers={"code": "STUDENT_NOT_FOUND"},
        )
    return profile
