# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session
# from datetime import datetime, timezone
# import uuid

# from app.db.session import get_db
# from app.models import InterviewSession, Problem
# from app.schemas.interview import InterviewSessionOut, InterviewSessionCreate, InterviewSessionUpdate
# from pydantic import BaseModel
# from typing import List, Dict, Any
# from app.schemas.problem import ProblemOut
# from app.deps.auth import get_current_user


# router = APIRouter()


# @router.get("/", response_model=list[InterviewSessionOut])
# def list_interviews(db: Session = Depends(get_db), user=Depends(get_current_user)):
#     company_uuid = uuid.UUID(user.company_id)
#     return db.query(InterviewSession).filter(InterviewSession.company_id == company_uuid).all()


# @router.post("/", response_model=InterviewSessionOut)
# def schedule_interview(payload: InterviewSessionCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     import uuid
#     user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
#     payload_company_uuid = uuid.UUID(payload.company_id) if isinstance(payload.company_id, str) else payload.company_id
    
#     if payload_company_uuid != user_company_uuid:
#         raise HTTPException(status_code=403, detail="Cross-company creation forbidden")
#     model = InterviewSession(**payload.model_dump())
#     db.add(model)
#     db.commit()
#     db.refresh(model)
#     return model


# @router.get("/{id}", response_model=InterviewSessionOut)
# def get_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     import uuid
#     user_company_uuid = uuid.UUID(user.company_id) if isinstance(user.company_id, str) else user.company_id
#     model = db.get(InterviewSession, id)
#     if not model or model.company_id != user_company_uuid:
#         raise HTTPException(status_code=404, detail="Interview not found")
#     return model


# @router.put("/{id}", response_model=InterviewSessionOut)
# def update_interview(id: str, payload: InterviewSessionUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     model = db.get(InterviewSession, id)
#     if not model or model.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")
#     for k, v in payload.model_dump(exclude_none=True).items():
#         setattr(model, k, v)
#     db.add(model)
#     db.commit()
#     db.refresh(model)
#     return model


# @router.delete("/{id}")
# def cancel_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     model = db.get(InterviewSession, id)
#     if not model or model.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")
#     db.delete(model)
#     db.commit()
#     return {"status": "deleted"}


# @router.post("/{id}/start")
# def start_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     model = db.get(InterviewSession, id)
#     if not model or model.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")
#     model.status = "in_progress"
#     db.add(model)
#     db.commit()
#     return {"status": "started"}


# @router.post("/{id}/end")
# def end_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     model = db.get(InterviewSession, id)
#     if not model or model.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")
#     model.status = "completed"
#     db.add(model)
#     db.commit()
#     return {"status": "ended"}


# @router.get("/{id}/live")
# def live_session(id: str):
#     return {"ws": "/ws/interviews/%s" % id}


# @router.get("/{id}/problem", response_model=ProblemOut)
# def get_interview_problem(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
#     """Get the problem associated with an interview session"""
#     # First get the interview session
#     interview = db.get(InterviewSession, id)
#     if not interview or interview.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")

#     # Then get the associated problem
#     problem = db.get(Problem, interview.problem_id)
#     if not problem:
#         raise HTTPException(status_code=404, detail="Problem not found")

#     # Verify the problem belongs to the same company (security check)
#     if problem.company_id != user.company_id:
#         raise HTTPException(status_code=403, detail="Access denied")

#     return ProblemOut.from_orm(problem)


# @router.get("/{id}/candidate-access", response_model=dict)
# def get_interview_for_candidate(id: str, db: Session = Depends(get_db)):
#     """Public endpoint for candidates to access interview session and all company problems"""
#     try:
#         # Get the interview session
#         interview = db.get(InterviewSession, id)
#         if not interview:
#             raise HTTPException(status_code=404, detail="Interview not found")

#         # Get ALL problems from the same company
#         all_problems = db.query(Problem).filter(
#             Problem.company_id == interview.company_id,
#             Problem.is_active == True
#         ).all()

#         if not all_problems:
#             raise HTTPException(status_code=404, detail="No problems found for this company")

#         # Get the main problem for this interview
#         main_problem = db.get(Problem, interview.problem_id)
#         if not main_problem:
#             raise HTTPException(status_code=404, detail="Interview problem not found")

#         def format_problem_for_candidate(problem):
#             """Format a single problem for candidate access"""
#             return {
#                 "id": problem.id,
#                 "title": problem.title,
#                 "description": problem.description,
#                 "difficulty": problem.difficulty,
#                 "category": problem.category,
#                 "tags": problem.tags or [],
#                 "programming_languages": problem.programming_languages or [],
#                 "time_limit_minutes": problem.time_limit_minutes,
#                 "starter_code": problem.starter_code or [],
#                 "test_cases": problem.test_cases,  # Return as varchar string directly
#                 "hints": problem.hints or [],
#                 "solution": problem.solution  # Include solution field for comparison
#             }

