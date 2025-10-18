import type { ExecutionResult, TestResult } from '../types';
import { mockExecutionService } from './mockExecution';

interface PistonExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
  compile?: {
    stdout: string;
    stderr: string;
    code: number;
    signal: string | null;
    output: string;
  };
}

interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

// Simplified language mappings for only Python 3.9 and GCC
const LANGUAGE_MAP: Record<string, { language: string; version: string; extension: string }> = {
  python: { language: 'python', version: '3.9.4', extension: 'py' },
  python3: { language: 'python', version: '3.9.4', extension: 'py' },
  py: { language: 'python', version: '3.9.4', extension: 'py' },
  c: { language: 'c', version: '10.2.0', extension: 'c' },
  cpp: { language: 'c++', version: '10.2.0', extension: 'cpp' },
  'c++': { language: 'c++', version: '10.2.0', extension: 'cpp' },
  gcc: { language: 'c', version: '10.2.0', extension: 'c' },
  'g++': { language: 'c++', version: '10.2.0', extension: 'cpp' },
};

export class PistonService {
  private readonly baseUrl: string;
  private runtimes: PistonRuntime[] = [];
  private runtimesLoaded = false;

  constructor(baseUrl = 'http://13.221.248.158') {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if Piston API is configured and accessible
   */
  private async isConfigured(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v2/runtimes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Failed to connect to Piston:', error);
      return false;
    }
  }

  /**
   * Load available runtimes from Piston API
   */
  private async loadRuntimes(): Promise<void> {
    if (this.runtimesLoaded) return;

    try {
      const response = await fetch(`${this.baseUrl}/api/v2/runtimes`);
      if (response.ok) {
        this.runtimes = await response.json();
        this.runtimesLoaded = true;
      }
    } catch {
      console.warn('[Piston] Failed to load runtimes');
    }
  }

  /**
   * Get language configuration for Piston
   */
  private getLanguageConfig(language: string): { language: string; version: string; extension: string } {
    const normalizedLanguage = language.toLowerCase();
    
    // Check direct mapping first
    if (LANGUAGE_MAP[normalizedLanguage]) {
      return LANGUAGE_MAP[normalizedLanguage];
    }

    // Check for partial matches
    if (normalizedLanguage.includes('python') || normalizedLanguage.includes('py')) {
      return LANGUAGE_MAP.python;
    }
    if (normalizedLanguage.includes('c++') || normalizedLanguage.includes('cpp')) {
      return LANGUAGE_MAP.cpp;
    }
    if (normalizedLanguage.includes('c')) {
      return LANGUAGE_MAP.c;
    }

    // Default fallback to Python
    return LANGUAGE_MAP.python;
  }

  /**
   * Get the appropriate filename for the code
   */
  private getFileName(language: string, extension: string): string {
    const langConfig = this.getLanguageConfig(language);
    if (langConfig.language === 'c++' || langConfig.language === 'c') {
      return `main.${extension}`;
    }
    return `main.${extension}`;
  }

  /**
   * Format input for Piston API
   * Ensures proper newline formatting for stdin
   */
  private formatInputForPiston(input?: string): string {
    if (!input) return '';

    // If input is already properly formatted (ends with newline), return as is
    if (input.endsWith('\n')) {
      return input;
    }

    // For multiple inputs separated by spaces or commas, convert to newlines
    // This handles cases like "5 10" or "5,10" -> "5\n10\n"
    if (input.includes(' ') || input.includes(',')) {
      const values = input.split(/[,\s]+/).filter(v => v.trim());
      return values.join('\n') + '\n';
    }

    // For single input, ensure it ends with newline
    return input.trim() + '\n';
  }

