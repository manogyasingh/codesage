import { useState, useEffect, useCallback } from 'react';
import { Problem } from '../types';
import { problemsService } from '../services/problems';
import { interviewsService, InterviewSession } from '../services/interviews';

interface UseInterviewProblemState {
  problem: Problem | null;
  interview: InterviewSession | null;
  loading: boolean;
  error: string | null;
}

export const useInterviewProblem = (interviewId: string | undefined) => {
  const [state, setState] = useState<UseInterviewProblemState>({
    problem: null,
    interview: null,
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setProblem = (problem: Problem | null) => {
    setState(prev => ({ ...prev, problem }));
  };

  const setInterview = (interview: InterviewSession | null) => {
    setState(prev => ({ ...prev, interview }));
  };

  const fetchInterviewData = useCallback(async () => {
    if (!interviewId) {
      setError('Interview ID is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For candidates, try the public endpoint first
      try {
        const data = await problemsService.getInterviewDataForCandidate(interviewId);
        setInterview(data.interview);
        setProblem(data.problem);
        return; // Success, exit early
      } catch (candidateError) {
        console.log('Candidate access failed, trying authenticated access:', candidateError);
      }

      // If candidate access fails, try the authenticated approach
      const interviewData = await interviewsService.getInterviewSessionById(interviewId);
      setInterview(interviewData);

      if (interviewData.problem_id) {
        const problemData = await problemsService.getProblem(interviewData.problem_id);
        setProblem(problemData);
      } else {
        setError('No problem associated with this interview session');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch interview data';
      setError(errorMessage);
      console.error('Error fetching interview data:', error);
    } finally {
      setLoading(false);
    }
  }, [interviewId]);

  // Fetch data when interviewId changes
  useEffect(() => {
    if (interviewId) {
      fetchInterviewData();
    } else {
      // Clear state when no interview ID
      setState({
        problem: null,
        interview: null,
        loading: false,
        error: null,
      });
    }
  }, [interviewId, fetchInterviewData]);

  const refetch = useCallback(() => {
    fetchInterviewData();
  }, [fetchInterviewData]);

  return {
    ...state,
    refetch,
  };
};
