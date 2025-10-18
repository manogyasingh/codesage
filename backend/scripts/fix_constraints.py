#!/usr/bin/env python3
"""
Fix foreign key constraints in the database
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def fix_foreign_key_constraints():
    """Fix incorrect foreign key constraints"""
    print("🔧 Fixing foreign key constraints...")
    
    try:
        with engine.connect() as connection:
            # Check all constraints on company_users table
            result = connection.execute(text("""
                SELECT constraint_name, constraint_type
                FROM information_schema.table_constraints 
                WHERE table_name = 'company_users'
                AND constraint_type = 'FOREIGN KEY';
            """))
            
            constraints = result.fetchall()
            print("\n📋 Current foreign key constraints on company_users:")
            for constraint in constraints:
                print(f"  • {constraint.constraint_name}")
            
            # Check if there's an incorrect constraint referencing users table
            result = connection.execute(text("""
                SELECT 
                    tc.constraint_name,
                    ccu.table_name AS foreign_table_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name='company_users'
                AND ccu.table_name = 'users';
            """))
            
            bad_constraints = result.fetchall()
            if bad_constraints:
                print("\n⚠️  Found incorrect constraints referencing 'users' table:")
                for constraint in bad_constraints:
                    print(f"  • {constraint.constraint_name}")
                    print(f"    Dropping constraint: {constraint.constraint_name}")
                    connection.execute(text(f"""
                        ALTER TABLE company_users 
                        DROP CONSTRAINT {constraint.constraint_name}
                    """))
                    connection.commit()
                    print(f"    ✅ Dropped {constraint.constraint_name}")
            else:
                print("\n✅ No incorrect constraints found referencing 'users' table")
            
            # Let's also check if there are any other problematic constraints
            result = connection.execute(text("""
                SELECT 
                    tc.constraint_name,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                    JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name='company_users';
            """))
            
            all_constraints = result.fetchall()
            print("\n📋 All foreign key constraints on company_users:")
            for constraint in all_constraints:
                print(f"  • {constraint.constraint_name}: {constraint.column_name} -> {constraint.foreign_table_name}.{constraint.foreign_column_name}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error fixing constraints: {e}")
        return False

if __name__ == "__main__":
    fix_foreign_key_constraints()