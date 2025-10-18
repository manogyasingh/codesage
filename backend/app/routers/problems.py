from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models import Problem
from app.schemas.problem import ProblemOut, ProblemCreate, ProblemUpdate
from app.deps.auth import get_current_user


router = APIRouter()


@router.get("/")
def list_problems(db: Session = Depends(get_db), user=Depends(get_current_user)):
    try:
        # Use raw SQL to avoid UUID casting issues
        company_id_str = str(user.company_id)
        query = text("""
            SELECT id, company_id, created_by, title, description, difficulty, 
                   category, tags, programming_languages, time_limit_minutes,
                   memory_limit_mb, starter_code, test_cases, solution, hints,
                   is_active, usage_count, success_rate, created_at, updated_at
            FROM problems 
            WHERE company_id = :company_id
        """)
        
        result = db.execute(query, {"company_id": company_id_str})
        problems = []
        
        for row in result:
            problems.append({
                "id": row.id,
                "company_id": row.company_id,
                "created_by": row.created_by,
                "title": row.title,
                "description": row.description,
                "difficulty": row.difficulty,
                "category": row.category,
                "tags": row.tags,
                "programming_languages": row.programming_languages,
                "time_limit_minutes": row.time_limit_minutes,
                "memory_limit_mb": row.memory_limit_mb,
                "starter_code": row.starter_code,
                "test_cases": row.test_cases,
                "solution": row.solution,
                "hints": row.hints,
                "is_active": row.is_active,
                "usage_count": row.usage_count,
                "success_rate": row.success_rate,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            })
        
        return problems
        
    except Exception as e:
        print(f"Error in list_problems: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load problems: {str(e)}")


@router.post("/", response_model=ProblemOut)
def create_problem(payload: ProblemCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    payload_company_id_str = str(payload.company_id)
    
    if payload_company_id_str != user_company_id_str:
        raise HTTPException(status_code=403, detail="Cross-company creation forbidden")
    model = Problem(**payload.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return ProblemOut.from_orm(model)


@router.get("/{id}", response_model=ProblemOut)
def get_problem(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(Problem, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Problem not found")
    return ProblemOut.from_orm(model)


@router.put("/{id}", response_model=ProblemOut)
def update_problem(id: str, payload: ProblemUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(Problem, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Problem not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(model, k, v)
    db.add(model)
    db.commit()
    db.refresh(model)
    return ProblemOut.from_orm(model)


@router.delete("/{id}")
def delete_problem(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(Problem, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Problem not found")
    db.delete(model)
    db.commit()
    return {"status": "deleted"}


@router.post("/{id}/test", response_model=dict)
def test_problem_solution(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    model = db.get(Problem, id)
    if not model or model.company_id != user.company_id:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"status": "ok", "message": "Tested successfully (stub)"}


@router.get("/{id}/analytics", response_model=dict)
def problem_analytics(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    model = db.get(Problem, id)
    if not model or model.company_id != user.company_id:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"usage_count": model.usage_count, "success_rate": model.success_rate}


@router.post("/{id}/duplicate", response_model=ProblemOut)
def duplicate_problem(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    model = db.get(Problem, id)
    if not model or model.company_id != user.company_id:
        raise HTTPException(status_code=404, detail="Problem not found")
    dup = Problem(
        id=f"{model.id}-copy",
        company_id=model.company_id,
        created_by=model.created_by,
        title=model.title + " (Copy)",
        description=model.description,
        difficulty=model.difficulty,
        category=model.category,
        tags=model.tags,
        programming_languages=model.programming_languages,
        time_limit_minutes=model.time_limit_minutes,
        memory_limit_mb=model.memory_limit_mb,
        starter_code=model.starter_code,
        test_cases=model.test_cases,
        solution=model.solution,
        hints=model.hints,
        is_active=model.is_active,
    )
    db.add(dup)
    db.commit()
    db.refresh(dup)
    return ProblemOut.from_orm(dup)


