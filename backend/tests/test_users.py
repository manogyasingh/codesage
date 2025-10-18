def test_users_crud_flow(client, auth_headers, company_and_admin):
    company, admin = company_and_admin

    # Create user
    payload = {
        "id": "user-1",
        "company_id": company.id,
        "email": "user1@example.com",
        "first_name": "User",
        "last_name": "One",
        "role": "interviewer",
        "permissions": {},
        "is_active": True,
        "password": "abc12345",
    }
    r = client.post("/users/", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["id"] == payload["id"]

    # List users
    r = client.get("/users/", headers=auth_headers)
    assert r.status_code == 200
    items = r.json()
    assert any(u["id"] == payload["id"] for u in items)

    # Get user
    r = client.get(f"/users/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == payload["email"]

    # Update user
    r = client.put(f"/users/{payload['id']}", json={"first_name": "Updated"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["first_name"] == "Updated"

    # Update permissions
    r = client.put(
        f"/users/{payload['id']}/permissions",
        json={"permissions": {"can_manage_users": True}},
        headers=auth_headers,
    )
    assert r.status_code == 200
    assert r.json()["permissions"]["can_manage_users"] is True

    # Update status
    r = client.put(f"/users/{payload['id']}/status", params={"is_active": False}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["is_active"] is False

    # Delete
    r = client.delete(f"/users/{payload['id']}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "deleted"


