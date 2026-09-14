const API_BASE_URL = 'http://localhost:3000';

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
  async getClassrooms(token: string): Promise<ClassroomProfile[]> {
    const res = await fetch(`${API_BASE_URL}/classrooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to fetch classrooms');
    return result;
  },

  // Create a classroom profile
  async createClassroom(data: CreateClassroomPayload, token: string): Promise<ClassroomProfile> {
    const res = await fetch(`${API_BASE_URL}/classrooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to create classroom');
    return result;
  },

  // Add students to a classroom (manual or bulk array)
  async addStudents(
    classroomId: string,
    students: StudentInputPayload[],
    token: string,
  ): Promise<StudentRecord[]> {
    const res = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ students }),
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to add students');
    return result;
  },

  // Delete a student from a classroom
  async deleteStudent(classroomId: string, studentId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/classrooms/${classroomId}/students/${studentId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete student');
  },

  // Delete a classroom
  async deleteClassroom(classroomId: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/classrooms/${classroomId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await res.json();
    if (!res.ok) throw new Error(result.message || 'Failed to delete classroom');
  },
};

