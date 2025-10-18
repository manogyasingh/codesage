import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MicIcon, MicOffIcon, MessageCircleIcon, SettingsIcon } from './Icons';
import { sphereClient, type SphereTurn } from '../services/sphere';
import { AIOrb } from './AIOrb';
import { openaiTTSService } from '../services/openai-tts';
import { openaiSTTService } from '../services/openaiSTTService';

type TranscriptTurn = { role: 'user' | 'assistant' | 'system'; content: string; ts: string };

interface InterviewerPanelProps {
    className?: string;
    code?: string;
    problem?: string;
    onOpenTranscript?: () => void;
    // Back-compat with older prop name
    onOpenChat?: () => void;
    // Optional hook to trigger hint flow externally
    onRequestHint?: () => void;
}

export function InterviewerPanel({ className = '', code = '', problem = '', onOpenTranscript, onOpenChat, onRequestHint }: InterviewerPanelProps) {
    const [isListening, setIsListening] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [assistantText, setAssistantText] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [nudgeEnabled, setNudgeEnabled] = useState(true);
    const [sessionId, setSessionId] = useState<string>('default');
    const [transcriptOpen, setTranscriptOpen] = useState(false);
    const [transcript, setTranscript] = useState<TranscriptTurn[]>([]);
    const [transcriptLoading, setTranscriptLoading] = useState(false);
    const sessionStartRef = useRef<number | null>(null);

    const historyRef = useRef<SphereTurn[]>([]);
    const idleTimerRef = useRef<number | null>(null);
    const lastEditAtRef = useRef<number>(Date.now());
    const lastHeardAtRef = useRef<number>(0);
    const transcriptRef = useRef<string>('');
    const interimTranscriptRef = useRef<string>('');
    const interimFullRef = useRef<string>('');
    const micOffPendingRef = useRef<string>('');
    const sendAndSpeakRef = useRef<(text: string) => void>(() => { });
    const hasSentStartRef = useRef<boolean>(false);
    const sendingRef = useRef<boolean>(false);
    const queueRef = useRef<string[]>([]);
    const lastEnqueueAtRef = useRef<number>(0);

    // Persisted settings
    useEffect(() => {
        try {
            const stored = localStorage.getItem('interviewer_nudge_enabled');
            if (stored != null) setNudgeEnabled(stored === 'true');
        } catch { }
    }, []);

    // While speaking, continuously refresh the idle timer to prevent auto-nudges
    useEffect(() => {
        if (!speaking) return;
        // Immediate refresh on enter speaking state
        lastEditAtRef.current = Date.now();
        const id = window.setInterval(() => {
            lastEditAtRef.current = Date.now();
        }, 1000);
        return () => {
            window.clearInterval(id);
        };
    }, [speaking]);

    // Stable session id persisted in localStorage
    useEffect(() => {
        try {
            const key = 'sphere_session_id';
            let sid = localStorage.getItem(key);
            if (!sid) {
                sid = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                localStorage.setItem(key, sid);
            }
            setSessionId(sid);
            // Track a per-session start time for elapsed calculation
            const startKey = `sphere_session_start_${sid}`;
            const existingStart = localStorage.getItem(startKey);
            if (existingStart) {
                sessionStartRef.current = Number(existingStart);
            } else {
                const now = Date.now();
                localStorage.setItem(startKey, String(now));
                sessionStartRef.current = now;
            }
        } catch {
            setSessionId('default');
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('interviewer_nudge_enabled', String(nudgeEnabled));
        } catch { }
    }, [nudgeEnabled]);

    // On interview start, send a single kickoff message and reset inactivity counter
    // NOTE: This effect is intentionally placed after sendAndSpeak is defined to satisfy linter rules.

    // Track code changes as edits for idle detection
    useEffect(() => {
        lastEditAtRef.current = Date.now();
    }, [code]);

    // Set up OpenAI TTS speaking state callback
    useEffect(() => {
        openaiTTSService.setOnSpeakingChange((isSpeaking) => {
            setSpeaking(isSpeaking);
            if (isSpeaking || !isSpeaking) {
                // Reset idle timer when speech starts or ends
                lastEditAtRef.current = Date.now();
            }
        });
    }, []);

    // Also treat clicks as activity to reset idle detection
    useEffect(() => {
        const resetIdleOnClick = () => {
            lastEditAtRef.current = Date.now();
        };
        // Use pointerdown to catch both mouse and touch early in the event chain
        window.addEventListener('pointerdown', resetIdleOnClick, true);
        return () => {
            window.removeEventListener('pointerdown', resetIdleOnClick, true);
        };
    }, []);

    const startTTS = useCallback(async (text: string) => {
        try {
            await openaiTTSService.speak(text, {
                voice: 'nova', // Professional female voice
                speed: 1.0,
                model: 'tts-1' // Use faster model for real-time interaction
            });
        } catch (error) {
            console.error('OpenAI TTS failed:', error);
        }
    }, []);

    const stopTTS = useCallback(() => {
        openaiTTSService.stop();
        // Reset idle timer on manual stop
        lastEditAtRef.current = Date.now();
    }, []);

    const startASR = useCallback(async () => {
        if (isListening) return;

        const success = await openaiSTTService.startListening((transcript: string, isFinal: boolean) => {
            const now = Date.now();
            if (isFinal) {
                const newFinals = transcript.trim();
                if (newFinals) {
                    const appended = (transcriptRef.current + ' ' + newFinals).trim();
                    transcriptRef.current = appended.length > 500 ? appended.slice(-500) : appended;
                }
                // Clear interim buffer on finalization
                interimTranscriptRef.current = '';
                interimFullRef.current = '';
                lastHeardAtRef.current = now;
                // If recording has stopped (mic off), send only the delta beyond what we already sent on mic-off
                try {
                    if (!openaiSTTService.isListening()) {
                        const finalFull = transcript.trim();
                        const pending = micOffPendingRef.current.trim();
                        let deltaToSend = '';
                        if (pending) {
                            if (finalFull.startsWith(pending)) {
                                deltaToSend = finalFull.slice(pending.length).trim();
                            } else {
                                deltaToSend = '';
                            }
                        } else {
                            deltaToSend = finalFull;
                        }
                        micOffPendingRef.current = '';
                        transcriptRef.current = '';
                        interimTranscriptRef.current = '';
                        interimFullRef.current = '';
                        if (deltaToSend) sendAndSpeakRef.current(deltaToSend);
                    }
                } catch { }
            } else {
                // Track interim (non-final) hypothesis so it can be flushed on pause/mic-off
                const full = transcript.trim();
                // Compute delta relative to last full interim transcript to avoid resending old text
                const prevFull = interimFullRef.current;
                let i = 0;
                const max = Math.min(full.length, prevFull.length);
                while (i < max && full.charCodeAt(i) === prevFull.charCodeAt(i)) i++;
                const delta = full.slice(i).trim();
                interimTranscriptRef.current = delta;
                interimFullRef.current = full;
                lastHeardAtRef.current = now;

                // Throttled coalesced send during speech to ensure requests start promptly
                if (full) {
                    const last = lastEnqueueAtRef.current;
                    if (now - last >= 600) {
                        lastEnqueueAtRef.current = now;
                        const coalesced = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
                        if (coalesced) sendAndSpeakRef.current(coalesced);
                    }
                }
            }
            // Update last edit time for both interim and final results
            lastEditAtRef.current = now;
        });

        if (success) {
            setIsListening(true);
        } else {
            console.error('Failed to start OpenAI STT service');
        }
    }, [isListening]);

    const stopASR = useCallback(() => {
        openaiSTTService.stopListening();
        setIsListening(false);
    }, []);

    const processQueue = useCallback(async () => {
        if (sendingRef.current) return;
        const next = queueRef.current.shift();
        if (!next) return;
        sendingRef.current = true;

        const userText = next;
        const stamped = userText;
        const newHistory: SphereTurn[] = [
            ...historyRef.current,
            { role: 'user', content: stamped },
        ];
        historyRef.current = newHistory;
        setAssistantText('');
        try {
            setTranscript((prev) => [
                ...prev,
                { role: 'user', content: stamped, ts: new Date().toISOString() },
            ]);
        } catch { }

        try {
            const now = Date.now();
            const start = sessionStartRef.current ?? now;
            const elapsedSec = Math.max(0, Math.floor((now - start) / 1000));
            let collected = '';
            const full = await sphereClient.streamChat(
                { history: newHistory, code: code || '', problem: problem || undefined, session_id: sessionId, time_elapsed: elapsedSec },
                (token) => {
                    collected += token;
                    setAssistantText((prev) => prev + token);
                },
            );
            const speakText = collected || full || '';
            if (speakText) {
                // Do not await TTS so we don't block processing the next queued user message
                startTTS(speakText);
            }
            historyRef.current = [
                ...historyRef.current,
                { role: 'assistant', content: speakText },
            ];
            if (speakText) {
                setTranscript((prev) => [
                    ...prev,
                    { role: 'assistant', content: speakText, ts: new Date().toISOString() },
                ]);
            }
        } catch { }
        sendingRef.current = false;
        if (queueRef.current.length > 0) {
            // Process next message in the queue
            processQueue();
        }
    }, [code, startTTS, sessionId, problem]);

    const sendAndSpeak = useCallback((userText: string) => {
        if (!userText) return;
        // Coalesce: if there is a pending item, replace it with the latest text instead of pushing another
        if (queueRef.current.length > 0) {
            queueRef.current[queueRef.current.length - 1] = userText;
        } else {
            queueRef.current.push(userText);
        }
        if (!sendingRef.current) processQueue();
    }, [processQueue]);

    // Keep the ref pointing to the latest sendAndSpeak to avoid dependency loops
    useEffect(() => {
        sendAndSpeakRef.current = sendAndSpeak;
    }, [sendAndSpeak]);

    // Idle timer for nudges and auto-send after speech pauses
    useEffect(() => {
        const tick = () => {
            const now = Date.now();
            if (isListening) {
                // Coalesce and send interim text during speech, throttled
                if (interimFullRef.current) {
                    const lastEnq = lastEnqueueAtRef.current;
                    if (now - lastEnq >= 600) {
                        lastEnqueueAtRef.current = now;
                        const coalesced = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
                        if (coalesced) sendAndSpeakRef.current(coalesced);
                    }
                }
                // On pause >1.2s, flush and clear buffers
                if ((transcriptRef.current || interimTranscriptRef.current) && now - lastHeardAtRef.current > 1200) {
                    lastHeardAtRef.current = now;
                    try {
                        openaiSTTService.flushInterim().finally(() => {
                            const toSend = `${transcriptRef.current} ${interimTranscriptRef.current}`.trim();
                            transcriptRef.current = '';
                            interimTranscriptRef.current = '';
                            interimFullRef.current = '';
                            if (toSend) sendAndSpeakRef.current(toSend);
                        });
                    } catch { }
                }
            }
            if (nudgeEnabled && now - lastEditAtRef.current >= 20000 && !speaking) {
                sendAndSpeakRef.current('<--20 seconds elasped since last keystroke, auto triggering [sage]-->');
                lastEditAtRef.current = now; // throttle
            }
            idleTimerRef.current = window.setTimeout(tick, 2000);
        };
        idleTimerRef.current = window.setTimeout(tick, 2000);
        return () => {
            if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
        };
    }, [sendAndSpeak, speaking, isListening, nudgeEnabled]);

    const onMicToggle = useCallback(async () => {
        if (isListening) {
            // Flush any pending recognized speech immediately on mic off
            let combined = '';
            try {
                const interim = await openaiSTTService.flushInterim();
                if (interim && interim.trim()) {
                    combined = interim.trim();
                } else {
                    const pendingFinal = transcriptRef.current.trim();
                    const pendingInterim = interimTranscriptRef.current.trim();
                    combined = `${pendingFinal} ${pendingInterim}`.trim();
                }
            } catch { }
            if (combined) {
                micOffPendingRef.current = combined;
                transcriptRef.current = '';
                interimTranscriptRef.current = '';
                sendAndSpeakRef.current(combined);
            }
            // Disables only user's mic; interviewer can still speak
            stopASR();
        } else {
            // Stop TTS to avoid overlap when enabling mic
            stopTTS();
            await startASR();
        }
    }, [isListening, startASR, stopASR, stopTTS, sendAndSpeak]);

    const openTranscript = useCallback(async () => {
        setTranscriptOpen(true);
        setTranscriptLoading(true);
        try {
            const data = await sphereClient.getTranscript(sessionId);
            setTranscript(Array.isArray(data?.turns) ? data.turns : []);
        } catch {
        } finally {
            setTranscriptLoading(false);
        }
        (onOpenTranscript || onOpenChat)?.();
    }, [onOpenTranscript, onOpenChat, sessionId]);

    // Send kickoff message exactly once when the component mounts
    useEffect(() => {
        if (hasSentStartRef.current) return;
        hasSentStartRef.current = true;
        const startMsg = "<--interview has started, user has been presented with the problem and template shown. introduce yourself and ask for the user's introduction. After the user has introduced himself, introduce the problem-->";
        sendAndSpeak(startMsg);
        lastEditAtRef.current = Date.now();
    }, [sendAndSpeak]);

    return (
        <>
            <div
                className={
                    `w-full max-w-sm rounded-2xl border border-gray-100 bg-white shadow ` +
                    `p-4 flex flex-col items-stretch ${className}`
                }
                aria-label="Interviewer Panel"
            >
                <div className="text-xs font-medium text-gray-600 mb-2 text-center">Interviewer Panel</div>

                {/* Centered orb and status */}
                <div className="flex flex-col items-center">
                    <div className="relative shrink-0" style={{ width: 68, height: 68 }}>
                        <div aria-hidden={true}>
                            <AIOrb size={68} />
                        </div>
                        <button
                            type="button"
                            aria-label="Stop speech"
                            title="Stop"
                            onClick={stopTTS}
                            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${speaking ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        >
                            <span className="w-4 h-4 rounded-[3px] bg-gray-900/90 shadow-md" />
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {isListening ? 'Listening…' : speaking ? 'Speaking…' : 'Ready'}
                    </div>
                </div>

                {/* Minimal controls row */}
                <div className="mt-3 flex items-center justify-center gap-3">
                    <button
                        type="button"
                        aria-label={isListening ? 'Disable microphone' : 'Enable microphone'}
                        title={isListening ? 'Disable microphone' : 'Enable microphone'}
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/70 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm ${isListening ? 'text-blue-600 border-blue-200' : ''}`}
                        onClick={onMicToggle}
                    >
                        {isListening ? <MicIcon className="w-5 h-5" /> : <MicOffIcon className="w-5 h-5" />}
                    </button>

                    <button
                        type="button"
                        aria-label="Open transcript"
                        title="Open transcript"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/70 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                        onClick={openTranscript}
                    >
                        <MessageCircleIcon className="w-5 h-5" />
                    </button>


                    <div className="relative">
                        <button
                            type="button"
                            aria-label="Open settings"
                            title="Settings"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200/70 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 shadow-sm"
                            onClick={() => setSettingsOpen((v) => !v)}
                            onBlur={() => setTimeout(() => setSettingsOpen(false), 150)}
                        >
                            <SettingsIcon className="w-5 h-5" />
                        </button>
                        {settingsOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-3 z-10">
                                <div className="text-sm font-medium text-gray-900 mb-2">Settings</div>
                                <label className="flex items-start gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5"
                                        checked={nudgeEnabled}
                                        onChange={(e) => setNudgeEnabled(e.target.checked)}
                                    />
                                    <span>Nudge when stuck</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {transcriptOpen && createPortal(
                <div className="fixed inset-0 z-[60]">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setTranscriptOpen(false)}
                        aria-hidden={true}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col max-h-[80vh]">
                            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                <div className="text-sm font-medium text-gray-900">Conversation Transcript</div>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center h-8 px-3 rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    onClick={() => setTranscriptOpen(false)}
                                    aria-label="Close transcript"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="p-4 overflow-auto space-y-3">
                                {transcriptLoading ? (
                                    <div className="text-sm text-gray-500">Loading…</div>
                                ) : transcript.length === 0 ? (
                                    <div className="text-sm text-gray-500">No messages yet.</div>
                                ) : (
                                    transcript.map((t, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className={`w-24 text-xs font-medium mt-0.5 ${t.role === 'assistant' ? 'text-blue-600' : t.role === 'user' ? 'text-gray-800' : 'text-gray-500'}`}>
                                                {t.role === 'assistant' ? 'Interviewer' : t.role === 'user' ? 'You' : 'System'}
                                            </div>
                                            <div className="flex-1 text-sm text-gray-800 whitespace-pre-wrap break-words">{t.content}</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}


