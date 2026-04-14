from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.attendance import Attendance
    from app.models.avatar import AvatarConfig
    from app.models.belt import BeltHistory
    from app.models.payment import Payment
    from app.models.user import User


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    belt: Mapped[str] = mapped_column(
        Enum("white", "blue", "purple", "brown", "black", name="belt_type"),
        default="white",
        nullable=False,
    )
    points: Mapped[int] = mapped_column(Integer, default=0)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    last_training: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="student_profile")
    avatar: Mapped[Optional["AvatarConfig"]] = relationship(
        "AvatarConfig", back_populates="student", uselist=False
    )
    attendances: Mapped[List["Attendance"]] = relationship(
        "Attendance", back_populates="student", order_by="Attendance.date.desc()"
    )
    payments: Mapped[List["Payment"]] = relationship(
        "Payment", back_populates="student", order_by="Payment.due_date.desc()"
    )
    belt_history: Mapped[List["BeltHistory"]] = relationship(
        "BeltHistory", back_populates="student", order_by="BeltHistory.promoted_at.desc()"
    )
