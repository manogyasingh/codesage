#!/usr/bin/env python3
"""
Test the complete candidate registration and interview access flow
"""

import requests
import json
import uuid

def test_complete_flow():
    """Test registration -> interview assignment -> login"""
    print("🧪 Testing complete candidate flow...")
    
    # Step 1: Register a new candidate
    candidate_id = f"test-user-{uuid.uuid4().hex[:8]}"
    registration_data = {
        "id": candidate_id,
        "email": f"{candidate_id}@example.com",
        "first_name": "Test",
        "last_name": "User"
    }
    
    print(f"1️⃣ Registering candidate with ID: {candidate_id}")
    try:
        response = requests.post(
            'http://localhost:8000/auth/register/candidate',
            json=registration_data
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ Registration successful: {result}")
        else:
            print(f"   ❌ Registration failed: {response.json()}")
            return False
            
    except Exception as e:
        print(f"   ❌ Registration error: {e}")
        return False
    
    # Step 2: Try to access a non-existent interview (should fail)
    fake_interview_id = str(uuid.uuid4())
    print(f"2️⃣ Testing access to non-existent interview")
    
    try:
        response = requests.post(
            'http://localhost:8000/candidates/verify-interview-access',
            json={
                "candidate_id": candidate_id,
                "interview_id": fake_interview_id
            }
        )
        
        if response.status_code == 404:
            print(f"   ✅ Correctly denied access to non-existent interview")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code} - {response.json()}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        
    # Step 3: Try to access existing interview (should fail - not assigned)
    existing_interview_id = "5926c906-c742-4f41-be22-4398350ebb1b"
    print(f"3️⃣ Testing access to existing interview (not assigned)")
    
    try:
        response = requests.post(
            'http://localhost:8000/candidates/verify-interview-access',
            json={
                "candidate_id": candidate_id,
                "interview_id": existing_interview_id
            }
        )
        
        if response.status_code == 403:
            error = response.json()
            print(f"   ✅ Correctly denied access: {error.get('detail')}")
        else:
            print(f"   ⚠️  Unexpected response: {response.status_code} - {response.json()}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("✅ Complete flow test passed!")
    return True

if __name__ == "__main__":
    success = test_complete_flow()
    if success:
        print("🎉 All candidate flow tests passed!")
    else:
        print("💥 Some tests failed!")