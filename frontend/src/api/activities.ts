import { apiFetch, API_BASE_URL } from './client';
import type { ActivityDefinition, ActivityBlock } from '../types/activityDsl';

export { API_BASE_URL };

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

export interface SaveDraftPayload {
  activityId?: string;
  title: string;
  description?: string;
  definition: ActivityDefinition | any;
}

export interface PublishActivityPayload {
  activityId: string;
  classroomId?: string;
  timerMode?: string;
  rewardMode?: string;
  targetScope?: string;
  targetGroupStudents?: any[];
  dueAt?: string;
  forceRepublish?: boolean;
}

export interface PublishActivityResponse {
  message?: string;
  shareCode?: string;
  alreadyPublished?: boolean;
  classHasActiveAssignment?: boolean;
  existingActivityTitle?: string;
  className?: string;
  existingActivityId?: string;
  isSameActivity?: boolean;
  assignment?: any;
  activitySession?: any;
  publishedAt?: string;
}

export interface GenerateDslPayload {
  prompt: string;
  subject?: string;
  gradeLevel?: string;
}

export interface ImproveBlockPayload {
  block: ActivityBlock | any;
  prompt: string;
}

export interface JoinStudentSessionPayload {
  shareCode: string;
  studentName: string;
  studentId?: string;
}

export interface RecordEventPayload {
  studentSessionId: string;
  type: string;
  blockId?: string;
  payload?: any;
}

export const activitiesApi = {
  // Get all activities
  async getActivities(token?: string): Promise<Activity[]> {
    return apiFetch<Activity[]>('/activities', { token });
  },

  // Get single activity by ID
  async getActivityById(id: string, token?: string): Promise<Activity> {
    return apiFetch<Activity>(`/activities/${id}`, { token });
  },

  // Create an activity (legacy or standard)
  async createActivity(data: CreateActivityPayload, token?: string): Promise<Activity> {
    return apiFetch<Activity>('/activities', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Save activity draft
  async saveDraft(data: SaveDraftPayload, token?: string): Promise<{ message: string; activity: Activity }> {
    return apiFetch<{ message: string; activity: Activity }>('/activities/save-draft', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Publish activity to start live session / assignment
  async publishActivity(data: PublishActivityPayload, token?: string): Promise<PublishActivityResponse> {
    return apiFetch<PublishActivityResponse>('/activities/publish', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Generate Activity DSL with Gemini AI
  async generateDsl(data: GenerateDslPayload, token?: string): Promise<ActivityDefinition> {
    return apiFetch<ActivityDefinition>('/activities/generate-dsl', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Improve a block with AI
  async improveBlock(data: ImproveBlockPayload, token?: string): Promise<ActivityBlock> {
    return apiFetch<ActivityBlock>('/activities/improve-block', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Get published session info by share code
  async getSession(shareCode: string): Promise<{ session: any; definition: ActivityDefinition }> {
    return apiFetch<{ session: any; definition: ActivityDefinition }>(`/activities/session/${shareCode}`);
  },

  // Join a student session with share code
  async joinStudentSession(data: JoinStudentSessionPayload): Promise<{ id: string; [key: string]: any }> {
    return apiFetch<{ id: string; [key: string]: any }>('/activities/student-session/join', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Get live classroom dashboard state
  async getSessionDashboard(shareCode: string, token?: string): Promise<{ session: any; students: any[] }> {
    return apiFetch<{ session: any; students: any[] }>(`/activities/session/${shareCode}/dashboard`, { token });
  },

  // Record an activity event / telemetry
  async recordEvent(data: RecordEventPayload): Promise<any> {
    return apiFetch<any>('/activities/event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Check if a classroom already has an active assignment
  async checkClassActiveAssignment(classroomId: string, token?: string): Promise<{
    classHasActiveAssignment: boolean;
    assignment?: any;
    className?: string;
    existingActivityTitle?: string;
  }> {
    return apiFetch(`/activities/assignments/check-class/${classroomId}`, { token });
  },

  // Submit student answers for an activity
  async submitAnswers(id: string, answers: Record<string, string>, token?: string): Promise<any> {
    return apiFetch(`/activities/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
      token,
    });
  },

  // Get analytics for an activity
  async getActivityAnalytics(id: string, token?: string): Promise<ActivityAnalytics> {
    return apiFetch<ActivityAnalytics>(`/activities/${id}/analytics`, { token });
  },
};