#         # Format all problems
#         formatted_problems = [format_problem_for_candidate(p) for p in all_problems]

#         # Find the main problem in the formatted list
#         main_problem_formatted = next(
#             (p for p in formatted_problems if p["id"] == main_problem.id),
#             formatted_problems[0] if formatted_problems else None
#         )

#         # Return interview data with all problems
#         return {
#             "interview": {
#                 "id": interview.id,
#                 "status": interview.status,
#                 "scheduled_at": interview.scheduled_at.isoformat() if interview.scheduled_at else None,
#                 "started_at": interview.started_at.isoformat() if interview.started_at else None,
#                 "duration_minutes": interview.duration_minutes,
#                 "main_problem_id": main_problem.id  # Indicate which problem is the main one
#             },
#             "problem": main_problem_formatted,  # Main problem for backward compatibility
#             "problems": formatted_problems  # All problems for switching
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Unexpected error in candidate access endpoint: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# @router.post("/{id}/code")
# def submit_code(id: str, code: str, language: str):
#     return {"status": "received"}


# @router.post("/{id}/execute")
# def execute_code(id: str, code: str, language: str):
#     return {"success": True, "output": "", "error": None}


# @router.post("/{id}/feedback")
# def submit_feedback(id: str, feedback: str):
#     return {"status": "ok"}


# @router.post("/{id}/execute-code")
# async def execute_code_with_validation(
#     id: str,
#     payload: dict,
#     db: Session = Depends(get_db)
# ):
#     """Execute code against test cases and validate results using existing Piston approach"""
#     try:
#         import aiohttp
#         import asyncio

#         code = payload.get("code", "")
#         language = payload.get("language", "")
#         problem_id = payload.get("problem_id", "")

#         if not code or not language or not problem_id:
#             raise HTTPException(status_code=400, detail="Missing required fields: code, language, problem_id")

#         # Get the interview session
#         interview = db.get(InterviewSession, id)
#         if not interview:
#             raise HTTPException(status_code=404, detail="Interview not found")

#         # Get the problem
#         problem = db.query(Problem).filter(
#             Problem.id == problem_id,
#             Problem.company_id == interview.company_id,
#             Problem.is_active == True
#         ).first()

#         if not problem:
#             raise HTTPException(status_code=404, detail="Problem not found")

#         # Parse test cases from varchar format
#         formatted_test_cases = []

#         if problem.test_cases and isinstance(problem.test_cases, str):
#             try:
#                 # Remove any extra quotes if present
#                 test_cases_str = problem.test_cases.strip().strip('"\'')

#                 # Split by double newlines to separate test cases
#                 test_case_blocks = test_cases_str.strip().split('\n\n')

#                 for i, block in enumerate(test_case_blocks):
#                     if block.strip():
#                         lines = block.strip().split('\n')
#                         if len(lines) >= 2:
#                             # All lines except the last are input, last line is expected output
#                             input_lines = lines[:-1]
#                             expected_output = lines[-1]

#                             formatted_test_cases.append({
#                                 "id": str(i + 1),
#                                 "input": '\n'.join(input_lines),
#                                 "expected_output": expected_output
#                             })
#             except Exception as e:
#                 print(f"Error parsing test cases: {e}")

#         # Language mapping (matching the working frontend approach)
#         language_map = {
#             'python': {'language': 'python', 'version': '3.10.0'},
#             'javascript': {'language': 'javascript', 'version': '18.15.0'},
#             'java': {'language': 'java', 'version': '15.0.2'},
#             'cpp': {'language': 'c++', 'version': '10.2.0'},
#             'typescript': {'language': 'typescript', 'version': '5.0.3'}
#         }

#         # Use the existing working Piston server URL
#         piston_url = "http://13.221.248.158/api/v2/execute"

#         # Execute code using direct HTTP calls (matching working approach)
#         execution_results = []

#         for test_case in formatted_test_cases:
#             test_input = test_case.get('input', '')
#             expected_output = test_case.get('expected_output', '')

#             if language not in language_map:
#                 execution_results.append({
#                     "test_case_id": test_case["id"],
#                     "input": test_input,
#                     "expected_output": expected_output,
#                     "actual_output": "",
#                     "stderr": f"Unsupported language: {language}",
#                     "passed": False,
#                     "execution_time": 0,
#                     "memory_used": 0,
#                     "exit_code": 1
#                 })
#                 continue

#             lang_config = language_map[language]

#             # Prepare Piston payload (matching working format)
#             piston_payload = {
#                 "language": lang_config['language'],
#                 "version": lang_config['version'],
#                 "files": [{
#                     "content": code
#                 }],
#                 "stdin": test_input,
#                 "compile_timeout": 10,
#                 "run_timeout": 10
#             }

