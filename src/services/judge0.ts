import type { ExecutionResult, TestResult } from '../types';
import { mockExecutionService } from './mockExecution';

interface Judge0Submission {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}

interface Judge0Response {
  token: string;
  stdout?: string;
  stderr?: string;
  status: {
    id: number;
    description: string;
  };
  time?: string;
  memory?: number;
  compile_output?: string;
}

// Language mappings for Judge0
const LANGUAGE_MAP: Record<string, number> = {
  javascript: 63, // Node.js
  typescript: 74, // TypeScript
  python: 71,     // Python 3
  java: 62,       // Java
  cpp: 54,        // C++
  c: 50,          // C
  csharp: 51,     // C#
  go: 60,         // Go
  rust: 73,       // Rust
  ruby: 72,       // Ruby
  php: 68,        // PHP
  swift: 83,      // Swift
  kotlin: 78,     // Kotlin
  scala: 81,      // Scala
  r: 80,          // R
  matlab: 64,     // Octave (MATLAB-like)
};

export class Judge0Service {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly rapidApiKey?: string;

  constructor(
    baseUrl = 'http://localhost:2358',
    options: { apiKey?: string; rapidApiKey?: string } = {}
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = options.apiKey;
    this.rapidApiKey = options.rapidApiKey;
  }

