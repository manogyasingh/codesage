from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

from app.deps.auth import get_current_user


router = APIRouter()


class ExecuteIn(BaseModel):
    code: str
    language: str


@router.post("/", response_model=dict)
def execute(payload: ExecuteIn, user=Depends(get_current_user)):
    return {"success": True, "output": "", "error": None}


@router.post("/test", response_model=dict)
def execute_test(payload: ExecuteIn, user=Depends(get_current_user)):
    return {"test_cases_passed": 0, "test_cases_total": 0}


@router.get("/languages", response_model=List[str])
def languages():
    return ["python", "javascript", "typescript", "go", "java"]


