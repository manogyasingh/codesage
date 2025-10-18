from typing import Optional, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, EmailStr, field_validator
from .common import Timestamped, IDModel
from .company import CompanyOut


class UserPermissions(BaseModel):
    can_create_problems: bool = True
    can_edit_problems: bool = True
    can_delete_problems: bool = False
    can_manage_users: bool = False
    can_view_analytics: bool = True
    can_conduct_interviews: bool = True
    can_export_data: bool = False


class CompanyUserBase(BaseModel):
    company_id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str = "interviewer"
    permissions: UserPermissions = UserPermissions()
    avatar: Optional[str] = None
    is_active: bool = True
    
    @field_validator('company_id', mode='before')
    @classmethod
    def convert_company_id_to_string(cls, value: Union[str, UUID]) -> str:
        """Convert UUID objects to strings"""
        return str(value) if value else ""


class CompanyUserCreate(CompanyUserBase):
    id: str
    password: str


class CompanyUserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    permissions: Optional[UserPermissions] = None
    avatar: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyUserOut(CompanyUserBase, IDModel, Timestamped):
    company: Optional[CompanyOut] = None
    
    class Config:
        from_attributes = True


