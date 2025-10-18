// Sphere backend client: chat and streaming with code context

export type SphereRole = 'user' | 'assistant' | 'system';

export interface SphereTurn {
    role: SphereRole;
    content: string;
}

export interface SphereChatRequest {
    history: SphereTurn[];
    code: string;
    problem?: string;
    session_id?: string;
    time_elapsed?: number;
}

export interface InterviewAnalysisRequest {
    session_id?: string;
    problem_title?: string;
    problem_description?: string;
    final_code?: string;
    time_elapsed?: number;
    execution_results?: any; // Test execution results
}

export interface InterviewAnalysisResponse {
    session_id: string;
    analysis: string;
    metrics: {
        duration_minutes: number;
        fumbles: number;
        slow_answers: number;
        avg_slow_answer_sec: number;
        total_interactions: number;
        notes_count: number;
    };
    transcript_summary: { role: SphereRole; content: string; ts: string }[];
    journal_notes: string[];
    error?: string;
}

const DEFAULT_BACKEND_URL = (import.meta as any).env?.VITE_SPHERE_BACKEND_URL || 'http://localhost:8001';

export class SphereClient {
    private baseUrl: string;

    constructor(baseUrl: string = DEFAULT_BACKEND_URL) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
    }

    async chat(req: SphereChatRequest): Promise<string> {
        const res = await fetch(`${this.baseUrl}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`Sphere chat failed: ${res.status} ${res.statusText}`);
        const data = await res.json();
        return data.reply as string;
    }

    async streamChat(
        req: SphereChatRequest,
        onToken: (token: string) => void,
    ): Promise<string> {
        const res = await fetch(`${this.baseUrl}/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });
        if (!res.ok || !res.body) {
            throw new Error(`Sphere stream failed: ${res.status} ${res.statusText}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            // Parse SSE style "data: <token>\n\n"
            let sepIndex;
            // Process complete events separated by double newlines
            while ((sepIndex = buffer.indexOf('\n\n')) !== -1) {
                const eventChunk = buffer.slice(0, sepIndex);
                buffer = buffer.slice(sepIndex + 2);
                // Extract lines that start with 'data: '
                for (const line of eventChunk.split('\n')) {
                    const prefix = 'data: ';
                    if (line.startsWith(prefix)) {
                        const token = line.slice(prefix.length);
                        if (token) {
                            onToken(token);
                            fullText += token;
                        }
                    }
                }
            }
        }

        // Flush remaining buffered token if formatted as a single line event
        if (buffer.startsWith('data: ')) {
            const token = buffer.slice('data: '.length).trim();
            if (token) {
                onToken(token);
                fullText += token;
            }
        }

        return fullText;
    }

    async getTranscript(sessionId?: string): Promise<{ session_id: string; turns: { role: SphereRole; content: string; ts: string }[] }> {
        const url = new URL(`${this.baseUrl}/transcript`);
        if (sessionId) url.searchParams.set('session_id', sessionId);
        const res = await fetch(url.toString(), { method: 'GET' });
        if (!res.ok) throw new Error(`Sphere transcript failed: ${res.status} ${res.statusText}`);
        return res.json();
    }

    async resetTranscript(sessionId?: string): Promise<void> {
        const url = new URL(`${this.baseUrl}/transcript/reset`);
        if (sessionId) url.searchParams.set('session_id', sessionId);
        const res = await fetch(url.toString(), { method: 'POST' });
        if (!res.ok) throw new Error(`Sphere transcript reset failed: ${res.status} ${res.statusText}`);
    }

    async analyzeInterview(req: InterviewAnalysisRequest): Promise<InterviewAnalysisResponse> {
        const res = await fetch(`${this.baseUrl}/analyze-interview`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req),
        });
        if (!res.ok) throw new Error(`Interview analysis failed: ${res.status} ${res.statusText}`);
        return res.json();
    }
}

export const sphereClient = new SphereClient();


