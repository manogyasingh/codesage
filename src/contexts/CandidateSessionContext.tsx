import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Problem } from '../types';
import { problemsService } from '../services/problems';

interface CandidateSession {
  candidateId: string;
  interviewId: string;
  candidateData: any;
  timestamp: string;
}

interface InterviewData {
  interview: any;
  problem: Problem;
  problems: Problem[];
}

interface CandidateSessionState {
  session: CandidateSession | null;
  interviewData: InterviewData | null;
  currentProblem: Problem | null;
  availableProblems: Problem[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isProblemSwitching: boolean;
  error: string | null;
}

type CandidateSessionAction =
  | { type: 'SESSION_START' }
  | { type: 'SESSION_SUCCESS'; payload: CandidateSession }
  | { type: 'SESSION_ERROR'; payload: string }
  | { type: 'SESSION_END' }
  | { type: 'INTERVIEW_DATA_LOADING' }
  | { type: 'INTERVIEW_DATA_SUCCESS'; payload: InterviewData }
  | { type: 'INTERVIEW_DATA_ERROR'; payload: string }
  | { type: 'PROBLEM_SWITCH_START' }
  | { type: 'PROBLEM_SWITCH_SUCCESS'; payload: Problem }
  | { type: 'PROBLEM_SWITCH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: CandidateSessionState = {
  session: null,
  interviewData: null,
  currentProblem: null,
  availableProblems: [],
  isAuthenticated: false,
  isLoading: false,
  isProblemSwitching: false,
  error: null,
};

const candidateSessionReducer = (state: CandidateSessionState, action: CandidateSessionAction): CandidateSessionState => {
  switch (action.type) {
    case 'SESSION_START':
      return { ...state, isLoading: true, error: null };
    case 'SESSION_SUCCESS':
      return {
        ...state,
        session: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SESSION_ERROR':
      return {
        ...state,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'SESSION_END':
      return initialState;
    case 'INTERVIEW_DATA_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'INTERVIEW_DATA_SUCCESS':
      return {
        ...state,
        interviewData: action.payload,
        currentProblem: action.payload.problem,
        availableProblems: action.payload.problems,
        isLoading: false,
        error: null,
      };
    case 'INTERVIEW_DATA_ERROR':
      return {
        ...state,
        interviewData: null,
        currentProblem: null,
        availableProblems: [],
        isLoading: false,
        error: action.payload,
      };
    case 'PROBLEM_SWITCH_START':
      return { ...state, isProblemSwitching: true, error: null };
    case 'PROBLEM_SWITCH_SUCCESS':
      return {
        ...state,
        currentProblem: action.payload,
        isProblemSwitching: false,
        error: null,
      };
    case 'PROBLEM_SWITCH_ERROR':
      return {
        ...state,
        isProblemSwitching: false,
        error: action.payload,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface CandidateSessionContextType {
  state: CandidateSessionState;
  startSession: (candidateId: string, interviewId: string, candidateData?: any) => Promise<void>;
  loadInterviewData: (interviewId: string) => Promise<void>;
  switchProblem: (problemId: string) => Promise<void>;
  executeCode: (code: string, language: string, problemId: string) => Promise<any>;
  refreshSession: () => Promise<void>;
  endSession: () => void;
  clearError: () => void;
}

const CandidateSessionContext = createContext<CandidateSessionContextType | undefined>(undefined);

export const CandidateSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(candidateSessionReducer, initialState);

  // Load session from localStorage on component mount
  useEffect(() => {
    const storedSession = localStorage.getItem('candidateSession');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        dispatch({ type: 'SESSION_SUCCESS', payload: sessionData });
        // Automatically load interview data if we have a session
        if (sessionData.interviewId) {
          loadInterviewData(sessionData.interviewId);
        }
      } catch (error) {
        console.error('Failed to parse stored session:', error);
        localStorage.removeItem('candidateSession');
      }
    }
  }, []);

  const startSession = async (candidateId: string, interviewId: string, candidateData?: any) => {
    dispatch({ type: 'SESSION_START' });
    try {
      const session: CandidateSession = {
        candidateId,
        interviewId,
        candidateData: candidateData || {},
        timestamp: new Date().toISOString(),
      };

      // Store session in localStorage
      localStorage.setItem('candidateSession', JSON.stringify(session));

      dispatch({ type: 'SESSION_SUCCESS', payload: session });

      // Automatically load interview data after session starts
      await loadInterviewData(interviewId);
    } catch (error) {
      dispatch({ type: 'SESSION_ERROR', payload: error instanceof Error ? error.message : 'Failed to start session' });
    }
  };

  const refreshSession = async () => {
    const storedSession = localStorage.getItem('candidateSession');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        dispatch({ type: 'SESSION_SUCCESS', payload: sessionData });
        // Reload interview data
        if (sessionData.interviewId) {
          await loadInterviewData(sessionData.interviewId);
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
        localStorage.removeItem('candidateSession');
        dispatch({ type: 'SESSION_ERROR', payload: 'Failed to refresh session' });
      }
    } else {
      dispatch({ type: 'SESSION_ERROR', payload: 'No stored session found' });
    }
  };

  const loadInterviewData = async (interviewId: string) => {
    dispatch({ type: 'INTERVIEW_DATA_LOADING' });
    try {
      const data = await problemsService.getInterviewDataForCandidate(interviewId);
      dispatch({ type: 'INTERVIEW_DATA_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'INTERVIEW_DATA_ERROR', payload: error instanceof Error ? error.message : 'Failed to load interview data' });
    }
  };

  const switchProblem = async (problemId: string) => {
    if (!state.session?.interviewId) {
      throw new Error('No active session');
    }

    dispatch({ type: 'PROBLEM_SWITCH_START' });
    try {
      const result = await problemsService.switchProblem(state.session.interviewId, problemId);
      dispatch({ type: 'PROBLEM_SWITCH_SUCCESS', payload: result.problem });
    } catch (error) {
      dispatch({ type: 'PROBLEM_SWITCH_ERROR', payload: error instanceof Error ? error.message : 'Failed to switch problem' });
      throw error;
    }
  };

  const executeCode = async (code: string, language: string, problemId: string) => {
    if (!state.session?.interviewId) {
      throw new Error('No active session');
    }

    try {
      const result = await problemsService.executeCodeWithValidation(
        state.session.interviewId,
        code,
        language,
        problemId
      );
      return result;
    } catch (error) {
      throw error;
    }
  };

  const endSession = () => {
    localStorage.removeItem('candidateSession');
    dispatch({ type: 'SESSION_END' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: CandidateSessionContextType = {
    state,
    startSession,
    loadInterviewData,
    switchProblem,
    executeCode,
    refreshSession,
    endSession,
    clearError,
  };

  return (
    <CandidateSessionContext.Provider value={contextValue}>
      {children}
    </CandidateSessionContext.Provider>
  );
};

export const useCandidateSession = (): CandidateSessionContextType => {
  const context = useContext(CandidateSessionContext);
  if (!context) {
    throw new Error('useCandidateSession must be used within a CandidateSessionProvider');
  }
  return context;
};
