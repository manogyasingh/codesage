const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface InterviewSession {
  id: string;
  company_id: string;
  candidate_id: string;
  interviewer_id: string;
  problem_id: string;
  status: string;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  duration_minutes?: number;
  candidate_code: any[];
  interviewer_notes?: string;
  candidate_feedback?: string;
  interviewer_rating?: number;
  technical_score?: number;
  communication_score?: number;
  overall_recommendation?: string;
  recording_url?: string;
  chat_transcript?: any[];
  test_results?: any[];
  
  // AI Analysis Results
  ai_analysis?: string;
  ai_metrics?: {
    duration_minutes: number;
    fumbles: number;
    slow_answers: number;
    avg_slow_answer_sec: number;
    total_interactions: number;
    notes_count: number;
    rating?: number;
  };
  ai_transcript_summary?: any[];
  ai_journal_notes?: string[];
  final_code_submitted?: string;
  
  created_at: string;
  updated_at: string;
  candidate?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    experience_level: string;
    availability_status: string;
  };
  interviewer?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  problem?: {
    id: string;
    title: string;
    difficulty: string;
  };
}

export interface CreateInterviewSessionRequest {
  id: string;
  candidate_id: string;
  interviewer_id: string;
  problem_id: string;
  scheduled_at: string;
}

class InterviewsService {
  private getStoredToken(): string | null {
    const token = localStorage.getItem('access_token');
    console.log('InterviewsService: Retrieved token:', token ? 'Token exists' : 'No token');
    return token;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getStoredToken();
    console.log('InterviewsService: Making request to', endpoint, 'with token:', !!token);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    console.log('InterviewsService: Response status:', response.status);
    
    if (!response.ok) {
      console.log('InterviewsService: Request failed with status:', response.status);
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        console.log('InterviewsService: Error data:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use the HTTP status
        console.log('InterviewsService: Could not parse error response');
      }
      
      if (response.status === 401) {
        throw new Error('Not authenticated');
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getInterviewSessions(): Promise<InterviewSession[]> {
    return this.makeRequest('/interviews/');
  }

  async getInterviewSessionById(sessionId: string): Promise<InterviewSession> {
    return this.makeRequest(`/interviews/${sessionId}`);
  }

  async createInterviewSession(sessionData: CreateInterviewSessionRequest): Promise<InterviewSession> {
    return this.makeRequest('/interviews/', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async updateInterviewSession(sessionId: string, updates: Partial<InterviewSession>): Promise<InterviewSession> {
    return this.makeRequest(`/interviews/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async startInterviewSession(sessionId: string): Promise<InterviewSession> {
    return this.makeRequest(`/interviews/${sessionId}/start`, {
      method: 'POST',
    });
  }

  async endInterviewSession(sessionId: string): Promise<InterviewSession> {
    return this.makeRequest(`/interviews/${sessionId}/end`, {
      method: 'POST',
    });
  }

  async deleteInterviewSession(sessionId: string): Promise<void> {
    return this.makeRequest(`/interviews/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async getCompanyInterviewSessions(): Promise<InterviewSession[]> {
    // This will get interview sessions for the current user's company
    return this.getInterviewSessions();
  }

  async submitInterviewAnalysis(sessionId: string, analysisData: {
    session_id: string;
    analysis: string;
    metrics: any;
    transcript_summary: any[];
    journal_notes: string[];
    final_code: string;
  }): Promise<InterviewSession> {
    return this.makeRequest(`/interviews/${sessionId}/submit-analysis`, {
      method: 'POST',
      body: JSON.stringify(analysisData),
    });
  }

  async getCompanyInterviewSummaries(): Promise<InterviewSession[]> {
    return this.makeRequest('/interviews/company/summaries', {
      method: 'GET',
    });
  }
}

export const interviewsService = new InterviewsService();