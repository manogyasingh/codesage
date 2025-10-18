import type { ExecutionResult, TestResult } from '../types';

/**
 * Mock code execution service for development/demo purposes
 * This simulates code execution when Judge0 is not available
 */
export class MockCodeExecutionService {
  
  /**
   * Simulate code execution with mock results
   */
  async executeCode(
    code: string,
    language: string,
    input?: string
  ): Promise<ExecutionResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    logs.push(`[MOCK] Starting mock execution for ${language}`);
    logs.push(`[MOCK] Code length: ${code.length} characters`);
    
    if (input) {
      logs.push(`[MOCK] Input provided: ${input.length} characters`);
    }

    // Simulate network delay
    const delayMs = 1000 + Math.random() * 2000;
    logs.push(`[MOCK] Simulating network delay: ${delayMs.toFixed(0)}ms`);
    await this.delay(delayMs);

    // Simulate different execution scenarios
    const scenario = this.determineScenario(code, language);
    logs.push(`[MOCK] Determined execution scenario: ${scenario}`);
    
    const result = this.generateMockResult(scenario, code, language, input);
    
    const totalTime = Date.now() - startTime;
    logs.push(`[MOCK] Mock execution completed in ${totalTime}ms`);
    logs.push(`[MOCK] Result: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    
    return {
      ...result,
      logs: [...logs, ...(result.logs || [])],
    };
  }

  /**
   * Simulate running code against test cases
   */
  async runTestCases(
    code: string,
    language: string,
    testCases: Array<{ input: any; expectedOutput: any; id: string }>
  ): Promise<ExecutionResult> {
    const logs: string[] = [];
    const startTime = Date.now();
    
    logs.push(`[MOCK] Starting test case execution for ${language}`);
    logs.push(`[MOCK] Number of test cases: ${testCases.length}`);
    logs.push(`[MOCK] Code length: ${code.length} characters`);

    const delay = 1500 + Math.random() * 1000;
    logs.push(`[MOCK] Simulating test execution delay: ${delay.toFixed(0)}ms`);
    await this.delay(delay);

    const testResults: TestResult[] = [];
    let successCount = 0;
    let totalTime = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const executionTime = 50 + Math.random() * 200;
      totalTime += executionTime;

      logs.push(`[MOCK] Executing test case ${i + 1}/${testCases.length} (ID: ${testCase.id})`);
      logs.push(`[MOCK] Test input: ${JSON.stringify(testCase.input).substring(0, 100)}`);
      logs.push(`[MOCK] Expected output: ${JSON.stringify(testCase.expectedOutput).substring(0, 100)}`);

      // Simulate test success/failure based on code quality
      const passed = this.simulateTestResult(code, testCase);
      if (passed) {
        successCount++;
        logs.push(`[SUCCESS] Test case ${testCase.id} passed in ${executionTime.toFixed(2)}ms`);
      } else {
        logs.push(`[FAIL] Test case ${testCase.id} failed in ${executionTime.toFixed(2)}ms`);
      }

      const actualOutput = passed ? testCase.expectedOutput : this.generateWrongOutput(testCase.expectedOutput);
      
      testResults.push({
        testCaseId: testCase.id,
        passed,
        actualOutput,
        executionTime,
        error: passed ? undefined : `Expected: ${JSON.stringify(testCase.expectedOutput)}, Got: ${JSON.stringify(actualOutput)}`,
      });
    }

    const averageTime = totalTime / testCases.length;
    const allPassed = successCount === testCases.length;
    const totalExecutionTime = Date.now() - startTime;

    logs.push(`[MOCK] Test execution summary: ${successCount}/${testCases.length} passed`);
    logs.push(`[MOCK] Average test time: ${averageTime.toFixed(2)}ms`);
    logs.push(`[MOCK] Total execution time: ${totalExecutionTime}ms`);

    if (allPassed) {
      logs.push(`[SUCCESS] All test cases passed successfully!`);
    } else {
      logs.push(`[PARTIAL] ${testCases.length - successCount} test cases failed`);
    }

    return {
      success: allPassed,
      output: allPassed 
        ? `All ${testCases.length} test cases passed!` 
        : `${successCount}/${testCases.length} test cases passed`,
      error: allPassed ? undefined : 'Some test cases failed',
      executionTime: averageTime,
      memoryUsage: 1024 * (50 + Math.random() * 100), // 50-150KB
      testResults,
      logs,
    };
  }

  /**
   * Get list of supported languages (mock)
   */
  async getSupportedLanguages(): Promise<Array<{ id: number; name: string }>> {
    return [
      { id: 63, name: 'javascript' },
      { id: 71, name: 'python' },
      { id: 62, name: 'java' },
      { id: 54, name: 'cpp' },
      { id: 50, name: 'c' },
      { id: 51, name: 'csharp' },
      { id: 60, name: 'go' },
      { id: 73, name: 'rust' },
    ];
  }

  /**
   * Determine execution scenario based on code content
   */
  private determineScenario(code: string, language: string): 'success' | 'syntax_error' | 'runtime_error' | 'timeout' {
    const codeContent = code.toLowerCase().trim();
    
    // Check for common syntax errors
    if (language === 'python' && codeContent.includes('print(') && !codeContent.includes(')')) {
      return 'syntax_error';
    }
    
    if (language === 'javascript' && codeContent.includes('console.log(') && !codeContent.includes(')')) {
      return 'syntax_error';
    }

    // Check for potential runtime errors
    if (codeContent.includes('1/0') || codeContent.includes('division by zero')) {
      return 'runtime_error';
    }

    // Check for infinite loops
    if (codeContent.includes('while true') || codeContent.includes('while(true)')) {
      return 'timeout';
    }

    // Most code should execute successfully in demo
    return 'success';
  }

  /**
   * Generate mock execution result based on scenario
   */
  private generateMockResult(
    scenario: string, 
    code: string, 
    language: string, 
    input?: string
  ): ExecutionResult {
    const executionTime = 50 + Math.random() * 300;
    const memoryUsage = 1024 * (30 + Math.random() * 70); // 30-100KB
    const logs: string[] = [];

    logs.push(`[MOCK] Processing ${scenario} scenario for ${language}`);
    logs.push(`[MOCK] Simulated execution time: ${executionTime.toFixed(2)}ms`);
    logs.push(`[MOCK] Simulated memory usage: ${(memoryUsage/1024).toFixed(2)}KB`);

    switch (scenario) {
      case 'syntax_error':
        logs.push(`[MOCK] Generating syntax error for ${language}`);
        logs.push(`[ERROR] Compilation failed during syntax analysis`);
        return {
          success: false,
          error: this.generateSyntaxError(language),
          executionTime: executionTime * 0.1, // Syntax errors are caught early
          memoryUsage: memoryUsage * 0.1,
          testResults: [],
          logs,
        };

      case 'runtime_error':
        logs.push(`[MOCK] Generating runtime error scenario`);
        logs.push(`[ERROR] Runtime exception occurred during execution`);
        return {
          success: false,
          error: this.generateRuntimeError(language),
          executionTime: executionTime * 0.5,
          memoryUsage: memoryUsage * 0.5,
          testResults: [],
          logs,
        };

      case 'timeout':
        logs.push(`[MOCK] Simulating timeout scenario`);
        logs.push(`[ERROR] Execution exceeded time limit (5000ms)`);
        logs.push(`[WARN] Process terminated due to timeout`);
        return {
          success: false,
          error: 'Time Limit Exceeded (5.0s)',
          executionTime: 5000,
          memoryUsage,
          testResults: [],
          logs,
        };

      case 'success':
      default:
        const output = this.generateSuccessOutput(code, language, input);
        logs.push(`[MOCK] Code executed successfully`);
        logs.push(`[INFO] Generated output: ${output?.substring(0, 50)}${output && output.length > 50 ? '...' : ''}`);
        logs.push(`[SUCCESS] Execution completed without errors`);
        return {
          success: true,
          output,
          executionTime,
          memoryUsage,
          testResults: [],
          logs,
        };
    }
  }

  /**
   * Generate syntax error messages for different languages
   */
  private generateSyntaxError(language: string): string {
    const errors: Record<string, string[]> = {
      python: [
        'SyntaxError: unexpected EOF while parsing (line 1)',
        'SyntaxError: invalid syntax (line 2)',
        'IndentationError: expected an indented block',
      ],
      javascript: [
        'SyntaxError: Unexpected end of input',
        'SyntaxError: Unexpected token }',
        'SyntaxError: Missing ) after argument list',
      ],
      java: [
        'error: \';\' expected',
        'error: class, interface, or enum expected',
        'error: reached end of file while parsing',
      ],
      cpp: [
        'error: expected \';\' before \'}\' token',
        'error: \'main\' must return \'int\'',
        'error: expected declaration before \'}\' token',
      ],
    };

    const languageErrors = errors[language] || errors.javascript;
    return languageErrors[Math.floor(Math.random() * languageErrors.length)];
  }

  /**
   * Generate runtime error messages
   */
  private generateRuntimeError(language: string): string {
    const errors = [
      'Runtime Error: ZeroDivisionError: division by zero',
      'Runtime Error: IndexError: list index out of range',
      'Runtime Error: NameError: name \'undefined_var\' is not defined',
      'Runtime Error: TypeError: unsupported operand type(s)',
    ];

    return errors[Math.floor(Math.random() * errors.length)];
  }

  /**
   * Generate realistic output for successful execution
   */
  private generateSuccessOutput(code: string, language: string, input?: string): string {
    const codeContent = code.toLowerCase();

    // Check for common patterns and generate appropriate output
    if (codeContent.includes('hello') || codeContent.includes('world')) {
      return 'Hello, World!';
    }

    if (codeContent.includes('print') || codeContent.includes('console.log')) {
      // Extract content between quotes or parentheses
      const match = code.match(/["'`]([^"'`]*)["'`]/) || code.match(/\(([^)]*)\)/);
      if (match && match[1]) {
        return match[1].replace(/['"]/g, '');
      }
    }

    if (input) {
      return `Processed input: ${input}`;
    }

    // Default outputs based on language
    const defaultOutputs: Record<string, string> = {
      python: 'Code executed successfully',
      javascript: 'Code executed successfully',
      java: 'Code executed successfully',
      cpp: 'Code executed successfully',
      c: 'Code executed successfully',
    };

    return defaultOutputs[language] || 'Code executed successfully';
  }

  /**
   * Simulate test case results with some intelligence
   */
  private simulateTestResult(code: string, testCase: any): boolean {
    // Base success rate of 70%
    let successRate = 0.7;

    // Increase success rate for better-looking code
    if (code.includes('def ') || code.includes('function ') || code.includes('class ')) {
      successRate += 0.15;
    }

    // Increase success rate for code with comments
    if (code.includes('//') || code.includes('#') || code.includes('/*')) {
      successRate += 0.1;
    }

    // Decrease success rate for very short code
    if (code.trim().length < 20) {
      successRate -= 0.2;
    }

    return Math.random() < Math.max(0.3, Math.min(0.9, successRate));
  }

  /**
   * Generate wrong output for failed test cases
   */
  private generateWrongOutput(expectedOutput: any): any {
    if (typeof expectedOutput === 'number') {
      return expectedOutput + Math.floor(Math.random() * 3) - 1;
    }
    
    if (typeof expectedOutput === 'string') {
      return expectedOutput.charAt(0).toLowerCase() + expectedOutput.slice(1);
    }

    if (Array.isArray(expectedOutput)) {
      return [...expectedOutput, 'extra_element'];
    }

    return 'unexpected_output';
  }

  /**
   * Simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockExecutionService = new MockCodeExecutionService();