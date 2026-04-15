from datetime import datetime

from pydantic import BaseModel


class GoalCreate(BaseModel):
    student_id: int
    type: str
    target: int
    period: str


class GoalOut(BaseModel):
    id: int
    student_id: int
    type: str
    target: int
    current: int
    period: str
    completed: bool
    created_at: datetime

    model_config = {"from_attributes": True}
