#!/usr/bin/env python3
"""
Script to inspect Supabase database schema and data format
This will help us understand the actual structure of problems and interview sessions
"""
import os
import json
from supabase import create_client, Client

def get_supabase_client():
    """Initialize Supabase client"""
    try:
        # Try to get Supabase credentials from environment or config
        url = os.environ.get("SUPABASE_URL") or "your_supabase_url_here"
        key = os.environ.get("SUPABASE_ANON_KEY") or "your_supabase_anon_key_here"
        
        if url == "your_supabase_url_here" or key == "your_supabase_anon_key_here":
            print("Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables")
            return None
            
        return create_client(url, key)
    except Exception as e:
        print(f"Error connecting to Supabase: {e}")
        return None

def inspect_problems_table(supabase: Client):
    """Inspect the problems table structure and sample data"""
    print("\n=== PROBLEMS TABLE INSPECTION ===")
    
    try:
        # Get a few sample problems to understand the structure
        response = supabase.table('problems').select('*').limit(3).execute()
        
        if response.data:
            print(f"Found {len(response.data)} sample problems:")
            for i, problem in enumerate(response.data, 1):
                print(f"\n--- Problem {i} ---")
                print(f"ID: {problem.get('id')}")
                print(f"Title: {problem.get('title')}")
                print(f"Company ID: {problem.get('company_id')}")
                print(f"Difficulty: {problem.get('difficulty')}")
                print(f"Category: {problem.get('category')}")
                
                # Check starter_code format
                starter_code = problem.get('starter_code')
                if starter_code:
                    print(f"Starter Code Type: {type(starter_code)}")
                    if isinstance(starter_code, list) and len(starter_code) > 0:
                        print(f"First Starter Code: {starter_code[0]}")
                    else:
                        print(f"Starter Code: {starter_code}")
                
                # Check test_cases format
                test_cases = problem.get('test_cases')
                if test_cases:
                    print(f"Test Cases Type: {type(test_cases)}")
                    if isinstance(test_cases, list) and len(test_cases) > 0:
                        print(f"First Test Case: {test_cases[0]}")
                    else:
                        print(f"Test Cases: {test_cases}")
                
                # Show all available fields
                print(f"Available fields: {list(problem.keys())}")
        else:
            print("No problems found in the database")
            
    except Exception as e:
        print(f"Error inspecting problems table: {e}")

def inspect_interview_sessions_table(supabase: Client):
    """Inspect the interview_sessions table structure"""
    print("\n=== INTERVIEW SESSIONS TABLE INSPECTION ===")
    
    try:
        # Get a few sample interview sessions
        response = supabase.table('interview_sessions').select('*').limit(3).execute()
        
        if response.data:
            print(f"Found {len(response.data)} sample interview sessions:")
            for i, session in enumerate(response.data, 1):
                print(f"\n--- Interview Session {i} ---")
                print(f"ID: {session.get('id')}")
                print(f"Company ID: {session.get('company_id')}")
                print(f"Candidate ID: {session.get('candidate_id')}")
                print(f"Problem ID: {session.get('problem_id')}")
                print(f"Status: {session.get('status')}")
                print(f"Available fields: {list(session.keys())}")
        else:
            print("No interview sessions found in the database")
            
    except Exception as e:
        print(f"Error inspecting interview_sessions table: {e}")

def check_table_schema(supabase: Client, table_name: str):
    """Get the schema information for a table"""
    print(f"\n=== {table_name.upper()} TABLE SCHEMA ===")
    
    try:
        # This might not work with all Supabase setups, but worth trying
        response = supabase.rpc('get_table_schema', {'table_name': table_name}).execute()
        if response.data:
            print(json.dumps(response.data, indent=2))
    except Exception as e:
        print(f"Could not get schema for {table_name}: {e}")
        print("Note: Schema inspection might not be available with current permissions")

def main():
    print("CodeSage Supabase Database Inspector")
    print("===================================")
    
    supabase = get_supabase_client()
    if not supabase:
        return
    
    # Inspect problems table
    inspect_problems_table(supabase)
    
    # Inspect interview sessions table
    inspect_interview_sessions_table(supabase)
    
    # Try to get schema info
    check_table_schema(supabase, 'problems')
    check_table_schema(supabase, 'interview_sessions')
    
    print("\n=== INSPECTION COMPLETE ===")

if __name__ == "__main__":
    main()
