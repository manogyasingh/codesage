#!/usr/bin/env python3
"""
Fix interview_sessions table schema by adding missing columns
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def fix_interview_sessions_schema():
    """Add missing columns to interview_sessions table"""
    print("🔧 Fixing interview_sessions table schema...")
    
    # Define all the columns that should exist
    columns_to_add = [
        ('scheduled_at', 'TIMESTAMP WITH TIME ZONE', None, True),
        ('started_at', 'TIMESTAMP WITH TIME ZONE', None, False),
        ('ended_at', 'TIMESTAMP WITH TIME ZONE', None, False),
        ('duration_minutes', 'INTEGER', None, False),
        ('candidate_code', 'JSON', '[]', False),
        ('interviewer_notes', 'VARCHAR(4000)', None, False),
        ('candidate_feedback', 'VARCHAR(4000)', None, False),
        ('interviewer_rating', 'INTEGER', None, False),
        ('technical_score', 'INTEGER', None, False),
        ('communication_score', 'INTEGER', None, False),
        ('overall_recommendation', 'VARCHAR(32)', None, False),
        ('recording_url', 'VARCHAR(512)', None, False),
        ('chat_transcript', 'JSON', None, False),
        ('test_results', 'JSON', None, False)
    ]
    
    try:
        with engine.connect() as connection:
            for col_name, col_type, default_value, required in columns_to_add:
                # Check if column exists
                result = connection.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'interview_sessions' 
                    AND column_name = '{col_name}'
                """))
                
                if not result.fetchone():
                    print(f"➕ Adding {col_name} column...")
                    
                    # Build the SQL based on column type and requirements
                    sql_parts = [f"ALTER TABLE interview_sessions ADD COLUMN {col_name} {col_type}"]
                    
                    if default_value is not None:
                        if col_type == 'JSON':
                            sql_parts.append(f"DEFAULT '{default_value}'")
                        else:
                            sql_parts.append(f"DEFAULT {default_value}")
                    
                    if required:
                        sql_parts.append("NOT NULL")
                    
                    sql = " ".join(sql_parts)
                    connection.execute(text(sql))
                    connection.commit()
                    print(f"✅ {col_name} column added!")
                else:
                    print(f"✅ {col_name} column already exists!")
            
            print("🎉 All missing columns added successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        return False

if __name__ == "__main__":
    fix_interview_sessions_schema()