def test_register_company_and_admin_login(client):
    # Register company + admin
    payload = {
        "id": "comp-2",
        "name": "Beta Inc",
        "email": "contact@example.com",
        "admin_user_id": "admin-2",
        "admin_email": "admin2@example.com",
        "admin_password": "pass1234",
        "first_name": "Be",
        "last_name": "Ta",
    }
    r = client.post("/auth/register/company", json=payload)
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    assert token

    # Login with admin
    r2 = client.post("/auth/login", data={"username": payload["admin_email"], "password": payload["admin_password"]})
    assert r2.status_code == 200, r2.text
    assert r2.json()["access_token"]


def test_register_candidate(client):
    payload = {
        "id": "cand-2",
        "email": "c2@test.com",
        "first_name": "Foo",
        "last_name": "Bar",
    }
    r = client.post("/auth/register/candidate", json=payload)
    assert r.status_code == 200, r.text
    assert r.json()["id"] == payload["id"]


