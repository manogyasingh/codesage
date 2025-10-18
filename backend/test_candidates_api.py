#!/usr/bin/env python3
"""
Test the candidates API endpoint with authentication
"""

import requests
import json

def test_candidates_api():
    """Test the candidates endpoint with proper authentication"""
    print("🧪 Testing candidates API with authentication...")
    
    # Step 1: Login to get token
    login_data = {
        "username": "admin@example.com",
        "password": "password123"
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/auth/login',
            data=login_data  # Use data for form-encoded login
        )
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data['access_token']
            print(f"✅ Login successful, token: {token[:20]}...")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.json()}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False
    
    # Step 2: Get candidates with token
    try:
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.get(
            'http://localhost:8000/candidates/',
            headers=headers
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {response.headers}")
        print(f"Response text: '{response.text}'")
        
        if response.status_code == 200:
            try:
                candidates = response.json()
                print(f"✅ Candidates API successful!")
                print(f"📊 Number of candidates: {len(candidates)}")
                
                if candidates:
                    print("👥 Candidates:")
                    for c in candidates:
                        print(f"  - {c['first_name']} {c['last_name']} ({c['email']})")
                else:
                    print("⚠️ No candidates found")
                    
                return True
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {e}")
                return False
        else:
            print(f"❌ Candidates API failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Candidates API error: {e}")
        return False

if __name__ == "__main__":
    success = test_candidates_api()
    if success:
        print("🎉 Candidates API test passed!")
    else:
        print("💥 Candidates API test failed!")