  /**
   * Execute code using Judge0 API
   */
  async executeCode(
    code: string,
    language: string,
    input?: string,
    timeout: number = 5
  ): Promise<ExecutionResult> {
    const executionStartTime = Date.now();
    
    // If Judge0 is not configured, use mock service
    if (!this.isConfigured()) {
      const logMessage = 'Judge0 API not configured - using mock execution service';
      console.warn(`[Judge0] ${logMessage}. See JUDGE0_SETUP.md for setup instructions.`);
      
      const result = await mockExecutionService.executeCode(code, language, input);
      // Add configuration warning to the result
      return {
        ...result,
        logs: [`[INFO] ${logMessage}`, ...(result.logs || [])],
      };
    }

    const logs: string[] = [];
    logs.push(`[INFO] Starting Judge0 execution for ${language} code (${code.length} chars)`);
    
    try {
      const languageId = this.getLanguageId(language);
      logs.push(`[INFO] Language ID resolved: ${languageId} for ${language}`);
      
      // Submit code for execution
      logs.push(`[INFO] Submitting code to Judge0 API...`);
      const submissionData = {
        source_code: this.base64Encode(code),
        language_id: languageId,
        stdin: input ? this.base64Encode(input) : undefined,
        cpu_time_limit: timeout,
        memory_limit: 128000, // 128MB in KB
      };
      
      const submission = await this.submitCode(submissionData);
      logs.push(`[INFO] Submission created with token: ${submission.token}`);

      // Poll for results
      logs.push(`[INFO] Polling for execution results...`);
      const result = await this.getSubmissionResult(submission.token);
      
      const executionTime = Date.now() - executionStartTime;
      logs.push(`[INFO] Execution completed in ${executionTime}ms with status: ${result.status.description}`);
      
      const formattedResult = this.formatExecutionResult(result);
      return {
        ...formattedResult,
        logs: [...logs, ...(formattedResult.logs || [])],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const executionTime = Date.now() - executionStartTime;
      
      logs.push(`[ERROR] Judge0 execution failed after ${executionTime}ms: ${errorMessage}`);
      logs.push(`[INFO] Falling back to mock execution service`);
      
      console.error('[Judge0] Execution failed, falling back to mock service:', error);
      
      const fallbackResult = await mockExecutionService.executeCode(code, language, input);
      return {
        ...fallbackResult,
        logs: [...logs, ...(fallbackResult.logs || [])],
      };
    }
  }

  /**
   * Run code against multiple test cases
   */
  async runTestCases(
    code: string,
    language: string,
    testCases: Array<{ input: any; expectedOutput: any; id: string }>,
    timeout: number = 5
  ): Promise<ExecutionResult> {
    const logs: string[] = [];
    
    // If Judge0 is not configured, use mock service
    if (!this.isConfigured()) {
      const logMessage = 'Judge0 API not configured - using mock test execution service';
      logs.push(`[INFO] ${logMessage}`);
      console.warn('Judge0 is not configured. Using mock execution service. See JUDGE0_SETUP.md for setup instructions.');
      
      const result = await mockExecutionService.runTestCases(code, language, testCases);
      return {
        ...result,
        logs: [...logs, ...(result.logs || [])],
      };
    }

    logs.push(`[INFO] Starting Judge0 test execution for ${testCases.length} test cases`);
    logs.push(`[INFO] Language: ${language}, Code length: ${code.length} chars`);

    try {
      const languageId = this.getLanguageId(language);
      const testResults: TestResult[] = [];
      let totalExecutionTime = 0;
      let maxMemoryUsage = 0;
      let hasError = false;
      let errorMessage = '';

      // Execute code against each test case
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        logs.push(`[INFO] Executing test case ${i + 1}/${testCases.length} (${testCase.id})`);
        
        try {
          const input = typeof testCase.input === 'string' 
            ? testCase.input 
            : JSON.stringify(testCase.input);

          logs.push(`[JUDGE0] Submitting test case ${testCase.id} to Judge0`);
          
          const submission = await this.submitCode({
            source_code: this.base64Encode(code),
            language_id: languageId,
            stdin: this.base64Encode(input),
            cpu_time_limit: timeout,
            memory_limit: 128000,
          });

          logs.push(`[JUDGE0] Test case ${testCase.id} submitted with token: ${submission.token}`);

          const result = await this.getSubmissionResult(submission.token);
          const executionTime = parseFloat(result.time || '0') * 1000; // Convert to ms
          const memoryUsage = (result.memory || 0) * 1024; // Convert KB to bytes

          totalExecutionTime += executionTime;
          maxMemoryUsage = Math.max(maxMemoryUsage, memoryUsage);

          logs.push(`[JUDGE0] Test case ${testCase.id} completed: ${result.status.description} (${executionTime.toFixed(2)}ms)`);

          if (result.status.id === 3) { // Accepted
            const actualOutput = this.base64Decode(result.stdout || '').trim();
            const expectedOutput = typeof testCase.expectedOutput === 'string'
              ? testCase.expectedOutput.trim()
              : JSON.stringify(testCase.expectedOutput);

            const passed = actualOutput === expectedOutput;

            if (passed) {
              logs.push(`[SUCCESS] Test case ${testCase.id} passed`);
            } else {
              logs.push(`[FAIL] Test case ${testCase.id} failed - output mismatch`);
            }

            testResults.push({
              testCaseId: testCase.id,
              passed,
              actualOutput: actualOutput || undefined,
              executionTime,
              error: passed ? undefined : `Expected: ${expectedOutput}, Got: ${actualOutput}`,
            });
          } else {
            // Execution failed
            hasError = true;
            const error = this.getErrorMessage(result);
            errorMessage = error;
            
            logs.push(`[ERROR] Test case ${testCase.id} execution failed: ${error}`);
            
            testResults.push({
              testCaseId: testCase.id,
              passed: false,
              executionTime,
              error,
            });
          }
        } catch (testError) {
          const error = testError instanceof Error ? testError.message : 'Test execution failed';
          logs.push(`[ERROR] Test case ${testCase.id} threw exception: ${error}`);
          
          testResults.push({
            testCaseId: testCase.id,
            passed: false,
            executionTime: 0,
            error,
          });
        }
      }

      const passedTests = testResults.filter(t => t.passed).length;
      const allTestsPassed = passedTests === testCases.length && !hasError;

      logs.push(`[INFO] Test execution completed: ${passedTests}/${testCases.length} passed`);
      logs.push(`[INFO] Average execution time: ${(totalExecutionTime / testCases.length).toFixed(2)}ms`);
      logs.push(`[INFO] Maximum memory usage: ${(maxMemoryUsage/1024).toFixed(2)}KB`);

      if (allTestsPassed) {
        logs.push(`[SUCCESS] All test cases passed successfully!`);
      } else {
        logs.push(`[PARTIAL] ${testCases.length - passedTests} test cases failed`);
      }

      return {
        success: allTestsPassed,
        output: allTestsPassed 
          ? `All tests passed! (${passedTests}/${testCases.length})` 
          : `Tests passed: ${passedTests}/${testCases.length}`,
        error: hasError ? errorMessage : undefined,
        executionTime: totalExecutionTime / testCases.length, // Average execution time
        memoryUsage: maxMemoryUsage,
        testResults,
        logs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`[ERROR] Judge0 test execution failed: ${errorMessage}`);
      logs.push(`[INFO] Falling back to mock test execution service`);
      
      console.error('Judge0 test execution failed, falling back to mock service:', error);
      
      const fallbackResult = await mockExecutionService.runTestCases(code, language, testCases);
      return {
        ...fallbackResult,
        logs: [...logs, ...(fallbackResult.logs || [])],
      };
    }
  }

  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<Array<{ id: number; name: string }>> {
    try {
      const response = await this.makeRequest('/languages');
      return response;
    } catch (error) {
      console.error('Failed to fetch supported languages:', error);
      return Object.entries(LANGUAGE_MAP).map(([name, id]) => ({ id, name }));
    }
  }

  /**
   * Check if Judge0 is properly configured
   */
  isReady(): boolean {
    return this.isConfigured();
  }

  /**
   * Submit code for execution
   */
  private async submitCode(submission: Judge0Submission): Promise<{ token: string }> {
    const response = await this.makeRequest('/submissions?base64_encoded=true&wait=false', {
      method: 'POST',
      body: JSON.stringify(submission),
    });

    return response;
  }

  /**
   * Get submission result by polling
   */
  private async getSubmissionResult(token: string, maxAttempts = 30): Promise<Judge0Response> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await this.makeRequest(`/submissions/${token}?base64_encoded=true`);
      
