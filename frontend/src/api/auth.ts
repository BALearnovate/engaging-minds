import { apiFetch, API_BASE_URL } from './client';

export { API_BASE_URL };

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  school?: string;
  role: 'ADMIN' | 'TEACHER' | 'STUDENT';
  avatar?: string;
  createdAt?: string;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  accessToken: string;
}

export const authApi = {
  async sendOtp(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async verifyOtp(data: { email: string; code: string }): Promise<{ message: string; verified: boolean }> {
    return apiFetch<{ message: string; verified: boolean }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    school?: string;
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

  async studentLogin(data: { studentCode: string; pin: string }): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/student-login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getProfile(token?: string): Promise<UserProfile> {
    return apiFetch<UserProfile>('/auth/me', { token });
  },

  async getProtectedRoleData(endpoint: 'admin' | 'teacher' | 'student', token?: string) {
    return apiFetch<any>(`/users/${endpoint}`, { token });
  },

  async verifyJoinCode(code: string): Promise<any> {
    return apiFetch<any>('/auth/verify-join-code', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async studentOnboarding(data: {
    studentId?: string;
    loginCode?: string;
    displayName?: string;
    email?: string;
    pin: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    return apiFetch<AuthResponse>('/auth/student-onboarding', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
