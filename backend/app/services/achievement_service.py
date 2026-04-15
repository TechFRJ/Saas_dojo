from sqlalchemy.orm import Session

from app.models.achievement import Achievement, StudentAchievement
from app.models.attendance import Attendance
from app.models.student import StudentProfile

ACHIEVEMENTS_DATA = [
    {
        "code": "FIRST_TRAINING",
        "title": "Primeiro Treino",
        "description": "Completou seu primeiro treino",
        "icon": "trophy",
        "category": "presença",
        "points_reward": 0,
    },
    {
        "code": "STREAK_3",
        "title": "Trilogia",
        "description": "3 dias de treino consecutivos",
        "icon": "flame",
        "category": "streak",
        "points_reward": 0,
    },
    {
        "code": "STREAK_5",
        "title": "Semana de Fogo",
        "description": "5 dias de treino consecutivos",
        "icon": "fire",
        "category": "streak",
        "points_reward": 0,
    },
    {
        "code": "STREAK_10",
        "title": "Imparável",
        "description": "10 dias de treino consecutivos",
        "icon": "bolt",
        "category": "streak",
        "points_reward": 0,
    },
    {
        "code": "STREAK_30",
        "title": "Mestre da Consistência",
        "description": "30 dias de treino consecutivos",
        "icon": "crown",
        "category": "streak",
        "points_reward": 0,
    },
    {
        "code": "POINTS_100",
        "title": "Centurião",
        "description": "Acumulou 100 pontos",
        "icon": "star",
        "category": "pontos",
        "points_reward": 0,
    },
    {
        "code": "POINTS_500",
        "title": "Elite",
        "description": "Acumulou 500 pontos",
        "icon": "medal",
        "category": "pontos",
        "points_reward": 0,
    },
    {
        "code": "POINTS_1000",
        "title": "Lendário",
        "description": "Acumulou 1000 pontos",
        "icon": "diamond",
        "category": "pontos",
        "points_reward": 0,
    },
    {
        "code": "BELT_BLUE",
        "title": "Faixa Azul",
        "description": "Graduado para faixa azul",
        "icon": "belt",
        "category": "faixa",
        "points_reward": 0,
    },
    {
        "code": "BELT_PURPLE",
        "title": "Faixa Roxa",
        "description": "Graduado para faixa roxa",
        "icon": "belt",
        "category": "faixa",
        "points_reward": 0,
    },
    {
        "code": "BELT_BROWN",
        "title": "Faixa Marrom",
        "description": "Graduado para faixa marrom",
        "icon": "belt",
        "category": "faixa",
        "points_reward": 0,
    },
    {
        "code": "BELT_BLACK",
        "title": "Faixa Preta",
        "description": "Graduado para faixa preta",
        "icon": "belt",
        "category": "faixa",
        "points_reward": 0,
    },
    {
        "code": "TRAINING_10",
        "title": "10 Treinos",
        "description": "10 presenças acumuladas",
        "icon": "dumbbell",
        "category": "presença",
        "points_reward": 0,
    },
    {
        "code": "TRAINING_50",
        "title": "50 Treinos",
        "description": "50 presenças acumuladas",
        "icon": "dumbbell",
        "category": "presença",
        "points_reward": 0,
    },
    {
        "code": "TRAINING_100",
        "title": "Centenário",
        "description": "100 presenças acumuladas",
        "icon": "dumbbell",
        "category": "presença",
        "points_reward": 0,
    },
]


def seed_achievements(db: Session) -> None:
    """Insere conquistas padrão se não existirem (idempotente)."""
    for data in ACHIEVEMENTS_DATA:
        existing = db.query(Achievement).filter(Achievement.code == data["code"]).first()
        if not existing:
            achievement = Achievement(**data)
            db.add(achievement)
    db.commit()


def check_and_unlock(student_id: int, db: Session) -> list[Achievement]:
    """
    Verifica quais conquistas o aluno agora satisfaz e desbloqueia.
    Retorna apenas as recém-desbloqueadas nesta chamada.
    """
    student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
    if not student:
        return []

    total_trainings = (
        db.query(Attendance).filter(Attendance.student_id == student_id).count()
    )

    already_unlocked_ids = {
        sa.achievement_id
        for sa in db.query(StudentAchievement)
        .filter(StudentAchievement.student_id == student_id)
        .all()
    }

    all_achievements = db.query(Achievement).all()
    newly_unlocked: list[Achievement] = []

    belt_map = {
        "blue": "BELT_BLUE",
        "purple": "BELT_PURPLE",
        "brown": "BELT_BROWN",
        "black": "BELT_BLACK",
    }

    for ach in all_achievements:
        if ach.id in already_unlocked_ids:
            continue

        unlocked = False
        code = ach.code

        if code == "FIRST_TRAINING":
            unlocked = total_trainings >= 1
        elif code == "STREAK_3":
            unlocked = student.streak >= 3
        elif code == "STREAK_5":
            unlocked = student.streak >= 5
        elif code == "STREAK_10":
            unlocked = student.streak >= 10
        elif code == "STREAK_30":
            unlocked = student.streak >= 30
        elif code == "POINTS_100":
            unlocked = student.points >= 100
        elif code == "POINTS_500":
            unlocked = student.points >= 500
        elif code == "POINTS_1000":
            unlocked = student.points >= 1000
        elif code in ("BELT_BLUE", "BELT_PURPLE", "BELT_BROWN", "BELT_BLACK"):
            required_belt = next(k for k, v in belt_map.items() if v == code)
            belts_order = ["white", "blue", "purple", "brown", "black"]
            student_belt_index = belts_order.index(student.belt)
            required_index = belts_order.index(required_belt)
            unlocked = student_belt_index >= required_index
        elif code == "TRAINING_10":
            unlocked = total_trainings >= 10
        elif code == "TRAINING_50":
            unlocked = total_trainings >= 50
        elif code == "TRAINING_100":
            unlocked = total_trainings >= 100

        if unlocked:
            sa = StudentAchievement(student_id=student_id, achievement_id=ach.id)
            db.add(sa)
            newly_unlocked.append(ach)

    if newly_unlocked:
        db.commit()

    return newly_unlocked
