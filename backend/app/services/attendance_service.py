from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.attendance import Attendance
from app.models.avatar import AvatarConfig
from app.models.student import StudentProfile
from app.services.gamification_service import (
    belt_to_color,
    calculate_level,
    calculate_outfit,
    calculate_points,
    calculate_streak,
    check_streak_bonus,
)


def register(student_id: int, db: Session, training_date: date = None) -> Attendance:
    if training_date is None:
        training_date = date.today()

    existing = (
        db.query(Attendance)
        .filter(Attendance.student_id == student_id, Attendance.date == training_date)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Presença já registrada para este dia.",
            headers={"code": "ATTENDANCE_ALREADY_REGISTERED"},
        )

    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aluno não encontrado.",
            headers={"code": "STUDENT_NOT_FOUND"},
        )

    last_date = student.last_training.date() if student.last_training else None
    new_streak = calculate_streak(last_date, student.streak)
    bonus = check_streak_bonus(new_streak)
    new_points = calculate_points(student.points) + bonus

    student.points = new_points
    student.streak = new_streak
    student.last_training = datetime.combine(training_date, datetime.min.time()).replace(
        tzinfo=timezone.utc
    )

    avatar = db.query(AvatarConfig).filter(AvatarConfig.student_id == student.id).first()
    if avatar:
        avatar.level = calculate_level(new_points)
        avatar.outfit = calculate_outfit(new_points)
        avatar.belt_color = belt_to_color(student.belt)

    attendance = Attendance(student_id=student_id, date=training_date)
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance
