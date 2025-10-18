#!/usr/bin/env python3
"""
Fix problems table schema by adding missing columns
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def fix_problems_table_schema():
    """Add missing columns to problems table"""
    print("🔧 Fixing problems table schema...")
    
    try:
        with engine.connect() as connection:
            # Check if created_by column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'problems' 
                AND column_name = 'created_by'
            """))
            
            if not result.fetchone():
                print("➕ Adding created_by column to problems table...")
                connection.execute(text("""
                    ALTER TABLE problems 
                    ADD COLUMN created_by UUID REFERENCES company_users(id)
                """))
                connection.commit()
                print("✅ created_by column added successfully!")
            else:
                print("✅ created_by column already exists!")
            
            # Check for other potentially missing columns
            expected_columns = [
                'usage_count', 'average_completion_time', 'success_rate'
            ]
            
            for col in expected_columns:
                result = connection.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'problems' 
                    AND column_name = '{col}'
                """))
                
                if not result.fetchone():
                    print(f"➕ Adding {col} column to problems table...")
                    if col == 'usage_count':
                        connection.execute(text(f"""
                            ALTER TABLE problems 
                            ADD COLUMN {col} INTEGER DEFAULT 0
                        """))
                    elif col == 'average_completion_time':
                        connection.execute(text(f"""
                            ALTER TABLE problems 
                            ADD COLUMN {col} FLOAT
                        """))
                    elif col == 'success_rate':
                        connection.execute(text(f"""
                            ALTER TABLE problems 
                            ADD COLUMN {col} FLOAT
                        """))
                    connection.commit()
                    print(f"✅ {col} column added successfully!")
                else:
                    print(f"✅ {col} column already exists!")
            
            print("🎉 Problems table schema fixed successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error fixing problems table schema: {e}")
        return False

if __name__ == "__main__":
    fix_problems_table_schema()