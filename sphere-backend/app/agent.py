from __future__ import annotations

import os
from typing import List, Literal, TypedDict

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
    SystemMessage,
    BaseMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from pathlib import Path
from dotenv import load_dotenv
from .journal import journal_store

# Ensure .env is loaded if not already
load_dotenv(dotenv_path=Path(__file__).resolve().parents[1] / ".env", override=False)


Role = Literal["user", "assistant", "system"]


class ChatMessage(TypedDict):
    role: Role
    content: str


def _to_lc_messages(messages: List[ChatMessage]) -> List[BaseMessage]:
    lc_messages: List[BaseMessage] = []
    for m in messages:
        if m["role"] == "user":
            lc_messages.append(HumanMessage(content=m["content"]))
        elif m["role"] == "assistant":
            lc_messages.append(AIMessage(content=m["content"]))
        else:
            lc_messages.append(SystemMessage(content=m["content"]))
    return lc_messages


def _make_journal_tools(session_id: str):
    """Create tool instances bound to a specific session_id.

    All tool executions print a completion log to stdout.
    """

    @tool("record_fumble")
    def record_fumble(reason: str | None = None, context: str | None = None) -> str:
        """
        Record that the candidate fumbled (hesitated, gave a wrong step, or got stuck).
        - reason: short phrase of what went wrong (optional)
        - context: brief context like the question or code section (optional)
        Returns a brief journal summary.
        """
        result = journal_store.record_fumble(session_id=session_id, reason=reason, context=context)
        print(
            f"[TOOL] record_fumble(session_id={session_id!r}, reason={reason!r}, context={context!r}) -> {result}"
        )
        return result

    @tool("record_slow_answer")
    def record_slow_answer(duration_sec: float, threshold_sec: float = 20.0, context: str | None = None) -> str:
        """
        Record that the candidate took a long time to respond.
        - duration_sec: measured response delay in seconds
        - threshold_sec: threshold that defines "slow" (default 20s)
        - context: brief context describing what they were responding to (optional)
        Returns a brief journal summary.
        """
        result = journal_store.record_slow_answer(
            session_id=session_id, duration_sec=duration_sec, threshold_sec=threshold_sec, context=context
        )
        print(
            f"[TOOL] record_slow_answer(session_id={session_id!r}, duration_sec={duration_sec!r}, threshold_sec={threshold_sec!r}, context={context!r}) -> {result}"
        )
        return result

    @tool("add_note")
    def add_note(note: str) -> str:
        """
        Add a free-form note to the journal about the candidate or session.
        Returns a brief journal summary.
        """
        result = journal_store.add_note(session_id=session_id, note=note)
        print(f"[TOOL] add_note(session_id={session_id!r}, note={note!r}) -> {result}")
        return result

    @tool("get_journal_summary")
    def get_journal_summary() -> str:
        """Get a one-line summary of the current journal state for this session."""
        result = journal_store.get_summary(session_id=session_id)
        print(f"[TOOL] get_journal_summary(session_id={session_id!r}) -> {result}")
        return result

    @tool("reset_journal")
    def reset_journal() -> str:
        """Reset the journal for this session back to zero counts and no notes."""
        journal_store.reset(session_id=session_id)
        result = journal_store.get_summary(session_id=session_id)
        print(f"[TOOL] reset_journal(session_id={session_id!r}) -> {result}")
        return result

    return [record_fumble, record_slow_answer, add_note, get_journal_summary, reset_journal]


def _run_with_tools(
    llm: ChatOpenAI,
    messages: List[BaseMessage],
    session_id: str,
) -> AIMessage:
    tools = _make_journal_tools(session_id)
    llm_with_tools = llm.bind_tools(tools)

    ai_message = llm_with_tools.invoke(messages)

    # Simple tool loop: execute tool calls until the model produces a final answer
    max_loops = 5
    loop = 0
    while isinstance(ai_message, AIMessage) and getattr(ai_message, "tool_calls", None):
        tool_messages: List[ToolMessage] = []
        for tool_call in ai_message.tool_calls:
            tool_name = tool_call["name"]
            tool_args = tool_call.get("args", {})
            tool_id = tool_call.get("id")

            selected = next((t for t in tools if getattr(t, "name", None) == tool_name), None)
            if selected is None:
                error = f"Unknown tool: {tool_name}"
                print(f"[TOOL] ERROR {error} args={tool_args!r}")
                tool_messages.append(ToolMessage(content=error, tool_call_id=tool_id))
                continue

            try:
                print(f"[TOOL] calling {tool_name}(args={tool_args!r}) for session_id={session_id!r}")
                result = selected.invoke(tool_args)
                print(f"[TOOL] completed {tool_name} -> {result}")
                tool_messages.append(ToolMessage(content=str(result), tool_call_id=tool_id))
            except Exception as e:
                print(f"[TOOL] exception in {tool_name}: {e}")
                tool_messages.append(ToolMessage(content=f"ERROR: {e}", tool_call_id=tool_id))

        messages = messages + [ai_message] + tool_messages
        ai_message = llm_with_tools.invoke(messages)

        loop += 1
        if loop >= max_loops:
            print("[TOOL] Max tool loop iterations reached; returning current model output.")
            break

    return ai_message


