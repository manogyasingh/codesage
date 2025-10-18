import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'interviewer' | 'candidate';
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  fallback 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  console.log('ProtectedRoute: isAuthenticated =', isAuthenticated);
  console.log('ProtectedRoute: user =', user);
  console.log('ProtectedRoute: isLoading =', isLoading);
  console.log('ProtectedRoute: requiredRole =', requiredRole);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication - both isAuthenticated AND user must be present
  if (!isAuthenticated || !user) {
    console.log('ProtectedRoute: Authentication failed - isAuthenticated:', isAuthenticated, 'user:', user);
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to access this page.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Check role authorization
  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. Required role: {requiredRole}
          </p>
          <p className="text-sm text-gray-500">Your role: {user.role}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};