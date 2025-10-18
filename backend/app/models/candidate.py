from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100))
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    resume_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    github_profile: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    linkedin_profile: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    experience_level: Mapped[str] = mapped_column(String(32))
    preferred_languages: Mapped[list] = mapped_column(JSON, default=list)
    current_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_position: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    location: Mapped[str] = mapped_column(String(255))
    availability_status: Mapped[str] = mapped_column(String(32), default="available")

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    skills: Mapped[list] = mapped_column(JSON, default=list)
    interviews = relationship("InterviewSession", back_populates="candidate")


