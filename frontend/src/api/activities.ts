const API_BASE_URL = 'http://localhost:3000';

export interface BlankKey {
  id: string;
  answer: string;
}

export interface QuestionOption {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: string;
  content: any;
  createdAt: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  _count?: {
    submissions: number;
  };
  mySubmission?: {
    id: string;
    score: number;
    correctCount: number;
    totalBlanks: number;
    createdAt: string;
  } | null;
}

export interface StudentSubmission {
  id: string;
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  score: number;
  correctCount: number;
  totalBlanks: number;
  answers: Record<string, string>;
  submittedAt: string;
}

export interface ActivityAnalytics {
  activity: Activity;
  analytics: {
    totalSubmissions: number;
    classAverage: number;
    highestScore: number;
  };
  studentSubmissions: StudentSubmission[];
}

export interface CreateActivityPayload {
  title: string;
  description?: string;
  type?: string;
  template?: string;
  rawContent?: string;
  blanks?: BlankKey[];
  questions?: QuestionOption[];
  h5pType?: string;
  h5pContent?: any;
}

export const activitiesApi = {
  async createActivity(data: CreateActivityPayload, token: string): Promise<Activity> {
    const res = await fetch(`${API_BASE_URL}/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create activity');
    return result;
  },

  async getActivities(token: string): Promise<Activity[]> {
    const res = await fetch(`${API_BASE_URL}/activities`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to fetch activities');
    return result;
  },

  async getActivityById(id: string, token: string): Promise<Activity> {
    const res = await fetch(`${API_BASE_URL}/activities/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to fetch activity');
    return result;
  },

  async submitAnswers(id: string, answers: Record<string, string>, token: string) {
    const res = await fetch(`${API_BASE_URL}/activities/${id}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ answers }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to submit answers');
    return result;
  },

  async getActivityAnalytics(id: string, token: string): Promise<ActivityAnalytics> {
    const res = await fetch(`${API_BASE_URL}/activities/${id}/analytics`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to fetch analytics');
    return result;
  },
};
