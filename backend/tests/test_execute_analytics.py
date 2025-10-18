def test_execute_and_languages(client, auth_headers):
    r = client.post("/execute/", json={"code": "print(1)", "language": "python"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["success"] is True

    r = client.post("/execute/test", json={"code": "print(1)", "language": "python"}, headers=auth_headers)
    assert r.status_code == 200
    assert "test_cases_total" in r.json()

    r = client.get("/execute/languages")
    assert r.status_code == 200
    assert "python" in r.json()


def test_analytics_endpoints(client, auth_headers):
    r = client.get("/analytics/dashboard", headers=auth_headers)
    assert r.status_code == 200
    r = client.get("/analytics/problems", headers=auth_headers)
    assert r.status_code == 200
    r = client.get("/analytics/interviews", headers=auth_headers)
    assert r.status_code == 200
    r = client.get("/analytics/candidates", headers=auth_headers)
    assert r.status_code == 200
    r = client.post("/analytics/export", headers=auth_headers)
    assert r.status_code == 200


