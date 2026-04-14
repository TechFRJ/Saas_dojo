from sqlalchemy import Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AvatarConfig(Base):
    __tablename__ = "avatar_configs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    student_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id"), unique=True, nullable=False
    )
    belt_color: Mapped[str] = mapped_column(String, default="branca", nullable=False)
    outfit: Mapped[str] = mapped_column(
        Enum("default", "fighter", "champion", "legend", name="outfit_type"),
        default="default",
        nullable=False,
    )
    level: Mapped[int] = mapped_column(Integer, default=1)

    student: Mapped["StudentProfile"] = relationship(  # noqa: F821
        "StudentProfile", back_populates="avatar"
    )
