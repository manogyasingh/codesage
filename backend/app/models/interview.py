from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional
import uuid

from sqlalchemy import String, DateTime, Integer, ForeignKey, Boolean, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), index=True)
    candidate_id: Mapped[str] = mapped_column(ForeignKey("candidates.id", ondelete="CASCADE"), index=True)
    interviewer_id: Mapped[str] = mapped_column(ForeignKey("company_users.id", ondelete="CASCADE"), index=True)
    problem_id: Mapped[str] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"), index=True)
    status: Mapped[str] = mapped_column(String(32), default="scheduled")
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duration_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    candidate_code: Mapped[list] = mapped_column(JSON, default=list)
    interviewer_notes: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)
    candidate_feedback: Mapped[Optional[str]] = mapped_column(String(4000), nullable=True)
    interviewer_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    technical_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    communication_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    overall_recommendation: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    recording_url: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    chat_transcript: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    test_results: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    
    # AI Analysis Results
    ai_analysis: Mapped[Optional[str]] = mapped_column(String(8000), nullable=True)  # Full AI analysis text
    ai_metrics: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Analysis metrics
    ai_transcript_summary: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # Transcript summary
    ai_journal_notes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # AI journal notes
    final_code_submitted: Mapped[Optional[str]] = mapped_column(String(10000), nullable=True)  # Final code submitted

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    company = relationship("Company", back_populates="interviews")
    candidate = relationship("Candidate", back_populates="interviews")
    interviewer = relationship("CompanyUser", back_populates="interviews")
    problem = relationship("Problem", back_populates="interviews")


