from __future__ import annotations

import threading
from dataclasses import dataclass, field
from typing import Dict, List


@dataclass
class SessionJournal:
    session_id: str
    fumbles: int = 0
    slow_answers: int = 0
    slow_answer_durations_sec: List[float] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)

    def summary(self) -> str:
        avg_slow = (
            sum(self.slow_answer_durations_sec) / len(self.slow_answer_durations_sec)
            if self.slow_answer_durations_sec
            else 0.0
        )
        return (
            f"Session '{self.session_id}': "
            f"fumbles={self.fumbles}, slow_answers={self.slow_answers}, "
            f"avg_slow_answer_sec={avg_slow:.2f}, notes={len(self.notes)}"
        )


class JournalStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: Dict[str, SessionJournal] = {}

    def get_or_create(self, session_id: str) -> SessionJournal:
        if not session_id:
            session_id = "default"
        with self._lock:
            journal = self._store.get(session_id)
            if journal is None:
                journal = SessionJournal(session_id=session_id)
                self._store[session_id] = journal
            return journal

    def reset(self, session_id: str) -> None:
        if not session_id:
            session_id = "default"
        with self._lock:
            self._store[session_id] = SessionJournal(session_id=session_id)

    def record_fumble(self, session_id: str, reason: str | None = None, context: str | None = None) -> str:
        journal = self.get_or_create(session_id)
        with self._lock:
            journal.fumbles += 1
            if reason:
                journal.notes.append(f"FUMBLE: {reason}" + (f" | context: {context}" if context else ""))
            elif context:
                journal.notes.append(f"FUMBLE: {context}")
        return journal.summary()

    def record_slow_answer(self, session_id: str, duration_sec: float, threshold_sec: float = 20.0, context: str | None = None) -> str:
        journal = self.get_or_create(session_id)
        with self._lock:
            journal.slow_answers += 1
            try:
                journal.slow_answer_durations_sec.append(float(duration_sec))
            except Exception:
                pass
            if context:
                journal.notes.append(
                    f"SLOW_ANSWER: {duration_sec:.2f}s (threshold {threshold_sec:.2f}s) | context: {context}"
                )
        return journal.summary()

    def add_note(self, session_id: str, note: str) -> str:
        journal = self.get_or_create(session_id)
        with self._lock:
            journal.notes.append(note)
        return journal.summary()

    def get_summary(self, session_id: str) -> str:
        journal = self.get_or_create(session_id)
        return journal.summary()

    def snapshot(self, session_id: str) -> Dict[str, object]:
        """Return a JSON-serializable snapshot of the journal for the given session.

        Includes raw counters, durations, notes, computed average, and summary.
        Thread-safe.
        """
        journal = self.get_or_create(session_id)
        with self._lock:
            avg_slow = (
                sum(journal.slow_answer_durations_sec) / len(journal.slow_answer_durations_sec)
                if journal.slow_answer_durations_sec
                else 0.0
            )
            return {
                "session_id": journal.session_id,
                "fumbles": journal.fumbles,
                "slow_answers": journal.slow_answers,
                "avg_slow_answer_sec": float(avg_slow),
                "slow_answer_durations_sec": list(journal.slow_answer_durations_sec),
                "notes": list(journal.notes),
                "summary": journal.summary(),
            }


# Global store instance used by the agent tools
journal_store = JournalStore()


