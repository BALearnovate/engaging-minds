const API_BASE_URL = 'http://localhost:3000';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  accessToken: string;
}

export const authApi = {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
  }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }
    return result;
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Login failed');
    }
    return result;
  },

  async getProfile(token: string): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch profile');
    }
    return result;
  },

  async getProtectedRoleData(endpoint: 'admin' | 'teacher' | 'student', token: string) {
    const response = await fetch(`${API_BASE_URL}/users/${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'Forbidden access');
    }
    return result;
  },
};
