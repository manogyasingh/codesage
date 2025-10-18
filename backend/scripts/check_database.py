#!/usr/bin/env python3
"""
Check database constraints and schema
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def check_database_constraints():
    """Check foreign key constraints in the database"""
    print("🔍 Checking database constraints...")
    
    try:
        with engine.connect() as connection:
            # Check foreign key constraints on company_users table
            result = connection.execute(text("""
                SELECT 
                    tc.constraint_name, 
                    tc.table_name, 
                    kcu.column_name, 
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name='company_users';
            """))
            
            constraints = result.fetchall()
            print("\n📋 Foreign Key Constraints on company_users table:")
            for constraint in constraints:
                print(f"  • {constraint.constraint_name}: {constraint.table_name}.{constraint.column_name} -> {constraint.foreign_table_name}.{constraint.foreign_column_name}")
            
            # Check what tables exist
            result = connection.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """))
            
            tables = result.fetchall()
            print("\n� Available tables:")
            for table in tables:
                print(f"  • {table.table_name}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

if __name__ == "__main__":
    check_database_constraints()
        companies = db.query(Company).all()
        print(f"\n🏢 Companies ({len(companies)}):")
        for company in companies:
            print(f"  - ID: {company.id}, Name: {company.name}, Email: {company.email}")
        
        # Check company users
        users = db.query(CompanyUser).all()
        print(f"\n👥 Company Users ({len(users)}):")
        for user in users:
            print(f"  - ID: {user.id}, Email: {user.email}, Company: {user.company_id}")
        
        # Check candidates
        candidates = db.query(Candidate).all()
        print(f"\n👤 Candidates ({len(candidates)}):")
        for candidate in candidates:
            print(f"  - ID: {candidate.id}, Email: {candidate.email}")
        
        # Check problems
        problems = db.query(Problem).all()
        print(f"\n🧩 Problems ({len(problems)}):")
        for problem in problems:
            print(f"  - ID: {problem.id}, Title: {problem.title}, Company: {problem.company_id}")
        
        # Check interview sessions
        interviews = db.query(InterviewSession).all()
        print(f"\n🎯 Interview Sessions ({len(interviews)}):")
        for interview in interviews:
            print(f"  - ID: {interview.id}, Title: {interview.title}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    check_database_data()