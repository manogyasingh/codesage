from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr
from .common import Timestamped, IDModel


class CompanySettings(BaseModel):
    max_concurrent_interviews: int = 1
    max_problems: int = 50
    max_candidates_per_month: int = 50
    allowed_programming_languages: List[str] = ["python", "javascript", "typescript", "go", "java"]
    custom_branding: bool = False
    api_access: bool = False


class CompanyBase(BaseModel):
    name: str
    email: EmailStr
    industry: Optional[str] = None
    size: Optional[str] = "startup"
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    subscription_plan: str = "free"
    is_active: bool = True
    settings: CompanySettings = CompanySettings()


class CompanyCreate(CompanyBase):
    id: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    logo: Optional[str] = None
    website: Optional[str] = None
    description: Optional[str] = None
    subscription_plan: Optional[str] = None
    is_active: Optional[bool] = None
    settings: Optional[CompanySettings] = None


class CompanyOut(CompanyBase, IDModel, Timestamped):
    pass


