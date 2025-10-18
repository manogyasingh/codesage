#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from sqlalchemy import inspect, text

def check_schema():
    db = next(get_db())
    try:
        # Check if we're using PostgreSQL or SQLite
        engine_name = db.bind.dialect.name
        print(f"Database engine: {engine_name}")
        
        if engine_name == 'postgresql':
            # PostgreSQL specific query
            result = db.execute(text("""
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'problems' 
                ORDER BY ordinal_position;
            """))
            print("Problems table columns (PostgreSQL):")
            for row in result:
                print(f"  {row[0]}: {row[1]}")
        else:
            # SQLite or other - use inspector
            inspector = inspect(db.bind)
            columns = inspector.get_columns('problems')
            print('Problems table columns:')
            for col in columns:
                print(f'  {col["name"]}: {col["type"]}')
                
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_schema()