const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CompanyUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  company_id: string;
  permissions: {
    can_create_problems?: boolean;
    can_edit_problems?: boolean;
    can_delete_problems?: boolean;
    can_manage_users?: boolean;
    can_view_analytics?: boolean;
    can_conduct_interviews?: boolean;
    can_export_data?: boolean;
  };
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
  };
}

export interface CreateUserRequest {
  id: string;
  company_id: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role?: string;
  permissions?: {
    can_create_problems?: boolean;
    can_edit_problems?: boolean;
    can_delete_problems?: boolean;
    can_manage_users?: boolean;
    can_view_analytics?: boolean;
    can_conduct_interviews?: boolean;
    can_export_data?: boolean;
  };
  avatar?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  role?: string;
  permissions?: {
    can_create_problems?: boolean;
    can_edit_problems?: boolean;
    can_delete_problems?: boolean;
    can_manage_users?: boolean;
    can_view_analytics?: boolean;
    can_conduct_interviews?: boolean;
    can_export_data?: boolean;
  };
  avatar?: string;
  is_active?: boolean;
}

class UsersService {
  private getStoredToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = this.getStoredToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If we can't parse the error response, use the HTTP status
      }
      
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getCompanyUsers(): Promise<CompanyUser[]> {
    return this.makeRequest('/users/');
  }

  async getUserById(userId: string): Promise<CompanyUser> {
    return this.makeRequest(`/users/${userId}`);
  }

  async createUser(userData: CreateUserRequest): Promise<CompanyUser> {
    return this.makeRequest('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<CompanyUser> {
    return this.makeRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async updateUserPermissions(userId: string, permissions: Record<string, any>): Promise<CompanyUser> {
    return this.makeRequest(`/users/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<CompanyUser> {
    return this.makeRequest(`/users/${userId}/status?is_active=${isActive}`, {
      method: 'PUT',
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.makeRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  async getCurrentUser(): Promise<CompanyUser> {
    return this.makeRequest('/users/me');
  }
}

export const usersService = new UsersService();