import React, { useState } from 'react';
import { judge0Service } from '../services/judge0';
import type { ExecutionResult } from '../types';

export const Judge0Demo: React.FC = () => {
  const [code, setCode] = useState(`console.log("Hello, Judge0!");`);
  const [language, setLanguage] = useState('javascript');
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check configuration status on mount
  React.useEffect(() => {
    setIsConfigured(judge0Service.isReady());
  }, []);

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
  ];

  const sampleCodes = {
    javascript: `console.log("Hello, Judge0!");`,
    python: `print("Hello, Judge0!")`,
    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Judge0!");
    }
}`,
    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, Judge0!" << endl;
    return 0;
}`,
    c: `#include <stdio.h>

int main() {
    printf("Hello, Judge0!\\n");
    return 0;
}`,
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const executionResult = await judge0Service.executeCode(code, language);
      setResult(executionResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime: 0,
        memoryUsage: 0,
        testResults: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setCode(sampleCodes[newLanguage as keyof typeof sampleCodes] || '');
    setResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Judge0 Code Execution Demo</h2>
        
        {/* Language Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Programming Language
          </label>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        {/* Code Editor */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code
          </label>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={12}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            placeholder="Enter your code here..."
          />
        </div>

        {/* Run Button */}
        <div className="mb-4">
          <button
            onClick={handleRunCode}
            disabled={isRunning || !code.trim()}
            className={`px-6 py-2 rounded-md font-medium ${
              isRunning || !code.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>

        {/* Loading */}
        {isRunning && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Executing code...</span>
          </div>
        )}

        {/* Results */}
        {result && !isRunning && (
          <div className="border rounded-lg p-4">
            <div className="flex items-center mb-3">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                result.success ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className={`font-medium ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.success ? 'Execution Successful' : 'Execution Failed'}
              </span>
              <div className="ml-auto text-sm text-gray-500">
                {result.executionTime.toFixed(2)}ms • {(result.memoryUsage / 1024).toFixed(1)}KB
              </div>
            </div>

            {result.success && result.output && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Output:</h4>
                <pre className="bg-gray-50 p-3 rounded border text-sm font-mono whitespace-pre-wrap">
                  {result.output}
                </pre>
              </div>
            )}

            {!result.success && result.error && (
              <div>
                <h4 className="font-medium text-red-700 mb-2">Error:</h4>
                <pre className="bg-red-50 p-3 rounded border border-red-200 text-sm font-mono whitespace-pre-wrap text-red-800">
                  {result.error}
                </pre>
              </div>
            )}

            {/* Execution Logs */}
            {result.logs && result.logs.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Execution Logs ({result.logs.length} entries)
                </h4>
                <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                  {result.logs.map((log, index) => {
                    const isError = log.includes('[ERROR]') || log.includes('[FAIL]');
                    const isWarning = log.includes('[WARN]');
                    const isSuccess = log.includes('[SUCCESS]');
                    
                    let textColor = 'text-gray-300';
                    if (isError) textColor = 'text-red-400';
                    else if (isWarning) textColor = 'text-yellow-400';
                    else if (isSuccess) textColor = 'text-green-400';
                    else if (log.includes('[INFO]') || log.includes('[MOCK]') || log.includes('[JUDGE0]')) {
                      textColor = 'text-blue-400';
                    }

                    return (
                      <div key={index} className="flex items-start space-x-2 mb-1">
                        <span className="text-xs text-gray-500 w-6 flex-shrink-0 mt-0.5">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <code className={`text-xs font-mono ${textColor}`}>
                          {log}
                        </code>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuration Status */}
        <div className={`mt-6 p-4 rounded-lg ${isConfigured ? 'bg-green-50' : 'bg-yellow-50'}`}>
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConfigured ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <h3 className={`font-medium ${isConfigured ? 'text-green-900' : 'text-yellow-900'}`}>
              {isConfigured ? 'Judge0 Configured' : 'Judge0 Not Configured - Using Mock Service'}
            </h3>
          </div>
          
          {isConfigured ? (
            <p className="text-sm text-green-800">
              Judge0 API is properly configured and ready to execute code securely.
            </p>
          ) : (
            <div className="text-sm text-yellow-800">
              <p className="mb-2">
                Judge0 API credentials are not configured. The demo is using a mock execution service 
                that simulates code execution with realistic results.
              </p>
              <div className="mb-2">
                <strong>To enable real Judge0 execution:</strong>
              </div>
              <ol className="space-y-1 list-decimal list-inside ml-4">
                <li>Sign up for a free RapidAPI account</li>
                <li>Subscribe to the Judge0 CE API</li>
                <li>Create <code className="bg-yellow-100 px-1 rounded">.env.local</code> file in project root</li>
                <li>Add <code className="bg-yellow-100 px-1 rounded">VITE_RAPIDAPI_KEY=your_key_here</code></li>
                <li>Restart the development server</li>
              </ol>
              <p className="mt-2">
                See <code className="bg-yellow-100 px-1 rounded">JUDGE0_SETUP.md</code> for detailed instructions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Judge0Demo;