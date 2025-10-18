#!/usr/bin/env python3
"""
Test the interview analysis submission endpoint
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
from datetime import datetime, timezone
from app.db.session import SessionLocal
from app.models import InterviewSession, Candidate, Problem, CompanyUser
from app.schemas.interview import InterviewSessionOut

def test_analysis_submission():
    """Test submitting interview analysis results"""
    db = SessionLocal()
    
    try:
        # Find an interview session
        interview = db.query(InterviewSession).first()
        if not interview:
            print("❌ No interview sessions found")
            return
        
        print(f"📋 Testing with interview session: {interview.id}")
        
        # Sample analysis data
        analysis_data = {
            "session_id": "test_session_123",
            "analysis": "This candidate demonstrated strong problem-solving skills and clear communication throughout the interview. OVERALL PERFORMANCE RATING: 8/10. STRENGTHS: Excellent algorithmic thinking, clean code structure. AREAS FOR IMPROVEMENT: Could optimize time complexity. RECOMMENDATION: Hire",
            "metrics": {
                "duration_minutes": 45,
                "fumbles": 2,
                "slow_answers": 1,
                "avg_slow_answer_sec": 15.5,
                "total_interactions": 12,
                "notes_count": 3,
                "rating": 8
            },
            "transcript_summary": [
                {"role": "user", "content": "I need to implement a binary search", "ts": "2024-01-01T10:00:00Z"},
                {"role": "assistant", "content": "That's a great approach. Let's start with the basic structure", "ts": "2024-01-01T10:00:30Z"}
            ],
            "journal_notes": [
                "Candidate started with a good approach",
                "Asked clarifying questions about edge cases",
                "Implemented solution efficiently"
            ],
            "final_code": "def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1"
        }
        
        # Update the interview session with analysis results
        interview.status = "completed"
        interview.ended_at = datetime.now(timezone.utc)
        interview.ai_analysis = analysis_data["analysis"]
        interview.ai_metrics = analysis_data["metrics"]
        interview.ai_transcript_summary = analysis_data["transcript_summary"]
        interview.ai_journal_notes = analysis_data["journal_notes"]
        interview.final_code_submitted = analysis_data["final_code"]
        
        # Calculate duration if not already set
        if interview.started_at and not interview.duration_minutes:
            duration = interview.ended_at - interview.started_at
            interview.duration_minutes = int(duration.total_seconds() / 60)
        elif not interview.duration_minutes:
            interview.duration_minutes = analysis_data["metrics"]["duration_minutes"]
        
        db.add(interview)
        db.commit()
        db.refresh(interview)
        
        print("✅ Successfully updated interview session with analysis results!")
        print(f"  • Status: {interview.status}")
        print(f"  • Duration: {interview.duration_minutes} minutes")
        print(f"  • AI Analysis: {interview.ai_analysis[:100]}...")
        print(f"  • Metrics: {interview.ai_metrics}")
        
        # Test querying completed interviews with analysis
        completed_interviews = db.query(InterviewSession).filter(
            InterviewSession.status == "completed",
            InterviewSession.ai_analysis.isnot(None)
        ).all()
        
        print(f"\n📊 Found {len(completed_interviews)} completed interviews with analysis")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    test_analysis_submission()