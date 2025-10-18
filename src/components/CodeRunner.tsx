import React, { useState } from 'react';
import { PlayIcon, StopIcon, RefreshIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from './Icons';
import { pistonService } from '../services/piston';
import type { TestCase, TestResult } from '../types';

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime: number;
  memoryUsage: number;
  testResults?: TestResult[];
}

interface CodeRunnerProps {
  code: string;
  language: string;
  testCases?: TestCase[];
  className?: string;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({
  code,
  language,
  testCases = [],
  className = '',
}) => {
// CodeRunner component for executing code and showing results
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'run' | 'testcases'>('run');

  const handleRun = async () => {
    console.log('🚀 CodeRunner handleRun clicked!', { code, language, input, testCases: testCases?.length });

    if (isRunning) return;

    setIsRunning(true);
    setResult(null);

    try {
      if (testCases && testCases.length > 0) {
        const pistonResult = await pistonService.runTestCases(code, language, testCases);
        
        const executionResult: ExecutionResult = {
          success: pistonResult.success,
          output: pistonResult.output,
          error: pistonResult.error,
          executionTime: pistonResult.executionTime || 0,
          memoryUsage: pistonResult.memoryUsage || 0,
          testResults: pistonResult.testResults || [],
        };

        setResult(executionResult);
      } else {
        console.log('� Running code with custom input...');
        const pistonResult = await pistonService.executeCode(code, language, input);
        console.log('✅ Piston result:', pistonResult);
        
        const executionResult: ExecutionResult = {
          success: pistonResult.success,
          output: pistonResult.output,
          error: pistonResult.error,
          executionTime: pistonResult.executionTime || 0,
          memoryUsage: pistonResult.memoryUsage || 0,
        };

        setResult(executionResult);
      }
    } catch (error) {
      console.error('CodeRunner execution error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed',
        executionTime: 0,
        memoryUsage: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setResult(null);
  };

  const formatMemoryUsage = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <button
            onClick={isRunning ? handleStop : handleRun}
            disabled={!code.trim()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
            }`}
          >
            {isRunning ? (
              <>
                <StopIcon className="w-4 h-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4" />
                <span>Run Code</span>
              </>
            )}
          </button>

          {result && (
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Piston Engine</span>
          </div>

          {result && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <ClockIcon className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{result.executionTime}ms</span>
              </div>
              <div className="text-gray-600">
                Memory: {formatMemoryUsage(result.memoryUsage)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex space-x-1 p-2">
          <button
            onClick={() => setActiveTab('run')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              activeTab === 'run'
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Custom Input
          </button>
          {testCases && testCases.length > 0 && (
            <button
              onClick={() => setActiveTab('testcases')}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                activeTab === 'testcases'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              Test Cases ({testCases.length})
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Content based on active tab */}
        {activeTab === 'run' && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex flex-col space-y-2">
              <label htmlFor="code-input" className="text-sm font-medium text-gray-700">
                Input (stdin)
              </label>
              <textarea
                id="code-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter input for your program (one value per line)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono resize-y min-h-[60px] max-h-[120px] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isRunning}
              />
              <div className="text-xs text-gray-500">
                Tip: For multiple inputs, put each value on a new line or separate with spaces
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcases' && testCases && testCases.length > 0 && (
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Test Cases ({testCases.length})</h4>
              {testCases.slice(0, 3).map((testCase, index) => (
                <div key={testCase.id} className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs font-medium text-gray-500 mb-2">Test Case {index + 1}</div>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="font-medium text-gray-700">Input:</span>
                      <code className="ml-2 px-2 py-1 bg-blue-50 text-blue-800 rounded text-xs">
                        {typeof testCase.input === 'string' ? testCase.input : JSON.stringify(testCase.input)}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Expected:</span>
                      <code className="ml-2 px-2 py-1 bg-green-50 text-green-800 rounded text-xs">
                        {typeof testCase.expectedOutput === 'string' ? testCase.expectedOutput : JSON.stringify(testCase.expectedOutput)}
                      </code>
                    </div>
                  </div>
                </div>
              ))}
              {testCases.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  ...and {testCases.length - 3} more test cases
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isRunning && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
              <div className="text-gray-600">Executing with Piston...</div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !isRunning && (
          <div className="p-4">
          {result.testResults && result.testResults.length > 0 ? (
            // Test Results View
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {result.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <span className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    Test Results
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {result.testResults.filter(t => t.passed).length} / {result.testResults.length} passed
                </div>
              </div>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {result.testResults.map((testResult, index) => (
                  <div
                    key={testResult.testCaseId || index}
                    className={`p-3 rounded-lg border ${
                      testResult.passed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Test Case {index + 1}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        testResult.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {testResult.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                    {testResult.actualOutput && (
                      <div className="text-xs space-y-1">
                        <div>
                          <span className="font-medium">Output:</span>
                          <code className="ml-2 text-gray-800">{testResult.actualOutput}</code>
                        </div>
                      </div>
                    )}
                    {testResult.error && (
                      <div className="text-xs text-red-700 mt-1">
                        <span className="font-medium">Error:</span> {testResult.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : result.success ? (
            // Regular Output View
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                <span className="font-medium text-green-700">Execution Successful</span>
              </div>
              {result.output && (
                <pre className="bg-gray-50 p-3 rounded-md text-sm text-gray-800 whitespace-pre-wrap font-mono border">
                  {result.output}
                </pre>
              )}
            </div>
          ) : (
            // Error View
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <XCircleIcon className="w-5 h-5 text-red-500" />
                <span className="font-medium text-red-700">Execution Failed</span>
              </div>
              {result.error && (
                <pre className="bg-red-50 p-3 rounded-md text-sm text-red-800 whitespace-pre-wrap font-mono border border-red-200">
                  {result.error}
                </pre>
              )}
            </div>
          )}
          </div>
        )}

        {/* Empty State */}
        {!result && !isRunning && (
          <div className="flex items-center justify-center p-8 text-gray-500">
            <div className="text-center">
              <PlayIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div>Click "Run Code" to execute your solution</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeRunner;