#             try:
#                 async with aiohttp.ClientSession() as session:
#                     async with session.post(
#                         piston_url,
#                         json=piston_payload,
#                         timeout=aiohttp.ClientTimeout(total=15)
#                     ) as response:
#                         if response.status != 200:
#                             error_text = await response.text()
#                             execution_results.append({
#                                 "test_case_id": test_case["id"],
#                                 "input": test_input,
#                                 "expected_output": expected_output,
#                                 "actual_output": "",
#                                 "stderr": f"Piston API error: {error_text}",
#                                 "passed": False,
#                                 "execution_time": 0,
#                                 "memory_used": 0,
#                                 "exit_code": response.status
#                             })
#                             continue

#                         result = await response.json()

#                         # Parse Piston response (matching working format)
#                         run_result = result.get('run', {})
#                         compile_result = result.get('compile', {})

#                         # Check for compilation errors
#                         if compile_result and compile_result.get('code', 0) != 0:
#                             execution_results.append({
#                                 "test_case_id": test_case["id"],
#                                 "input": test_input,
#                                 "expected_output": expected_output,
#                                 "actual_output": compile_result.get('stdout', ''),
#                                 "stderr": compile_result.get('stderr', ''),
#                                 "passed": False,
#                                 "execution_time": 0,
#                                 "memory_used": 0,
#                                 "exit_code": compile_result.get('code', 1)
#                             })
#                             continue

#                         # Parse runtime result
#                         actual_output = run_result.get('stdout', '').strip()
#                         expected_output_clean = expected_output.strip()

#                         is_correct = (
#                             run_result.get('code', 0) == 0 and
#                             actual_output == expected_output_clean
#                         )

#                         execution_results.append({
#                             "test_case_id": test_case["id"],
#                             "input": test_input,
#                             "expected_output": expected_output_clean,
#                             "actual_output": actual_output,
#                             "stderr": run_result.get('stderr', ''),
#                             "passed": is_correct,
#                             "execution_time": 0,  # Piston doesn't return timing info
#                             "memory_used": 0,     # Piston doesn't return memory info
#                             "exit_code": run_result.get('code', 0)
#                         })

#             except asyncio.TimeoutError:
#                 execution_results.append({
#                     "test_case_id": test_case["id"],
#                     "input": test_input,
#                     "expected_output": expected_output,
#                     "actual_output": "",
#                     "stderr": "Execution timeout",
#                     "passed": False,
#                     "execution_time": 10,
#                     "memory_used": 0,
#                     "exit_code": 124
#                 })
#             except Exception as e:
#                 execution_results.append({
#                     "test_case_id": test_case["id"],
#                     "input": test_input,
#                     "expected_output": expected_output,
#                     "actual_output": "",
#                     "stderr": f"Execution error: {str(e)}",
#                     "passed": False,
#                     "execution_time": 0,
#                     "memory_used": 0,
#                     "exit_code": 1
#                 })

#         # Calculate overall results
#         passed_count = sum(1 for result in execution_results if result.get("passed", False))
#         total_count = len(execution_results)
#         success_rate = (passed_count / total_count * 100) if total_count > 0 else 0

#         # Compare with solution if available
#         solution_comparison = None
#         if problem.solution and isinstance(problem.solution, dict):
#             solution_code = problem.solution.get("code", "")
#             if solution_code and language in problem.solution.get("language", ""):
#                 solution_comparison = {
#                     "has_solution": True,
#                     "solution_language": problem.solution.get("language", ""),
#                     "solution_explanation": problem.solution.get("explanation", ""),
#                     "time_complexity": problem.solution.get("time_complexity", ""),
#                     "space_complexity": problem.solution.get("space_complexity", "")
#                 }
#             else:
#                 solution_comparison = {"has_solution": False}

#         return {
#             "success": True,
#             "execution_results": execution_results,
#             "summary": {
#                 "passed_count": passed_count,
#                 "total_count": total_count,
#                 "success_rate": success_rate,
#                 "all_passed": passed_count == total_count
#             },
#             "solution_comparison": solution_comparison,
#             "problem_id": problem_id,
#             "language": language
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error in code execution: {e}")
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")


# @router.get("/{id}/switch-problem/{problem_id}")
# def switch_problem(id: str, problem_id: str, db: Session = Depends(get_db)):
#     """Switch to a different problem within the same interview session"""
#     try:
#         # Get the interview session
#         interview = db.get(InterviewSession, id)
#         if not interview:
#             raise HTTPException(status_code=404, detail="Interview not found")

#         # Get the requested problem
#         problem = db.query(Problem).filter(
#             Problem.id == problem_id,
#             Problem.company_id == interview.company_id,
#             Problem.is_active == True
#         ).first()

#         if not problem:
#             raise HTTPException(status_code=404, detail="Problem not found or not accessible")

#         # Format the problem for candidate access (reuse the formatting logic)
#         def format_problem_for_candidate(problem):
#             """Format a single problem for candidate access"""
#             return {
#                 "id": problem.id,
#                 "title": problem.title,
#                 "description": problem.description,
#                 "difficulty": problem.difficulty,
#                 "category": problem.category,
#                 "tags": problem.tags or [],
#                 "programming_languages": problem.programming_languages or [],
#                 "time_limit_minutes": problem.time_limit_minutes,
#                 "starter_code": problem.starter_code or [],
#                 "test_cases": problem.test_cases,  # Return as varchar string directly
#                 "hints": problem.hints or [],
#                 "solution": problem.solution
#             }

