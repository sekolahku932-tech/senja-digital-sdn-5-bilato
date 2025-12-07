import { User, Role, Student, Material, Submission } from '../types';

// Keys for LocalStorage (Backup/Cache)
const KEYS = {
  USERS: 'senja_users',
  STUDENTS: 'senja_students',
  MATERIALS: 'senja_materials',
  SUBMISSIONS: 'senja_submissions',
  SETTINGS: 'senja_settings',
};

// URL Google Apps Script (GANTI DENGAN URL BARU SETELAH DEPLOY ULANG)
const API_URL = "https://script.google.com/macros/s/AKfycbyEBrEy5XtNM5X_akHkFK18qJ0wsN93UdNuL1qw59PTuOgkcjLR4k22KzCP8ylBlIVbbQ/exec";

// --- Helper for Google Sheet API ---

// Basic generic interface for Settings
export interface SettingItem {
  key: string;
  value: string;
}

const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

const safeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  return [];
};

const apiFetch = async <T>(sheetName: string): Promise<T[]> => {
  // 1. Try fetching from Google Sheet
  try {
    const res = await fetch(`${API_URL}?action=getAll&_t=${Date.now()}`);
    if (!res.ok) throw new Error("Network response was not ok");
    
    const json = await res.json();
    const data = json[sheetName.toLowerCase()];
    
    // Jika data valid, simpan ke cache lokal dan kembalikan
    if (Array.isArray(data)) {
        localStorage.setItem(`senja_${sheetName.toLowerCase()}`, JSON.stringify(data));
        return data;
    }
  } catch (error) {
    console.warn(`Gagal mengambil data ${sheetName} dari server, menggunakan cache lokal.`, error);
  }

  // 2. Fallback to LocalStorage if fetch fails or data invalid
  return getLocal(`senja_${sheetName.toLowerCase()}`);
};

const apiSave = async <T>(sheetName: string, data: T[]) => {
  // 1. Always save to local first for optimistic UI (terasa cepat)
  localStorage.setItem(`senja_${sheetName.toLowerCase()}`, JSON.stringify(data));

  // 2. Send to Google Sheet in background
  try {
    // PENTING: Menggunakan mode 'no-cors' dan content-type 'text/plain' 
    // agar browser tidak memblokir request ke Google Apps Script.
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain' 
      },
      body: JSON.stringify({
        action: 'save',
        sheet: sheetName,
        data: data
      })
    });
  } catch (error) {
    console.error("Gagal menyimpan ke Spreadsheet:", error);
  }
};

// --- Initialization ---

const defaultAdmin: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin',
  name: 'Administrator',
  role: Role.ADMIN,
  classGrade: '' // Ensure property exists for Spreadsheet headers
};

export const initStorage = async () => {
  // Ensure admin exists locally at least for first run offline
  const users = getLocal<User>(KEYS.USERS);
  if (users.length === 0) {
    localStorage.setItem(KEYS.USERS, JSON.stringify([defaultAdmin]));
  }
};

initStorage();

// --- Async Data Accessors ---

// Users
export const getUsers = async (): Promise<User[]> => {
  const users = await apiFetch<User>('Users');
  
  // PENTING: Cek apakah admin ada. Jika Spreadsheet kosong (return []), 
  // kita HARUS menyuntikkan admin default agar user bisa login pertama kali.
  const adminExists = users.some(u => u.username === 'admin');
  
  if (!adminExists) {
    // Gabungkan default admin dengan data yang ada
    return [defaultAdmin, ...users];
  }
  
  return users;
};

export const saveUser = async (user: User) => {
  // Local First Strategy
  const users = getLocal<User>(KEYS.USERS);
  // Ensure default admin always exists if we are operating on local data that might be empty
  if (!users.find(u => u.username === 'admin')) users.unshift(defaultAdmin);

  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) users[index] = user;
  else users.push(user);
  
  // Normalize to ensure header creation in Sheet (Google Script uses first row keys)
  const normalized = users.map(u => ({
    ...u,
    classGrade: u.classGrade || ''
  }));
  
  await apiSave('Users', normalized);
};

export const deleteUser = async (id: string) => {
  const users = getLocal<User>(KEYS.USERS);
  // Cegah penghapusan admin utama
  if (id === 'admin-001') return; 
  const newUsers = users.filter(u => u.id !== id);
  
  // Normalize to ensure header creation in Sheet
  const normalized = newUsers.map(u => ({
    ...u,
    classGrade: u.classGrade || ''
  }));

  await apiSave('Users', normalized);
};

// Students
export const getStudents = async (): Promise<Student[]> => {
    const data = await apiFetch<Student>('Students');
    // Force IDs to string to prevent mismatch with input/filter
    return data.map(s => ({
        ...s,
        nisn: String(s.nisn),
        classGrade: String(s.classGrade)
    }));
};

export const saveStudentsBulk = async (newStudents: Student[]) => {
  const current = getLocal<Student>(KEYS.STUDENTS);
  // Merge strategy: update if exists, add if new
  const map = new Map(current.map(s => [s.nisn, s]));
  newStudents.forEach(s => map.set(s.nisn, s));
  
  const normalized = Array.from(map.values()).map(s => ({
      ...s,
      nisn: String(s.nisn),
      classGrade: String(s.classGrade)
  }));
  
  await apiSave('Students', normalized);
};

