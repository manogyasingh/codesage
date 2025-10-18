from __future__ import annotations

import threading
from dataclasses import dataclass
from typing import Dict, List, Literal
from datetime import datetime, timezone


Role = Literal["user", "assistant", "system"]


@dataclass
class TranscriptTurn:
    role: Role
    content: str
    ts_iso: str


class TranscriptStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._store: Dict[str, List[TranscriptTurn]] = {}

    def append(self, session_id: str, role: Role, content: str) -> None:
        if not session_id:
            session_id = "default"
        with self._lock:
            turns = self._store.setdefault(session_id, [])
            turns.append(
                TranscriptTurn(
                    role=role,
                    content=content,
                    ts_iso=datetime.now(timezone.utc).isoformat(),
                )
            )

    def get(self, session_id: str) -> List[TranscriptTurn]:
        if not session_id:
            session_id = "default"
        with self._lock:
            return list(self._store.get(session_id, []))

    def reset(self, session_id: str) -> None:
        if not session_id:
            session_id = "default"
        with self._lock:
            self._store[session_id] = []


transcript_store = TranscriptStore()


