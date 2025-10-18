import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { CompanyRegistration } from './CompanyRegistration';

interface AuthLayoutProps {
  onAuthSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ onAuthSuccess, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  if (mode === 'register') {
    return (
      <CompanyRegistration
        onSuccess={onAuthSuccess}
        onSwitchToLogin={() => setMode('login')}
      />
    );
  }

  return (
    <LoginForm
      onSuccess={onAuthSuccess}
      onSwitchToRegister={() => setMode('register')}
    />
  );
};