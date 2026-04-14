from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(
        Enum("teacher", "student", name="user_role"), nullable=False
    )
    academy_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("academies.id"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    academy: Mapped["Academy"] = relationship("Academy", back_populates="users")  # noqa: F821
    student_profile: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="user", uselist=False
    )
