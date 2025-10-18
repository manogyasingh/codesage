"""
Migration script to convert company_id from VARCHAR to UUID
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from sqlalchemy import text
import uuid

def migrate_company_ids():
    db = SessionLocal()
    try:
        print("Starting migration from VARCHAR to UUID for company_id columns...")
        
        # First, let's see what data we have
        print("\n1. Checking existing data...")
        
        companies = db.execute(text("SELECT id, name FROM companies")).fetchall()
        print(f"Found {len(companies)} companies:")
        for company in companies:
            print(f"  - {company.id}: {company.name}")
        
        users = db.execute(text("SELECT id, company_id, email FROM company_users")).fetchall()
        print(f"Found {len(users)} company users:")
        for user in users:
            print(f"  - {user.id}: {user.email} (company: {user.company_id})")
        
        interviews = db.execute(text("SELECT id, company_id, candidate_id FROM interview_sessions")).fetchall()
        print(f"Found {len(interviews)} interview sessions:")
        for interview in interviews:
            print(f"  - {interview.id}: candidate {interview.candidate_id} (company: {interview.company_id})")
        
        # Step 1: Add new UUID columns
        print("\n2. Adding new UUID columns...")
        
        # Add new UUID columns temporarily
        db.execute(text("ALTER TABLE companies ADD COLUMN IF NOT EXISTS id_uuid UUID"))
        db.execute(text("ALTER TABLE company_users ADD COLUMN IF NOT EXISTS company_id_uuid UUID"))
        db.execute(text("ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS company_id_uuid UUID"))
        
        db.commit()
        
        # Step 2: Convert existing string IDs to UUIDs or generate new ones
        print("\n3. Converting/generating UUIDs...")
        
        # For companies table - convert existing string IDs to UUIDs if they're valid, otherwise generate new ones
        for company in companies:
            try:
                # Try to parse as UUID
                company_uuid = uuid.UUID(company.id)
            except ValueError:
                # If not a valid UUID, generate a new one
                company_uuid = uuid.uuid4()
                print(f"Generated new UUID for company {company.name}: {company_uuid}")
            
            db.execute(text("UPDATE companies SET id_uuid = :uuid WHERE id = :old_id"), 
                      {"uuid": company_uuid, "old_id": company.id})
        
        db.commit()
        
        # Step 3: Update foreign key references
        print("\n4. Updating foreign key references...")
        
        # Update company_users table
        for user in users:
            # Find the corresponding UUID for this company_id
            company_uuid_result = db.execute(text("SELECT id_uuid FROM companies WHERE id = :company_id"), 
                                           {"company_id": user.company_id}).fetchone()
            if company_uuid_result:
                db.execute(text("UPDATE company_users SET company_id_uuid = :uuid WHERE id = :user_id"), 
                          {"uuid": company_uuid_result.id_uuid, "user_id": user.id})
        
        # Update interview_sessions table
        for interview in interviews:
            # Find the corresponding UUID for this company_id
            company_uuid_result = db.execute(text("SELECT id_uuid FROM companies WHERE id = :company_id"), 
                                           {"company_id": interview.company_id}).fetchone()
            if company_uuid_result:
                db.execute(text("UPDATE interview_sessions SET company_id_uuid = :uuid WHERE id = :interview_id"), 
                          {"uuid": company_uuid_result.id_uuid, "interview_id": interview.id})
        
        db.commit()
        
        # Step 4: Drop old columns and constraints
        print("\n5. Dropping old columns and constraints...")
        
        # Drop foreign key constraints first
        try:
            db.execute(text("ALTER TABLE company_users DROP CONSTRAINT IF EXISTS company_users_company_id_fkey"))
            db.execute(text("ALTER TABLE interview_sessions DROP CONSTRAINT IF EXISTS interview_sessions_company_id_fkey"))
        except Exception as e:
            print(f"Note: Some constraints might not exist: {e}")
        
        # Drop old columns
        db.execute(text("ALTER TABLE company_users DROP COLUMN IF EXISTS company_id"))
        db.execute(text("ALTER TABLE interview_sessions DROP COLUMN IF EXISTS company_id"))
        db.execute(text("ALTER TABLE companies DROP COLUMN IF EXISTS id"))
        
        db.commit()
        
        # Step 5: Rename new columns and set up constraints
        print("\n6. Renaming columns and setting up new constraints...")
        
        # Rename UUID columns to original names
        db.execute(text("ALTER TABLE companies RENAME COLUMN id_uuid TO id"))
        db.execute(text("ALTER TABLE company_users RENAME COLUMN company_id_uuid TO company_id"))
        db.execute(text("ALTER TABLE interview_sessions RENAME COLUMN company_id_uuid TO company_id"))
        
        # Set primary key and constraints
        db.execute(text("ALTER TABLE companies ADD PRIMARY KEY (id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_company_users_company_id ON company_users (company_id)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS ix_interview_sessions_company_id ON interview_sessions (company_id)"))
        
        # Add foreign key constraints
        db.execute(text("ALTER TABLE company_users ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE"))
        db.execute(text("ALTER TABLE interview_sessions ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE"))
        
        db.commit()
        
        print("\n7. Migration completed successfully!")
        
        # Verify the results
        print("\n8. Verifying results...")
        companies_after = db.execute(text("SELECT id, name FROM companies")).fetchall()
        for company in companies_after:
            print(f"  Company: {company.id} ({type(company.id)}) - {company.name}")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_company_ids()