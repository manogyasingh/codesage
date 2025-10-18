#!/usr/bin/env python3
"""
Check environment variables
"""
import os
from dotenv import load_dotenv

def check_env_vars():
    print("🔍 Checking Environment Variables...")
    
    # Load .env file
    load_dotenv()
    
    print(f"📊 DATABASE_URL from os.getenv: {os.getenv('DATABASE_URL')}")
    print(f"🔑 SECRET_KEY from os.getenv: {os.getenv('SECRET_KEY')}")
    print(f"🌐 SUPABASE_URL from os.getenv: {os.getenv('SUPABASE_URL')}")
    
    # Check if .env file exists
    env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
    if os.path.exists(env_file):
        print(f"✅ .env file found at: {env_file}")
        with open(env_file, 'r') as f:
            lines = f.readlines()
        print(f"📄 .env file has {len(lines)} lines")
    else:
        print("❌ .env file not found")

if __name__ == "__main__":
    check_env_vars()