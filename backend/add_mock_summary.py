#!/usr/bin/env python3
"""
Script to add mock interview summary data for testing
"""

import json
import uuid
from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def add_mock_summary():
    db = SessionLocal()
    try:
        # Mock AI analysis data
        mock_ai_analysis = """
The candidate demonstrated strong problem-solving skills and good understanding of algorithms. 
They approached the problem methodically and wrote clean, readable code. 
Communication was clear throughout the interview process.

Key strengths:
- Excellent problem decomposition
- Clean code structure
- Good time complexity analysis
- Clear communication

Areas for improvement:
- Could optimize space complexity
- Minor syntax errors initially
"""

        mock_ai_metrics = {
            "duration_minutes": 45,
            "fumbles": 2,
            "slow_answers": 3,
            "avg_slow_answer_sec": 15.5,
            "total_interactions": 28,
            "notes_count": 5,
            "rating": 8.5
        }

        mock_transcript_summary = [
            {
                "timestamp": "00:02:30",
                "speaker": "interviewer",
                "content": "Let's start with the problem. Can you explain your approach?"
            },
            {
                "timestamp": "00:03:15",
                "speaker": "candidate",
                "content": "I'll use a two-pointer approach to solve this efficiently."
            },
            {
                "timestamp": "00:25:00",
                "speaker": "interviewer", 
                "content": "Great solution! Can you analyze the time complexity?"
            },
            {
                "timestamp": "00:25:30",
                "speaker": "candidate",
                "content": "The time complexity is O(n) and space complexity is O(1)."
            }
        ]

        mock_journal_notes = [
            "Candidate started with a brute force approach",
            "Quickly optimized to a more efficient solution",
            "Asked good clarifying questions",
            "Handled edge cases well",
            "Code is clean and well-commented"
        ]

        mock_final_code = '''def two_sum(nums, target):
    """
    Find two numbers in the array that add up to target
    """
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test cases
print(two_sum([2, 7, 11, 15], 9))  # [0, 1]
print(two_sum([3, 2, 4], 6))       # [1, 2]'''

        interview_session_id = '5926c906-c742-4f41-be22-4398350ebb1b'

        # Update the interview session with mock summary data
        query = text("""
            UPDATE interview_sessions 
            SET 
                status = 'completed',
                ended_at = NOW(),
                duration_minutes = 45,
                interviewer_rating = 4,
                technical_score = 85,
                communication_score = 90,
                overall_recommendation = 'hire',
                ai_analysis = :ai_analysis,
                ai_metrics = :ai_metrics,
                ai_transcript_summary = :transcript_summary,
                ai_journal_notes = :journal_notes,
                final_code_submitted = :final_code,
                updated_at = NOW()
            WHERE id = :session_id
        """)
        
        result = db.execute(query, {
            "session_id": interview_session_id,
            "ai_analysis": mock_ai_analysis,
            "ai_metrics": json.dumps(mock_ai_metrics),
            "transcript_summary": json.dumps(mock_transcript_summary),
            "journal_notes": json.dumps(mock_journal_notes),
            "final_code": mock_final_code
        })
        
        if result.rowcount > 0:
            print(f"✅ Successfully updated interview session {interview_session_id} with mock summary data")
        else:
            print("❌ No interview session found with that ID")

        # Add analytics data to interview_analytics table
        analytics_data = [
            {
                "metric_type": "problem_solving_score",
                "metric_value": {"score": 85, "max_score": 100, "category": "technical"}
            },
            {
                "metric_type": "communication_score", 
                "metric_value": {"score": 90, "max_score": 100, "category": "soft_skills"}
            },
            {
                "metric_type": "code_quality",
                "metric_value": {"score": 88, "readability": 9, "efficiency": 8, "best_practices": 9}
            },
            {
                "metric_type": "time_management",
                "metric_value": {"total_time_minutes": 45, "time_to_solution": 35, "time_for_optimization": 10}
            },
            {
                "metric_type": "interaction_metrics",
                "metric_value": {
                    "total_questions_asked": 6,
                    "clarifications_requested": 3,
                    "hints_used": 1,
                    "fumbles": 2
                }
            },
            {
                "metric_type": "performance_summary",
                "metric_value": {
                    "overall_rating": 8.5,
                    "recommendation": "hire",
                    "strengths": ["problem_solving", "communication", "code_quality"],
                    "areas_for_improvement": ["optimization", "edge_case_handling"]
                }
            }
        ]

        # Insert analytics data
        for analytics in analytics_data:
            analytics_id = str(uuid.uuid4())
            insert_analytics_query = text("""
                INSERT INTO interview_analytics (id, session_id, metric_type, metric_value, recorded_at)
                VALUES (:id, :session_id, :metric_type, :metric_value, :recorded_at)
            """)
            
            db.execute(insert_analytics_query, {
                "id": analytics_id,
                "session_id": interview_session_id,
                "metric_type": analytics["metric_type"],
                "metric_value": json.dumps(analytics["metric_value"]),
                "recorded_at": datetime.now(timezone.utc)
            })
        
        db.commit()
        print(f"✅ Successfully added {len(analytics_data)} analytics records")
            
        # Verify the update
        verify_query = text("""
            SELECT id, status, ai_analysis, ai_metrics, final_code_submitted 
            FROM interview_sessions 
            WHERE id = :session_id
        """)
        
        result = db.execute(verify_query, {"session_id": interview_session_id})
        row = result.fetchone()
        
        if row:
            print(f"📊 Verification:")
            print(f"   ID: {row.id}")
            print(f"   Status: {row.status}")
            print(f"   Has AI Analysis: {bool(row.ai_analysis)}")
            print(f"   Has AI Metrics: {bool(row.ai_metrics)}")
            print(f"   Has Final Code: {bool(row.final_code_submitted)}")

        # Verify analytics data
        analytics_verify_query = text("""
            SELECT COUNT(*) as count, array_agg(metric_type) as metrics
            FROM interview_analytics 
            WHERE session_id = :session_id
        """)
        
        analytics_result = db.execute(analytics_verify_query, {"session_id": interview_session_id})
        analytics_row = analytics_result.fetchone()
        
        if analytics_row:
            print(f"📈 Analytics Verification:")
            print(f"   Records: {analytics_row.count}")
            print(f"   Metrics: {analytics_row.metrics}")
        
    except Exception as e:
        print(f"❌ Error adding mock summary: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_mock_summary()