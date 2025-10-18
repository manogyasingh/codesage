#!/usr/bin/env python3
"""
Show which database is being used and display connection info
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.db.session import engine

def show_database_info():
    """Show database connection information"""
    print("🔍 Database Configuration Info:")
    print(f"📊 Database URL: {settings.DATABASE_URL}")
    print(f"🔗 Engine: {engine}")
    print(f"🏢 Database Type: {'PostgreSQL (Supabase)' if 'postgresql' in settings.DATABASE_URL else 'SQLite (Local)'}")
    
    # Test connection
    try:
        with engine.connect() as conn:
            print("✅ Database connection successful!")
            
            # Try to get table names to verify connection
            if 'postgresql' in settings.DATABASE_URL:
                result = conn.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
                tables = [row[0] for row in result]
                print(f"📋 Found {len(tables)} tables: {tables}")
            else:
                result = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
                tables = [row[0] for row in result]
                print(f"📋 Found {len(tables)} tables: {tables}")
                
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

if __name__ == "__main__":
    show_database_info()