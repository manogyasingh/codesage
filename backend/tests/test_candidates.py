def test_candidates_endpoints(client, auth_headers, candidate_seed):
    # List
    r = client.get("/candidates/", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), list)

    # Get
    r = client.get(f"/candidates/{candidate_seed.id}", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == candidate_seed.email

    # Notes (stub)
    r = client.put(f"/candidates/{candidate_seed.id}/notes", params={"notes": "Great"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"

    # History (stub)
    r = client.get(f"/candidates/{candidate_seed.id}/history", headers=auth_headers)
    assert r.status_code == 200
    assert r.json() == []

    # Invite
    r = client.post("/candidates/invite", params={"email": "new@example.com"})
    assert r.status_code == 200
    assert r.json()["status"] == "invited"


