import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService, type User, type LoginRequest, type RegisterCompanyRequest, type RegisterCandidateRequest } from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  console.log('AuthReducer - Action:', action.type, 'Current state:', state);
  
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      const newState = {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload, // Only authenticate if user exists
        isLoading: false,
        error: null,
      };
      console.log('AuthReducer - AUTH_SUCCESS new state:', newState);
      return newState;
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  registerCompany: (data: RegisterCompanyRequest) => Promise<void>;
  registerCandidate: (data: RegisterCandidateRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  getCompanyId: () => string | null;
  refreshCurrentUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  console.log('AuthProvider render - current state:', state);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = authService.getToken();
      const user = authService.getUser();
      
      console.log('AuthContext init - token exists:', !!token);
      console.log('AuthContext init - stored user:', user);

      if (token && user) {
        console.log('AuthContext init - both token and user exist, verifying...');
        dispatch({ type: 'AUTH_START' });
        try {
          // Verify token is still valid by fetching current user
          const currentUser = await authService.getCurrentUser();
          console.log('AuthContext init - current user from API:', currentUser);
          if (currentUser) {
            dispatch({ type: 'AUTH_SUCCESS', payload: currentUser });
          } else {
            console.log('AuthContext init - no current user from API, logging out');
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
          authService.logout();
        }
      } else {
        console.log('AuthContext init - missing token or user, staying logged out');
        console.log('AuthContext init - token exists:', !!token);
        console.log('AuthContext init - user exists:', !!user);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    console.log('AuthContext: Starting login process');
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.login(credentials);
      console.log('AuthContext: Login response received:', response);
      console.log('AuthContext: User from response:', response.user);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
      console.log('AuthContext: Login success dispatched with payload:', response.user);
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Login failed' });
      throw error;
    }
  };

  const registerCompany = async (data: RegisterCompanyRequest) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.registerCompany(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const registerCandidate = async (data: RegisterCandidateRequest) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const response = await authService.registerCandidate(data);
      dispatch({ type: 'AUTH_SUCCESS', payload: response.user });
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Registration failed' });
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getCompanyId = () => {
    return authService.getCompanyId();
  };

  const refreshCurrentUser = async () => {
    dispatch({ type: 'AUTH_START' });
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        dispatch({ type: 'AUTH_SUCCESS', payload: currentUser });
      } else {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: error instanceof Error ? error.message : 'Failed to refresh user' });
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    registerCompany,
    registerCandidate,
    logout,
    clearError,
    getCompanyId,
    refreshCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