def run_agent(
    messages: List[ChatMessage],
    code_context: str,
    problem_context: str = "",
    session_id: str = "default",
    time_elapsed_sec: int | None = None,
) -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    model = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

    llm = ChatOpenAI(
        model=model,
        openai_api_key=api_key,
        base_url=os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
        temperature=0.7,
        max_tokens=512,
    )

    system_preamble = (
"""
You are Sphere, a friendly AI technical interviewer that nudges and guides the user. The interview will consist of Leetcode styled DSA questions. You'll be given the problem that the user has been asked to solve, and you will always be presented with the current state of the user's text editor. Always incorporate the user's current code context when responding. You also have access to tools for journaling candidate metrics (record_fumble, record_slow_answer, add_note, get_journal_summary, reset_journal). Use these tools to silently track behavior when appropriate; these will be accessed by the HR systems using an API. Do not expose internal journaling details to the interviewee. You are gently helpful and carefully nudge the user in the correct direction but you never tell them the answer or the method straight away. In case you do help them, you make a note of it in your journal.

Chat with you can be triggered in a number of ways. You will always be told exactly what triggered it. The reasons can include:
1. User asked a question or responded to you using the audio interface.
2. Submission result interrupt - After a submission result, you'll be given the result and you'll have to present some feedback and guidance to the user. Tell them "All testcases passed! You've completed the challenge and can now exit the session." or "You've passed all but two test cases, where you got TLE. Go over your code and try to optimise the time complexity"
3. User stuck interrupt: if the user hasn't typed a single character in 20 seconds. In this case, it may be helpful to ask them what they're thinking. Or if they're stuck with something.
4. Session start: When the interview session begins, provide a warm, encouraging introduction. Briefly acknowledge the problem and encourage the candidate to start thinking about it.

You should use the journal tool whenever appropriate. Events which should trigger the journal tool:
1. Important Time Milestones - if the current timer (time elapsed since the beginning) is right after an important milestone like 5 minutes or 20 minutes or 1 hour, 2. Submission result interrupt - "user's second submission has passed all but 2 test cases. These test cases are the time intensive ones, which suggest that user's time complexity is suboptimal."mention the user's current progress in your journal. (eg, "At the end of 30 mins, the user had implemented the basic structure but missed the edge cases.")
2. Submission result interrupt - "user's second submission has passed all but 2 test cases. These test cases are the time intensive ones, which suggest that user's time complexity is suboptimal."
3. User asking for help - "User wasn't clear about the implementation of hashmaps in C++ and asked for my help."
4. Session start - "Interview session started. User has been presented with the problem."

Since your response will be sent to a TTS, asterisks and other formattings will make it illegible. NEVER USE MARKDOWN!

Remember, this is a conversation. Write short messages instead of paragraphs.
"""
    )

    time_block = (
        f"\n\nInterview Timer:\nSeconds elapsed since start: {time_elapsed_sec}\n"
        if time_elapsed_sec is not None
        else ""
    )

    context_block = f"\n\nCode Context (latest editor text):\n`````\n{code_context}\n`````\n"
    problem_block = (
        f"\n\nProblem Context (statement):\n`````\n{problem_context}\n`````\n" if problem_context else ""
    )

    lc_messages = [SystemMessage(content=system_preamble + time_block + problem_block + context_block)] + _to_lc_messages(messages)

    final_ai = _run_with_tools(llm, lc_messages, session_id=session_id)
    return final_ai.content if hasattr(final_ai, "content") else str(final_ai)


def stream_agent(
    messages: List[ChatMessage],
    code_context: str,
    problem_context: str = "",
    session_id: str = "default",
    time_elapsed_sec: int | None = None,
):
    # Reuse the non-streaming tool loop for correct tool execution and logging,
    # then emit the result as a simple word stream.
    full_text = run_agent(
        messages=messages,
        code_context=code_context,
        problem_context=problem_context,
        session_id=session_id,
        time_elapsed_sec=time_elapsed_sec,
    )
    for token in (full_text or "").split(" "):
        if token:
            yield token + " "


