from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    role: str
    academy_id: int


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}
