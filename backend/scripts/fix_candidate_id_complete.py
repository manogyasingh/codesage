#!/usr/bin/env python3
"""
Complete fix for candidate ID columns - convert both candidates.id and interview_sessions.candidate_id
from UUID to VARCHAR to allow user-defined candidate IDs.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal, engine

def fix_candidate_id_columns():
    """Fix both candidates.id and interview_sessions.candidate_id columns"""
    print("🔧 Fixing candidate ID columns in both tables...")
    
    db = SessionLocal()
    try:
        # Check current column types
        print("📋 Checking current column types...")
        
        # Check candidates table
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates' AND column_name = 'id'
        """))
        candidates_type = result.fetchone()
        
        # Check interview_sessions table
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'interview_sessions' AND column_name = 'candidate_id'
        """))
        interviews_type = result.fetchone()
        
        if candidates_type:
            print(f"📋 candidates.id type: {candidates_type[1]}")
        if interviews_type:
            print(f"📋 interview_sessions.candidate_id type: {interviews_type[1]}")
        
        # Check for existing data in both tables
        candidates_count = db.execute(text("SELECT COUNT(*) FROM candidates")).scalar()
        interviews_count = db.execute(text("SELECT COUNT(*) FROM interview_sessions")).scalar()
        
        print(f"📊 Found {candidates_count} candidates and {interviews_count} interview sessions")
        
        # Step 1: Drop foreign key constraint
        print("🔄 Dropping foreign key constraint...")
        db.execute(text("""
            ALTER TABLE interview_sessions 
            DROP CONSTRAINT IF EXISTS interview_sessions_candidate_id_fkey
        """))
        
        # Step 2: Convert interview_sessions.candidate_id to VARCHAR if it's UUID
        if interviews_type and interviews_type[1].upper() == 'UUID':
            print("🔄 Converting interview_sessions.candidate_id to VARCHAR...")
            
            if interviews_count > 0:
                # Backup interview sessions data
                db.execute(text("""
                    CREATE TABLE interview_sessions_backup AS 
                    SELECT 
                        id, company_id, interviewer_id,
                        candidate_id::text as candidate_id_text,
                        problem_id, status, start_time, end_time,
                        duration, created_at, updated_at, candidate_code
                    FROM interview_sessions
                """))
                print("✅ Interview sessions backup created")
                
                # Drop and recreate interview_sessions table
                db.execute(text("DROP TABLE interview_sessions CASCADE"))
            
            # Create interview_sessions table with VARCHAR candidate_id
            db.execute(text("""
                CREATE TABLE interview_sessions (
                    id VARCHAR(255) PRIMARY KEY,
                    company_id VARCHAR(255) NOT NULL,
                    candidate_id VARCHAR(255) NOT NULL,
                    interviewer_id VARCHAR(255),
                    problem_id VARCHAR(255) NOT NULL,
                    status VARCHAR(32) DEFAULT 'waiting',
                    start_time TIMESTAMP WITH TIME ZONE,
                    end_time TIMESTAMP WITH TIME ZONE,
                    duration INTEGER,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    candidate_code JSON DEFAULT '[]'::json
                )
            """))
            
            if interviews_count > 0:
                # Restore data
                db.execute(text("""
                    INSERT INTO interview_sessions 
                    (id, company_id, candidate_id, interviewer_id, problem_id, status, 
                     start_time, end_time, duration, created_at, updated_at, candidate_code)
                    SELECT 
                        id, company_id, candidate_id_text, interviewer_id, problem_id, status,
                        start_time, end_time, duration, created_at, updated_at, candidate_code
                    FROM interview_sessions_backup
                """))
                
                # Drop backup
                db.execute(text("DROP TABLE interview_sessions_backup"))
                print("✅ Interview sessions data restored")
        
        # Step 3: Ensure candidates table is also VARCHAR (it should be from previous script)
        if candidates_type and candidates_type[1].upper() == 'UUID':
            print("🔄 Converting candidates.id to VARCHAR...")
            
            if candidates_count > 0:
                # Backup candidates data
                db.execute(text("""
                    CREATE TABLE candidates_backup AS 
                    SELECT 
                        id::text as id_text,
                        email, first_name, last_name, phone, resume_url,
                        github_profile, linkedin_profile, portfolio_url,
                        experience_level, preferred_languages, current_company,
                        current_position, location, availability_status,
                        created_at, updated_at, skills
                    FROM candidates
                """))
                print("✅ Candidates backup created")
                
                # Drop and recreate candidates table
                db.execute(text("DROP TABLE candidates CASCADE"))
            
            # Create candidates table with VARCHAR id
            db.execute(text("""
                CREATE TABLE candidates (
                    id VARCHAR(255) PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    first_name VARCHAR(100) NOT NULL,
                    last_name VARCHAR(100) NOT NULL,
                    phone VARCHAR(32),
                    resume_url VARCHAR(512),
                    github_profile VARCHAR(512),
                    linkedin_profile VARCHAR(512),
                    portfolio_url VARCHAR(512),
                    experience_level VARCHAR(32) NOT NULL,
                    preferred_languages JSON DEFAULT '[]'::json,
                    current_company VARCHAR(255),
                    current_position VARCHAR(255),
                    location VARCHAR(255) NOT NULL,
                    availability_status VARCHAR(32) DEFAULT 'available',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    skills JSON DEFAULT '[]'::json
                )
            """))
            
            if candidates_count > 0:
                # Restore data
                db.execute(text("""
                    INSERT INTO candidates 
                    SELECT * FROM candidates_backup
                """))
                
                # Drop backup
                db.execute(text("DROP TABLE candidates_backup"))
                print("✅ Candidates data restored")
        
        # Step 4: Recreate foreign key constraint (now both columns are VARCHAR)
        print("🔄 Creating foreign key constraint...")
        db.execute(text("""
            ALTER TABLE interview_sessions 
            ADD CONSTRAINT interview_sessions_candidate_id_fkey 
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
        """))
        
        # Step 5: Create indexes
        print("🔄 Creating indexes...")
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_candidates_email ON candidates(email)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_candidate_id ON interview_sessions(candidate_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_company_id ON interview_sessions(company_id)"))
        
        db.commit()
        print("✅ Successfully converted all candidate ID columns to VARCHAR(255)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting complete candidate ID fix...")
    fix_candidate_id_columns()
    print("🎉 Candidate ID fix completed!")