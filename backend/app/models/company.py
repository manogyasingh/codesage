from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import String, DateTime, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    industry: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    size: Mapped[Optional[str]] = mapped_column(String(20), default="startup")
    logo: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    website: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    subscription_plan: Mapped[str] = mapped_column(String(32), default="free")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    users = relationship("CompanyUser", back_populates="company", cascade="all, delete-orphan")
    problems = relationship("Problem", back_populates="company", cascade="all, delete-orphan")
    interviews = relationship("InterviewSession", back_populates="company", cascade="all, delete-orphan")


