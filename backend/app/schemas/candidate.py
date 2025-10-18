from typing import Optional, List, Union
from pydantic import BaseModel, EmailStr, field_validator
from .common import Timestamped, IDModel


class CandidateSkill(BaseModel):
    skill_name: str
    proficiency: str
    years_of_experience: int


class CandidateBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    github_profile: Optional[str] = None
    linkedin_profile: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_level: str
    preferred_languages: List[str] = []
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    location: str
    availability_status: str = "available"
    skills: List[str] = []


class CandidateCreate(CandidateBase):
    id: str


class CandidateUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    resume_url: Optional[str] = None
    github_profile: Optional[str] = None
    linkedin_profile: Optional[str] = None
    portfolio_url: Optional[str] = None
    experience_level: Optional[str] = None
    preferred_languages: Optional[List[str]] = None
    current_company: Optional[str] = None
    current_position: Optional[str] = None
    location: Optional[str] = None
    availability_status: Optional[str] = None
    skills: Optional[List[str]] = None


class CandidateOut(CandidateBase, IDModel, Timestamped):
    pass


