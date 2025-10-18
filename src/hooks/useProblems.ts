import { useState, useEffect, useCallback } from 'react';
import { Problem, ProblemCreate, ProblemUpdate } from '../types';
import { problemsService } from '../services/problems';
import { useAuth } from '../contexts/AuthContext';

interface UseProblemsState {
  problems: Problem[];
  loading: boolean;
  error: string | null;
}

export const useProblems = () => {
  const [state, setState] = useState<UseProblemsState>({
    problems: [],
    loading: false,
    error: null,
  });
  
  const { isAuthenticated, getCompanyId } = useAuth();

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setProblems = (problems: Problem[]) => {
    setState(prev => ({ ...prev, problems }));
  };

  // Fetch all problems for the user's company
  const fetchProblems = useCallback(async () => {
    if (!isAuthenticated) {
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const problems = await problemsService.getProblems();
      setProblems(problems);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch problems');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch problems on component mount and when authentication status changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchProblems();
    } else {
      setProblems([]);
      setError(null);
    }
  }, [isAuthenticated, fetchProblems]);

  // Create a new problem
  const createProblem = useCallback(async (problemData: Omit<ProblemCreate, 'company_id' | 'created_by'>) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      const newProblem = await problemsService.createProblem(problemData);
      setProblems((prev: Problem[]) => [...prev, newProblem]);
      return newProblem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create problem';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Update an existing problem
  const updateProblem = useCallback(async (id: string, updates: ProblemUpdate) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProblem = await problemsService.updateProblem(id, updates);
      setProblems((prev: Problem[]) => prev.map((p: Problem) => p.id === id ? updatedProblem : p));
      return updatedProblem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update problem';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Delete a problem
  const deleteProblem = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    setLoading(true);
    setError(null);

    try {
      await problemsService.deleteProblem(id);
      setProblems((prev: Problem[]) => prev.filter((p: Problem) => p.id !== id));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete problem';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Get problems by difficulty
  const getProblemsByDifficulty = useCallback(async (difficulty: 'easy' | 'medium' | 'hard') => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await problemsService.getProblemsByDifficulty(difficulty);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch problems by difficulty';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated]);

  // Get problems by category
  const getProblemsByCategory = useCallback(async (category: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await problemsService.getProblemsByCategory(category);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch problems by category';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated]);

  // Search problems
  const searchProblems = useCallback(async (query: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await problemsService.searchProblems(query);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search problems';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated]);

  // Get problems statistics
  const getProblemsStats = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      return await problemsService.getProblemsStats();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch problems statistics';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isAuthenticated]);

  return {
    ...state,
    companyId: getCompanyId(),
    fetchProblems,
    createProblem,
    updateProblem,
    deleteProblem,
    getProblemsByDifficulty,
    getProblemsByCategory,
    searchProblems,
    getProblemsStats,
  };
};
