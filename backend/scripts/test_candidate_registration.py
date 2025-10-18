#!/usr/bin/env python3
"""
Test candidate registration after fixing the database schema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import Candidate

def test_candidate_registration():
    """Test creating a candidate with a string ID"""
    print("🧪 Testing candidate registration...")
    
    db = SessionLocal()
    try:
        # Test data
        candidate_id = "test-candidate-456"
        
        # Check if candidate already exists
        existing = db.get(Candidate, candidate_id)
        if existing:
            print(f"🗑️ Removing existing test candidate: {candidate_id}")
            db.delete(existing)
            db.commit()
        
        # Create new candidate
        candidate = Candidate(
            id=candidate_id,
            email="testuser@example.com",
            first_name="Test",
            last_name="User",
            experience_level="mid",
            location="Remote",
        )
        
        db.add(candidate)
        db.commit()
        
        print(f"✅ Successfully created candidate with ID: {candidate_id}")
        print(f"📧 Email: {candidate.email}")
        print(f"👤 Name: {candidate.first_name} {candidate.last_name}")
        
        # Verify we can retrieve it
        retrieved = db.get(Candidate, candidate_id)
        if retrieved:
            print(f"✅ Successfully retrieved candidate: {retrieved.id}")
        else:
            print("❌ Failed to retrieve candidate")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Testing candidate registration...")
    success = test_candidate_registration()
    if success:
        print("🎉 Test completed successfully!")
    else:
        print("💥 Test failed!")