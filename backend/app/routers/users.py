from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import CompanyUser
from app.schemas.user import CompanyUserOut, CompanyUserCreate, CompanyUserUpdate
from app.core.security import get_password_hash
from app.deps.auth import get_current_user


router = APIRouter()


@router.get("/me", response_model=CompanyUserOut)
def get_current_user_profile(user: CompanyUser = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current authenticated user's profile"""
    # Refresh user to ensure company relationship is loaded
    db.refresh(user)
    return user


@router.get("/", response_model=list[CompanyUserOut])
def list_users(db: Session = Depends(get_db), user=Depends(get_current_user)):
    from sqlalchemy import text
    
    # Use raw SQL to handle PostgreSQL UUID casting properly
    user_company_id_str = str(user.company_id)
    result = db.execute(
        text("SELECT * FROM company_users WHERE company_id = CAST(:company_id AS uuid)"),
        {"company_id": user_company_id_str}
    ).fetchall()
    
    # Convert results to CompanyUser objects
    users = []
    for row in result:
        company_user = db.get(CompanyUser, row[0])  # Get by ID (first column)
        if company_user:
            users.append(company_user)
    
    return users


@router.post("/", response_model=CompanyUserOut)
def create_user(payload: CompanyUserCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    payload_company_id_str = str(payload.company_id)
    
    if payload_company_id_str != user_company_id_str:
        raise HTTPException(status_code=403, detail="Cross-company creation forbidden")
    if db.query(CompanyUser).filter(CompanyUser.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already used")
    model = CompanyUser(
        id=payload.id,
        company_id=payload.company_id,
        email=payload.email,
        first_name=payload.first_name,
        last_name=payload.last_name,
        role=payload.role,
        permissions=payload.permissions.model_dump(),
        is_active=payload.is_active,
        avatar=payload.avatar,
        password_hash=get_password_hash(payload.password),
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.get("/{id}", response_model=CompanyUserOut)
def get_user(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(CompanyUser, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="User not found")
    return model


@router.put("/{id}", response_model=CompanyUserOut)
def update_user(id: str, payload: CompanyUserUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import uuid
    user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
    model = db.get(CompanyUser, id)
    if not model or model.company_id != user_company_uuid:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        if k == "permissions":
            v = v.model_dump()
        setattr(model, k, v)
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.delete("/{id}")
def delete_user(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import uuid
    user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
    model = db.get(CompanyUser, id)
    if not model or model.company_id != user_company_uuid:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(model)
    db.commit()
    return {"status": "deleted"}


@router.put("/{id}/permissions", response_model=CompanyUserOut)
def update_permissions(id: str, payload: CompanyUserUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import uuid
    user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
    model = db.get(CompanyUser, id)
    if not model or model.company_id != user_company_uuid:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.permissions is None:
        raise HTTPException(status_code=400, detail="permissions required")
    model.permissions = payload.permissions.model_dump()
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.put("/{id}/status", response_model=CompanyUserOut)
def update_status(id: str, is_active: bool, db: Session = Depends(get_db), user=Depends(get_current_user)):
    import uuid
    user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
    model = db.get(CompanyUser, id)
    if not model or model.company_id != user_company_uuid:
        raise HTTPException(status_code=404, detail="User not found")
    model.is_active = is_active
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


