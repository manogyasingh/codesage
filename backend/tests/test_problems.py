def make_problem(company_id: str, creator_id: str):
    return {
        "id": "prob-1",
        "company_id": company_id,
        "created_by": creator_id,
        "title": "Two Sum",
        "description": "Find two numbers",
        "difficulty": "easy",
        "category": "algorithms",
        "tags": ["arrays"],
        "programming_languages": ["python"],
        "time_limit_minutes": 60,
        "starter_code": [],
        "test_cases": [],
        "is_active": True,
    }


def test_problems_crud_and_special_endpoints(client, auth_headers, company_and_admin):
    company, admin = company_and_admin

    # Create
    payload = make_problem(company.id, admin.id)
    r = client.post("/problems/", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == payload["id"]

    # List
    r = client.get("/problems/", headers=auth_headers)
    assert r.status_code == 200
    assert any(p["id"] == payload["id"] for p in r.json())

    # Get
    r = client.get(f"/problems/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200

    # Update
    r = client.put(f"/problems/{payload['id']}", json={"title": "Two Sum Updated"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "Two Sum Updated"

    # Test solution (stub)
    r = client.post(f"/problems/{payload['id']}/test", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    # Analytics
    r = client.get(f"/problems/{payload['id']}/analytics", headers=auth_headers)
    assert r.status_code == 200
    assert "usage_count" in r.json()

    # Duplicate
    r = client.post(f"/problems/{payload['id']}/duplicate", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["id"].endswith("-copy")

    # Delete
    r = client.delete(f"/problems/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"


