#!/usr/bin/env python3
"""
Get the actual interview session ID for testing
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from app.models import InterviewSession, Candidate

def get_interview_session_id():
    """Get the actual interview session ID"""
    db = next(get_db())
    
    try:
        # Find the candidate first
        candidate = db.query(Candidate).filter(Candidate.email == "candidate@example.com").first()
        if not candidate:
            print("❌ No candidate found with email candidate@example.com")
            return
        
        # Find the interview session for this candidate
        interview = db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate.id).first()
        if not interview:
            print("❌ No interview session found for this candidate")
            return
        
        print("✅ Found interview session!")
        print(f"📋 Interview Session Details:")
        print(f"  • Interview ID: {interview.id}")
        print(f"  • Candidate Email: candidate@example.com")
        print(f"  • Status: {interview.status}")
        print(f"  • Scheduled At: {interview.scheduled_at}")
        print("")
        print("🎯 Use this Interview ID in the candidate login form:")
        print(f"   {interview.id}")
        
        return interview.id
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    finally:
        db.close()

if __name__ == "__main__":
    get_interview_session_id()