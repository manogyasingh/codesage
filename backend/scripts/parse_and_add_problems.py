#!/usr/bin/env python3
"""
Script to parse problems from markdown file and add them to the database
"""
import os
import sys
import re
import uuid
from typing import List, Dict, Any

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import SessionLocal
from app.models.problem import Problem
from app.models.user import CompanyUser
from app.models.company import Company


def parse_markdown_problems(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse the markdown file and extract problem information
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split by problem separators (-----)
    problems_raw = content.split('-----')
    problems = []
    
    for i, problem_text in enumerate(problems_raw):
        problem_text = problem_text.strip()
        if not problem_text:
            continue
            
        # Extract problem number and title from the first line
        title_match = re.match(r'^#\s*Problem\s*(\d+)\s*$', problem_text.split('\n')[0])
        if not title_match:
            continue
            
        problem_num = int(title_match.group(1))
        
        # Extract the problem description (everything after the title until ## Input)
        lines = problem_text.split('\n')[1:]  # Skip the title line
        description_lines = []
        
        for line in lines:
            if line.strip().startswith('## Input'):
                break
            description_lines.append(line)
        
        description = '\n'.join(description_lines).strip()
        
        # Extract input section
        input_section = ""
        input_start = problem_text.find('## Input')
        if input_start != -1:
            input_end = problem_text.find('## Output', input_start)
            if input_end != -1:
                input_section = problem_text[input_start:input_end].replace('## Input', '').strip()
        
        # Extract output section
        output_section = ""
        output_start = problem_text.find('## Output')
        if output_start != -1:
            output_end = problem_text.find('## Constraints', output_start)
            if output_end == -1:
                output_end = problem_text.find('## Example', output_start)
            if output_end != -1:
                output_section = problem_text[output_start:output_end].replace('## Output', '').strip()
        
        # Extract constraints section
        constraints_section = ""
        constraints_start = problem_text.find('## Constraints')
        if constraints_start != -1:
            constraints_end = problem_text.find('## Example', constraints_start)
            if constraints_end != -1:
                constraints_section = problem_text[constraints_start:constraints_end].replace('## Constraints', '').strip()
        
        # Extract examples section
        examples_section = ""
        examples_start = problem_text.find('## Example')
        if examples_start != -1:
            examples_section = problem_text[examples_start:].replace('## Example', '').strip()
        elif problem_text.find('## Examples') != -1:
            examples_start = problem_text.find('## Examples')
            examples_section = problem_text[examples_start:].replace('## Examples', '').strip()
        
        # Determine difficulty based on problem characteristics
        difficulty = "medium"  # Default
        if problem_num in [1, 2, 3]:
            difficulty = "easy"
        elif problem_num in [9, 10, 11]:
            difficulty = "hard"
        
        # Determine category based on problem content
        category = "algorithms"
        if "tree" in description.lower() or "subtree" in description.lower():
            category = "trees"
        elif "graph" in description.lower() or "shortest" in description.lower():
            category = "graphs"
        elif "string" in description.lower() or "palindrome" in description.lower():
            category = "strings"
        elif "array" in description.lower() or "subarray" in description.lower():
            category = "arrays"
        elif "dynamic" in description.lower() or "coin" in description.lower():
            category = "dynamic-programming"
        
        # Create full description combining all sections
        full_description = description
        if input_section:
            full_description += f"\n\n## Input\n{input_section}"
        if output_section:
            full_description += f"\n\n## Output\n{output_section}"
        if constraints_section:
            full_description += f"\n\n## Constraints\n{constraints_section}"
        if examples_section:
            full_description += f"\n\n## Examples\n{examples_section}"
        
        problem_data = {
            'title': f'Problem {problem_num}',
            'description': full_description,
            'difficulty': difficulty,
            'category': category,
            'tags': [category, difficulty],
            'programming_languages': ['python', 'java', 'cpp', 'javascript'],
            'time_limit_minutes': 60,
            'memory_limit_mb': 256,
            'starter_code': [],
            'test_cases': None,
            'solution': None,
            'hints': [],
        }
        
        problems.append(problem_data)
    
    return problems


def ensure_company_user_exists(db: SessionLocal, company_id: str) -> str:
    """
    Ensure a company user exists for the given company, create one if not
    """
    # Check if company exists
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        print(f"❌ Company with ID {company_id} not found!")
        return None
    
    # Check if a company user already exists
    company_user = db.query(CompanyUser).filter(CompanyUser.company_id == company_id).first()
    
    if not company_user:
        # Create a default company user
        user_id = str(uuid.uuid4())
        company_user = CompanyUser(
            id=user_id,
            company_id=company_id,
            email="admin@company.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            password_hash="default_hash_change_me",
            is_active=True
        )
        db.add(company_user)
        db.commit()
        print(f"✅ Created default company user with ID: {user_id}")
    else:
        print(f"✅ Found existing company user with ID: {company_user.id}")
    
    return company_user.id


def add_problems_to_database(problems: List[Dict[str, Any]], company_id: str, created_by: str):
    """
    Add problems to the database
    """
    db = SessionLocal()
    try:
        print(f"Adding {len(problems)} problems to database...")
        
        for i, problem_data in enumerate(problems):
            # Generate unique problem ID
            problem_id = str(uuid.uuid4())
            
            problem = Problem(
                id=problem_id,
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
            print(f"✅ Added: {problem_data['title']}")
        
        db.commit()
        print(f"🎉 Successfully added {len(problems)} problems to the database!")
        
    except Exception as e:
        print(f"❌ Error adding problems to database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def main():
    """
    Main function to parse markdown and add problems to database
    """
    # Configuration
    COMPANY_ID = "96ab8f63-f6dd-4c77-a7e6-b4e2bba75e1d"
    MARKDOWN_FILE = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "src",
        "problems.md"
    )
    
    print("🚀 Starting problem parsing and database insertion...")
    print(f"Company ID: {COMPANY_ID}")
    print(f"Markdown file: {MARKDOWN_FILE}")
    
    # Check if markdown file exists
    if not os.path.exists(MARKDOWN_FILE):
        print(f"❌ Markdown file not found: {MARKDOWN_FILE}")
        return
    
    # Parse problems from markdown
    print("📖 Parsing problems from markdown...")
    problems = parse_markdown_problems(MARKDOWN_FILE)
    print(f"✅ Parsed {len(problems)} problems")
    
    # Ensure company user exists
    db = SessionLocal()
    try:
        created_by = ensure_company_user_exists(db, COMPANY_ID)
        if not created_by:
            return
    finally:
        db.close()
    
    # Add problems to database
    add_problems_to_database(problems, COMPANY_ID, created_by)
    
    print("✨ All done!")


if __name__ == "__main__":
    main()