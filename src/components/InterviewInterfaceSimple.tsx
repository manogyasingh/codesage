import React, { useState, useEffect, useMemo } from 'react';
import { marked } from 'marked';
import { CodeEditor } from './CodeEditor';
import { ProblemSelector } from './ProblemSelector';
import { ClockIcon, CodeIcon, TestTubeIcon, AlertCircleIcon } from './Icons';
import { InterviewerPanel } from './InterviewerPanel';
import { InterviewAnalysisResults } from './InterviewAnalysisResults';
import { useCandidateSession } from '../contexts/CandidateSessionContext';
import { sphereClient, InterviewAnalysisResponse } from '../services/sphere';

// Configure marked for better rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

interface InterviewInterfaceProps {
  onSessionEnd?: () => void;
}

export const InterviewInterface: React.FC<InterviewInterfaceProps> = ({
  onSessionEnd,
}) => {
  const { state, switchProblem, executeCode, clearError } = useCandidateSession();
  const {
    currentProblem,
    availableProblems,
    isLoading,
    isProblemSwitching,
    error
  } = state;

  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp' | 'typescript'>('python');
  const [activePanel, setActivePanel] = useState<'code' | 'analysis'>('code');
  const [code, setCode] = useState('# Write your solution here\n');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [executionResults, setExecutionResults] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState<InterviewAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Set initial code based on selected language and problem data
  useEffect(() => {
    if (currentProblem?.starter_code && selectedLanguage) {
      const starterCode = currentProblem.starter_code.find(code => code.language === selectedLanguage);
      if (starterCode) {
        setCode(starterCode.code);
      } else {
        // Fallback to a basic template if no starter code exists for the language
        const templates = {
          python: '# Write your solution here\ndef solution():\n    pass\n',
          javascript: '// Write your solution here\nfunction solution() {\n    \n}\n',
          typescript: '// Write your solution here\nfunction solution(): any {\n    \n}\n',
          java: '// Write your solution here\npublic class Solution {\n    \n}\n',
          cpp: '// Write your solution here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}\n'
        };
        setCode(templates[selectedLanguage]);
      }
    }
  }, [selectedLanguage, currentProblem]);

  // Convert markdown to HTML for problem description
  const renderedDescription = useMemo(() => {
    if (!currentProblem?.description) return '';
    try {
      return marked(currentProblem.description) as string;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return currentProblem.description;
    }
  }, [currentProblem?.description]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Build a concise summary string for submission results
  const summarizeExecution = (res: any): string => {
    try {
      if (!res) return 'no results';
      if (res.success === false) {
        const err = typeof res.error === 'string' ? res.error : 'Execution failed';
        return `error: ${err.slice(0, 180)}`;
      }
      const total = res?.summary?.total_count;
      const passed = res?.summary?.passed_count;
      const cases = Array.isArray(res?.execution_results)
        ? res.execution_results
          .map((r: any) => `${r?.test_case_id ?? '?'}:${r?.passed ? 'P' : 'F'}`)
          .join(',')
        : 'no-cases';
      return `${passed ?? '?'} / ${total ?? '?'} passed | cases: ${cases}`;
    } catch {
      return 'unavailable';
    }
  };

  // Notify Sphere that a submission has been made
  const notifySphereOfSubmission = async (res: any) => {
    try {
      let sid = 'default';
      try {
        sid = localStorage.getItem('sphere_session_id') || 'default';
      } catch { }
      const summary = summarizeExecution(res);
      const content = `<--USER MADE A SUBMISSION--> <--Submission summary: ${summary} -->`;
      await sphereClient.chat({
        history: [{ role: 'user', content }],
        code,
        problem: currentProblem?.description,
        session_id: sid,
        time_elapsed: timeElapsed,
      });
    } catch {
      // silent failure; do not block UI on telemetry errors
    }
  };

  const handleLanguageChange = (language: typeof selectedLanguage) => {
    setSelectedLanguage(language);
  };

  const handleProblemChange = async (problem: any) => {
    try {
      await switchProblem(problem.id);
      // Clear previous execution results when switching problems
      setExecutionResults(null);
    } catch (error) {
      console.error('Failed to switch problem:', error);
    }
  };

  const handleRunCode = async () => {
    if (!currentProblem || !code.trim()) {
      return;
    }

    setIsExecuting(true);
    try {
      const results = await executeCode(code, selectedLanguage, currentProblem.id);
      setExecutionResults(results);
      // Fire-and-forget notification to Sphere about this submission
      notifySphereOfSubmission(results);
    } catch (error) {
      console.error('Code execution failed:', error);
      const failure = {
        success: false,
        error: error instanceof Error ? error.message : 'Execution failed'
      } as const;
      setExecutionResults(failure);
      // Notify Sphere even on failures
      notifySphereOfSubmission(failure);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleEndSession = async () => {
    setIsAnalyzing(true);

    try {
      // Generate a session ID based on timestamp if not available
      const sessionId = `interview_${Date.now()}`;

      // Analyze the interview using the sphere backend
      const analysis = await sphereClient.analyzeInterview({
        session_id: sessionId,
        problem_title: currentProblem?.title,
        problem_description: currentProblem?.description,
        final_code: code,
        time_elapsed: timeElapsed,
        execution_results: executionResults // Include test execution results
      });

      setAnalysisData(analysis);
      setShowAnalysis(true);
    } catch (error) {
      console.error('Failed to analyze interview:', error);
      // Still show analysis with error data
      setAnalysisData({
        session_id: `interview_${Date.now()}`,
        analysis: '',
        metrics: {
          duration_minutes: Math.floor(timeElapsed / 60),
          fumbles: 0,
          slow_answers: 0,
          avg_slow_answer_sec: 0,
          total_interactions: 0,
          notes_count: 0
        },
        transcript_summary: [],
        journal_notes: [],
        error: error instanceof Error ? error.message : 'Analysis failed'
      });
      setShowAnalysis(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show loading state while fetching problem data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading interview session...</p>
        </div>
      </div>
    );
  }

  // Show error state if problem couldn't be loaded
  if (error && !currentProblem) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Interview</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!currentProblem) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">No problem data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <CodeIcon className="w-6 h-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{currentProblem.title}</h1>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${currentProblem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentProblem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
              {currentProblem.difficulty}
            </span>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Microphone Toggle */}

            {/* End Session Button */}
            <button
              onClick={handleEndSession}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>End Interview</span>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-md">
            <div className="flex items-center">
              <AlertCircleIcon className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
              <button
                onClick={clearError}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Problem Description */}
        <div className="w-1/2 bg-white border-r border-gray-200 flex flex-col">
          <div className="border-b border-gray-200 p-4">
            {/* Problem Selector */}
            <ProblemSelector
              problems={availableProblems}
              currentProblem={currentProblem}
              onProblemChange={handleProblemChange}
              isLoading={isProblemSwitching}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: renderedDescription }}
            />

            {/* Test Cases Display */}
            {currentProblem.test_cases && typeof currentProblem.test_cases === 'string' && currentProblem.test_cases.trim() && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Cases</h3>
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-700">Test Cases:</span>
                      <pre className="mt-1 text-sm bg-white p-2 rounded border overflow-x-auto whitespace-pre-wrap">
                        {currentProblem.test_cases}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Tabbed Interface */}
        <div className="flex-1 flex flex-col">
          {/* Tab Navigation */}
          <div className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActivePanel('code')}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${activePanel === 'code' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <CodeIcon className="w-4 h-4 inline mr-2" />
                Code
              </button>
              <button
                onClick={() => setActivePanel('analysis')}
                className={`px-3 py-2 text-sm font-medium rounded-lg ${activePanel === 'analysis' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <TestTubeIcon className="w-4 h-4 inline mr-2" />
                Test Results
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'code' && (
              <div className="h-full flex flex-col">
                {/* Language Selector and Run Button */}
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value as typeof selectedLanguage)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {currentProblem.programming_languages?.map(lang => (
                        <option key={lang} value={lang.toLowerCase()}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </option>
                      )) || [
                          <option key="python" value="python">Python</option>,
                          <option key="javascript" value="javascript">JavaScript</option>,
                          <option key="typescript" value="typescript">TypeScript</option>,
                          <option key="java" value="java">Java</option>,
                          <option key="cpp" value="cpp">C++</option>
                        ]}
                    </select>

                    <button
                      onClick={handleRunCode}
                      disabled={isExecuting || !code.trim()}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isExecuting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Running...</span>
                        </>
                      ) : (
                        <>
                          <TestTubeIcon className="h-4 w-4" />
                          <span>Run Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Code Editor */}
                <div className="flex-1">
                  <CodeEditor
                    value={code}
                    onChange={setCode}
                    language={selectedLanguage}
                    className="h-full"
                  />
                </div>
              </div>
            )}

            {activePanel === 'analysis' && (
              <div className="h-full p-6 bg-gray-50 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h3>
                {executionResults?.execution_results ? (
                  <div className="space-y-3">
                    {executionResults.execution_results.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Test Case {result.test_case_id}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {result.passed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                        {!result.passed && (
                          <div className="text-sm text-gray-600">
                            <p><strong>Expected:</strong> {result.expected_output}</p>
                            <p><strong>Got:</strong> {result.actual_output}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <TestTubeIcon className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No test results yet</p>
                    <p className="text-sm">Run your code to see test results</p>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Execution Results Panel - Only show when not in analysis tab */}
        {activePanel !== 'analysis' && executionResults && (
          <div className="bg-white border-t border-gray-200 p-4 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Execution Results
              {executionResults.summary && (
                <span className={`ml-2 text-sm px-2 py-1 rounded ${executionResults.summary.all_passed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {executionResults.summary.passed_count}/{executionResults.summary.total_count} passed
                </span>
              )}
            </h3>

            {executionResults.success ? (
              <div className="space-y-3">
                {executionResults.execution_results?.map((result: any, index: number) => (
                  <div key={index} className={`p-3 rounded border ${result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Test Case {result.test_case_id}</span>
                      <span className={`px-2 py-1 text-xs rounded ${result.passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                        {result.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                    {!result.passed && (
                      <div className="text-sm space-y-1">
                        <div><strong>Expected:</strong> {result.expected_output}</div>
                        <div><strong>Got:</strong> {result.actual_output}</div>
                      </div>
                    )}
                  </div>
                ))}

                {executionResults.solution_comparison?.has_solution && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-medium text-blue-900 mb-2">Solution Information</h4>
                    {executionResults.solution_comparison.solution_explanation && (
                      <p className="text-sm text-blue-800 mb-2">{executionResults.solution_comparison.solution_explanation}</p>
                    )}
                    <div className="text-xs text-blue-700">
                      Time: {executionResults.solution_comparison.time_complexity} |
                      Space: {executionResults.solution_comparison.space_complexity}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                Error: {executionResults.error || 'Execution failed'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Interviewer Panel - bottom center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <InterviewerPanel code={code} problem={currentProblem?.description || ''} />
      </div>

      {/* Interview Analysis Modal */}
      {showAnalysis && analysisData && (
        <InterviewAnalysisResults
          analysisData={analysisData}
          sessionId={state.session?.interviewId}
          finalCode={code}
          executionResults={executionResults}
          onClose={() => {
            setShowAnalysis(false);
            setAnalysisData(null);
            if (onSessionEnd) {
              onSessionEnd();
            }
          }}
          onNewInterview={() => {
            setShowAnalysis(false);
            setAnalysisData(null);
            // Reset interview state
            setCode('# Write your solution here\n');
            setTimeElapsed(0);
            setExecutionResults(null);
            // Optionally redirect to start new interview
            if (onSessionEnd) {
              onSessionEnd();
            }
          }}
        />
      )}
    </div>
  );
};
