#!/usr/bin/env python3
"""
Add all missing columns to problems table
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db.session import engine

def add_all_missing_columns():
    """Add all missing columns to problems table"""
    print("🔧 Adding all missing columns to problems table...")
    
    # Define all the columns that should exist
    columns_to_add = [
        ('programming_languages', 'JSON', '[]'),
        ('tags', 'JSON', '[]'),
        ('starter_code', 'JSON', '[]'),
        ('test_cases', 'JSON', '[]'),
        ('solution', 'JSON', None),
        ('hints', 'JSON', None),
        ('time_limit_minutes', 'INTEGER', '60'),
        ('memory_limit_mb', 'INTEGER', None)
    ]
    
    try:
        with engine.connect() as connection:
            for col_name, col_type, default_value in columns_to_add:
                # Check if column exists
                result = connection.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = 'problems' 
                    AND column_name = '{col_name}'
                """))
                
                if not result.fetchone():
                    print(f"➕ Adding {col_name} column...")
                    
                    if col_type == 'JSON':
                        if default_value is None:
                            sql = f"ALTER TABLE problems ADD COLUMN {col_name} JSON"
                        else:
                            sql = f"ALTER TABLE problems ADD COLUMN {col_name} JSON DEFAULT '{default_value}'"
                    elif col_type == 'INTEGER':
                        if default_value is None:
                            sql = f"ALTER TABLE problems ADD COLUMN {col_name} INTEGER"
                        else:
                            sql = f"ALTER TABLE problems ADD COLUMN {col_name} INTEGER DEFAULT {default_value}"
                    
                    connection.execute(text(sql))
                    connection.commit()
                    print(f"✅ {col_name} column added!")
                else:
                    print(f"✅ {col_name} column already exists!")
            
            print("🎉 All missing columns added successfully!")
            return True
            
    except Exception as e:
        print(f"❌ Error adding columns: {e}")
        return False

if __name__ == "__main__":
    add_all_missing_columns()