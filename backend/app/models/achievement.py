from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.student import StudentProfile


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    icon: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(
        Enum("presença", "faixa", "pontos", "streak", name="achievement_category"),
        nullable=False,
    )
    points_reward: Mapped[int] = mapped_column(Integer, default=0)

    student_achievements: Mapped[List["StudentAchievement"]] = relationship(
        "StudentAchievement", back_populates="achievement"
    )


class StudentAchievement(Base):
    __tablename__ = "student_achievements"
    __table_args__ = (
        UniqueConstraint("student_id", "achievement_id", name="uq_student_achievement"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id"), nullable=False
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id"), nullable=False
    )
    unlocked_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    student: Mapped["StudentProfile"] = relationship(
        "StudentProfile", back_populates="achievements"
    )
    achievement: Mapped["Achievement"] = relationship(
        "Achievement", back_populates="student_achievements"
    )
