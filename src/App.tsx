import { useState, useEffect } from 'react';
import { LandingPage, ClientPortal, CompanyPortal } from './components';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthLayout } from './components/AuthLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

type AppMode = 'landing' | 'client' | 'company' | 'auth';

function AppContent(): JSX.Element {
  const [mode, setMode] = useState<AppMode>('landing');
  const { isAuthenticated, user, logout } = useAuth();

  // Debug localStorage contents
  useEffect(() => {
    console.log('localStorage access_token:', localStorage.getItem('access_token'));
    console.log('localStorage user:', localStorage.getItem('user'));
  }, []);

  console.log('AppContent render - mode:', mode, 'isAuthenticated:', isAuthenticated, 'user:', user);

  const handleSelectPortal = (portal: 'client' | 'company') => {
    if (portal === 'client') {
      // For client portal, candidates might not need authentication
      setMode(portal);
    } else if (portal === 'company') {
      // Company portal requires authentication
      if (isAuthenticated && user) {
        setMode(portal);
      } else {
        setMode('auth');
      }
    }
  };

  const handleBackToLanding = () => {
    setMode('landing');
  };

  const handleAuthSuccess = () => {
    // After successful authentication, go to company portal
    console.log('handleAuthSuccess called');
    console.log('Current user:', user);
    console.log('Is authenticated:', isAuthenticated);
    
    // Temporary workaround - force refresh to reload auth state
    // setTimeout(() => {
    //   window.location.reload();
    // }, 500);
    
    // Add a small delay to ensure auth state is updated
    setTimeout(() => {
      console.log('Setting mode to company after timeout');
      console.log('User after timeout:', user);
      console.log('Is authenticated after timeout:', isAuthenticated);
      setMode('company');
    }, 100);
  };

  const handleLogout = async () => {
    await logout();
    setMode('landing');
  };

  if (mode === 'auth') {
    return <AuthLayout onAuthSuccess={handleAuthSuccess} />;
  }

  if (mode === 'client') {
    return <ClientPortal onBackToLanding={handleBackToLanding} />;
  }

  if (mode === 'company') {
    console.log('Rendering company mode - isAuthenticated:', isAuthenticated, 'user:', user);
    return (
      <ProtectedRoute fallback={<AuthLayout onAuthSuccess={handleAuthSuccess} />}>
        <CompanyPortal onBackToLanding={handleBackToLanding} onLogout={handleLogout} />
      </ProtectedRoute>
    );
  }

  return <LandingPage onSelectPortal={handleSelectPortal} />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