  /**
   * Execute code using Piston API
   */
  async executeCode(
    code: string,
    language: string,
    input?: string,
    timeout: number = 2
  ): Promise<ExecutionResult> {
// PistonService.executeCode called
    
    const executionStartTime = Date.now();
    
    // Check if Piston is configured
    const isConfigured = await this.isConfigured();
    
    if (!isConfigured) {
      const logMessage = 'Piston not running on 110.239.123.172:3001 - using mock execution service';
      console.warn(`[Piston] ${logMessage}`);
      
      const result = await mockExecutionService.executeCode(code, language, input);
      return {
        ...result,
        logs: [`[INFO] ${logMessage}`, ...(result.logs || [])],
      };
    }

    const logs: string[] = [];
    logs.push(`[INFO] Starting Piston execution for ${language} code (${code.length} chars)`);
    
    try {
      // Load runtimes if not already loaded
      await this.loadRuntimes();

      const languageConfig = this.getLanguageConfig(language);
      logs.push(`[INFO] Language resolved: ${languageConfig.language} v${languageConfig.version}`);

      const fileName = this.getFileName(language, languageConfig.extension);
      const formattedInput = this.formatInputForPiston(input);

      // Enhanced input logging
      logs.push(`[DEBUG] Raw input parameter: ${JSON.stringify(input)}`);
      logs.push(`[DEBUG] Formatted input for Piston: ${JSON.stringify(formattedInput)}`);
      logs.push(`[DEBUG] Input will be sent as stdin: ${formattedInput ? 'YES' : 'NO'}`);

      // Prepare request payload
      const requestPayload: PistonExecuteRequest = {
        language: languageConfig.language,
        version: languageConfig.version,
        files: [
          {
            name: fileName,
            content: code
          }
        ],
        stdin: formattedInput,
        run_timeout: 2 * 1000, // Convert to milliseconds
        compile_timeout: 10000, // 10 seconds for compilation
        run_memory_limit: 128 * 1024 * 1024, // 128MB
        compile_memory_limit: 128 * 1024 * 1024, // 128MB
      };

      logs.push(`[DEBUG] Request payload stdin field: ${JSON.stringify(requestPayload.stdin)}`);
      logs.push(`[INFO] Submitting code to Piston API at ${this.baseUrl}/api/v2/execute`);

      const response = await fetch(`${this.baseUrl}/api/v2/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error(`Piston API error: ${response.status} ${response.statusText}`);
      }

      const result: PistonExecuteResponse = await response.json();
      
      const executionTime = Date.now() - executionStartTime;
      logs.push(`[INFO] Execution completed in ${executionTime}ms`);
      
      return this.formatExecutionResult(result, logs);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const executionTime = Date.now() - executionStartTime;
      
      logs.push(`[ERROR] Piston execution failed after ${executionTime}ms: ${errorMessage}`);
      logs.push(`[INFO] Falling back to mock execution service`);
      
      console.error('[Piston] Execution failed, falling back to mock service:', error);
      
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
    testCases: Array<{ input: unknown; expectedOutput: unknown; id: string }>,
    timeout: number = 5
  ): Promise<ExecutionResult> {
    const logs: string[] = [];
    
    // Check if Piston is configured
    if (!(await this.isConfigured())) {
      const logMessage = 'Piston API not configured - using mock test execution service';
      logs.push(`[INFO] ${logMessage}`);
      console.warn('[Piston] Not configured. Using mock execution service.');
      
      const result = await mockExecutionService.runTestCases(code, language, testCases);
      return {
        ...result,
        logs: [...logs, ...(result.logs || [])],
      };
    }

    logs.push(`[INFO] Running ${testCases.length} test cases with Piston`);
    
    try {
      const testResults: TestResult[] = [];
      let allPassed = true;
      let totalExecutionTime = 0;

      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        logs.push(`[INFO] Running test case ${i + 1}/${testCases.length}: ${testCase.id}`);
        
        const startTime = Date.now();

        // Format input properly for the test case
        let testInput: string = '';
        if (testCase.input !== null && testCase.input !== undefined) {
          if (typeof testCase.input === 'string') {
            testInput = testCase.input;
          } else if (Array.isArray(testCase.input)) {
            // Handle array inputs by joining with newlines
            testInput = testCase.input.join('\n');
          } else {
            // For objects or other types, convert to string
            testInput = JSON.stringify(testCase.input);
          }
        }

        // Enhanced logging for input-output correspondence
        logs.push(`[TEST] ═══════════════════════════════════════════════════════════`);
        logs.push(`[TEST] Test Case: ${testCase.id}`);
        logs.push(`[TEST] Input: ${JSON.stringify(testCase.input)}`);
        logs.push(`[TEST] Formatted for execution: ${JSON.stringify(testInput)}`);
        logs.push(`[TEST] Input length: ${testInput.length} chars`);

        const result = await this.executeCode(
          code,
          language,
          testInput, // Always pass the testInput, even if it's empty string
          timeout
        );
        const executionTime = Date.now() - startTime;
        totalExecutionTime += executionTime;

        const output = result.output?.trim() || '';
        const passed = this.compareOutputs(output, testCase.expectedOutput);
        allPassed = allPassed && passed;

        // Enhanced output logging with clear input-output mapping
        const normalizedExpected = this.normalizeOutput(testCase.expectedOutput);
        logs.push(`[TEST] Output: "${output}"`);
        logs.push(`[TEST] Expected: "${normalizedExpected}"`);
        logs.push(`[TEST] Result: ${passed ? '✅ PASSED' : '❌ FAILED'} (${executionTime}ms)`);

        // Show input → output mapping clearly
        logs.push(`[TEST] Mapping: ${JSON.stringify(testCase.input)} → "${output}"`);

        testResults.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: output,
          executionTime,
          error: result.error,
        });

        if (!passed) {
          logs.push(`[DEBUG] Raw expected type: ${typeof testCase.expectedOutput}, value: ${JSON.stringify(testCase.expectedOutput)}`);
          logs.push(`[DEBUG] Comparison details - Normalized actual: "${this.normalizeOutput(output)}", Normalized expected: "${normalizedExpected}"`);
        } else {
          logs.push(`[DEBUG] ✓ Output matches expected result`);
        }

        // Add separator for readability
        logs.push(`[TEST] ═══════════════════════════════════════════════════════════`);
        logs.push(`[INFO] ────────────────────────────────────────`);
      }

      const avgExecutionTime = totalExecutionTime / testCases.length;
      logs.push(`[INFO] All test cases completed. Average execution time: ${avgExecutionTime.toFixed(2)}ms`);

      return {
        success: allPassed,
        output: allPassed ? 'All tests passed!' : `${testResults.filter(t => t.passed).length}/${testCases.length} tests passed`,
        error: allPassed ? undefined : 'Some test cases failed',
        executionTime: totalExecutionTime,
        memoryUsage: 0, // Piston doesn't provide detailed memory info
        testResults,
        logs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logs.push(`[ERROR] Test execution failed: ${errorMessage}`);
      logs.push(`[INFO] Falling back to mock execution service`);
      
      console.error('[Piston] Test execution failed, falling back to mock service:', error);
      
      const fallbackResult = await mockExecutionService.runTestCases(code, language, testCases);
      return {
        ...fallbackResult,
        logs: [...logs, ...(fallbackResult.logs || [])],
      };
    }
  }

  /**
   * Get available languages/runtimes
   */
  async getAvailableLanguages(): Promise<string[]> {
    try {
      await this.loadRuntimes();
      return this.runtimes.map(runtime => runtime.language);
    } catch (error) {
      console.warn('[Piston] Failed to get available languages:', error);
      return Object.keys(LANGUAGE_MAP);
    }
  }

  /**
   * Format Piston execution result
   */
  private formatExecutionResult(result: PistonExecuteResponse, logs: string[] = []): ExecutionResult {
    const hasCompileError = result.compile && result.compile.code !== 0;
    const hasRuntimeError = result.run.code !== 0;
    
    // Determine if execution was successful
    const success = !hasCompileError && !hasRuntimeError;
    
    // Combine outputs
    const output = result.run.stdout || '';
    let error: string | undefined;
    
    if (hasCompileError) {
      error = result.compile!.stderr || result.compile!.output || 'Compilation failed';
      logs.push(`[ERROR] Compilation failed with code ${result.compile!.code}`);
    } else if (hasRuntimeError) {
      error = result.run.stderr || result.run.output || 'Runtime error';
      logs.push(`[ERROR] Runtime error with code ${result.run.code}`);
    }
    
    // If there's stderr but no error status, include it as a warning
    if (!error && result.run.stderr) {
      logs.push(`[WARN] stderr: ${result.run.stderr}`);
    }

    return {
      success,
      output: output.trim(),
      error,
      executionTime: 0, // Piston doesn't provide detailed timing
      memoryUsage: 0,    // Piston doesn't provide detailed memory usage
      testResults: [],   // Single execution doesn't have test results
      logs,
    };
  }

  /**
   * Normalize output for comparison
   * Handles various output formats and types consistently
   */
  private normalizeOutput(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    if (typeof value === 'boolean') {
      return value.toString();
    }

    if (Array.isArray(value)) {
      // Handle arrays by joining elements or converting to string representation
      return value.map(item => this.normalizeOutput(item)).join(' ').trim();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value).trim();
  }

  /**
   * Compare two outputs with flexible matching
   * Handles different formats and representations
   */
  private compareOutputs(actual: string, expected: unknown): boolean {
    const normalizedActual = this.normalizeOutput(actual);
    const normalizedExpected = this.normalizeOutput(expected);

    // Direct string comparison (most common case)
    if (normalizedActual === normalizedExpected) {
      return true;
    }

    // Try numeric comparison if both can be parsed as numbers
    const actualNum = parseFloat(normalizedActual);
    const expectedNum = parseFloat(normalizedExpected);
    if (!isNaN(actualNum) && !isNaN(expectedNum)) {
      return Math.abs(actualNum - expectedNum) < 1e-9; // Handle floating point precision
    }

    // Try boolean comparison
    const actualBool = normalizedActual.toLowerCase();
    const expectedBool = normalizedExpected.toLowerCase();
    if ((actualBool === 'true' || actualBool === 'false') &&
        (expectedBool === 'true' || expectedBool === 'false')) {
      return actualBool === expectedBool;
    }

    // Handle array-like outputs (space or newline separated)
    const actualParts = normalizedActual.split(/[\s\n]+/).filter(s => s);
    const expectedParts = normalizedExpected.split(/[\s\n]+/).filter(s => s);
    if (actualParts.length === expectedParts.length && actualParts.length > 1) {
      return actualParts.every((part, index) =>
        this.compareOutputs(part, expectedParts[index])
      );
    }

    // Case-insensitive comparison for strings
    if (normalizedActual.toLowerCase() === normalizedExpected.toLowerCase()) {
      return true;
    }

    return false;
  }
}

// Export singleton instance with environment configuration
export const pistonService = new PistonService(
  // import.meta.env.VITE_PISTON_API_URL || 'http://localhost:3001'
  import.meta.env.VITE_PISTON_API_URL || 'http://13.221.248.158'
);
export default pistonService;
