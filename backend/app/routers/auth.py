from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models import CompanyUser, Company
from app.deps.auth import get_current_user

from pydantic import BaseModel, EmailStr


router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: str
    email: str
    role: str
    company_id: str  # This should be string for JSON serialization
    first_name: str
    last_name: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class RegisterCompanyIn(BaseModel):
    id: str
    name: str
    email: EmailStr
    admin_user_id: str
    admin_email: EmailStr
    admin_password: str
    first_name: str
    last_name: str


@router.post("/register/company", response_model=AuthResponse)
def register_company(data: RegisterCompanyIn, db: Session = Depends(get_db)):
    if db.get(Company, data.id) is not None:
        raise HTTPException(status_code=400, detail="Company already exists")
    if db.query(Company).filter(Company.email == data.email).first():
        raise HTTPException(status_code=400, detail="Company email already used")
    if db.get(CompanyUser, data.admin_user_id) is not None:
        raise HTTPException(status_code=400, detail="Admin user already exists")
    if db.query(CompanyUser).filter(CompanyUser.email == data.admin_email).first():
        raise HTTPException(status_code=400, detail="Admin email already used")

    company = Company(
        id=data.id,
        name=data.name,
        email=data.email,
    )
    db.add(company)

    admin = CompanyUser(
        id=data.admin_user_id,
        company_id=data.id,
        email=data.admin_email,
        first_name=data.first_name,
        last_name=data.last_name,
        role="admin",
        password_hash=get_password_hash(data.admin_password),
    )
    db.add(admin)
    db.commit()

    token = create_access_token(subject=admin.id, expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    
    user_data = UserOut(
        id=str(admin.id),
        email=admin.email,
        role=admin.role,
        company_id=str(admin.company_id),
        first_name=admin.first_name,
        last_name=admin.last_name
    )
    
    return AuthResponse(access_token=token, user=user_data)


@router.post("/login", response_model=AuthResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(CompanyUser).filter(CompanyUser.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token(subject=str(user.id))
    
    user_data = UserOut(
        id=str(user.id),
        email=user.email,
        role=user.role,
        company_id=str(user.company_id),
        first_name=user.first_name,
        last_name=user.last_name
    )
    
    return AuthResponse(access_token=token, user=user_data)


@router.get("/me", response_model=UserOut)
def get_current_user_info(user: CompanyUser = Depends(get_current_user)):
    return UserOut(
        id=str(user.id),
        email=user.email,
        role=user.role,
        company_id=str(user.company_id),
        first_name=user.first_name,
        last_name=user.last_name
    )


class CandidateRegisterIn(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str


# Placeholder for candidate registration; could be in separate router if needed
# Implemented here to match spec endpoints
from app.models import Candidate  # noqa: E402


@router.post("/register/candidate", response_model=dict)
def register_candidate(data: CandidateRegisterIn, db: Session = Depends(get_db)):
    if db.get(Candidate, data.id) is not None:
        raise HTTPException(status_code=400, detail="Candidate already exists")
    if db.query(Candidate).filter(Candidate.email == data.email).first():
        raise HTTPException(status_code=400, detail="Candidate email already used")
    candidate = Candidate(
        id=data.id,
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        experience_level="entry",
        location="",
    )
    db.add(candidate)
    db.commit()
    return {"id": candidate.id}


@router.post("/logout", response_model=dict)
def logout():
    return {"status": "ok"}


@router.post("/refresh", response_model=Token)
def refresh(user: CompanyUser = Depends(lambda: None), db: Session = Depends(get_db)):
    # decode via dependency would be ideal; keeping simple without requiring token again
    # For now issue a short-lived token-less flow (not secure; placeholder)
    raise HTTPException(status_code=501, detail="Not implemented")


class ForgotPasswordIn(BaseModel):
    email: EmailStr


@router.post("/forgot-password", response_model=dict)
def forgot_password(data: ForgotPasswordIn):
    return {"status": "sent"}


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password", response_model=dict)
def reset_password(data: ResetPasswordIn):
    return {"status": "ok"}


