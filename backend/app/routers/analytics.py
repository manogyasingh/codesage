from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.deps.auth import get_current_user
from app.models import Problem, InterviewSession, Candidate


router = APIRouter()


@router.get("/dashboard", response_model=dict)
def dashboard(db: Session = Depends(get_db), user=Depends(get_current_user)):
    problems = db.query(Problem).count()
    interviews = db.query(InterviewSession).count()
    candidates = db.query(Candidate).count()
    return {"problems": problems, "interviews": interviews, "candidates": candidates}


@router.get("/problems", response_model=dict)
def problems_analytics(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"by_difficulty": {}, "by_category": {}}


@router.get("/interviews", response_model=dict)
def interviews_analytics(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"status_counts": {}}


@router.get("/candidates", response_model=dict)
def candidates_analytics(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"experience_distribution": {}}


@router.post("/export", response_model=dict)
def export(db: Session = Depends(get_db), user=Depends(get_current_user)):
    return {"status": "queued"}


