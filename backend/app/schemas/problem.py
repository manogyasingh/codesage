from typing import Optional, List, Any, Union
from uuid import UUID
from pydantic import BaseModel, field_validator, model_serializer
from .common import Timestamped, IDModel


class StarterCode(BaseModel):
    language: str
    code: str


class TestCase(BaseModel):
    id: str
    input: Any
    expected_output: Any
    is_hidden: bool
    explanation: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_id_to_string(cls, value: Union[str, int, UUID]) -> str:
        """Convert ID to string"""
        return str(value)


class Solution(BaseModel):
    language: str
    code: str
    explanation: Optional[str] = None
    time_complexity: Optional[str] = None
    space_complexity: Optional[str] = None


class ProblemBase(BaseModel):
    company_id: str
    created_by: str
    title: str
    description: str
    difficulty: str
    category: str
    tags: List[str] = []
    programming_languages: List[str] = []
    time_limit_minutes: int = 60
    memory_limit_mb: Optional[int] = None
    starter_code: List[StarterCode] = []
    test_cases: Optional[str] = None
    solution: Optional[Solution] = None
    hints: Optional[List[str]] = None
    is_active: bool = True

    @field_validator('company_id', 'created_by', mode='before')
    @classmethod
    def convert_uuid_to_string(cls, value: Union[str, UUID]) -> str:
        """Convert UUID objects to strings"""
        return str(value) if value else ""


class ProblemCreate(ProblemBase):
    id: str


class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    programming_languages: Optional[List[str]] = None
    time_limit_minutes: Optional[int] = None
    memory_limit_mb: Optional[int] = None
    starter_code: Optional[List[StarterCode]] = None
    test_cases: Optional[str] = None
    solution: Optional[Solution] = None
    hints: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProblemOut(BaseModel):
    id: str
    company_id: str
    created_by: str
    title: str
    description: str
    difficulty: str
    category: str
    tags: List[str] = []
    programming_languages: List[str] = []
    time_limit_minutes: int = 60
    memory_limit_mb: Optional[int] = None
    starter_code: List[StarterCode] = []
    test_cases: Optional[str] = None
    solution: Optional[Solution] = None
    hints: Optional[List[str]] = None
    is_active: bool = True
    usage_count: int
    average_completion_time: Optional[int] = None
    success_rate: Optional[int] = None
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, problem_orm):
        """Convert ORM model to Pydantic model with proper string conversion"""
        return cls(
            id=str(problem_orm.id),
            company_id=str(problem_orm.company_id),
            created_by=str(problem_orm.created_by),
            title=problem_orm.title,
            description=problem_orm.description,
            difficulty=problem_orm.difficulty,
            category=problem_orm.category,
            tags=problem_orm.tags or [],
            programming_languages=problem_orm.programming_languages or [],
            time_limit_minutes=problem_orm.time_limit_minutes,
            memory_limit_mb=problem_orm.memory_limit_mb,
            starter_code=[
                StarterCode(language=sc.get('language', ''), code=sc.get('code', ''))
                for sc in (problem_orm.starter_code or [])
            ],
            test_cases=problem_orm.test_cases,  # Now a string field
            solution=Solution(**problem_orm.solution) if problem_orm.solution else None,
            hints=problem_orm.hints,
            is_active=problem_orm.is_active,
            usage_count=problem_orm.usage_count or 0,
            average_completion_time=problem_orm.average_completion_time,
            success_rate=problem_orm.success_rate,
            created_at=problem_orm.created_at.isoformat() if problem_orm.created_at else "",
            updated_at=problem_orm.updated_at.isoformat() if problem_orm.updated_at else ""
        )
