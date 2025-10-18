#!/usr/bin/env python3
"""
Complete fix for interview_sessions table schema to match the SQLAlchemy model
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal

def fix_interview_sessions_complete():
    """Completely recreate interview_sessions table to match the model"""
    print("🔧 Completely fixing interview_sessions table schema...")
    
    db = SessionLocal()
    try:
        # Check if there's any data to backup
        count = db.execute(text("SELECT COUNT(*) FROM interview_sessions")).scalar()
        print(f"📊 Found {count} interview sessions")
        
        if count > 0:
            print("💾 Creating backup...")
            # Create backup table with existing data
            db.execute(text("""
                CREATE TABLE interview_sessions_backup AS 
                SELECT * FROM interview_sessions
            """))
            print("✅ Backup created")
        
        # Drop the current table and all its constraints
        print("🗑️ Dropping current interview_sessions table...")
        db.execute(text("DROP TABLE interview_sessions CASCADE"))
        
        # Recreate table with correct schema to match the model exactly
        print("🔨 Creating new interview_sessions table with correct schema...")
        db.execute(text("""
            CREATE TABLE interview_sessions (
                id VARCHAR(255) PRIMARY KEY,
                company_id VARCHAR(255) NOT NULL,
                candidate_id VARCHAR(255) NOT NULL,
                interviewer_id VARCHAR(255) NOT NULL,
                problem_id VARCHAR(255) NOT NULL,
                status VARCHAR(32) DEFAULT 'scheduled',
                scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
                started_at TIMESTAMP WITH TIME ZONE,
                ended_at TIMESTAMP WITH TIME ZONE,
                duration_minutes INTEGER,
                candidate_code JSON DEFAULT '[]'::json,
                interviewer_notes VARCHAR(4000),
                candidate_feedback VARCHAR(4000),
                interviewer_rating INTEGER,
                technical_score INTEGER,
                communication_score INTEGER,
                overall_recommendation VARCHAR(32),
                recording_url VARCHAR(512),
                chat_transcript JSON,
                test_results JSON,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        # Restore data if there was any (with proper column mapping)
        if count > 0:
            print("🔄 Restoring data with column mapping...")
            # Map old columns to new schema and provide defaults for required fields
            db.execute(text("""
                INSERT INTO interview_sessions 
                (id, company_id, candidate_id, interviewer_id, problem_id, status, 
                 scheduled_at, started_at, ended_at, duration_minutes, candidate_code, 
                 created_at, updated_at)
                SELECT 
                    id, 
                    company_id, 
                    candidate_id, 
                    COALESCE(interviewer_id, 'default-interviewer') as interviewer_id,
                    problem_id, 
                    COALESCE(status, 'waiting') as status,
                    COALESCE(start_time, created_at, CURRENT_TIMESTAMP) as scheduled_at,
                    start_time as started_at,
                    end_time as ended_at,
                    duration as duration_minutes,
                    COALESCE(candidate_code, '[]'::json) as candidate_code,
                    COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
                    COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at
                FROM interview_sessions_backup
            """))
            
            # Drop backup
            db.execute(text("DROP TABLE interview_sessions_backup"))
            print("✅ Data restored and backup cleaned up")
        
        # Add foreign key constraints
        print("🔗 Adding foreign key constraints...")
        try:
            db.execute(text("""
                ALTER TABLE interview_sessions 
                ADD CONSTRAINT interview_sessions_company_id_fkey 
                FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
            """))
        except Exception as e:
            print(f"⚠️  Could not add company_id foreign key: {e}")
        
        try:
            db.execute(text("""
                ALTER TABLE interview_sessions 
                ADD CONSTRAINT interview_sessions_candidate_id_fkey 
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            """))
        except Exception as e:
            print(f"⚠️  Could not add candidate_id foreign key: {e}")
        
        try:
            db.execute(text("""
                ALTER TABLE interview_sessions 
                ADD CONSTRAINT interview_sessions_interviewer_id_fkey 
                FOREIGN KEY (interviewer_id) REFERENCES company_users(id) ON DELETE CASCADE
            """))
        except Exception as e:
            print(f"⚠️  Could not add interviewer_id foreign key: {e}")
        
        try:
            db.execute(text("""
                ALTER TABLE interview_sessions 
                ADD CONSTRAINT interview_sessions_problem_id_fkey 
                FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
            """))
        except Exception as e:
            print(f"⚠️  Could not add problem_id foreign key: {e}")
        
        # Create indexes
        print("📇 Creating indexes...")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_company_id ON interview_sessions(company_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_candidate_id ON interview_sessions(candidate_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_interviewer_id ON interview_sessions(interviewer_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_problem_id ON interview_sessions(problem_id)"))
        
        db.commit()
        print("✅ Interview sessions table schema updated successfully!")
        
        # Verify the new schema
        print("\n📋 Verifying new schema...")
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'interview_sessions' 
            ORDER BY ordinal_position
        """))
        
        for row in result:
            nullable = "NULL" if row[2] == "YES" else "NOT NULL"
            print(f"  ✓ {row[0]}: {row[1]} ({nullable})")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting complete interview_sessions schema fix...")
    fix_interview_sessions_complete()
    print("🎉 Schema fix completed!")