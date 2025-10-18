#!/usr/bin/env python3
"""
Database initialization script for Supabase
Creates all necessary tables and initial data
"""
import os
import sys

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import Base, engine
from app.models import *  # Import all models

def init_db():
    """Initialize database tables"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
        
        # Test connection
        from app.db.session import get_db
        db = next(get_db())
        print("✅ Database connection successful!")
        db.close()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 Initializing CodeSage Database...")
    success = init_db()
    if success:
        print("🎉 Database initialization completed!")
    else:
        print("💥 Database initialization failed!")
        sys.exit(1)