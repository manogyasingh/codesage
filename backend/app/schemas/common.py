from datetime import datetime
from typing import Optional, Union, Any
from uuid import UUID
from pydantic import BaseModel, Field, field_validator, model_serializer
from pydantic import ConfigDict


class Timestamped(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    created_at: datetime
    updated_at: datetime


class IDModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str = Field(..., description="UUID string")
    
    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value: Union[str, UUID]) -> str:
        """Convert UUID objects to strings"""
        return str(value) if value else ""


