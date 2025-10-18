import { LoginRequest, RegisterCompanyRequest, RegisterCandidateRequest, AuthResponse, User } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Initialize from localStorage on startup
    this.token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');
    console.log('AuthService constructor - stored token exists:', !!this.token);
    console.log('AuthService constructor - stored user string:', storedUser);
    
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        console.log('AuthService constructor - parsed user:', this.user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.clearAuth();
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Login failed');
    }

    const authResponse: AuthResponse = await response.json();
    this.setAuth(authResponse);
    return authResponse;
  }

  async registerCompany(data: RegisterCompanyRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register/company', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setAuth(response);
    return response;
  }

  async registerCandidate(data: RegisterCandidateRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register/candidate', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setAuth(response);
    return response;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const user = await this.request<User>('/auth/me');
      this.user = user;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error fetching current user:', error);
      this.clearAuth();
      return null;
    }
  }

  async refreshToken(): Promise<void> {
    if (!this.token) {
      throw new Error('No token available for refresh');
    }

    try {
      const response = await this.request<AuthResponse>('/auth/refresh', {
        method: 'POST',
      });
      this.setAuth(response);
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      throw error;
    }
  }

  logout(): void {
    this.clearAuth();
  }

  private setAuth(authResponse: AuthResponse): void {
    console.log('AuthService setAuth called with:', authResponse);
    this.token = authResponse.access_token;
    this.user = authResponse.user;
    console.log('AuthService setAuth - token set:', !!this.token);
    console.log('AuthService setAuth - user set:', this.user);
    localStorage.setItem('access_token', this.token);
    localStorage.setItem('user', JSON.stringify(this.user));
    console.log('AuthService setAuth - localStorage updated');
  }

  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    console.log('AuthService getUser called - current user:', this.user);
    return this.user;
  }

  getCompanyId(): string | null {
    return this.user?.company_id || null;
  }

  isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }
}

export const authService = new AuthService();
export type { User, LoginRequest, RegisterCompanyRequest, RegisterCandidateRequest, AuthResponse };
