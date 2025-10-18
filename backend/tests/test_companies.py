def test_company_profile_and_settings(client, auth_headers):
    # Profile
    r = client.get("/companies/profile", headers=auth_headers)
    assert r.status_code == 200
    company = r.json()
    assert company["id"]

    # Update profile
    r = client.put("/companies/profile", json={"name": "New Name"}, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["name"] == "New Name"

    # Get settings
    r = client.get("/companies/settings", headers=auth_headers)
    assert r.status_code == 200
    assert isinstance(r.json(), dict)

    # Update settings
    new_settings = {"max_concurrent_interviews": 2}
    r = client.put("/companies/settings", json=new_settings, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["max_concurrent_interviews"] == 2

    # Subscription
    r = client.get("/companies/subscription", headers=auth_headers)
    assert r.status_code == 200
    assert "subscription_plan" in r.json()


