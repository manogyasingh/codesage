from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Company
from app.schemas.company import CompanyOut, CompanyUpdate
from app.deps.auth import get_current_user


router = APIRouter()


@router.get("/profile", response_model=CompanyOut)
def get_company_profile(db: Session = Depends(get_db), user=Depends(get_current_user)):
    company = db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/profile", response_model=CompanyOut)
def update_company_profile(update: CompanyUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    company = db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for k, v in update.model_dump(exclude_none=True).items():
        setattr(company, k, v)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/settings", response_model=dict)
def get_company_settings(db: Session = Depends(get_db), user=Depends(get_current_user)):
    company = db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company.settings or {}


@router.put("/settings", response_model=dict)
def update_company_settings(settings: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    company = db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    company.settings = settings
    db.add(company)
    db.commit()
    db.refresh(company)
    return company.settings or {}


@router.get("/analytics", response_model=dict)
def company_analytics():
    return {"interviews": 0, "active_problems": 0}


@router.get("/subscription", response_model=dict)
def company_subscription(db: Session = Depends(get_db), user=Depends(get_current_user)):
    company = db.get(Company, user.company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {"subscription_plan": company.subscription_plan}


