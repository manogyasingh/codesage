import { useState, useEffect } from 'react';
import { InterviewInterface } from './InterviewInterfaceSimple';
import { PlayIcon, CodeIcon, ClockIcon, UserIcon, AlertTriangleIcon } from './Icons';
import { CandidateSessionProvider, useCandidateSession } from '../contexts/CandidateSessionContext';
import { CandidateAuthLayout } from './CandidateAuthLayout';

interface ClientPortalProps {
  onBackToLanding: () => void;
}

function ClientPortalContent({ onBackToLanding }: ClientPortalProps) {
  const { state, endSession } = useCandidateSession();
  const { isAuthenticated, session, currentProblem, isLoading, error } = state;
  const [isInInterview, setIsInInterview] = useState(false);

  // Load problem from interview session if authenticated
  useEffect(() => {
    if (isAuthenticated && session && currentProblem) {
      setIsInInterview(true);
    }
  }, [isAuthenticated, session, currentProblem]);

  const handleAuthSuccess = async (candidateData: any) => {
    // No need to call refreshSession here since the context automatically
    // loads sessions from localStorage and will pick up the stored data
    console.log('Authentication successful:', candidateData);
  };

  const handleLeaveInterview = () => {
    endSession();
    setIsInInterview(false);
  };

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Error</h2>
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

  // Show authentication screen if not authenticated
  if (!isAuthenticated) {
    return <CandidateAuthLayout onAuthSuccess={handleAuthSuccess} />;
  }

  if (isInInterview && currentProblem) {
    return <InterviewInterface onSessionEnd={handleLeaveInterview} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToLanding}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to Home
              </button>
              <div className="h-6 border-l border-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Candidate Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <UserIcon className="w-4 h-4" />
                <span>Interview Candidate</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center">
            <CodeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Interview</h2>
            <p className="text-gray-600 text-lg mb-6">
              Ready to showcase your coding skills? Enter your details below to join the live interview session.
            </p>
          </div>

          {/* Interview Session Info */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-center">
                <UserIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
                  Welcome, {session?.candidateData?.candidate?.first_name} {session?.candidateData?.candidate?.last_name}!
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Interview ID: {session?.interviewId}
              </p>
            </div>

            <button
              onClick={() => setIsInInterview(true)}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Start Interview</span>
            </button>

            <div className="flex space-x-2">
              <button
                onClick={handleLeaveInterview}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Leave Session
              </button>
              
              <button
                onClick={onBackToLanding}
                className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Current Problem Status */}
        {currentProblem && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Current Live Problem</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentProblem.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : currentProblem.status === 'waiting'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {currentProblem.status === 'active' ? '🟢 Active' : 
                 currentProblem.status === 'waiting' ? '🟡 Waiting' : '⚫ Completed'}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Problem Title</div>
                <div className="font-semibold">{currentProblem.title}</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                <div className={`font-semibold ${
                  currentProblem.difficulty === 'Easy' ? 'text-green-600' :
                  currentProblem.difficulty === 'Medium' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {currentProblem.difficulty}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Time Remaining</div>
                <div className="font-semibold flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {currentProblem.timeRemaining} minutes
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">Problem Description</div>
              <p className="text-gray-900">{currentProblem.description}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangleIcon className="w-6 h-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Interview Guidelines</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Make sure you have a stable internet connection</li>
                <li>• Test your microphone and camera before joining</li>
                <li>• You can ask clarifying questions about the problem</li>
                <li>• Think out loud to help the interviewer understand your approach</li>
                <li>• Don't hesitate to discuss different solutions and trade-offs</li>
                <li>• Use the built-in code editor with syntax highlighting and auto-completion</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Requirements */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Technical Requirements</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Supported Languages</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• Python 3.x</li>
                <li>• JavaScript (ES6+)</li>
                <li>• Java 11+</li>
                <li>• C++ 17</li>
                <li>• TypeScript</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-700 mb-2">Editor Features</h5>
              <ul className="text-gray-600 space-y-1">
                <li>• IntelliSense & Auto-completion</li>
                <li>• Syntax highlighting</li>
                <li>• Error detection</li>
                <li>• Code formatting</li>
                <li>• Real-time collaboration</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function ClientPortal({ onBackToLanding }: ClientPortalProps) {
  return (
    <CandidateSessionProvider>
      <ClientPortalContent onBackToLanding={onBackToLanding} />
    </CandidateSessionProvider>
  );
}
