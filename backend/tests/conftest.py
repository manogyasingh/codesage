import os
import sys
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure imports like `from app...` work regardless of CWD
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.main import create_app
import app.main as app_main
import app.db.session as db_session_module
from app.db.session import Base, get_db
import app.core.security as security_module
import app.routers.auth as auth_router_module
import app.routers.users as users_router_module
from app.models import Company, CompanyUser, Candidate


@pytest.fixture(scope="session")
def db_engine():
    # Use a temporary SQLite DB file to persist across connections during tests
    fd, db_path = tempfile.mkstemp(prefix="codesage_test_", suffix=".db")
    os.close(fd)
    try:
        engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
        Base.metadata.create_all(bind=engine)
        yield engine
    finally:
        try:
            os.remove(db_path)
        except OSError:
            pass


@pytest.fixture()
def db_session(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Reset DB between tests to avoid cross-test unique constraint conflicts
        Base.metadata.drop_all(bind=db_engine)
        Base.metadata.create_all(bind=db_engine)


@pytest.fixture()
def app(db_session, db_engine):
    # Ensure the application uses the test engine for startup table creation
    db_session_module.engine = db_engine
    app_main.engine = db_engine
    app = create_app()

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    return app


@pytest.fixture()
def client(app):
    return TestClient(app)


@pytest.fixture(autouse=True)
def patch_security(monkeypatch):
    def fake_hash(p: str) -> str:
        return f"hashed:{p}"

    def fake_verify(plain: str, hashed: str) -> bool:
        return hashed == f"hashed:{plain}"

    # Patch in core module
    monkeypatch.setattr(security_module, "get_password_hash", fake_hash, raising=True)
    monkeypatch.setattr(security_module, "verify_password", fake_verify, raising=True)
    # Patch in routers that imported the symbols directly
    monkeypatch.setattr(auth_router_module, "get_password_hash", fake_hash, raising=True)
    monkeypatch.setattr(auth_router_module, "verify_password", fake_verify, raising=True)
    monkeypatch.setattr(users_router_module, "get_password_hash", fake_hash, raising=True)
    yield


@pytest.fixture()
def company_and_admin(db_session):
    company = Company(id="comp-1", name="Acme Corp", email="admin@example.com")
    admin = CompanyUser(
        id="user-admin-1",
        company_id=company.id,
        email="admin@example.com",
        first_name="Admin",
        last_name="User",
        role="admin",
        password_hash="hashed:secret123",
    )
    db_session.add(company)
    db_session.add(admin)
    db_session.commit()
    return company, admin


@pytest.fixture()
def auth_headers(client, company_and_admin):
    _, admin = company_and_admin
    resp = client.post("/auth/login", data={"username": admin.email, "password": "secret123"})
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def candidate_seed(db_session):
    candidate = Candidate(
        id="cand-1",
        email="cand1@example.com",
        first_name="Jane",
        last_name="Doe",
        experience_level="junior",
        location="Remote",
    )
    db_session.add(candidate)
    db_session.commit()
    return candidate


