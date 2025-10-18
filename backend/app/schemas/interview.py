from typing import Optional, List, Any, Union
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, field_validator
from .common import Timestamped, IDModel


class ExecutionResult(BaseModel):
    success: bool
    output: Optional[str] = None
    error: Optional[str] = None
    execution_time_ms: int
    memory_used_mb: int
    test_cases_passed: int
    test_cases_total: int


class CandidateCode(BaseModel):
    language: str
    code: str
    timestamp: datetime
    execution_result: Optional[ExecutionResult] = None


class ChatMessage(BaseModel):
    id: str
    sender_type: str
    sender_id: str
    message: str
    timestamp: datetime


class TestResult(BaseModel):
    test_case_id: str
    passed: bool
    actual_output: Optional[Any] = None
    execution_time_ms: int
    error_message: Optional[str] = None


class InterviewSessionBase(BaseModel):
    company_id: str
    candidate_id: str
    interviewer_id: str
    problem_id: str
    status: str = "scheduled"
    scheduled_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    candidate_code: List[CandidateCode] = []
    
    @field_validator('company_id', 'candidate_id', 'interviewer_id', 'problem_id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value: Union[str, UUID]) -> str:
        """Convert UUID objects to strings"""
        return str(value) if value else ""
    interviewer_notes: Optional[str] = None
    candidate_feedback: Optional[str] = None
    interviewer_rating: Optional[int] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    overall_recommendation: Optional[str] = None
    recording_url: Optional[str] = None
    chat_transcript: Optional[List[ChatMessage]] = None
    test_results: Optional[List[TestResult]] = None
    
    # AI Analysis Results
    ai_analysis: Optional[str] = None
    ai_metrics: Optional[dict] = None
    ai_transcript_summary: Optional[List[dict]] = None
    ai_journal_notes: Optional[List[str]] = None
    final_code_submitted: Optional[str] = None


class InterviewSessionCreate(InterviewSessionBase):
    id: str


class InterviewSessionUpdate(BaseModel):
    status: Optional[str] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    candidate_code: Optional[List[CandidateCode]] = None
    interviewer_notes: Optional[str] = None
    candidate_feedback: Optional[str] = None
    interviewer_rating: Optional[int] = None
    technical_score: Optional[int] = None
    communication_score: Optional[int] = None
    overall_recommendation: Optional[str] = None
    recording_url: Optional[str] = None
    chat_transcript: Optional[List[ChatMessage]] = None
    test_results: Optional[List[TestResult]] = None
    
    # AI Analysis Results
    ai_analysis: Optional[str] = None
    ai_metrics: Optional[dict] = None
    ai_transcript_summary: Optional[List[dict]] = None
    ai_journal_notes: Optional[List[str]] = None
    final_code_submitted: Optional[str] = None


class InterviewSessionOut(InterviewSessionBase, IDModel, Timestamped):
    @field_validator('id', mode='before')
    @classmethod
    def convert_id_uuid_to_string(cls, value: Union[str, UUID]) -> str:
        """Convert UUID objects to strings for id field"""
        return str(value) if value else ""


