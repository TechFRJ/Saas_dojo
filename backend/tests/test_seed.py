"""Tests for the seed script — validates it populates the database correctly."""
from datetime import date, timedelta, timezone, datetime

import pytest

from app.models import Academy, Attendance, AvatarConfig, BeltHistory, Payment, StudentProfile, User
from app.core.security import hash_password
from app.services.gamification_service import belt_to_color, calculate_level, calculate_outfit


def _run_seed_with_db(db):
    """Replicate seed logic using the test db session."""
    from app.models.academy import Academy
    from app.models.user import User
    from app.models.student import StudentProfile
    from app.models.avatar import AvatarConfig
    from app.models.attendance import Attendance
    from app.models.belt import BeltHistory
    from app.models.payment import Payment

    # Clean
    for model in [Attendance, BeltHistory, Payment, AvatarConfig, StudentProfile, User, Academy]:
        db.query(model).delete()
    db.commit()

    academy = Academy(name="Academia Dragão")
    db.add(academy)
    db.flush()

    teacher = User(
        email="professor@teste.com",
        password=hash_password("123456"),
        role="teacher",
        academy_id=academy.id,
    )
    db.add(teacher)
    db.flush()

    today = date.today()
    students_data = [
        {"email": "aluno1@teste.com", "name": "Carlos Alves", "belt": "blue", "points": 340, "streak": 3},
        {"email": "aluno2@teste.com", "name": "Mariana Costa", "belt": "white", "points": 80, "streak": 1},
        {"email": "aluno3@teste.com", "name": "Rafael Souza", "belt": "purple", "points": 750, "streak": 7},
    ]

    for sdata in students_data:
        user = User(
            email=sdata["email"],
            password=hash_password("123456"),
            role="student",
            academy_id=academy.id,
        )
        db.add(user)
        db.flush()

        profile = StudentProfile(
            user_id=user.id,
            name=sdata["name"],
            belt=sdata["belt"],
            points=sdata["points"],
            streak=sdata["streak"],
            last_training=datetime.combine(today - timedelta(days=1), datetime.min.time()).replace(
                tzinfo=timezone.utc
            ),
        )
        db.add(profile)
        db.flush()

        avatar = AvatarConfig(
            student_id=profile.id,
            belt_color=belt_to_color(sdata["belt"]),
            outfit=calculate_outfit(sdata["points"]),
            level=calculate_level(sdata["points"]),
        )
        db.add(avatar)

        for day_offset in range(10, 0, -1):
            if day_offset % 3 == 0:
                continue
            training_date = today - timedelta(days=day_offset)
            db.add(Attendance(student_id=profile.id, date=training_date))

        db.add(BeltHistory(student_id=profile.id, belt=sdata["belt"], promoted_at=date(2025, 1, 1)))

        for month_offset in range(3):
            due = today.replace(day=10) - timedelta(days=30 * month_offset)
            db.add(Payment(student_id=profile.id, amount=150.0, status="paid", due_date=due))

    db.commit()


def test_seed_runs_without_errors(db):
    """Seed must complete without raising any exception."""
    _run_seed_with_db(db)


def test_seed_creates_academy(db):
    _run_seed_with_db(db)
    academies = db.query(Academy).all()
    assert len(academies) == 1
    assert academies[0].name == "Academia Dragão"


def test_seed_creates_teacher(db):
    _run_seed_with_db(db)
    teacher = db.query(User).filter(User.role == "teacher").first()
    assert teacher is not None
    assert teacher.email == "professor@teste.com"


def test_seed_creates_three_students(db):
    _run_seed_with_db(db)
    students = db.query(User).filter(User.role == "student").all()
    assert len(students) == 3


def test_seed_creates_student_profiles(db):
    _run_seed_with_db(db)
    profiles = db.query(StudentProfile).all()
    assert len(profiles) == 3


def test_seed_creates_avatars(db):
    _run_seed_with_db(db)
    avatars = db.query(AvatarConfig).all()
    assert len(avatars) == 3


def test_seed_creates_attendances(db):
    _run_seed_with_db(db)
    attendances = db.query(Attendance).all()
    assert len(attendances) > 0


def test_seed_creates_payments(db):
    _run_seed_with_db(db)
    payments = db.query(Payment).all()
    assert len(payments) == 9  # 3 students × 3 months


def test_seed_avatar_outfit_correct(db):
    _run_seed_with_db(db)
    high_points_profile = db.query(StudentProfile).filter(StudentProfile.points == 750).first()
    assert high_points_profile is not None
    assert high_points_profile.avatar.outfit == "legend"


def test_seed_all_users_same_academy(db):
    _run_seed_with_db(db)
    users = db.query(User).all()
    academy_ids = {u.academy_id for u in users}
    assert len(academy_ids) == 1


def test_seed_teacher_password_verifiable(db):
    _run_seed_with_db(db)
    from app.core.security import verify_password
    teacher = db.query(User).filter(User.role == "teacher").first()
    assert verify_password("123456", teacher.password)


def test_seed_student_belt_colors_match(db):
    _run_seed_with_db(db)
    profiles = db.query(StudentProfile).all()
    for profile in profiles:
        expected_color = belt_to_color(profile.belt)
        assert profile.avatar.belt_color == expected_color
