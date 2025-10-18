#!/usr/bin/env python3
"""
Fix candidates table foreign key constraints
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def fix_candidates_constraints():
    """Fix incorrect foreign key constraints on candidates table"""
    print("🔧 Fixing candidates table constraints...")
    
    try:
        with engine.connect() as connection:
            # Check all constraints on candidates table
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
                      AND tc.table_schema = kcu.table_schema
                    LEFT JOIN information_schema.constraint_column_usage AS ccu
                      ON ccu.constraint_name = tc.constraint_name
                      AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                AND tc.table_name='candidates';
            """))
            
            constraints = result.fetchall()
            print("\n📋 Current foreign key constraints on candidates:")
            for constraint in constraints:
                print(f"  • {constraint.constraint_name}: {constraint.column_name} -> {constraint.foreign_table_name}.{constraint.foreign_column_name if constraint.foreign_column_name else 'None'}")
            
            # Check for the problematic constraint
            result = connection.execute(text("""
                SELECT constraint_name
                FROM information_schema.table_constraints 
                WHERE table_name = 'candidates'
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name = 'candidates_id_fkey';
            """))
            
            if result.fetchone():
                print("\n⚠️  Found problematic candidates_id_fkey constraint")
                print("🔧 Dropping candidates_id_fkey constraint...")
                
                connection.execute(text("""
                    ALTER TABLE candidates 
                    DROP CONSTRAINT candidates_id_fkey
                """))
                connection.commit()
                print("✅ candidates_id_fkey constraint dropped successfully!")
            else:
                print("\n✅ No problematic candidates_id_fkey constraint found")
            
            # Verify the fix by checking remaining constraints
            result = connection.execute(text("""
                SELECT constraint_name
                FROM information_schema.table_constraints 
                WHERE table_name = 'candidates'
                AND constraint_type = 'FOREIGN KEY';
            """))
            
            remaining_constraints = result.fetchall()
            print("\n📋 Remaining foreign key constraints on candidates:")
            for constraint in remaining_constraints:
                print(f"  • {constraint.constraint_name}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error fixing constraints: {e}")
        return False

if __name__ == "__main__":
    fix_candidates_constraints()