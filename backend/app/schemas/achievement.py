from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AchievementOut(BaseModel):
    id: int
    code: str
    title: str
    description: str
    icon: str
    category: str
    points_reward: int
    unlocked_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StudentAchievementsOut(BaseModel):
    unlocked: list[AchievementOut]
    locked: list[AchievementOut]
    total_unlocked: int
    total: int
