const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Candidate {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  resume_url?: string;
  github_profile?: string;
  linkedin_profile?: string;
  portfolio_url?: string;
  experience_level: string;
  preferred_languages: string[];
  current_company?: string;
  current_position?: string;
  location: string;
  availability_status: string;
  skills: string[];
  created_at: string;
  updated_at: string;
}

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
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
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

class CandidatesService {
  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getStoredToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use the HTTP status
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return this.makeRequest('/candidates/');
  }

  async getCandidateById(candidateId: string): Promise<Candidate> {
    return this.makeRequest(`/candidates/${candidateId}`);
  }

  async getCandidateHistory(candidateId: string): Promise<any[]> {
    return this.makeRequest(`/candidates/${candidateId}/history`);
  }

  async addCandidateNotes(candidateId: string, notes: string): Promise<any> {
    return this.makeRequest(`/candidates/${candidateId}/notes`, {
      method: 'PUT',
      body: JSON.stringify({ notes }),
    });
  }

  async verifyInterviewAccess(email: string, interviewId: string): Promise<any> {
    return this.makeRequest('/candidates/verify-interview-access', {
      method: 'POST',
      body: JSON.stringify({
        email,
        interview_id: interviewId,
      }),
    });
  }

  async inviteCandidate(email: string): Promise<any> {
    return this.makeRequest(`/candidates/invite?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    });
  }
}

export const candidatesService = new CandidatesService();