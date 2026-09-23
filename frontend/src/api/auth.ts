import { apiFetch, API_BASE_URL } from './client';

export { API_BASE_URL };

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
    return apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  async getProfile(token?: string): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me', { token });
  },

  async getProtectedRoleData(endpoint: 'admin' | 'teacher' | 'student', token?: string) {
    return apiFetch<any>(`/users/${endpoint}`, { token });
  },
};
