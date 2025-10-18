#!/usr/bin/env python3
"""
Script to parse problems from markdown file and add them to the database.
"""

import re
import uuid
import sys
import os
from typing import List, Dict, Any

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.problem import Problem
from app.models.company import Company
from app.models.user import CompanyUser

def parse_markdown_problems(file_path: str) -> List[Dict[str, Any]]:
    """Parse problems from markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    problems = []
    
    # Split by "-----" separator or "# Problem" headers
    problem_sections = re.split(r'(?=# Problem \d+)', content)
    
    for section in problem_sections:
        if not section.strip() or '# Problem' not in section:
            continue
            
        problem = parse_single_problem(section)
        if problem:
            problems.append(problem)
    
    return problems

def parse_single_problem(section: str) -> Dict[str, Any]:
    """Parse a single problem from markdown section."""
    lines = section.strip().split('\n')
    
    # Extract problem number and title
    title_match = re.match(r'# Problem (\d+)(?:\s*-\s*(.+))?', lines[0])
    if not title_match:
        return None
    
    problem_num = title_match.group(1)
    problem_title = title_match.group(2) or f"Problem {problem_num}"
    
    # Initialize problem data
    problem_data = {
        'title': problem_title.strip(),
        'description': '',
        'difficulty': 'Medium',  # Default difficulty
        'category': 'Algorithm',  # Default category
        'tags': ['competitive-programming'],
        'programming_languages': ['python', 'cpp', 'java'],
        'time_limit_minutes': 60,
        'memory_limit_mb': 256,
        'starter_code': [],
        'test_cases': None,
        'solution': None,
        'hints': None
    }
    
    current_section = None
    description_lines = []
    input_lines = []
    output_lines = []
    constraints_lines = []
    examples_lines = []
    
    for line in lines[1:]:  # Skip the title line
        line = line.strip()
        
        if line.startswith('## '):
            current_section = line[3:].lower()
        elif line.startswith('### '):
            current_section = line[4:].lower()
        elif line == '-----':
            break
        elif line:
            if current_section is None:
                # This is part of the main description
                description_lines.append(line)
            elif 'input' in current_section:
                input_lines.append(line)
            elif 'output' in current_section:
                output_lines.append(line)
            elif 'constraint' in current_section:
                constraints_lines.append(line)
            elif 'example' in current_section or 'input' in current_section or 'output' in current_section:
                examples_lines.append(line)
            else:
                description_lines.append(line)
        elif current_section:
            # Empty line within a section
            if 'input' in current_section:
                input_lines.append('')
            elif 'output' in current_section:
                output_lines.append('')
            elif 'constraint' in current_section:
                constraints_lines.append('')
            elif 'example' in current_section:
                examples_lines.append('')
    
    # Build the complete description
    description_parts = []
    
    if description_lines:
        description_parts.append('\n'.join(description_lines).strip())
    
    if input_lines:
        description_parts.append('## Input\n' + '\n'.join(input_lines).strip())
    
    if output_lines:
        description_parts.append('## Output\n' + '\n'.join(output_lines).strip())
    
    if constraints_lines:
        description_parts.append('## Constraints\n' + '\n'.join(constraints_lines).strip())
    
    if examples_lines:
        description_parts.append('## Examples\n' + '\n'.join(examples_lines).strip())
    
    problem_data['description'] = '\n\n'.join(description_parts)
    
    # Determine difficulty based on problem complexity (simple heuristic)
    description_lower = problem_data['description'].lower()
    if any(word in description_lower for word in ['tree', 'graph', 'dynamic', 'segment', 'binary indexed']):
        problem_data['difficulty'] = 'hard'
    elif any(word in description_lower for word in ['array', 'string', 'hash', 'two pointer']):
        problem_data['difficulty'] = 'medium'
    else:
        problem_data['difficulty'] = 'easy'
    
    # Determine category based on keywords - using database allowed values
    if any(word in description_lower for word in ['tree', 'node', 'binary tree']):
        problem_data['category'] = 'trees'
    elif any(word in description_lower for word in ['graph', 'dfs', 'bfs', 'city', 'flight', 'route']):
        problem_data['category'] = 'graphs'
    elif any(word in description_lower for word in ['dynamic programming', 'dp', 'memoization', 'coin', 'ways']):
        problem_data['category'] = 'dp'
    elif any(word in description_lower for word in ['array', 'subarray', 'sum', 'median', 'window']):
        problem_data['category'] = 'arrays'
    elif any(word in description_lower for word in ['string', 'palindrome', 'substring', 'character']):
        problem_data['category'] = 'strings'
    elif any(word in description_lower for word in ['data structure', 'segment tree', 'binary indexed']):
        problem_data['category'] = 'data-structures'
    else:
        problem_data['category'] = 'algorithms'
    
    # Add some basic starter code templates
    problem_data['starter_code'] = [
        {
            'language': 'python',
            'code': f'''def solve():
    # Your solution here
    pass

# Read input and call solve function
if __name__ == "__main__":
    solve()'''
        },
        {
            'language': 'cpp',
            'code': f'''#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {{
    // Your solution here
    return 0;
}}'''
        },
        {
            'language': 'java',
            'code': f'''import java.util.*;
import java.io.*;

public class Solution {{
    public static void main(String[] args) {{
        Scanner sc = new Scanner(System.in);
        // Your solution here
    }}
}}'''
        }
    ]
    
    return problem_data

def create_company_user_if_not_exists(db: Session, company_id: str) -> str:
    """Create a company user if one doesn't exist."""
    # Check if company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        print(f"Company with ID {company_id} not found!")
        return None
    
    # Check if a company user already exists for this company
    company_user = db.query(CompanyUser).filter(CompanyUser.company_id == company_id).first()
    
    if not company_user:
        # Create a default company user
        company_user = CompanyUser(
            id=str(uuid.uuid4()),
            company_id=company_id,
            email=f"admin@{company.name.lower().replace(' ', '')}.com",
            name="System Admin",
            role="admin",
            is_active=True
        )
        db.add(company_user)
        db.commit()
        db.refresh(company_user)
        print(f"Created company user: {company_user.id}")
    
    return company_user.id