#         formatted_problem = format_problem_for_candidate(problem)

#         return {
#             "success": True,
#             "problem": formatted_problem,
#             "switched_at": datetime.now(timezone.utc).isoformat()
#         }

#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error switching problem: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to switch problem: {str(e)}")


# # Schema for submitting interview analysis results
# class InterviewAnalysisSubmission(BaseModel):
#     session_id: str
#     analysis: str
#     metrics: Dict[str, Any]
#     transcript_summary: List[Dict[str, Any]]
#     journal_notes: List[str]
#     final_code: str


# @router.post("/{id}/submit-analysis", response_model=InterviewSessionOut)
# def submit_interview_analysis(
#     id: str, 
#     analysis_data: InterviewAnalysisSubmission, 
#     db: Session = Depends(get_db)
# ):
#     """Public endpoint for submitting interview analysis results (called by candidate interface)"""
#     try:
#         # Get the interview session
#         interview = db.get(InterviewSession, id)
#         if not interview:
#             raise HTTPException(status_code=404, detail="Interview not found")
        
#         # Update the interview session with analysis results
#         interview.status = "completed"
#         interview.ended_at = datetime.now(timezone.utc)
#         interview.ai_analysis = analysis_data.analysis
#         interview.ai_metrics = analysis_data.metrics
#         interview.ai_transcript_summary = analysis_data.transcript_summary
#         interview.ai_journal_notes = analysis_data.journal_notes
#         interview.final_code_submitted = analysis_data.final_code
        
#         # Calculate duration if not already set
#         if interview.started_at and not interview.duration_minutes:
#             duration = interview.ended_at - interview.started_at
#             interview.duration_minutes = int(duration.total_seconds() / 60)
        
#         db.add(interview)
#         db.commit()
#         db.refresh(interview)
        
#         return interview
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         print(f"Error submitting analysis: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to submit analysis: {str(e)}")


# @router.get("/company/summaries", response_model=list[InterviewSessionOut])
# def get_interview_summaries_for_company(db: Session = Depends(get_db), user=Depends(get_current_user)):
#     """Get completed interview sessions with analysis results for the company"""
#     # Convert string company_id back to UUID for database query
#     company_uuid = uuid.UUID(user.company_id)
    
#     return db.query(InterviewSession).filter(
#         InterviewSession.company_id == company_uuid,
#         InterviewSession.status == "completed",
#         InterviewSession.ai_analysis.isnot(None)
#     ).order_by(InterviewSession.ended_at.desc()).all()


# @router.post("/{id}/reset-status")
# def reset_interview_status(
#     id: str, 
#     new_status: str, 
#     db: Session = Depends(get_db), 
#     user=Depends(get_current_user)
# ):
#     """Reset interview status (admin function)"""
#     valid_statuses = ["scheduled", "in_progress", "completed", "not-completed"]
    
#     if new_status not in valid_statuses:
#         raise HTTPException(
#             status_code=400, 
#             detail=f"Invalid status. Valid statuses are: {', '.join(valid_statuses)}"
#         )
    
#     # Get the interview
#     interview = db.get(InterviewSession, id)
#     if not interview or interview.company_id != user.company_id:
#         raise HTTPException(status_code=404, detail="Interview not found")
    
#     old_status = interview.status
#     interview.status = new_status
    
#     # Reset timestamps based on new status
#     if new_status == "scheduled":
#         interview.started_at = None
#         interview.ended_at = None
#         interview.duration_minutes = None
#     elif new_status == "in_progress":
#         if not interview.started_at:
#             interview.started_at = datetime.now(timezone.utc)
#         interview.ended_at = None
#     elif new_status == "completed":
#         if not interview.started_at:
#             interview.started_at = datetime.now(timezone.utc)
#         if not interview.ended_at:
#             interview.ended_at = datetime.now(timezone.utc)
    
#     # Clear AI analysis data if reverting from completed
#     if old_status == "completed" and new_status != "completed":
#         interview.ai_analysis = None
#         interview.ai_metrics = None
#         interview.ai_transcript_summary = None
#         interview.ai_journal_notes = None
#         interview.final_code_submitted = None
    
#     db.add(interview)
#     db.commit()
#     db.refresh(interview)
    
#     return {
#         "status": "success",
#         "message": f"Interview status changed from '{old_status}' to '{new_status}'",
#         "interview": interview
#     }


from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone

from app.db.session import get_db
from app.models import InterviewSession, Problem
from app.schemas.interview import InterviewSessionOut, InterviewSessionCreate, InterviewSessionUpdate
from app.schemas.problem import ProblemOut
from app.deps.auth import get_current_user


router = APIRouter()


