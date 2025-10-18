from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from pathlib import Path
from dotenv import load_dotenv

# Load env from backend/.env
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)

from .agent import run_agent, stream_agent
from .transcript import transcript_store
from .journal import journal_store

APP_NAME = "Sphere Backend"

app = FastAPI(title=APP_NAME)

# CORS: allow all (hackathon mode, unsafe for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EchoRequest(BaseModel):
    message: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/echo")
async def echo(req: EchoRequest):
    return {"reply": req.message}


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    history: list[ChatTurn]
    code: str
    problem: str | None = None
    session_id: str | None = None
    time_elapsed: int | None = None  # seconds since interview start

@app.post("/chat")
async def chat(req: ChatRequest):
    session_id = req.session_id or "default"

    # Append latest user message to transcript if present
    if req.history:
        last = req.history[-1]
        if last.role and last.content:
            transcript_store.append(session_id=session_id, role=last.role, content=last.content)

    reply = run_agent(
        messages=[{"role": t.role, "content": t.content} for t in req.history],
        code_context=req.code,
        problem_context=req.problem or "",
        session_id=session_id,
        time_elapsed_sec=req.time_elapsed,
    )

    # Append assistant reply
    if reply:
        transcript_store.append(session_id=session_id, role="assistant", content=reply)
    return {"reply": reply}


@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    session_id = req.session_id or "default"

    # Append latest user message to transcript if present
    if req.history:
        last = req.history[-1]
        if last.role and last.content:
            transcript_store.append(session_id=session_id, role=last.role, content=last.content)

    async def event_gen():
        full_text = ""
        for token in stream_agent(
            messages=[{"role": t.role, "content": t.content} for t in req.history],
            code_context=req.code,
            problem_context=req.problem or "",
            session_id=session_id,
            time_elapsed_sec=req.time_elapsed,
        ):
            full_text += token
            yield f"data: {token}\n\n"
        # When stream completes, record assistant reply
        if full_text:
            transcript_store.append(session_id=session_id, role="assistant", content=full_text)

    from starlette.responses import StreamingResponse

    return StreamingResponse(event_gen(), media_type="text/event-stream")


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    try:
        while True:
            data = await ws.receive_text()
            # Placeholder: echo back for now
            await ws.send_text(data)
    except WebSocketDisconnect:
        pass


# Transcript endpoints
@app.get("/transcript")
async def get_transcript(session_id: str | None = None):
    sid = session_id or "default"
    turns = [
        {"role": t.role, "content": t.content, "ts": t.ts_iso}
        for t in transcript_store.get(sid)
    ]
    return {"session_id": sid, "turns": turns}


@app.post("/transcript/reset")
async def reset_transcript(session_id: str | None = None):
    sid = session_id or "default"
    transcript_store.reset(sid)
    return {"session_id": sid, "status": "reset"}


# Journal endpoints
class JournalNoteRequest(BaseModel):
    session_id: str | None = None
    note: str


@app.get("/journal")
async def get_journal(session_id: str | None = None):
    sid = session_id or "default"
    snapshot = journal_store.snapshot(sid)
    return snapshot


@app.post("/journal/note")
async def add_journal_note(req: JournalNoteRequest):
    sid = req.session_id or "default"
    journal_store.add_note(session_id=sid, note=req.note)
    return journal_store.snapshot(sid)


@app.post("/journal/fumble")
async def record_journal_fumble(session_id: str | None = None, reason: str | None = None, context: str | None = None):
    sid = session_id or "default"
    journal_store.record_fumble(session_id=sid, reason=reason, context=context)
    return journal_store.snapshot(sid)


@app.post("/journal/slow")
async def record_journal_slow(
    session_id: str | None = None,
    duration_sec: float = 0.0,
    threshold_sec: float = 20.0,
    context: str | None = None,
):
    sid = session_id or "default"
    journal_store.record_slow_answer(
        session_id=sid, duration_sec=duration_sec, threshold_sec=threshold_sec, context=context
    )
    return journal_store.snapshot(sid)


@app.post("/journal/reset")
async def reset_journal(session_id: str | None = None):
    sid = session_id or "default"
    journal_store.reset(sid)
    return {"session_id": sid, "status": "reset", **journal_store.snapshot(sid)}


class InterviewAnalysisRequest(BaseModel):
    session_id: str | None = None
    problem_title: str | None = None
    problem_description: str | None = None
    final_code: str | None = None
    time_elapsed: int | None = None  # in seconds
    execution_results: dict | None = None  # Test execution results


