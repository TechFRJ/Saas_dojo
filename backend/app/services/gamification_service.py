from datetime import date
from typing import Optional


def calculate_points(current_points: int) -> int:
    """Retorna +10 por treino."""
    return current_points + 10


def calculate_streak(last_training: Optional[date], current_streak: int) -> int:
    """
    - Se last_training foi ontem: streak + 1
    - Se last_training foi hoje: streak (sem alteração)
    - Caso contrário: reset para 1
    """
    today = date.today()

    if last_training is None:
        return 1

    delta = (today - last_training).days

    if delta == 1:
        return current_streak + 1
    elif delta == 0:
        return current_streak
    else:
        return 1


def check_streak_bonus(new_streak: int) -> int:
    """Retorna +20 se streak for múltiplo de 5, senão 0."""
    if new_streak > 0 and new_streak % 5 == 0:
        return 20
    return 0


def calculate_level(points: int) -> int:
    """int(points / 100) + 1"""
    return int(points / 100) + 1


def calculate_outfit(points: int) -> str:
    """default < 100 | fighter < 300 | champion < 700 | legend >= 700"""
    if points >= 700:
        return "legend"
    elif points >= 300:
        return "champion"
    elif points >= 100:
        return "fighter"
    return "default"


BELT_COLOR_MAP = {
    "white": "branca",
    "blue": "azul",
    "purple": "roxa",
    "brown": "marrom",
    "black": "preta",
}


def belt_to_color(belt: str) -> str:
    return BELT_COLOR_MAP.get(belt, "branca")
