#!/usr/bin/env python3
"""
Test the candidate verification endpoint with valid data
"""

import sys
import os
import requests
import json

def test_candidate_verification():
    """Test the fixed candidate verification endpoint"""
    print("🧪 Testing candidate verification endpoint...")
    
    # Test data with the correct candidate ID
    test_data = {
        "candidate_id": "ad17e059-acf8-4535-931c-5702dba92718",
        "interview_id": "5926c906-c742-4f41-be22-4398350ebb1b"
    }
    
    try:
        response = requests.post(
            'http://localhost:8000/candidates/verify-interview-access',
            json=test_data,
            headers={'Content-Type': 'application/json'}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Candidate verification worked!")
            print("📋 Full response:")
            print(json.dumps(result, indent=2))
            return True
        else:
            error = response.json()
            print(f"❌ Error: {error.get('detail', 'Unknown error')}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to server. Make sure uvicorn is running.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_candidate_verification()
    if success:
        print("🎉 All tests passed! The candidate login system is working!")
    else:
        print("💥 Tests failed!")