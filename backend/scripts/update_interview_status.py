#!/usr/bin/env python3
"""
Script to update interview status in the database
Usage: python update_interview_status.py <interview_id> <new_status>
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import InterviewSession
from datetime import datetime, timezone

def update_interview_status(interview_id: str, new_status: str):
    """
    Update interview status in the database
    Valid statuses: scheduled, in_progress, completed
    """
    valid_statuses = ["scheduled", "in_progress", "completed", "not-completed"]
    
    if new_status not in valid_statuses:
        print(f"Error: Invalid status '{new_status}'. Valid statuses are: {', '.join(valid_statuses)}")
        return False
    
    # Get database session
    db = next(get_db())
    
    try:
        # Find the interview
        interview = db.get(InterviewSession, interview_id)
        if not interview:
            print(f"Error: Interview with ID '{interview_id}' not found")
            return False
        
        print(f"Found interview: {interview.id}")
        print(f"Current status: {interview.status}")
        print(f"Candidate ID: {interview.candidate_id}")
        print(f"Company ID: {interview.company_id}")
        
        # Update the status
        old_status = interview.status
        interview.status = new_status
        
        # Reset timestamps based on new status
        if new_status == "scheduled":
            interview.started_at = None
            interview.ended_at = None
            interview.duration_minutes = None
        elif new_status == "in_progress":
            if not interview.started_at:
                interview.started_at = datetime.now(timezone.utc)
            interview.ended_at = None
        elif new_status == "completed":
            if not interview.started_at:
                interview.started_at = datetime.now(timezone.utc)
            if not interview.ended_at:
                interview.ended_at = datetime.now(timezone.utc)
        
        # Clear AI analysis data if reverting from completed
        if old_status == "completed" and new_status != "completed":
            interview.ai_analysis = None
            interview.ai_metrics = None
            interview.ai_transcript_summary = None
            interview.ai_journal_notes = None
            interview.final_code_submitted = None
            print("Cleared AI analysis data")
        
        db.add(interview)
        db.commit()
        db.refresh(interview)
        
        print(f"Successfully updated interview status from '{old_status}' to '{new_status}'")
        return True
        
    except Exception as e:
        print(f"Error updating interview: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def list_interviews():
    """List all interviews in the database"""
    db = next(get_db())
    
    try:
        interviews = db.query(InterviewSession).all()
        print("\nAll interviews in database:")
        print("-" * 80)
        for interview in interviews:
            print(f"ID: {interview.id}")
            print(f"Status: {interview.status}")
            print(f"Candidate: {interview.candidate_id}")
            print(f"Company: {interview.company_id}")
            print(f"Scheduled: {interview.scheduled_at}")
            print(f"Started: {interview.started_at}")
            print(f"Ended: {interview.ended_at}")
            print("-" * 80)
    except Exception as e:
        print(f"Error listing interviews: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python update_interview_status.py list                    # List all interviews")
        print("  python update_interview_status.py <interview_id> <status> # Update interview status")
        print("  Valid statuses: scheduled, in_progress, completed")
        sys.exit(1)
    
    if sys.argv[1] == "list":
        list_interviews()
    elif len(sys.argv) == 3:
        interview_id = sys.argv[1]
        new_status = sys.argv[2]
        update_interview_status(interview_id, new_status)
    else:
        print("Error: Invalid arguments")
        print("Usage: python update_interview_status.py <interview_id> <new_status>")
        sys.exit(1)