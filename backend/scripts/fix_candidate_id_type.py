#!/usr/bin/env python3
"""
Fix candidate ID column type from UUID to VARCHAR to allow user-defined IDs

This script changes the candidates.id column from UUID to VARCHAR(255) 
to allow users to enter custom candidate IDs during registration.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import SessionLocal, engine

def fix_candidate_id_type():
    """Change candidates.id from UUID to VARCHAR(255)"""
    print("🔧 Fixing candidate ID column type...")
    
    db = SessionLocal()
    try:
        # Check current column type
        result = db.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'candidates' AND column_name = 'id'
        """))
        current_type = result.fetchone()
        
        if current_type:
            print(f"📋 Current candidates.id type: {current_type[1]}")
            
            if current_type[1].upper() == 'UUID':
                print("🔄 Converting UUID column to VARCHAR(255)...")
                
                # Check if there are any existing records
                result = db.execute(text("SELECT COUNT(*) FROM candidates"))
                count = result.scalar()
                
                if count > 0:
                    print(f"⚠️  Found {count} existing records. Backing up data...")
                    
                    # Create backup table
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
                    print("✅ Backup created")
                
                # Drop foreign key constraints first
                print("🔄 Dropping foreign key constraints...")
                db.execute(text("""
                    ALTER TABLE interview_sessions 
                    DROP CONSTRAINT IF EXISTS interview_sessions_candidate_id_fkey
                """))
                
                # Drop and recreate the table with VARCHAR id
                print("🔄 Recreating candidates table with VARCHAR id...")
                db.execute(text("DROP TABLE candidates CASCADE"))
                
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
                
                # Restore data if there was any
                if count > 0:
                    print("🔄 Restoring data...")
                    db.execute(text("""
                        INSERT INTO candidates 
                        SELECT * FROM candidates_backup
                    """))
                    
                    # Drop backup table
                    db.execute(text("DROP TABLE candidates_backup"))
                    print("✅ Data restored and backup cleaned up")
                
                # Recreate foreign key constraint for interview_sessions
                print("🔄 Recreating foreign key constraints...")
                db.execute(text("""
                    ALTER TABLE interview_sessions 
                    ADD CONSTRAINT interview_sessions_candidate_id_fkey 
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                """))
                
                # Create indexes
                db.execute(text("CREATE INDEX IF NOT EXISTS ix_candidates_email ON candidates(email)"))
                
                db.commit()
                print("✅ Successfully converted candidates.id to VARCHAR(255)")
                
            elif current_type[1].upper() in ['VARCHAR', 'CHARACTER VARYING', 'TEXT']:
                print("✅ candidates.id is already a string type, no changes needed")
            else:
                print(f"⚠️  Unexpected column type: {current_type[1]}")
        else:
            print("❌ candidates table or id column not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Starting candidate ID type fix...")
    fix_candidate_id_type()
    print("🎉 Candidate ID type fix completed!")