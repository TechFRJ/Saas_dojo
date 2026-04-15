"""
Seed script — populates the database with initial data for development.
Run with: python seed.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app.models import (
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
from app.core.security import hash_password
from app.services.achievement_service import check_and_unlock, seed_achievements
from app.services.gamification_service import belt_to_color, calculate_level, calculate_outfit


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clean existing data
        db.query(StudentAchievement).delete()
        db.query(Goal).delete()
        db.query(Attendance).delete()
        db.query(BeltHistory).delete()
        db.query(Payment).delete()
        db.query(AvatarConfig).delete()
        db.query(StudentProfile).delete()
        db.query(User).delete()
        db.query(Academy).delete()
        db.query(Achievement).delete()
        db.commit()

        # 1. Seed achievements (15 default ones)
        seed_achievements(db)

        # 2. Create academy
        academy = Academy(name="Academia Dragão")
        db.add(academy)
        db.flush()

        # 2. Create teacher
        teacher = User(
            email="professor@teste.com",
            password=hash_password("123456"),
            role="teacher",
            academy_id=academy.id,
        )
        db.add(teacher)
        db.flush()

        # 3. Create students
        students_data = [
            {
                "email": "aluno1@teste.com",
                "name": "Carlos Alves",
                "belt": "blue",
                "points": 340,
                "streak": 3,
            },
            {
                "email": "aluno2@teste.com",
                "name": "Mariana Costa",
                "belt": "white",
                "points": 80,
                "streak": 1,
            },
            {
                "email": "aluno3@teste.com",
                "name": "Rafael Souza",
                "belt": "purple",
                "points": 750,
                "streak": 7,
            },
        ]

        today = date.today()
        profile_ids_for_goals = []

        for idx, sdata in enumerate(students_data):
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

            # Attendance history — last 10 days (with a gap to simulate real usage)
            for day_offset in range(10, 0, -1):
                if day_offset % 3 == 0:
                    continue  # skip some days to be realistic
                training_date = today - timedelta(days=day_offset)
                attendance = Attendance(student_id=profile.id, date=training_date)
                db.add(attendance)

            # Belt history
            if sdata["belt"] == "blue":
                db.add(BeltHistory(student_id=profile.id, belt="white", promoted_at=date(2024, 1, 10)))
                db.add(BeltHistory(student_id=profile.id, belt="blue", promoted_at=date(2025, 3, 15)))
            elif sdata["belt"] == "purple":
                db.add(BeltHistory(student_id=profile.id, belt="white", promoted_at=date(2023, 1, 10)))
                db.add(BeltHistory(student_id=profile.id, belt="blue", promoted_at=date(2023, 8, 20)))
                db.add(BeltHistory(student_id=profile.id, belt="purple", promoted_at=date(2025, 1, 5)))
            else:
                db.add(BeltHistory(student_id=profile.id, belt="white", promoted_at=date(2025, 6, 1)))

            # Payments
            for month_offset in range(3):
                due = today.replace(day=10) - timedelta(days=30 * month_offset)
                pay_status = "paid" if month_offset > 0 else "pending"
                db.add(Payment(student_id=profile.id, amount=150.0, status=pay_status, due_date=due))

            db.flush()
            profile_ids_for_goals.append((profile.id, today))

        db.commit()

        # Auto-unlock achievements based on seeded data
        for profile_id, _ in profile_ids_for_goals:
            check_and_unlock(profile_id, db)

        # Add sample goals for each student
        iso_year, iso_week, _ = today.isocalendar()
        week_period = f"{iso_year}-W{iso_week:02d}"
        month_period = today.strftime("%Y-%m")

        for profile_id, _ in profile_ids_for_goals:
            db.add(Goal(
                student_id=profile_id,
                type="weekly_trainings",
                target=4,
                current=2,
                period=week_period,
                completed=False,
            ))
            db.add(Goal(
                student_id=profile_id,
                type="monthly_trainings",
                target=16,
                current=7,
                period=month_period,
                completed=False,
            ))

        db.commit()
        print("Seed executado com sucesso!")
        print("  Academia:   Academia Dragão")
        print("  Professor:  professor@teste.com / 123456")
        print("  Aluno 1:    aluno1@teste.com / 123456  (Carlos Alves — faixa azul)")
        print("  Aluno 2:    aluno2@teste.com / 123456  (Mariana Costa — faixa branca)")
        print("  Aluno 3:    aluno3@teste.com / 123456  (Rafael Souza — faixa roxa)")

    except Exception as exc:
        db.rollback()
        print(f"Erro ao executar seed: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
