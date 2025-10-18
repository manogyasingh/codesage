import { Problem, ProblemCreate, ProblemUpdate, TestCase } from '../types';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ProblemsService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = authService.getToken();

    if (!token) {
      throw new Error('Authentication required');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token might be expired, try to refresh or logout
        authService.logout();
        throw new Error('Authentication expired. Please log in again.');
      }
      
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get all problems for the authenticated user's company
   * The backend automatically filters by company_id based on the user's token
   */
  async getProblems(): Promise<Problem[]> {
    try {
      const problems = await this.request<Problem[]>('/problems/');
      return problems;
    } catch (error) {
      console.error('Error fetching problems:', error);
      throw error;
    }
  }

  /**
   * Get a specific problem by ID
   * The backend ensures the problem belongs to the user's company
   */
  async getProblem(id: string): Promise<Problem> {
    try {
      const problem = await this.request<Problem>(`/problems/${id}`);
      return problem;
    } catch (error) {
      console.error(`Error fetching problem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create a new problem for the user's company
   */
  async createProblem(problemData: Omit<ProblemCreate, 'company_id' | 'created_by'>): Promise<Problem> {
    const user = authService.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const payload: ProblemCreate = {
      ...problemData,
      company_id: user.company_id,
      created_by: user.id,
    };

    try {
      const problem = await this.request<Problem>('/problems/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return problem;
    } catch (error) {
      console.error('Error creating problem:', error);
      throw error;
    }
  }

  /**
   * Update an existing problem
   * The backend ensures the problem belongs to the user's company
   */
  async updateProblem(id: string, updates: ProblemUpdate): Promise<Problem> {
    try {
      const problem = await this.request<Problem>(`/problems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return problem;
    } catch (error) {
      console.error(`Error updating problem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete a problem
   * The backend ensures the problem belongs to the user's company
   */
  async deleteProblem(id: string): Promise<void> {
    try {
      await this.request<void>(`/problems/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error(`Error deleting problem ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get problems filtered by difficulty
   */
  async getProblemsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): Promise<Problem[]> {
    try {
      const problems = await this.getProblems();
      return problems.filter(problem => problem.difficulty === difficulty);
    } catch (error) {
      console.error(`Error fetching ${difficulty} problems:`, error);
      throw error;
    }
  }

  /**
   * Get problems filtered by category
   */
  async getProblemsByCategory(category: string): Promise<Problem[]> {
    try {
      const problems = await this.getProblems();
      return problems.filter(problem => problem.category === category);
    } catch (error) {
      console.error(`Error fetching ${category} problems:`, error);
      throw error;
    }
  }

  /**
   * Get problems filtered by programming language
   */
  async getProblemsByLanguage(language: string): Promise<Problem[]> {
    try {
      const problems = await this.getProblems();
      return problems.filter(problem =>
        problem.programming_languages.includes(language)
      );
    } catch (error) {
      console.error(`Error fetching ${language} problems:`, error);
      throw error;
    }
  }

  /**
   * Get problem by interview ID
   * Fetches the problem associated with a specific interview session
   */
  async getProblemByInterviewId(interviewId: string): Promise<Problem> {
    try {
      const problem = await this.request<Problem>(`/interviews/${interviewId}/problem`);
      return problem;
    } catch (error) {
      console.error(`Error fetching problem for interview ${interviewId}:`, error);
      throw error;
    }
  }

  /**
   * Get interview and problem data for candidates (no authentication required)
   * This now returns all problems from the company for problem switching
   */
  async getInterviewDataForCandidate(interviewId: string): Promise<{
    interview: any,
    problem: Problem,
    problems: Problem[]
  }> {
    try {
      const url = `${API_BASE_URL}/interviews/${interviewId}/candidate-access`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error fetching interview data for candidate ${interviewId}:`, error);
      throw error;
    }
  }

  /**
   * Switch to a different problem within the same interview session
   */
  async switchProblem(interviewId: string, problemId: string): Promise<{
    success: boolean,
    problem: Problem,
    switched_at: string
  }> {
    try {
      const url = `${API_BASE_URL}/interviews/${interviewId}/switch-problem/${problemId}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error switching to problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Execute code against test cases and validate results
   */
  async executeCodeWithValidation(
    interviewId: string,
    code: string,
    language: string,
    problemId: string
  ): Promise<{
    success: boolean,
    execution_results: Array<{
      test_case_id: number,
      input: string,
      expected_output: string,
      actual_output: string,
      passed: boolean,
      execution_time?: number,
      memory_used?: number,
      error?: string
    }>,
    summary: {
      passed_count: number,
      total_count: number,
      success_rate: number,
      all_passed: boolean
    },
    solution_comparison?: {
      has_solution: boolean,
      solution_language?: string,
      solution_explanation?: string,
      time_complexity?: string,
      space_complexity?: string
    },
    problem_id: string,
    language: string
  }> {
    try {
      const url = `${API_BASE_URL}/interviews/${interviewId}/execute-code`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          problem_id: problemId
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error executing code for problem ${problemId}:`, error);
      throw error;
    }
  }

  /**
   * Parse test cases from varchar format (with \n newlines)
   */
  parseTestCasesFromVarchar(testCasesString: string): TestCase[] {
    try {
      if (!testCasesString || typeof testCasesString !== 'string') {
        return [];
      }

      const testCases: TestCase[] = [];
      const testCaseBlocks = testCasesString.trim().split('\n\n');

      testCaseBlocks.forEach((block, index) => {
        if (block.trim()) {
          const lines = block.trim().split('\n');
          if (lines.length >= 2) {
            const inputLines = lines.slice(0, -1);
            const expectedOutput = lines[lines.length - 1];

            testCases.push({
              id: (index + 1).toString(),
              input: inputLines.join('\n'),
              expected_output: expectedOutput,
              is_hidden: false,
              explanation: ''
            });
          }
        }
      });

      return testCases;
    } catch (error) {
      console.error('Error parsing test cases from varchar format:', error);
      return [];
    }
  }

  /**
   * Format test cases to varchar format (with \n newlines)
   */
  formatTestCasesToVarchar(testCases: TestCase[]): string {
    try {
      return testCases.map(tc => {
        const input = tc.input || '';
        const expectedOutput = tc.expected_output || '';
        return `${input}\n${expectedOutput}`;
      }).join('\n\n');
    } catch (error) {
      console.error('Error formatting test cases to varchar format:', error);
      return '';
    }
  }

  /**
   * Validate code output against expected results
   */
  validateCodeOutput(actualOutput: string, expectedOutput: string): boolean {
    try {
      // Trim whitespace and normalize line endings
      const normalizedActual = actualOutput.trim().replace(/\r\n/g, '\n');
      const normalizedExpected = expectedOutput.trim().replace(/\r\n/g, '\n');

      return normalizedActual === normalizedExpected;
    } catch (error) {
      console.error('Error validating code output:', error);
      return false;
    }
  }

  /**
   * Get solution for a problem (if available)
   */
  async getSolution(problemId: string, language?: string): Promise<{
    code: string,
    language: string,
    explanation?: string,
    time_complexity?: string,
    space_complexity?: string
  } | null> {
    try {
      const problem = await this.getProblem(problemId);

      if (!problem.solution) {
        return null;
      }

      // If solution is stored as a single object
      if (typeof problem.solution === 'object' && !Array.isArray(problem.solution)) {
        const solution = problem.solution as any;

        // If language is specified, check if it matches
        if (language && solution.language !== language) {
          return null;
        }

        return {
          code: solution.code || '',
          language: solution.language || '',
          explanation: solution.explanation || '',
          time_complexity: solution.time_complexity || '',
          space_complexity: solution.space_complexity || ''
        };
      }

      // If solution is stored as an array of solutions for different languages
      if (Array.isArray(problem.solution)) {
        const solutions = problem.solution as any[];
        const targetSolution = language
          ? solutions.find(s => s.language === language)
          : solutions[0];

        if (!targetSolution) {
          return null;
        }

        return {
          code: targetSolution.code || '',
          language: targetSolution.language || '',
          explanation: targetSolution.explanation || '',
          time_complexity: targetSolution.time_complexity || '',
          space_complexity: targetSolution.space_complexity || ''
        };
      }

      return null;
    } catch (error) {
      console.error(`Error getting solution for problem ${problemId}:`, error);
      return null;
    }
  }
}

export const problemsService = new ProblemsService();
export type { Problem, ProblemCreate, ProblemUpdate, TestCase };
