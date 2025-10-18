#!/usr/bin/env python3
"""
Simple fix to add missing columns to interview_sessions table
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def add_missing_interview_columns():
    """Add missing columns to interview_sessions table"""
    print("🔧 Adding missing columns to interview_sessions table...")
    
    db = SessionLocal()
    try:
        # List of columns to add with their definitions
        columns_to_add = [
            ("scheduled_at", "TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"),
            ("started_at", "TIMESTAMP WITH TIME ZONE"),
            ("ended_at", "TIMESTAMP WITH TIME ZONE"), 
            ("duration_minutes", "INTEGER"),
            ("interviewer_notes", "VARCHAR(4000)"),
            ("candidate_feedback", "VARCHAR(4000)"),
            ("interviewer_rating", "INTEGER"),
            ("technical_score", "INTEGER"),
            ("communication_score", "INTEGER"),
            ("overall_recommendation", "VARCHAR(32)"),
            ("recording_url", "VARCHAR(512)"),
            ("chat_transcript", "JSON"),
            ("test_results", "JSON")
        ]
        
        # Check which columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'interview_sessions'
        """))
        existing_columns = {row[0] for row in result}
        
        print(f"📋 Existing columns: {existing_columns}")
        
        # Add missing columns one by one
        for column_name, column_def in columns_to_add:
            if column_name not in existing_columns:
                print(f"➕ Adding column: {column_name}")
                try:
                    db.execute(text(f"ALTER TABLE interview_sessions ADD COLUMN {column_name} {column_def}"))
                    db.commit()
                    print(f"✅ Added {column_name}")
                except Exception as e:
                    print(f"❌ Error adding {column_name}: {e}")
                    db.rollback()
            else:
                print(f"✓ Column {column_name} already exists")
        
        # Map existing start_time/end_time to new columns if they're null
        print("🔄 Updating data mappings...")
        try:
            # Copy start_time to both scheduled_at and started_at if they're null
            db.execute(text("""
                UPDATE interview_sessions 
                SET scheduled_at = COALESCE(scheduled_at, start_time, created_at, CURRENT_TIMESTAMP),
                    started_at = COALESCE(started_at, start_time)
                WHERE scheduled_at IS NULL OR started_at IS NULL
            """))
            
            # Copy end_time to ended_at if it's null
            db.execute(text("""
                UPDATE interview_sessions 
                SET ended_at = COALESCE(ended_at, end_time)
                WHERE ended_at IS NULL
            """))
            
            # Copy duration to duration_minutes if it's null
            db.execute(text("""
                UPDATE interview_sessions 
                SET duration_minutes = COALESCE(duration_minutes, duration)
                WHERE duration_minutes IS NULL
            """))
            
            db.commit()
            print("✅ Data mappings updated")
        except Exception as e:
            print(f"⚠️  Error updating mappings: {e}")
            db.rollback()
        
        print("✅ Missing columns added successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting to add missing columns...")
    add_missing_interview_columns()
    print("🎉 Column addition completed!")