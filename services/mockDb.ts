import { User, Student, Material, Submission, Role, Parent } from '../types';

// Initial Data
const INITIAL_USERS: User[] = [
  { id: 'u1', username: 'admin', password: 'admin', fullName: 'Administrator', role: Role.ADMIN },
  { id: 'u2', username: 'guru1', password: 'password', fullName: 'Budi Santoso', role: Role.TEACHER, assignedClass: '5' }
];

const INITIAL_STUDENTS: Student[] = [
  { id: 's1', nisn: '123456', name: 'Ahmad Siswa', gender: 'L', grade: '5' },
  { id: 's2', nisn: '654321', name: 'Siti Pelajar', gender: 'P', grade: '5' }
];

const INITIAL_MATERIALS: Material[] = [
  {
    id: 'm1',
    title: 'Keindahan Alam Indonesia',
    grade: '5',
    content: 'Indonesia memiliki kekayaan alam yang luar biasa...',
    type: 'image',
    mediaUrl: 'https://picsum.photos/800/400',
    questions: [
      { id: 'q1', text: 'Apa yang kamu rasakan setelah melihat gambar tersebut?' },
      { id: 'q2', text: 'Sebutkan 3 hal menarik dari bacaan!' }
    ],
    hasTask: true,
    taskDescription: 'Gambarlah pemandangan di sekitarmu.'
  }
];

class MockDatabase {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  }

  private set<T>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // USERS
  getUsers(): User[] { return this.get('users', INITIAL_USERS); }
  addUser(user: User) { 
    const users = this.getUsers();
    this.set('users', [...users, { ...user, id: Date.now().toString() }]);
  }
  updateUser(user: User) {
    const users = this.getUsers().map(u => u.id === user.id ? user : u);
    this.set('users', users);
  }
  deleteUser(id: string) {
    this.set('users', this.getUsers().filter(u => u.id !== id));
  }
  
  // STUDENTS
  getStudents(): Student[] { return this.get('students', INITIAL_STUDENTS); }
  addStudent(student: Student) {
    const list = this.getStudents();
    this.set('students', [...list, { ...student, id: Date.now().toString() }]);
  }
  updateStudent(student: Student) {
    const list = this.getStudents().map(s => s.id === student.id ? student : s);
    this.set('students', list);
  }
  deleteStudent(id: string) {
    this.set('students', this.getStudents().filter(s => s.id !== id));
  }
  addStudentsBulk(students: Omit<Student, 'id'>[]) {
    const current = this.getStudents();
    const newStudents = students.map(s => ({ ...s, id: Date.now().toString() + Math.random() }));
    this.set('students', [...current, ...newStudents]);
  }

  // MATERIALS
  getMaterials(): Material[] { return this.get('materials', INITIAL_MATERIALS); }
  addMaterial(material: Material) {
    const list = this.getMaterials();
    this.set('materials', [...list, { ...material, id: Date.now().toString() }]);
  }
  deleteMaterial(id: string) {
    this.set('materials', this.getMaterials().filter(m => m.id !== id));
  }

  // SUBMISSIONS
  getSubmissions(): Submission[] { return this.get('submissions', []); }
  addSubmission(sub: Submission) {
    const list = this.getSubmissions();
    this.set('submissions', [...list, { ...sub, id: Date.now().toString() }]);
  }
  updateSubmission(sub: Submission) {
    const list = this.getSubmissions().map(s => s.id === sub.id ? sub : s);
    this.set('submissions', list);
  }

  // SETTINGS
  getCertBg(): string { return localStorage.getItem('certBg') || ''; }
  setCertBg(url: string) { localStorage.setItem('certBg', url); }
}

export const db = new MockDatabase();