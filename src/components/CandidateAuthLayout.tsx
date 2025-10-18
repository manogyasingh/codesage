import React, { useState } from 'react';
import { CandidateLogin } from './CandidateLogin';
import { CandidateRegistration } from './CandidateRegistration';

interface CandidateAuthLayoutProps {
  onAuthSuccess: (candidateData?: any) => void;
  initialMode?: 'login' | 'register';
}

export const CandidateAuthLayout: React.FC<CandidateAuthLayoutProps> = ({ 
  onAuthSuccess, 
  initialMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  if (mode === 'register') {
    return (
      <CandidateRegistration
        onSuccess={() => setMode('login')}
        onSwitchToLogin={() => setMode('login')}
      />
    );
  }

  return (
    <CandidateLogin
      onSuccess={onAuthSuccess}
      onSwitchToRegister={() => setMode('register')}
    />
  );
};