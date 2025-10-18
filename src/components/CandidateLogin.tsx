import React, { useState } from 'react';

interface CandidateLoginProps {
  onSuccess?: (candidateData: any) => void;
  onSwitchToRegister?: () => void;
}

export const CandidateLogin: React.FC<CandidateLoginProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    candidateId: '',
    interviewId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // For candidates, we'll verify their email against an interview session
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/candidates/verify-interview-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_id: formData.candidateId,
          interview_id: formData.interviewId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to verify interview access');
      }

      const candidateData = await response.json();
      
      // Store candidate session data - use the correct key that context expects
      localStorage.setItem('candidateSession', JSON.stringify({
        candidateId: formData.candidateId,
        interviewId: formData.interviewId,
        candidateData,
        timestamp: new Date().toISOString(),
      }));

      onSuccess?.(candidateData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Interview Session
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your details to access the interview platform
          </p>
        </div>
        
        <div className="bg-white shadow-xl rounded-2xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <div>
              <label htmlFor="candidateId" className="block text-sm font-medium text-gray-700">
                Candidate ID
              </label>
              <input
                id="candidateId"
                name="candidateId"
                type="text"
                required
                value={formData.candidateId}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Enter your candidate ID"
              />
            </div>

            <div>
              <label htmlFor="interviewId" className="block text-sm font-medium text-gray-700">
                Interview ID
              </label>
              <input
                id="interviewId"
                name="interviewId"
                type="text"
                required
                value={formData.interviewId}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Enter interview session ID"
              />
              <p className="mt-1 text-xs text-gray-500">
                This should be provided by your interviewer
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Interview'
                )}
              </button>
            </div>

            {onSwitchToRegister && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an interview scheduled?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="font-medium text-green-600 hover:text-green-500"
                  >
                    Register as candidate
                  </button>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