def add_problems_to_database(problems: List[Dict[str, Any]], company_id: str):
    """Add problems to the database."""
    db = next(get_db())
    
    try:
        # Get or create a company user
        created_by = create_company_user_if_not_exists(db, company_id)
        if not created_by:
            print("Failed to get or create company user")
            return
        
        added_count = 0
        for problem_data in problems:
            # Create problem instance
            problem = Problem(
                id=str(uuid.uuid4()),
                company_id=company_id,
                created_by=created_by,
                title=problem_data['title'],
                description=problem_data['description'],
                difficulty=problem_data['difficulty'],
                category=problem_data['category'],
                tags=problem_data['tags'],
                programming_languages=problem_data['programming_languages'],
                time_limit_minutes=problem_data['time_limit_minutes'],
                memory_limit_mb=problem_data['memory_limit_mb'],
                starter_code=problem_data['starter_code'],
                test_cases=problem_data['test_cases'],
                solution=problem_data['solution'],
                hints=problem_data['hints'],
                is_active=True,
                usage_count=0
            )
            
            db.add(problem)
            added_count += 1
            print(f"Added problem: {problem.title}")
        
        db.commit()
        print(f"\nSuccessfully added {added_count} problems to the database!")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding problems to database: {e}")
        raise
    finally:
        db.close()

def main():
    """Main function to parse markdown and add problems."""
    # Path to the markdown file
    markdown_file = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
        'src', 
        'problems.md'
    )
    
    company_id = '96ab8f63-f6dd-4c77-a7e6-b4e2bba75e1d'
    
    if not os.path.exists(markdown_file):
        print(f"Markdown file not found: {markdown_file}")
        return
    
    print(f"Parsing problems from: {markdown_file}")
    print(f"Company ID: {company_id}")
    
    # Parse problems from markdown
    problems = parse_markdown_problems(markdown_file)
    print(f"Parsed {len(problems)} problems")
    
    # Add problems to database
    add_problems_to_database(problems, company_id)

if __name__ == "__main__":
    main()