export const saveStudent = async (student: Student) => {
  await saveStudentsBulk([student]);
};

export const deleteStudent = async (nisn: string) => {
  const list = getLocal<Student>(KEYS.STUDENTS);
  const newList = list.filter(s => String(s.nisn) !== String(nisn));
  await apiSave('Students', newList);
};

// Materials
export const getMaterials = async (): Promise<Material[]> => {
  const data = await apiFetch<Material>('Materials');
  // Defensive check: Ensure questions and tasks are always arrays
  // Force IDs to string
  return data.map(m => ({
    ...m,
    id: String(m.id),
    classGrade: String(m.classGrade),
    questions: safeArray(m.questions),
    tasks: safeArray(m.tasks)
  }));
};

export const saveMaterial = async (material: Material) => {
  const list = getLocal<Material>(KEYS.MATERIALS);
  const index = list.findIndex(m => String(m.id) === String(material.id));
  if (index >= 0) list[index] = material;
  else list.push(material);
  
  // Ensure IDs are strings
  const normalized = list.map(m => ({
      ...m,
      id: String(m.id),
      classGrade: String(m.classGrade)
  }));

  await apiSave('Materials', normalized);
};

export const deleteMaterial = async (id: string) => {
  const list = getLocal<Material>(KEYS.MATERIALS);
  const newList = list.filter(m => String(m.id) !== String(id));
  await apiSave('Materials', newList);
};

// Submissions
export const getSubmissions = async (): Promise<Submission[]> => {
  const data = await apiFetch<Submission>('Submissions');
  return data.map(s => ({
    ...s,
    id: String(s.id),
    materialId: String(s.materialId),
    studentNisn: String(s.studentNisn),
    answers: safeArray(s.answers),
    taskText: s.taskText || '',
    taskFileUrl: s.taskFileUrl || ''
  }));
};

export const saveSubmission = async (sub: Submission) => {
  const list = getLocal<Submission>(KEYS.SUBMISSIONS);
  const index = list.findIndex(s => String(s.id) === String(sub.id));
  if (index >= 0) list[index] = sub;
  else list.push(sub);

  // NORMALISASI PENTING:
  // Pastikan SEMUA data submission memiliki field taskText dan taskFileUrl.
  // Jika data lama (baris pertama) tidak punya field ini, Google Sheet tidak akan membuat kolomnya.
  const normalizedList = list.map(s => ({
      ...s,
      id: String(s.id),
      materialId: String(s.materialId),
      studentNisn: String(s.studentNisn),
      taskText: s.taskText || '',      // Force field exist
      taskFileUrl: s.taskFileUrl || '', // Force field exist
      teacherNotes: s.teacherNotes || ''
  }));

  await apiSave('Submissions', normalizedList);
};

export const deleteSubmission = async (id: string) => {
  const list = getLocal<Submission>(KEYS.SUBMISSIONS);
  const newList = list.filter(s => String(s.id) !== String(id));
  
  const normalizedList = newList.map(s => ({
      ...s,
      id: String(s.id),
      materialId: String(s.materialId),
      studentNisn: String(s.studentNisn),
      taskText: s.taskText || '',
      taskFileUrl: s.taskFileUrl || '',
      teacherNotes: s.teacherNotes || ''
  }));

  await apiSave('Submissions', normalizedList);
};

// Settings (Async with Spreadsheet) with CHUNKING SUPPORT
export const getSettings = async (): Promise<SettingItem[]> => apiFetch<SettingItem>('Settings');

export const getCertBackground = async (): Promise<string | null> => {
  const settings = await getSettings();
  
  // Cek apakah ada chunk 1, 2, dst
  const chunks = settings.filter(s => s.key.startsWith('certBg_chunk'));
  
  if (chunks.length > 0) {
      // Sort berdasarkan index (chunk0, chunk1, chunk2...)
      chunks.sort((a, b) => {
          const idxA = parseInt(a.key.replace('certBg_chunk', ''));
          const idxB = parseInt(b.key.replace('certBg_chunk', ''));
          return idxA - idxB;
      });
      // Gabungkan value
      return chunks.map(c => c.value).join('');
  }

  // Fallback ke legacy key (jika data lama)
  const item = settings.find(s => s.key === 'certBg');
  return item ? item.value : null;
};

export const saveCertBackground = async (dataUrl: string) => {
  let settings = await getSettings(); // Ambil settings terbaru dari server/cache
  
  // 1. Hapus data lama (baik legacy maupun chunk)
  settings = settings.filter(s => s.key !== 'certBg' && !s.key.startsWith('certBg_chunk'));

  // 2. Pecah string menjadi potongan 45.000 karakter
  const CHUNK_SIZE = 45000;
  const totalChunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  
  for (let i = 0; i < totalChunks; i++) {
      const chunkVal = dataUrl.substr(i * CHUNK_SIZE, CHUNK_SIZE);
      settings.push({
          key: `certBg_chunk${i}`,
          value: chunkVal
      });
  }

  await apiSave('Settings', settings);
};