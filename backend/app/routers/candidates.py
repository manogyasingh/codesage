from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
import uuid

from app.db.session import get_db
from app.models import Candidate, InterviewSession
from app.schemas.candidate import CandidateOut, CandidateCreate, CandidateUpdate
from app.deps.auth import get_current_user


class VerifyInterviewAccessRequest(BaseModel):
    candidate_id: str
    interview_id: str


router = APIRouter()


@router.get("/test")
def test_candidates(db: Session = Depends(get_db)):
    # Test endpoint without authentication
    try:
        candidates = db.query(Candidate).all()
        return {"count": len(candidates), "message": "Test successful"}
    except Exception as e:
        return {"error": str(e)}

@router.get("/")
def list_candidates(db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Get candidates that have interview sessions with the current user's company
    try:
        print(f"DEBUG: User company_id type: {type(user.company_id)}, value: {user.company_id}")
        
        # Use raw SQL to avoid type casting issues with PostgreSQL
        company_id_str = str(user.company_id)
        
        # First get distinct candidate IDs from interview sessions
        query = text("""
            SELECT DISTINCT candidate_id 
            FROM interview_sessions 
            WHERE company_id = :company_id
        """)
        
        result = db.execute(query, {"company_id": company_id_str})
        candidate_ids = [row.candidate_id for row in result]
        
        print(f"DEBUG: Candidate IDs from interviews: {candidate_ids}")
        
        if not candidate_ids:
            print("DEBUG: No candidate IDs found, returning empty list")
            return []
        
        # Then get the actual candidate records using raw SQL
        placeholders = ','.join([':id' + str(i) for i in range(len(candidate_ids))])
        candidates_query = text(f"""
            SELECT id, email, first_name, last_name, experience_level, location, skills, created_at, updated_at
            FROM candidates 
            WHERE id IN ({placeholders})
        """)
        
        params = {f'id{i}': candidate_ids[i] for i in range(len(candidate_ids))}
        candidates_result = db.execute(candidates_query, params)
        
        result = []
        for row in candidates_result:
            result.append({
                "id": row.id,
                "email": row.email,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "experience_level": row.experience_level,
                "location": row.location,
                "skills": row.skills,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None
            })
        
        print(f"DEBUG: Found {len(result)} candidates")
        return result
        
    except Exception as e:
        print(f"Error in list_candidates: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load candidates: {str(e)}")


@router.get("/{id}", response_model=CandidateOut)
def get_candidate(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    model = db.get(Candidate, id)
    if not model:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return model


@router.put("/{id}/notes")
def add_candidate_notes(id: str, notes: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    model = db.get(Candidate, id)
    if not model:
        raise HTTPException(status_code=404, detail="Candidate not found")
    # In a full design, notes would be stored in a join table; stub here
    return {"status": "ok"}


@router.get("/{id}/history", response_model=list)
def candidate_history(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Stub: Would join interview_sessions by candidate_id
    return []


@router.post("/verify-interview-access")
def verify_interview_access(request: VerifyInterviewAccessRequest, db: Session = Depends(get_db)):
    """Verify if a candidate can access a specific interview session"""
    
    # Check if candidate exists
    candidate = db.get(Candidate, request.candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Check if interview session exists and is active
    interview = db.get(InterviewSession, request.interview_id)
    if not interview:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    # Check if candidate is assigned to this interview
    if interview.candidate_id != candidate.id:
        raise HTTPException(status_code=403, detail="Access denied: You are not assigned to this interview session")
    
    # Check if interview is in a valid state
    if interview.status not in ["scheduled", "active"]:
        raise HTTPException(status_code=400, detail=f"Interview session is {interview.status} and cannot be accessed")
    
    # Get the problem details for the title
    from app.models.problem import Problem
    problem = db.get(Problem, interview.problem_id)
    
    return {
        "candidate": {
            "id": candidate.id,
            "email": candidate.email,
            "first_name": candidate.first_name,
            "last_name": candidate.last_name,
        },
        "interview": {
            "id": interview.id,
            "title": problem.title if problem else "Interview Problem",
            "status": interview.status,
            "scheduled_at": interview.scheduled_at,
            "problem_id": interview.problem_id,
        },
        "access_granted": True
    }


@router.post("/invite")
def invite_candidate(email: str):
    # Stub sending invite
    return {"status": "invited", "email": email}


