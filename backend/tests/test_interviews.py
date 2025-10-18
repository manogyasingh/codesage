from datetime import datetime, timezone


def make_session(company_id: str, candidate_id: str, interviewer_id: str, problem_id: str):
    return {
        "id": "sess-1",
        "company_id": company_id,
        "candidate_id": candidate_id,
        "interviewer_id": interviewer_id,
        "problem_id": problem_id,
        "scheduled_at": datetime.now(timezone.utc).isoformat(),
        "status": "scheduled",
        "candidate_code": [],
    }


def ensure_problem(client, auth_headers, company, admin):
    payload = {
        "id": "prob-for-session",
        "company_id": company.id,
        "created_by": admin.id,
        "title": "Temp",
        "description": "",
        "difficulty": "easy",
        "category": "algorithms",
        "tags": [],
        "programming_languages": ["python"],
        "starter_code": [],
        "test_cases": [],
        "is_active": True,
    }
    r = client.post("/problems/", json=payload, headers=auth_headers)
    assert r.status_code == 200 or r.status_code == 400
    return payload["id"]


def test_interviews_crud_and_lifecycle(client, auth_headers, company_and_admin, candidate_seed):
    company, admin = company_and_admin
    problem_id = ensure_problem(client, auth_headers, company, admin)

    # Create
    payload = make_session(company.id, candidate_seed.id, admin.id, problem_id)
    r = client.post("/interviews/", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == payload["id"]

    # List
    r = client.get("/interviews/", headers=auth_headers)
    assert r.status_code == 200
    assert any(s["id"] == payload["id"] for s in r.json())

    # Get
    r = client.get(f"/interviews/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200

    # Update
    r = client.put(f"/interviews/{payload['id']}", json={"status": "scheduled"}, headers=auth_headers)
    assert r.status_code == 200

    # Start
    r = client.post(f"/interviews/{payload['id']}/start", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "started"

    # End
    r = client.post(f"/interviews/{payload['id']}/end", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ended"

    # Live/session stub
    r = client.get(f"/interviews/{payload['id']}/live")
    assert r.status_code == 200
    assert "ws" in r.json()

    # Code submit and execute stubs
    r = client.post(f"/interviews/{payload['id']}/code", params={"code": "print(1)", "language": "python"})
    assert r.status_code == 200
    r = client.post(f"/interviews/{payload['id']}/execute", params={"code": "print(1)", "language": "python"})
    assert r.status_code == 200

    # Feedback
    r = client.post(f"/interviews/{payload['id']}/feedback", params={"feedback": "Great"})
    assert r.status_code == 200

    # Delete
    r = client.delete(f"/interviews/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"


