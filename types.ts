export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: Role;
  assignedClass?: string; // For teachers (1-6)
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  grade: string; // "1" to "6"
  parentId?: string;
}

export interface Parent {
  id: string;
  studentId: string;
  name: string;
  phone: string;
}

export interface ReflectionQuestion {
  id: string;
  text: string;
}

export interface Material {
  id: string;
  title: string;
  grade: string;
  content: string; // Description or text content
  type: 'image' | 'video' | 'pdf' | 'text';
  mediaUrl?: string; // Mock URL
  linkUrl?: string; // YouTube or PDF link
  questions: ReflectionQuestion[];
  hasTask: boolean;
  taskDescription?: string;
}

export interface Submission {
  id: string;
  materialId: string;
  studentId: string;
  studentName: string;
  reflectionAnswers: { questionId: string; answer: string }[];
  
  // Updated Task Fields
  taskSubmissionType?: 'TEXT' | 'IMAGE';
  taskSubmissionContent?: string; // Base64 string for image or plain text
  taskFileUrl?: string; // Legacy support
  
  taskNotes?: string; // Student notes
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  teacherFeedback?: string;
  gradedBy?: string;
  submittedAt: string;
}

export interface AppState {
  currentUser: User | Student | null;
  currentRole: Role | null;
}