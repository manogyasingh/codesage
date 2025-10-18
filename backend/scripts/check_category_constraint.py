#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from sqlalchemy import text

def check_constraints():
    db = next(get_db())
    try:
        # Check all constraints
        result = db.execute(text("""
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name LIKE '%category%' OR constraint_name LIKE '%difficulty%';
        """))
        print("Constraints:")
        for row in result:
            print(f"  {row[0]}: {row[1]}")
            
        # Also check for enum types
        result = db.execute(text("""
            SELECT enumlabel 
            FROM pg_enum 
            JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
            WHERE typname LIKE '%category%';
        """))
        print("\nCategory enum values:")
        for row in result:
            print(f"  - {row[0]}")
            
        # Check existing problems to see what categories and difficulties are used
        result = db.execute(text("SELECT DISTINCT category FROM problems;"))
        print("\nExisting categories in use:")
        for row in result:
            print(f"  - {row[0]}")
            
        result = db.execute(text("SELECT DISTINCT difficulty FROM problems;"))
        print("\nExisting difficulties in use:")
        for row in result:
            print(f"  - {row[0]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_constraints()