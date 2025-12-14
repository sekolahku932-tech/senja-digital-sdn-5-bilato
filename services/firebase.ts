import * as firebaseApp from "firebase/app";
import { 
  getFirestore, collection, getDocs, addDoc, updateDoc, 
  deleteDoc, doc, query, where, getDoc, setDoc, writeBatch 
} from "firebase/firestore";
import { User, Student, Material, Submission, Role } from "../types";

// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDghVWbka6CjSswZy0wa0tvNePzz4BgeHI",
  authDomain: "senja-digital-f525a.firebaseapp.com",
  projectId: "senja-digital-f525a",
  storageBucket: "senja-digital-f525a.firebasestorage.app",
  messagingSenderId: "243052070818",
  appId: "1:243052070818:web:0ba36105aabbe4567594fb",
  measurementId: "G-9JLCSWQP53"
};

// Initialize Firebase
const app = firebaseApp.initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helper to map doc data with ID
const mapDoc = (doc: any) => ({ id: doc.id, ...doc.data() });

// --- SEEDING (INITIAL DATA) ---
export const seedDatabase = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", "admin"));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    return "Database sudah ada isinya. Tidak perlu setup ulang.";
  }

  try {
    const batch = writeBatch(db);

    // 1. Create Admin
    const adminRef = doc(usersRef);
    batch.set(adminRef, {
      username: 'admin',
      password: 'admin', // Password sederhana untuk awal
      fullName: 'Administrator Sekolah',
      role: Role.ADMIN
    });

    // 2. Create Default Teacher
    const teacherRef = doc(usersRef);
    batch.set(teacherRef, {
      username: 'guru5',
      password: 'guru5',
      fullName: 'Wali Kelas 5',
      role: Role.TEACHER,
      assignedClass: '5'
    });

    // 3. Create Sample Student
    const studentRef = doc(collection(db, "students"));
    batch.set(studentRef, {
      nisn: '12345',
      name: 'Siswa Contoh',
      gender: 'L',
      grade: '5'
    });

    await batch.commit();
    return "Berhasil! User Admin (user: admin, pass: admin) telah dibuat.";
  } catch (error) {
    console.error(error);
    throw new Error("Gagal melakukan setup database.");
  }
};

// --- USERS SERVICE ---
export const getUsers = async (): Promise<User[]> => {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map(doc => mapDoc(doc) as User);
};

export const addUser = async (user: User) => {
  const { id, ...userData } = user; 
  await addDoc(collection(db, "users"), userData);
};

export const updateUser = async (user: User) => {
  const userRef = doc(db, "users", user.id);
  const { id, ...userData } = user;
  await updateDoc(userRef, userData);
};

export const deleteUser = async (id: string) => {
  await deleteDoc(doc(db, "users", id));
};

export const getUserByUsername = async (username: string, role: Role): Promise<User | null> => {
  const q = query(
    collection(db, "users"), 
    where("username", "==", username),
    where("role", "==", role)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc(snapshot.docs[0]) as User;
};

// --- STUDENTS SERVICE ---
export const getStudents = async (grade?: string): Promise<Student[]> => {
  const studentsRef = collection(db, "students");
  let q;
  
  if (grade) {
    q = query(studentsRef, where("grade", "==", grade));
  } else {
    q = query(studentsRef);
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc(doc) as Student);
};

export const addStudent = async (student: Student) => {
  const { id, ...data } = student;
  await addDoc(collection(db, "students"), data);
};

export const updateStudent = async (student: Student) => {
  const ref = doc(db, "students", student.id);
  const { id, ...data } = student;
  await updateDoc(ref, data);
};

export const deleteStudent = async (id: string) => {
  await deleteDoc(doc(db, "students", id));
};

export const getStudentByNISN = async (nisn: string): Promise<Student | null> => {
  const q = query(collection(db, "students"), where("nisn", "==", nisn));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapDoc(snapshot.docs[0]) as Student;
};

// --- MATERIALS SERVICE ---
export const getMaterials = async (grade?: string): Promise<Material[]> => {
  const ref = collection(db, "materials");
  let q;
  if (grade) {
    q = query(ref, where("grade", "==", grade));
  } else {
    q = query(ref);
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc(doc) as Material);
};

export const addMaterial = async (material: Material) => {
  const { id, ...data } = material;
  await addDoc(collection(db, "materials"), data);
};

export const updateMaterial = async (material: Material) => {
  const ref = doc(db, "materials", material.id);
  const { id, ...data } = material;
  await updateDoc(ref, data);
};

export const deleteMaterial = async (id: string) => {
  await deleteDoc(doc(db, "materials", id));
};

// --- SUBMISSIONS SERVICE ---
export const getSubmissions = async (studentId?: string, materialId?: string): Promise<Submission[]> => {
  const ref = collection(db, "submissions");
  let constraints = [];
  
  if (studentId) constraints.push(where("studentId", "==", studentId));
  if (materialId) constraints.push(where("materialId", "==", materialId)); 
  
  const q = query(ref, ...constraints);
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => mapDoc(doc) as Submission);
};

export const addSubmission = async (sub: Submission) => {
  const { id, ...data } = sub;
  await addDoc(collection(db, "submissions"), data);
};

export const updateSubmission = async (sub: Submission) => {
  const ref = doc(db, "submissions", sub.id);
  const { id, ...data } = sub;
  await updateDoc(ref, data);
};

// --- SETTINGS SERVICE ---
export const getCertBg = async (): Promise<string> => {
  const docRef = doc(db, "settings", "certificate");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().bgUrl || "";
  }
  return "";
};

export const setCertBg = async (url: string) => {
  await setDoc(doc(db, "settings", "certificate"), { bgUrl: url });
};