@app.post("/analyze-interview")
async def analyze_interview(req: InterviewAnalysisRequest):
    """Analyze the interview session and provide a comprehensive summary."""
    sid = req.session_id or "default"
    
    # Get transcript
    transcript_turns = [
        {"role": t.role, "content": t.content, "ts": t.ts_iso}
        for t in transcript_store.get(sid)
    ]
    
    # Get journal data
    journal_data = journal_store.snapshot(sid)
    
    # Format test execution results if provided
    test_results_section = ""
    if req.execution_results:
        test_results_section = f"""
TEST EXECUTION RESULTS:
Success: {req.execution_results.get('success', 'N/A')}
Total Test Cases: {req.execution_results.get('summary', {}).get('total_count', 'N/A')}
Passed: {req.execution_results.get('summary', {}).get('passed_count', 'N/A')}
All Tests Passed: {req.execution_results.get('summary', {}).get('all_passed', 'N/A')}

INDIVIDUAL TEST CASE RESULTS:
"""
        if req.execution_results.get('execution_results'):
            for i, result in enumerate(req.execution_results['execution_results'], 1):
                status = "PASSED" if result.get('passed', False) else "FAILED"
                test_results_section += f"Test Case {result.get('test_case_id', i)}: {status}"
                if not result.get('passed', False):
                    test_results_section += f"\n  Expected: {result.get('expected_output', 'N/A')}"
                    test_results_section += f"\n  Got: {result.get('actual_output', 'N/A')}"
                test_results_section += "\n"
        
        if req.execution_results.get('solution_comparison'):
            sol_comp = req.execution_results['solution_comparison']
            test_results_section += f"""
SOLUTION COMPARISON:
Has Reference Solution: {sol_comp.get('has_solution', False)}
Time Complexity: {sol_comp.get('time_complexity', 'N/A')}
Space Complexity: {sol_comp.get('space_complexity', 'N/A')}
Solution Explanation: {sol_comp.get('solution_explanation', 'N/A')}
"""
    
    # Create analysis prompt
    analysis_prompt = f"""
You are an expert technical interviewer analyzing a completed coding interview session. 
Provide a comprehensive analysis and summary of the candidate's performance.

INTERVIEW DATA:
Problem: {req.problem_title or 'N/A'}
Duration: {req.time_elapsed or 0} seconds ({(req.time_elapsed or 0) // 60} minutes)

{test_results_section}

PERFORMANCE METRICS:
- Fumbles: {journal_data.get('fumbles', 0)}
- Slow responses: {journal_data.get('slow_answers', 0)}
- Average slow response time: {journal_data.get('avg_slow_answer_sec', 0):.1f} seconds
- Notes: {len(journal_data.get('notes', []))}

TRANSCRIPT SUMMARY:
Total interactions: {len(transcript_turns)}
{chr(10).join([f"- {turn['role']}: {turn['content'][:100]}..." for turn in transcript_turns[-5:]]) if transcript_turns else "No conversation recorded"}

JOURNAL NOTES:
{chr(10).join(journal_data.get('notes', [])) if journal_data.get('notes') else "No specific notes recorded"}

FINAL CODE SUBMITTED:
```
{req.final_code or 'No code provided'}
```

Please provide a comprehensive analysis focusing on:

1. OVERALL PERFORMANCE RATING (1-10 scale)
   - Consider test case pass rate, code quality, and problem-solving approach

2. STRENGTHS demonstrated during the interview
   - Highlight successful test cases and good coding practices

3. AREAS FOR IMPROVEMENT 
   - Focus on failed test cases and what went wrong
   - Analyze logic errors, edge case handling, and implementation issues

4. COMMUNICATION SKILLS assessment
   - Based on transcript interactions and explanation quality

5. PROBLEM-SOLVING APPROACH analysis
   - How they approached the problem, debugging process

6. TECHNICAL COMPETENCY evaluation
   - Code structure, algorithm choice, efficiency considerations
   - Analysis of test case failures and debugging ability

7. TEST CASE ANALYSIS
   - Detailed feedback on which test cases passed/failed and why
   - Suggestions for handling edge cases or improving logic

8. RECOMMENDATION (Strong Hire / Hire / No Hire / Strong No Hire)
   - Weight test case success heavily in this decision

Keep the analysis professional, constructive, and specific. Focus on observable behaviors and concrete examples from the session.
Provide actionable feedback based on the test execution results.
"""

    try:
        from .agent import run_agent
        
        analysis_result = run_agent(
            messages=[{"role": "user", "content": analysis_prompt}],
            code_context=req.final_code or "",
            problem_context=req.problem_description or "",
            session_id=f"{sid}_analysis"
        )
        
        return {
            "session_id": sid,
            "analysis": analysis_result,
            "metrics": {
                "duration_minutes": (req.time_elapsed or 0) // 60,
                "fumbles": journal_data.get('fumbles', 0),
                "slow_answers": journal_data.get('slow_answers', 0),
                "avg_slow_answer_sec": journal_data.get('avg_slow_answer_sec', 0),
                "total_interactions": len(transcript_turns),
                "notes_count": len(journal_data.get('notes', []))
            },
            "transcript_summary": transcript_turns[-10:] if transcript_turns else [],
            "journal_notes": journal_data.get('notes', [])
        }
        
    except Exception as e:
        return {
            "session_id": sid,
            "analysis": f"Analysis failed: {str(e)}",
            "metrics": {
                "duration_minutes": (req.time_elapsed or 0) // 60,
                "fumbles": journal_data.get('fumbles', 0),
                "slow_answers": journal_data.get('slow_answers', 0),
                "avg_slow_answer_sec": journal_data.get('avg_slow_answer_sec', 0),
                "total_interactions": len(transcript_turns),
                "notes_count": len(journal_data.get('notes', []))
            },
            "error": str(e)
        }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
