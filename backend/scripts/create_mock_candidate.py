#!/usr/bin/env python3
"""
Create mock candidate and interview session for testing candidate portal
"""
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.session import get_db
from app.models import Candidate, InterviewSession, Problem, Company, CompanyUser

def create_mock_candidate_data():
    """Create mock candidate, problem, and interview session"""
    db = next(get_db())
    
    try:
        # Check if candidate already exists
        existing_candidate = db.query(Candidate).filter(Candidate.email == "candidate@example.com").first()
        if existing_candidate:
            print("✅ Mock candidate already exists!")
        else:
            # Create candidate
            candidate_id = str(uuid.uuid4())
            candidate = Candidate(
                id=candidate_id,
                email="candidate@example.com",
                first_name="Test",
                last_name="Candidate",
                experience_level="mid",
                location="Remote",
                skills=["Python", "JavaScript", "React"],
                preferred_languages=["python", "javascript"],
                github_profile="https://github.com/testcandidate",
                linkedin_profile="https://linkedin.com/in/testcandidate",
                resume_url="https://example.com/resume.pdf",
                availability_status="available"
            )
            db.add(candidate)
            print("✅ Mock candidate created!")

        # Check if problem exists (check by title since ID will be UUID)
        existing_problem = db.query(Problem).filter(Problem.title == "Two Sum Problem").first()
        if existing_problem:
            print("✅ Mock problem already exists!")
        else:
            # Get the existing company (look by email since ID might vary)
            company = db.query(Company).filter(Company.email == "company@example.com").first()
            if not company:
                print("❌ Mock company not found. Please run create_mock_company.py first.")
                return False
            
            # Get admin user as problem creator
            admin_user = db.query(CompanyUser).filter(CompanyUser.email == "admin@example.com").first()
            if not admin_user:
                print("❌ Admin user not found. Please run create_mock_company.py first.")
                return False
            
            # Create problem
            problem_id = str(uuid.uuid4())
            problem = Problem(
                id=problem_id,
                company_id=company.id,
                created_by=admin_user.id,
                title="Two Sum Problem",
                category="algorithms",
                description="""Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

**Example 2:**
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```

**Constraints:**
- 2 ≤ nums.length ≤ 10⁴
- -10⁹ ≤ nums[i] ≤ 10⁹
- -10⁹ ≤ target ≤ 10⁹
- Only one valid answer exists.""",
                difficulty="easy",
                programming_languages=["python", "javascript", "java"],
                time_limit_minutes=30,
                starter_code=[
                    {
                        "language": "python",
                        "code": """def two_sum(nums, target):
    \"\"\"
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    \"\"\"
    pass"""
                    },
                    {
                        "language": "javascript", 
                        "code": """/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    
};"""
                    },
                    {
                        "language": "java",
                        "code": """class Solution {
    public int[] twoSum(int[] nums, int target) {
        
    }
}"""
                    }
                ],
                test_cases=[
                    {
                        "id": 1,
                        "input": {"nums": [2, 7, 11, 15], "target": 9},
                        "expected_output": [0, 1],
                        "is_hidden": False
                    },
                    {
                        "id": 2,
                        "input": {"nums": [3, 2, 4], "target": 6},
                        "expected_output": [1, 2],
                        "is_hidden": False
                    },
                    {
                        "id": 3,
                        "input": {"nums": [3, 3], "target": 6},
                        "expected_output": [0, 1],
                        "is_hidden": True
                    }
                ],
                tags=["array", "hash-table", "two-pointers"],
                is_active=True
            )
            db.add(problem)
            print("✅ Mock problem created!")

        # Commit the candidate and problem before creating interview session
        db.commit()

        # Check if interview session exists (check by candidate email since ID will be UUID)
        candidate_check = db.query(Candidate).filter(Candidate.email == "candidate@example.com").first()
        existing_interview = None
        if candidate_check:
            existing_interview = db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate_check.id).first()
        
        if existing_interview:
            print("✅ Mock interview session already exists!")
        else:
            # Get references with error checking
            candidate = db.query(Candidate).filter(Candidate.email == "candidate@example.com").first()
            if not candidate:
                print("❌ Candidate not found")
                return False
                
            problem = db.query(Problem).filter(Problem.title == "Two Sum Problem").first()
            if not problem:
                print("❌ Problem not found")
                return False
                
            company = db.query(Company).filter(Company.email == "company@example.com").first()
            if not company:
                print("❌ Company not found")
                return False
                
            interviewer = db.query(CompanyUser).filter(CompanyUser.email == "admin@example.com").first()
            if not interviewer:
                print("❌ Interviewer not found")
                return False
            
            print(f"✅ Found candidate: {candidate.id}")
            print(f"✅ Found problem: {problem.id}")
            print(f"✅ Found company: {company.id}")
            print(f"✅ Found interviewer: {interviewer.id}")
            
            # Create interview session
            interview_session_id = str(uuid.uuid4())
            interview_session = InterviewSession(
                id=interview_session_id,
                company_id=company.id,
                interviewer_id=interviewer.id,
                candidate_id=candidate.id,
                problem_id=problem.id,
                status="scheduled",
                scheduled_at=datetime.now(timezone.utc) + timedelta(minutes=5),
                duration_minutes=60
            )
            db.add(interview_session)
            print("✅ Mock interview session created!")

        db.commit()
        
        # Get the actual interview session ID that was created
        candidate = db.query(Candidate).filter(Candidate.email == "candidate@example.com").first()
        interview = db.query(InterviewSession).filter(InterviewSession.candidate_id == candidate.id).first()
        
        print("\n🎉 Mock candidate data created successfully!")
        print("📋 Test Credentials:")
        print(f"📧 Candidate Email: candidate@example.com")
        print(f"🔢 Interview ID: {interview.id}")
        print("\n🚀 You can now test the Candidate Portal!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating mock candidate data: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("👤 Creating Mock Candidate Data for Testing...")
    success = create_mock_candidate_data()
    if not success:
        sys.exit(1)