      // Check if execution is complete
      if (response.status.id > 2) { // Status > 2 means completed (success or error)
        return response;
      }

      // Wait before next poll
      await this.sleep(1000);
    }

    throw new Error('Execution timeout - submission took too long to complete');
  }

  /**
   * Make HTTP request to Judge0 API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    // Check if API is configured
    if (!this.isConfigured()) {
      throw new Error(
        'Judge0 is not configured. Please set up your API keys in the environment variables. ' +
        'See JUDGE0_SETUP.md for detailed instructions.'
      );
    }

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Add authentication headers
    if (this.rapidApiKey) {
      headers['X-RapidAPI-Key'] = this.rapidApiKey;
      headers['X-RapidAPI-Host'] = 'http://lcoalhost:2358';
    }
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge0 API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  /**
   * Check if Judge0 is properly configured
   */
  private isConfigured(): boolean {
    return Boolean(this.rapidApiKey || this.apiKey);
  }

  /**
   * Get language ID for Judge0
   */
  private getLanguageId(language: string): number {
    const normalizedLanguage = language.toLowerCase();
    const languageId = LANGUAGE_MAP[normalizedLanguage];
    
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}. Supported languages: ${Object.keys(LANGUAGE_MAP).join(', ')}`);
    }

    return languageId;
  }

  /**
   * Format Judge0 response to ExecutionResult
   */
  private formatExecutionResult(result: Judge0Response): ExecutionResult {
    const isSuccess = result.status.id === 3; // Status 3 = Accepted
    const executionTime = parseFloat(result.time || '0') * 1000; // Convert to ms
    const memoryUsage = (result.memory || 0) * 1024; // Convert KB to bytes
    const logs: string[] = [];

    logs.push(`[JUDGE0] Execution status: ${result.status.description} (ID: ${result.status.id})`);
    logs.push(`[JUDGE0] Execution time: ${result.time || '0'}s (${executionTime.toFixed(2)}ms)`);
    logs.push(`[JUDGE0] Memory usage: ${result.memory || '0'}KB (${(memoryUsage/1024).toFixed(2)}KB)`);

    if (result.stdout) {
      const output = this.base64Decode(result.stdout);
      logs.push(`[JUDGE0] Standard output length: ${output.length} characters`);
    }

    if (result.stderr) {
      const error = this.base64Decode(result.stderr);
      logs.push(`[JUDGE0] Standard error length: ${error.length} characters`);
    }

    if (result.compile_output) {
      const compileOutput = this.base64Decode(result.compile_output);
      logs.push(`[JUDGE0] Compilation output length: ${compileOutput.length} characters`);
    }

    if (isSuccess) {
      logs.push(`[SUCCESS] Code executed successfully via Judge0`);
    } else {
      logs.push(`[ERROR] Code execution failed via Judge0`);
    }

    return {
      success: isSuccess,
      output: isSuccess ? this.base64Decode(result.stdout || '') : undefined,
      error: !isSuccess ? this.getErrorMessage(result) : undefined,
      executionTime,
      memoryUsage,
      testResults: [],
      logs,
    };
  }

  /**
   * Get error message from Judge0 response
   */
  private getErrorMessage(result: Judge0Response): string {
    const statusMessages: Record<number, string> = {
      1: 'In Queue',
      2: 'Processing',
      3: 'Accepted',
      4: 'Wrong Answer',
      5: 'Time Limit Exceeded',
      6: 'Compilation Error',
      7: 'Runtime Error (SIGSEGV)',
      8: 'Runtime Error (SIGXFSZ)',
      9: 'Runtime Error (SIGFPE)',
      10: 'Runtime Error (SIGABRT)',
      11: 'Runtime Error (NZEC)',
      12: 'Runtime Error (Other)',
      13: 'Internal Error',
      14: 'Exec Format Error',
    };

    const statusMessage = statusMessages[result.status.id] || result.status.description;
    
    if (result.status.id === 6 && result.compile_output) {
      // Compilation error
      return `Compilation Error:\n${this.base64Decode(result.compile_output)}`;
    } else if (result.stderr) {
      // Runtime error
      return `${statusMessage}:\n${this.base64Decode(result.stderr)}`;
    } else {
      return statusMessage;
    }
  }

  /**
   * Base64 encode string
   */
  private base64Encode(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }

  /**
   * Base64 decode string
   */
  private base64Decode(str: string): string {
    try {
      return decodeURIComponent(escape(atob(str)));
    } catch {
      return str; // Return as-is if decoding fails
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create default instance with environment-based configuration
export const judge0Service = new Judge0Service(
  import.meta.env.VITE_JUDGE0_API_URL || 'http://localhost:2358',
  {
    rapidApiKey: import.meta.env.VITE_RAPIDAPI_KEY,
    apiKey: import.meta.env.VITE_JUDGE0_API_KEY,
  }
);

// Export for custom configurations
export default Judge0Service;
