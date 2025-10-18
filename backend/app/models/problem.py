from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, Boolean, Integer, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[str] = mapped_column(ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    created_by: Mapped[str] = mapped_column(ForeignKey("company_users.id"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(4000))
    difficulty: Mapped[str] = mapped_column(String(16))
    category: Mapped[str] = mapped_column(String(100))
    tags: Mapped[list] = mapped_column(JSON, default=list)
    programming_languages: Mapped[list] = mapped_column(JSON, default=list)
    time_limit_minutes: Mapped[int] = mapped_column(Integer, default=60)
    memory_limit_mb: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    starter_code: Mapped[list] = mapped_column(JSON, default=list)
    test_cases: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    solution: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    hints: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    average_completion_time: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    success_rate: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    company = relationship("Company", back_populates="problems")
    creator = relationship("CompanyUser", back_populates="created_problems")
    interviews = relationship("InterviewSession", back_populates="problem")
