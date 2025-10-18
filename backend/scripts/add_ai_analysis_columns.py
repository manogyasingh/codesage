#!/usr/bin/env python3
"""
Add AI analysis columns to interview_sessions table
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def add_ai_analysis_columns():
    """Add AI analysis columns to interview_sessions table"""
    db = SessionLocal()
    
    try:
        print("🔄 Adding AI analysis columns to interview_sessions table...")
        
        # Check if columns already exist
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'interview_sessions' 
            AND column_name IN ('ai_analysis', 'ai_metrics', 'ai_transcript_summary', 'ai_journal_notes', 'final_code_submitted')
        """))
        existing_columns = [row[0] for row in result.fetchall()]
        
        columns_to_add = [
            ('ai_analysis', 'TEXT'),
            ('ai_metrics', 'JSONB'),
            ('ai_transcript_summary', 'JSONB'),
            ('ai_journal_notes', 'JSONB'),
            ('final_code_submitted', 'TEXT')
        ]
        
        for column_name, column_type in columns_to_add:
            if column_name not in existing_columns:
                print(f"  Adding column: {column_name}")
                db.execute(text(f"""
                    ALTER TABLE interview_sessions 
                    ADD COLUMN {column_name} {column_type}
                """))
            else:
                print(f"  Column already exists: {column_name}")
        
        db.commit()
        print("✅ Successfully added AI analysis columns!")
        
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_ai_analysis_columns()