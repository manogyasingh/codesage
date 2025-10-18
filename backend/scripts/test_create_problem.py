#!/usr/bin/env python3

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
import json
from app.db.session import get_db
from app.models import Problem
from datetime import datetime, timezone

def test_create_problem():
    db = next(get_db())
    try:
        # Create a test problem with proper UUIDs
        problem_data = {
            'id': str(uuid.uuid4()),
            'company_id': '96ab8f63-f6dd-4c77-a7e6-b4e2bba75e1d',  # From your debug info
            'created_by': 'a3b9227f-7338-402d-85e5-0e768b997d39',   # From your debug info
            'title': 'Test Problem Direct Insert',
            'description': 'A test problem created directly in the database',
            'difficulty': 'medium',
            'category': 'algorithms',
            'tags': ['test', 'direct-insert'],
            'programming_languages': ['Python'],
            'time_limit_minutes': 60,
            'memory_limit_mb': 256,
            'starter_code': [{'language': 'Python', 'code': 'def solution():\n    pass'}],
            'test_cases': [{'id': str(uuid.uuid4()), 'input': '1', 'expected_output': '1', 'is_hidden': False}],
            'solution': None,
            'hints': ['Try a simple approach'],
            'is_active': True,
            'usage_count': 0,
            'average_completion_time': None,
            'success_rate': None,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc)
        }
        
        print("Creating problem with data:")
        print(json.dumps(problem_data, indent=2, default=str))
        
        problem = Problem(**problem_data)
        db.add(problem)
        db.commit()
        db.refresh(problem)
        
        print(f"✅ Problem created successfully with ID: {problem.id}")
        return problem.id
        
    except Exception as e:
        print(f"❌ Error creating problem: {e}")
        db.rollback()
        return None
    finally:
        db.close()

if __name__ == "__main__":
    test_create_problem()