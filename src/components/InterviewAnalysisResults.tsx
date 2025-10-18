import React, { useState } from 'react';
import { InterviewAnalysisResponse } from '../services/sphere';
import { interviewsService } from '../services/interviews';
import { 
  ClockIcon, 
  AlertCircleIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  MessageCircleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  StarIcon
} from './Icons';

interface InterviewAnalysisResultsProps {
  analysisData: InterviewAnalysisResponse;
  onClose: () => void;
  onNewInterview?: () => void;
  sessionId?: string; // Interview session ID to submit results to company
  finalCode?: string; // Final code submitted by candidate
  executionResults?: any; // Test execution results for display
}

export const InterviewAnalysisResults: React.FC<InterviewAnalysisResultsProps> = ({
  analysisData,
  onClose,
  onNewInterview,
  sessionId,
  finalCode,
  executionResults,
}) => {
  const { analysis, metrics, transcript_summary, journal_notes, error } = analysisData;
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Parse the analysis to extract structured information
  const parseAnalysis = (text: string) => {
    const sections = {
      rating: '',
      strengths: '',
      improvements: '',
      communication: '',
      problemSolving: '',
      technical: '',
      testCaseAnalysis: '',
      recommendation: ''
    };

    const lines = text.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.includes('OVERALL PERFORMANCE RATING')) {
        currentSection = 'rating';
      } else if (trimmedLine.includes('STRENGTHS')) {
        currentSection = 'strengths';
      } else if (trimmedLine.includes('AREAS FOR IMPROVEMENT')) {
        currentSection = 'improvements';
      } else if (trimmedLine.includes('COMMUNICATION SKILLS')) {
        currentSection = 'communication';
      } else if (trimmedLine.includes('PROBLEM-SOLVING APPROACH')) {
        currentSection = 'problemSolving';
      } else if (trimmedLine.includes('TECHNICAL COMPETENCY')) {
        currentSection = 'technical';
      } else if (trimmedLine.includes('TEST CASE ANALYSIS')) {
        currentSection = 'testCaseAnalysis';
      } else if (trimmedLine.includes('RECOMMENDATION')) {
        currentSection = 'recommendation';
      } else if (trimmedLine && currentSection) {
        sections[currentSection as keyof typeof sections] += trimmedLine + ' ';
      }
    });

    return sections;
  };

  const parsedAnalysis = parseAnalysis(analysis);
  
  // Extract rating number if present
  const ratingMatch = parsedAnalysis.rating.match(/(\d+(?:\.\d+)?)/);
  const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // Function to send results to company
  const sendResultsToCompany = async () => {
    if (!sessionId) {
      setSendError('No session ID provided');
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      await interviewsService.submitInterviewAnalysis(sessionId, {
        session_id: analysisData.session_id,
        analysis: analysisData.analysis,
        metrics: analysisData.metrics,
        transcript_summary: analysisData.transcript_summary,
        journal_notes: analysisData.journal_notes,
        final_code: finalCode || '',
      });
      
      setSendSuccess(true);
    } catch (error) {
      console.error('Failed to send results to company:', error);
      setSendError(error instanceof Error ? error.message : 'Failed to send results');
    } finally {
      setIsSending(false);
    }
  };

  // Determine recommendation color and icon
  const getRecommendationStyle = (rec: string) => {
    const lower = rec.toLowerCase();
    if (lower.includes('strong hire')) {
      return { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircleIcon };
    } else if (lower.includes('hire') && !lower.includes('no hire')) {
      return { color: 'text-blue-700', bg: 'bg-blue-100', icon: TrendingUpIcon };
    } else if (lower.includes('no hire')) {
      return { color: 'text-red-700', bg: 'bg-red-100', icon: XCircleIcon };
    }
    return { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: AlertCircleIcon };
  };

  const recStyle = getRecommendationStyle(parsedAnalysis.recommendation);

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <div className="flex items-center mb-4">
            <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Analysis Failed</h2>
          </div>
          <p className="text-gray-600 mb-6">
            We couldn't analyze your interview session: {error}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Interview Analysis Report</h2>
              <p className="text-blue-100">Session ID: {analysisData.session_id}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Overall Rating */}
            {rating && (
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Overall Rating</h3>
                    <div className="flex items-center mt-2">
                      <span className="text-3xl font-bold text-yellow-600">{rating}/10</span>
                      <div className="ml-3 flex">
                        {[...Array(Math.floor(rating))].map((_, i) => (
                          <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />
                        ))}
                        {rating % 1 !== 0 && <StarIcon className="h-5 w-5 text-yellow-300 fill-current" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duration & Metrics */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Metrics</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Duration: {metrics.duration_minutes} minutes</span>
                </div>
                <div className="flex items-center">
                  <MessageCircleIcon className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm text-gray-700">Interactions: {metrics.total_interactions}</span>
                </div>
                <div className="flex items-center">
                  <AlertCircleIcon className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm text-gray-700">Issues: {metrics.fumbles}</span>
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className={`${recStyle.bg} p-6 rounded-lg border`}>
              <div className="flex items-center">
                <recStyle.icon className={`h-8 w-8 ${recStyle.color} mr-3`} />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Recommendation</h3>
                  <p className={`${recStyle.color} font-medium mt-1`}>
                    {parsedAnalysis.recommendation.replace(/RECOMMENDATION[\s:]*/, '').trim()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Strengths */}
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="flex items-center mb-4">
                <TrendingUpIcon className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {parsedAnalysis.strengths.replace(/STRENGTHS[\s:]*/, '').trim() || 'No specific strengths noted.'}
              </p>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <div className="flex items-center mb-4">
                <TrendingDownIcon className="h-6 w-6 text-red-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">
                {parsedAnalysis.improvements.replace(/AREAS FOR IMPROVEMENT[\s:]*/, '').trim() || 'No specific areas noted.'}
              </p>
            </div>
          </div>

          {/* Skills Assessment */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-2">Communication</h4>
              <p className="text-sm text-gray-700">
                {parsedAnalysis.communication.replace(/COMMUNICATION SKILLS[\s:]*/, '').trim() || 'No assessment available.'}
              </p>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-gray-900 mb-2">Problem Solving</h4>
              <p className="text-sm text-gray-700">
                {parsedAnalysis.problemSolving.replace(/PROBLEM-SOLVING APPROACH[\s:]*/, '').trim() || 'No assessment available.'}
              </p>
            </div>

            <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
              <h4 className="font-semibold text-gray-900 mb-2">Technical Skills</h4>
              <p className="text-sm text-gray-700">
                {parsedAnalysis.technical.replace(/TECHNICAL COMPETENCY[\s:]*/, '').trim() || 'No assessment available.'}
              </p>
            </div>
          </div>

          {/* Test Results Summary */}
          {executionResults && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Execution Results</h3>
              
              {/* Test Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className={`p-4 rounded-lg border ${
                  executionResults.summary?.all_passed 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {executionResults.summary?.all_passed ? (
                      <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                    ) : (
                      <XCircleIcon className="h-6 w-6 text-red-600 mr-2" />
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-900">Overall Result</h4>
                      <p className={`text-sm font-medium ${
                        executionResults.summary?.all_passed ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {executionResults.summary?.all_passed ? 'All Tests Passed' : 'Some Tests Failed'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-gray-900">Test Cases</h4>
                  <p className="text-blue-700 font-medium">
                    {executionResults.summary?.passed_count || 0} / {executionResults.summary?.total_count || 0} Passed
                  </p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-semibold text-gray-900">Success Rate</h4>
                  <p className="text-yellow-700 font-medium">
                    {executionResults.summary?.total_count 
                      ? Math.round((executionResults.summary.passed_count / executionResults.summary.total_count) * 100)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Individual Test Cases */}
              {executionResults.execution_results && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Individual Test Case Results:</h4>
                  {executionResults.execution_results.map((result: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Test Case {result.test_case_id || index + 1}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          result.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      {!result.passed && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium text-gray-700">Expected:</span>
                              <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                                {result.expected_output || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Got:</span>
                              <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                                {result.actual_output || 'N/A'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Solution Comparison */}
              {executionResults.solution_comparison?.has_solution && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Reference Solution Analysis</h4>
                  {executionResults.solution_comparison.solution_explanation && (
                    <p className="text-sm text-blue-800 mb-3">
                      {executionResults.solution_comparison.solution_explanation}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-900">Time Complexity:</span>
                      <span className="ml-2 text-blue-700">
                        {executionResults.solution_comparison.time_complexity || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-900">Space Complexity:</span>
                      <span className="ml-2 text-blue-700">
                        {executionResults.solution_comparison.space_complexity || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Test Case Analysis */}
          {parsedAnalysis.testCaseAnalysis.trim() && (
            <div className="mb-8">
              <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                <div className="flex items-center mb-4">
                  <CheckCircleIcon className="h-6 w-6 text-indigo-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Test Case Analysis & Feedback</h3>
                </div>
                <div className="text-gray-700 whitespace-pre-wrap">
                  {parsedAnalysis.testCaseAnalysis.replace(/TEST CASE ANALYSIS[\s:]*/, '').trim()}
                </div>
              </div>
            </div>
          )}

          {/* Full Analysis Text */}
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Analysis</h3>
            <div className="prose max-w-none text-sm text-gray-700 whitespace-pre-wrap">
              {analysis}
            </div>
          </div>

          {/* Session Data */}
          {(journal_notes.length > 0 || transcript_summary.length > 0) && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h3>
              
              {journal_notes.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Interview Notes:</h4>
                  <ul className="space-y-1">
                    {journal_notes.map((note, index) => (
                      <li key={index} className="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {transcript_summary.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recent Interactions:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {transcript_summary.map((turn, index) => (
                      <div key={index} className="text-sm p-2 rounded bg-gray-100">
                        <span className="font-medium capitalize">{turn.role}:</span> {turn.content.substring(0, 100)}
                        {turn.content.length > 100 && '...'}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Send Results Status */}
          {sessionId && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Share Results with Company</h4>
              {sendSuccess ? (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span>Results successfully sent to the company!</span>
                </div>
              ) : sendError ? (
                <div className="text-red-600">
                  <div className="flex items-center mb-2">
                    <XCircleIcon className="h-5 w-5 mr-2" />
                    <span>Failed to send results</span>
                  </div>
                  <p className="text-sm">{sendError}</p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 text-sm mb-3">
                    Send your interview results to the company for review.
                  </p>
                  <button
                    onClick={sendResultsToCompany}
                    disabled={isSending}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isSending ? 'Sending...' : 'Send Results to Company'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            {onNewInterview && (
              <button
                onClick={onNewInterview}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Start New Interview
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};