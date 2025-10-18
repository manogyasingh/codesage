#!/usr/bin/env python3
"""
Fix database schema by adding missing columns
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def fix_database_schema():
    """Add missing columns to existing tables"""
    print("🔧 Fixing database schema...")
    
    try:
        with engine.connect() as connection:
            # Check if password_hash column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'company_users' 
                AND column_name = 'password_hash'
            """))
            
            if not result.fetchone():
                print("➕ Adding password_hash column to company_users table...")
                connection.execute(text("""
                    ALTER TABLE company_users 
                    ADD COLUMN password_hash VARCHAR(255)
                """))
                connection.commit()
                print("✅ password_hash column added successfully!")
            else:
                print("✅ password_hash column already exists!")
            
            # Check if hashed_password column exists (and rename it if needed)
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'company_users' 
                AND column_name = 'hashed_password'
            """))
            
            if result.fetchone():
                print("🔄 Renaming hashed_password to password_hash...")
                connection.execute(text("""
                    ALTER TABLE company_users 
                    RENAME COLUMN hashed_password TO password_hash
                """))
                connection.commit()
                print("✅ Column renamed successfully!")
            
            print("🎉 Database schema fixed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error fixing database schema: {e}")
        return False

if __name__ == "__main__":
    fix_database_schema()