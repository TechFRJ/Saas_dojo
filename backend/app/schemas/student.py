from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class AvatarOut(BaseModel):
    belt_color: str
    outfit: str
    level: int

    model_config = {"from_attributes": True}


class StudentCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    belt: Optional[str] = None
    points: Optional[int] = None


class StudentProfileOut(BaseModel):
    id: int
    user_id: int
    name: str
    belt: str
    points: int
    streak: int
    last_training: Optional[datetime]
    created_at: datetime
    avatar: Optional[AvatarOut] = None

    model_config = {"from_attributes": True}


class StudentDetailOut(StudentProfileOut):
    belt_history: list["BeltHistoryOut"] = []
    attendances: list["AttendanceOut"] = []
    payments: list["PaymentOut"] = []


class AttendanceOut(BaseModel):
    id: int
    student_id: int
    date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceCreate(BaseModel):
    student_id: int


class PaymentOut(BaseModel):
    id: int
    student_id: int
    amount: float
    status: str
    due_date: date
    created_at: datetime

    model_config = {"from_attributes": True}


class PaymentCreate(BaseModel):
    student_id: int
    amount: float
    due_date: date


class PaymentUpdate(BaseModel):
    status: str


class BeltHistoryOut(BaseModel):
    id: int
    student_id: int
    belt: str
    promoted_at: date

    model_config = {"from_attributes": True}


class BeltUpdate(BaseModel):
    student_id: int
    belt: str


class DashboardOut(BaseModel):
    total_students: int
    students_today: int
    monthly_revenue: float
    active_students: int


StudentDetailOut.model_rebuild()
