import { apiFetch, API_BASE_URL } from './client';

export { API_BASE_URL };

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  loginCode: string;
  createdAt?: string;
}

export interface ClassroomProfile {
  id: string;
  subject: string;
  grade: string;
  year: string;
  students: StudentRecord[];
  createdAt?: string;
}

export interface CreateClassroomPayload {
  subject: string;
  grade: string;
  year: string;
}

export interface StudentInputPayload {
  firstName: string;
  lastName?: string;
}

export const classroomsApi = {
  // Get all classrooms for teacher
  async getClassrooms(token?: string): Promise<ClassroomProfile[]> {
    return apiFetch<ClassroomProfile[]>('/classrooms', { token });
  },

  // Create a classroom profile
  async createClassroom(data: CreateClassroomPayload, token?: string): Promise<ClassroomProfile> {
    return apiFetch<ClassroomProfile>('/classrooms', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    });
  },

  // Add students to a classroom (manual or bulk array)
  async addStudents(
    classroomId: string,
    students: StudentInputPayload[],
    token?: string,
  ): Promise<StudentRecord[]> {
    return apiFetch<StudentRecord[]>(`/classrooms/${classroomId}/students`, {
      method: 'POST',
      body: JSON.stringify({ students }),
      token,
    });
  },

  // Delete a student from a classroom
  async deleteStudent(classroomId: string, studentId: string, token?: string): Promise<void> {
    return apiFetch<void>(`/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
      token,
    });
  },

  // Delete a classroom
  async deleteClassroom(classroomId: string, token?: string): Promise<void> {
    return apiFetch<void>(`/classrooms/${classroomId}`, {
      method: 'DELETE',
      token,
    });
  },
};
