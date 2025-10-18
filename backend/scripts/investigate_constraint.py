#!/usr/bin/env python3
"""
Investigate and fix the company_users_id_fkey constraint
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def investigate_and_fix_constraint():
    """Investigate the problematic constraint and fix it"""
    print("🔍 Investigating company_users_id_fkey constraint...")
    
    try:
        with engine.connect() as connection:
            # Get detailed info about the problematic constraint
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
                AND tc.table_name='company_users'
                AND tc.constraint_name = 'company_users_id_fkey';
            """))
            
            constraint_info = result.fetchone()
            if constraint_info:
                print(f"\n📋 Constraint details:")
                print(f"  • Name: {constraint_info.constraint_name}")
                print(f"  • Column: {constraint_info.column_name}")
                print(f"  • References: {constraint_info.foreign_table_name}.{constraint_info.foreign_column_name}")
                
                # Check if the referenced table exists
                if constraint_info.foreign_table_name:
                    result = connection.execute(text(f"""
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables 
                            WHERE table_name = '{constraint_info.foreign_table_name}'
                            AND table_schema = 'public'
                        );
                    """))
                    table_exists = result.fetchone()[0]
                    
                    if not table_exists:
                        print(f"  ❌ Referenced table '{constraint_info.foreign_table_name}' does not exist!")
                        print("  🔧 Dropping the problematic constraint...")
                        
                        connection.execute(text("""
                            ALTER TABLE company_users 
                            DROP CONSTRAINT company_users_id_fkey
                        """))
                        connection.commit()
                        print("  ✅ Constraint dropped successfully!")
                    else:
                        print(f"  ✅ Referenced table '{constraint_info.foreign_table_name}' exists")
                else:
                    print("  ❌ Constraint has no foreign table reference - this is invalid!")
                    print("  🔧 Dropping the problematic constraint...")
                    
                    connection.execute(text("""
                        ALTER TABLE company_users 
                        DROP CONSTRAINT company_users_id_fkey
                    """))
                    connection.commit()
                    print("  ✅ Constraint dropped successfully!")
            else:
                print("\n✅ company_users_id_fkey constraint not found or already removed")
            
            # Verify the fix by checking remaining constraints
            result = connection.execute(text("""
                SELECT constraint_name
                FROM information_schema.table_constraints 
                WHERE table_name = 'company_users'
                AND constraint_type = 'FOREIGN KEY';
            """))
            
            remaining_constraints = result.fetchall()
            print("\n📋 Remaining foreign key constraints on company_users:")
            for constraint in remaining_constraints:
                print(f"  • {constraint.constraint_name}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error investigating constraint: {e}")
        return False

if __name__ == "__main__":
    investigate_and_fix_constraint()