@router.get("/company/summaries")
def get_interview_summaries_for_company(db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Get completed interview sessions with analysis results for the company"""
    try:
        company_id_str = str(user.company_id)
        query = text("""
            SELECT id, company_id, candidate_id, interviewer_id, problem_id, status, 
                   scheduled_at, started_at, ended_at, duration_minutes, candidate_code,
                   interviewer_notes, candidate_feedback, interviewer_rating, 
                   technical_score, communication_score, overall_recommendation,
                   recording_url, chat_transcript, test_results, ai_analysis,
                   ai_metrics, ai_transcript_summary, ai_journal_notes,
                   final_code_submitted, created_at, updated_at
            FROM interview_sessions 
            WHERE company_id = :company_id 
            AND status = 'completed'
            AND ai_analysis IS NOT NULL
            ORDER BY ended_at DESC
        """)
        
        result = db.execute(query, {"company_id": company_id_str})
        summaries = []
        
        for row in result:
            summaries.append({
                "id": row.id,
                "company_id": row.company_id,
                "candidate_id": row.candidate_id,
                "interviewer_id": row.interviewer_id,
                "problem_id": row.problem_id,
                "status": row.status,
                "scheduled_at": row.scheduled_at.isoformat() if row.scheduled_at else None,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "ended_at": row.ended_at.isoformat() if row.ended_at else None,
                "duration_minutes": row.duration_minutes,
                "candidate_code": row.candidate_code,
                "interviewer_notes": row.interviewer_notes,
                "candidate_feedback": row.candidate_feedback,
                "interviewer_rating": row.interviewer_rating,
                "technical_score": row.technical_score,
                "communication_score": row.communication_score,
                "overall_recommendation": row.overall_recommendation,
                "recording_url": row.recording_url,
                "chat_transcript": row.chat_transcript,
                "test_results": row.test_results,
                "ai_analysis": row.ai_analysis,
                "ai_metrics": row.ai_metrics,
                "ai_transcript_summary": row.ai_transcript_summary,
                "ai_journal_notes": row.ai_journal_notes,
                "final_code_submitted": row.final_code_submitted,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            })
        
        print(f"DEBUG: Found {len(summaries)} interview summaries")
        return summaries
        
    except Exception as e:
        print(f"Error in get_interview_summaries_for_company: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load interview summaries: {str(e)}")


@router.get("/")
def list_interviews(db: Session = Depends(get_db), user=Depends(get_current_user)):
    print(f"DEBUG: User company_id type: {type(user.company_id)}, value: {user.company_id}")
    
    try:
        # Use raw SQL to avoid type casting issues with PostgreSQL
        company_id_str = str(user.company_id)
        query = text("""
            SELECT id, company_id, candidate_id, interviewer_id, problem_id, status, 
                   scheduled_at, started_at, ended_at, duration_minutes, candidate_code,
                   interviewer_notes, candidate_feedback, interviewer_rating, 
                   technical_score, communication_score, overall_recommendation,
                   recording_url, chat_transcript, test_results, ai_analysis,
                   ai_metrics, ai_transcript_summary, ai_journal_notes,
                   final_code_submitted, created_at, updated_at
            FROM interview_sessions 
            WHERE company_id = :company_id
        """)
        
        result = db.execute(query, {"company_id": company_id_str})
        interviews = []
        
        for row in result:
            interviews.append({
                "id": row.id,
                "company_id": row.company_id,
                "candidate_id": row.candidate_id,
                "interviewer_id": row.interviewer_id,
                "problem_id": row.problem_id,
                "status": row.status,
                "scheduled_at": row.scheduled_at.isoformat() if row.scheduled_at else None,
                "started_at": row.started_at.isoformat() if row.started_at else None,
                "ended_at": row.ended_at.isoformat() if row.ended_at else None,
                "duration_minutes": row.duration_minutes,
                "candidate_code": row.candidate_code,
                "interviewer_notes": row.interviewer_notes,
                "candidate_feedback": row.candidate_feedback,
                "interviewer_rating": row.interviewer_rating,
                "technical_score": row.technical_score,
                "communication_score": row.communication_score,
                "overall_recommendation": row.overall_recommendation,
                "recording_url": row.recording_url,
                "chat_transcript": row.chat_transcript,
                "test_results": row.test_results,
                "ai_analysis": row.ai_analysis,
                "ai_metrics": row.ai_metrics,
                "ai_transcript_summary": row.ai_transcript_summary,
                "ai_journal_notes": row.ai_journal_notes,
                "final_code_submitted": row.final_code_submitted,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            })
        
        print(f"DEBUG: Found {len(interviews)} interviews")
        return interviews
        
    except Exception as e:
        print(f"Error in list_interviews: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load interviews: {str(e)}")


@router.post("/", response_model=InterviewSessionOut)
def schedule_interview(payload: InterviewSessionCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    # Use string representations for PostgreSQL UUID compatibility
    user_company_id_str = str(user.company_id)
    payload_company_id_str = str(payload.company_id)
    
    if payload_company_id_str != user_company_id_str:
        raise HTTPException(status_code=403, detail="Cross-company creation forbidden")
    model = InterviewSession(**payload.model_dump())
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.get("/{id}", response_model=InterviewSessionOut)
def get_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(InterviewSession, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")
    return model


@router.put("/{id}", response_model=InterviewSessionOut)
def update_interview(id: str, payload: InterviewSessionUpdate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(InterviewSession, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(model, k, v)
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


@router.delete("/{id}")
def cancel_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(InterviewSession, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")
    db.delete(model)
    db.commit()
    return {"status": "deleted"}


@router.post("/{id}/start")
def start_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(InterviewSession, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")
    model.status = "in_progress"
    db.add(model)
    db.commit()
    return {"status": "started"}


@router.post("/{id}/end")
def end_interview(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    user_company_id_str = str(user.company_id)
    model = db.get(InterviewSession, id)
    if not model or str(model.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")
    model.status = "completed"
    db.add(model)
    db.commit()
    return {"status": "ended"}


@router.get("/{id}/live")
def live_session(id: str):
    return {"ws": "/ws/interviews/%s" % id}


@router.get("/{id}/problem", response_model=ProblemOut)
def get_interview_problem(id: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Get the problem associated with an interview session"""
    user_company_id_str = str(user.company_id)
    
    # First get the interview session
    interview = db.get(InterviewSession, id)
    if not interview or str(interview.company_id) != user_company_id_str:
        raise HTTPException(status_code=404, detail="Interview not found")

    # Then get the associated problem
    problem = db.get(Problem, interview.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Verify the problem belongs to the same company (security check)
    if str(problem.company_id) != user_company_id_str:
        raise HTTPException(status_code=403, detail="Access denied")

    return ProblemOut.from_orm(problem)


@router.get("/{id}/candidate-access", response_model=dict)
def get_interview_for_candidate(id: str, db: Session = Depends(get_db)):
    """Public endpoint for candidates to access interview session and all company problems"""
    try:
        # Get the interview session
        interview = db.get(InterviewSession, id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Get ALL problems from the same company
        all_problems = db.query(Problem).filter(
            Problem.company_id == interview.company_id,
            Problem.is_active == True
        ).all()

        if not all_problems:
            raise HTTPException(status_code=404, detail="No problems found for this company")

        # Get the main problem for this interview
        main_problem = db.get(Problem, interview.problem_id)
        if not main_problem:
            raise HTTPException(status_code=404, detail="Interview problem not found")

        def format_problem_for_candidate(problem):
            """Format a single problem for candidate access"""
            return {
                "id": problem.id,
                "title": problem.title,
                "description": problem.description,
                "difficulty": problem.difficulty,
                "category": problem.category,
                "tags": problem.tags or [],
                "programming_languages": problem.programming_languages or [],
                "time_limit_minutes": problem.time_limit_minutes,
                "starter_code": problem.starter_code or [],
                "test_cases": problem.test_cases,  # Return as varchar string directly
                "hints": problem.hints or [],
                "solution": problem.solution  # Include solution field for comparison
            }

        # Format all problems
        formatted_problems = [format_problem_for_candidate(p) for p in all_problems]

        # Find the main problem in the formatted list
        main_problem_formatted = next(
            (p for p in formatted_problems if p["id"] == main_problem.id),
            formatted_problems[0] if formatted_problems else None
        )

        # Return interview data with all problems
        return {
            "interview": {
                "id": interview.id,
                "status": interview.status,
                "scheduled_at": interview.scheduled_at.isoformat() if interview.scheduled_at else None,
                "started_at": interview.started_at.isoformat() if interview.started_at else None,
                "duration_minutes": interview.duration_minutes,
                "main_problem_id": main_problem.id  # Indicate which problem is the main one
            },
            "problem": main_problem_formatted,  # Main problem for backward compatibility
            "problems": formatted_problems  # All problems for switching
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error in candidate access endpoint: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/{id}/code")
def submit_code(id: str, code: str, language: str):
    return {"status": "received"}


@router.post("/{id}/execute")
def execute_code(id: str, code: str, language: str):
    return {"success": True, "output": "", "error": None}


@router.post("/{id}/feedback")
def submit_feedback(id: str, feedback: str):
    return {"status": "ok"}


@router.post("/{id}/execute-code")
async def execute_code_with_validation(
    id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    """Execute code against test cases and validate results using existing Piston approach"""
    try:
        import aiohttp
        import asyncio

        print(f"🚀 Starting code execution for interview {id}")
        print(f"📝 Payload: {payload}")

        code = payload.get("code", "")
        language = payload.get("language", "")
        problem_id = payload.get("problem_id", "")

        print(f"📊 Extracted: code_length={len(code)}, language={language}, problem_id={problem_id}")

        if not code or not language or not problem_id:
            raise HTTPException(status_code=400, detail="Missing required fields: code, language, problem_id")

        # Get the interview session
        interview = db.get(InterviewSession, id)
        if not interview:
            print(f"❌ Interview {id} not found")
            raise HTTPException(status_code=404, detail="Interview not found")

        print(f"✅ Found interview: company_id={interview.company_id}")

        # Get the problem
        problem = db.query(Problem).filter(
            Problem.id == problem_id,
            Problem.company_id == interview.company_id,
            Problem.is_active == True
        ).first()

        if not problem:
            print(f"❌ Problem {problem_id} not found for company {interview.company_id}")
            raise HTTPException(status_code=404, detail="Problem not found")

        print(f"✅ Found problem: {problem.title}")
        print(f"🧪 Test cases available: {bool(problem.test_cases)}")
        print(f"🧪 Test cases type: {type(problem.test_cases)}")
        print(f"🧪 Test cases length: {len(problem.test_cases) if problem.test_cases else 0}")

        # Parse test cases and expected outputs correctly
        formatted_test_cases = []

        if problem.test_cases and isinstance(problem.test_cases, str):
            try:
                # Parse test cases (input data)
                test_cases_str = problem.test_cases.strip().strip('"\'').replace('\\n', '\n')
                test_lines = test_cases_str.strip().split('\n')
                
                # Parse expected outputs from solution column
                solution_lines = []
                if problem.solution and isinstance(problem.solution, str):
                    solution_str = problem.solution.strip().strip('"\'').replace('\\n', '\n')
                    solution_lines = solution_str.strip().split('\n')
                
                print(f"🧪 Test case lines: {len(test_lines)}")
                print(f"🧪 Solution lines: {len(solution_lines)}")
                
                # Parse test cases - each line in test_cases maps to each line in solution (1:1)
                # Each line in test_cases is a complete test input
                # Each line in solution is the corresponding expected output
                
                test_case_num = 1
                max_test_cases = min(len(test_lines), len(solution_lines))
                
                for i in range(max_test_cases):
                    test_input = test_lines[i].strip()
                    expected_output = solution_lines[i].strip()
                    
                    # Skip empty lines
                    if not test_input or not expected_output:
                        continue
                    
                    formatted_test_cases.append({
                        "id": str(test_case_num),
                        "input": test_input,
                        "expected_output": expected_output
                    })
                    
                    print(f"🧪 Test case {test_case_num}: input={repr(test_input)}, expected={repr(expected_output)} (from solution column)")
                    
                    test_case_num += 1
                        
                print(f"🎯 Total test cases parsed: {len(formatted_test_cases)}")
                        
            except Exception as e:
                print(f"❌ Error parsing test cases: {e}")
                import traceback
                traceback.print_exc()

        print(f"🧪 Final formatted_test_cases: {len(formatted_test_cases)} cases")

        # Language mapping (matching frontend piston.ts exactly)
        language_map = {
            'python': {'language': 'python', 'version': '3.9.4'},
            'cpp': {'language': 'c++', 'version': '10.2.0'},
            'c': {'language': 'c', 'version': '10.2.0'}
        }

        # Use the existing working Piston server URL
        piston_url = "http://runner.sumitsaw.tech/api/v2/execute"

        # Execute code using direct HTTP calls (matching working approach)
        execution_results = []

        for test_case in formatted_test_cases:
            test_input = test_case.get('input', '')
            expected_output = test_case.get('expected_output', '')

            if language not in language_map:
                execution_results.append({
                    "test_case_id": test_case["id"],
                    "input": test_input,
                    "expected_output": expected_output,
                    "actual_output": "",
                    "stderr": f"Unsupported language: {language}",
                    "passed": False,
                    "execution_time": 0,
                    "memory_used": 0,
                    "exit_code": 1
                })
                continue

            lang_config = language_map[language]

            # Prepare Piston payload (matching working format)
            piston_payload = {
                "language": lang_config['language'],
                "version": lang_config['version'],
                "files": [{
                    "content": code
                }],
                "stdin": test_input,
                "compile_timeout": 10,
                "run_timeout": 10
            }

            try:
                async with aiohttp.ClientSession() as session:
                    async with session.post(
                        piston_url,
                        json=piston_payload,
                        timeout=aiohttp.ClientTimeout(total=15)
                    ) as response:
                        if response.status != 200:
                            error_text = await response.text()
                            execution_results.append({
                                "test_case_id": test_case["id"],
                                "input": test_input,
                                "expected_output": expected_output,
                                "actual_output": "",
                                "stderr": f"Piston API error: {error_text}",
                                "passed": False,
                                "execution_time": 0,
                                "memory_used": 0,
                                "exit_code": response.status
                            })
                            continue

                        result = await response.json()

                        # Parse Piston response (matching working format)
                        run_result = result.get('run', {})
                        compile_result = result.get('compile', {})

                        # Check for compilation errors
                        if compile_result and compile_result.get('code', 0) != 0:
                            execution_results.append({
                                "test_case_id": test_case["id"],
                                "input": test_input,
                                "expected_output": expected_output,
                                "actual_output": compile_result.get('stdout', ''),
                                "stderr": compile_result.get('stderr', ''),
                                "passed": False,
                                "execution_time": 0,
                                "memory_used": 0,
                                "exit_code": compile_result.get('code', 1)
                            })
                            continue

                        # Parse runtime result
                        actual_output = run_result.get('stdout', '').strip()
                        expected_output_clean = expected_output.strip()
                        exit_code = run_result.get('code')
                        
                        # Handle None exit code - if None, assume 0 if no stderr, else 1
                        if exit_code is None:
                            stderr = run_result.get('stderr', '').strip()
                            exit_code = 1 if stderr else 0

                        print(f"🔍 Test case {test_case['id']} results:")
                        print(f"   📥 Input: {repr(test_input)}")
                        print(f"   📤 Expected: {repr(expected_output_clean)}")
                        print(f"   📤 Actual: {repr(actual_output)}")
                        print(f"   🔢 Exit code: {exit_code} (original: {run_result.get('code')})")
                        print(f"   ❌ stderr: {repr(run_result.get('stderr', ''))}")

                        is_correct = (
                            exit_code == 0 and
                            actual_output == expected_output_clean
                        )

                        print(f"   ✅ Passed: {is_correct} (exit_code==0: {exit_code == 0}, outputs_match: {actual_output == expected_output_clean})")

                        execution_results.append({
                            "test_case_id": test_case["id"],
                            "input": test_input,
                            "expected_output": expected_output_clean,
                            "actual_output": actual_output,
                            "stderr": run_result.get('stderr', ''),
                            "passed": is_correct,
                            "execution_time": 0,  # Piston doesn't return timing info
                            "memory_used": 0,     # Piston doesn't return memory info
                            "exit_code": exit_code
                        })

            except asyncio.TimeoutError:
                execution_results.append({
                    "test_case_id": test_case["id"],
                    "input": test_input,
                    "expected_output": expected_output,
                    "actual_output": "",
                    "stderr": "Execution timeout",
                    "passed": False,
                    "execution_time": 10,
                    "memory_used": 0,
                    "exit_code": 124
                })
            except Exception as e:
                execution_results.append({
                    "test_case_id": test_case["id"],
                    "input": test_input,
                    "expected_output": expected_output,
                    "actual_output": "",
                    "stderr": f"Execution error: {str(e)}",
                    "passed": False,
                    "execution_time": 0,
                    "memory_used": 0,
                    "exit_code": 1
                })

        # Calculate overall results
        passed_count = sum(1 for result in execution_results if result.get("passed", False))
        total_count = len(execution_results)
        success_rate = (passed_count / total_count * 100) if total_count > 0 else 0

        # Note: The 'solution' column contains expected outputs, not code solutions
        # For now, we don't provide solution hints during code execution
        # This could be enhanced later to show hints or explanations
        solution_comparison = {"has_solution": False}
        
        print(f"🔍 Solution column contains expected outputs (not code)")
        print(f"   Problem solution data: {problem.solution}")
        
        # The solution column contains expected test case outputs, not code solutions
        # If you want to show solution hints, you'd need a separate 'hints' or 'solution_code' column

        return {
            "success": True,
            "execution_results": execution_results,
            "summary": {
                "passed_count": passed_count,
                "total_count": total_count,
                "success_rate": success_rate,
                "all_passed": passed_count == total_count
            },
            "solution_comparison": solution_comparison,
            "problem_id": problem_id,
            "language": language
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in code execution: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Code execution failed: {str(e)}")


@router.get("/{id}/switch-problem/{problem_id}")
def switch_problem(id: str, problem_id: str, db: Session = Depends(get_db)):
    """Switch to a different problem within the same interview session"""
    try:
        # Get the interview session
        interview = db.get(InterviewSession, id)
        if not interview:
            raise HTTPException(status_code=404, detail="Interview not found")

        # Get the requested problem
        problem = db.query(Problem).filter(
            Problem.id == problem_id,
            Problem.company_id == interview.company_id,
            Problem.is_active == True
        ).first()

        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found or not accessible")

        # Format the problem for candidate access (reuse the formatting logic)
        def format_problem_for_candidate(problem):
            """Format a single problem for candidate access"""
            return {
                "id": problem.id,
                "title": problem.title,
                "description": problem.description,
                "difficulty": problem.difficulty,
                "category": problem.category,
                "tags": problem.tags or [],
                "programming_languages": problem.programming_languages or [],
                "time_limit_minutes": problem.time_limit_minutes,
                "starter_code": problem.starter_code or [],
                "test_cases": problem.test_cases,  # Return as varchar string directly
                "hints": problem.hints or [],
                "solution": problem.solution
            }

        formatted_problem = format_problem_for_candidate(problem)

        return {
            "success": True,
            "problem": formatted_problem,
            "switched_at": datetime.now(timezone.utc).isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error switching problem: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to switch problem: {str(e)}")
