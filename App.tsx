import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { StudentManagement } from './components/StudentManagement';
import { MaterialManagement } from './components/MaterialManagement';
import { StudentReading } from './components/StudentReading';
import { Grading } from './components/Grading';
import { UserManagement } from './components/UserManagement';
import { Settings } from './components/Settings';
import { User, Student, Role } from './types';
import { getUserByUsername, getStudentByNISN, seedDatabase, getStudents } from './services/firebase';
import { Shield, Book, GraduationCap, ArrowRight, Loader2, Database, AlertCircle, CheckCircle, Users } from 'lucide-react';

// --- Login Pages ---

const LandingPage = () => {
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleSetup = async () => {
    // Removed window.confirm to prevent sandbox blocking
    setIsSeeding(true);
    setStatus(null);
    try {
        const msg = await seedDatabase();
        setStatus({type: 'success', text: msg});
    } catch (e: any) {
        setStatus({type: 'error', text: e.message || "Gagal setup database."});
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen senja-gradient flex flex-col items-center justify-center p-4 text-white">
      <div className="text-center mb-12 animate-in fade-in slide-in-from-top duration-700">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md tracking-tight">SENJA DIGITAL</h1>
        <p className="text-xl opacity-90 font-light tracking-widest border-b-2 border-white/20 inline-block pb-1">SD NEGERI 5 BILATO</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl animate-in zoom-in duration-500 delay-100">
        <button onClick={() => navigate('/login/admin')} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl hover:bg-white/20 transition transform hover:-translate-y-2 group flex flex-col items-center">
          <div className="p-4 bg-orange-500/20 rounded-full mb-4 group-hover:bg-orange-500/40 transition">
             <Shield className="w-12 h-12 text-orange-100" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Admin</h3>
          <p className="opacity-70 text-sm text-center">Masuk sebagai Administrator Sekolah</p>
        </button>

        <button onClick={() => navigate('/login/teacher')} className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl hover:bg-white/20 transition transform hover:-translate-y-2 group flex flex-col items-center">
           <div className="p-4 bg-purple-500/20 rounded-full mb-4 group-hover:bg-purple-500/40 transition">
             <Book className="w-12 h-12 text-purple-100" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Wali Kelas</h3>
          <p className="opacity-70 text-sm text-center">Masuk untuk Kelola Kelas & Materi</p>
        </button>

        <button onClick={() => navigate('/login/student')} className="bg-white text-senja-primary p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-2 group flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 bg-orange-100 rounded-bl-xl text-xs font-bold text-orange-600">
            SISWA
          </div>
          <div className="p-4 bg-orange-100 rounded-full mb-4 group-hover:scale-110 transition">
             <GraduationCap className="w-12 h-12 text-senja-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Masuk Siswa</h3>
          <p className="opacity-70 text-sm text-center text-gray-600">Gunakan NISN untuk mulai belajar</p>
          <div className="mt-4 flex justify-center w-full">
            <div className="bg-senja-primary/10 p-2 rounded-full">
               <ArrowRight className="w-5 h-5 animate-pulse text-senja-primary"/>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-12 flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-300">
        <button 
            onClick={handleSetup} 
            disabled={isSeeding}
            className="flex items-center gap-2 text-xs border border-white/30 px-4 py-2 rounded-full hover:bg-white/10 transition disabled:opacity-50"
        >
            {isSeeding ? <Loader2 className="w-3 h-3 animate-spin"/> : <Database className="w-3 h-3"/>}
            Setup Database Awal (Klik Sekali Saja)
        </button>
        
        {status && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2 ${
                status.type === 'success' ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
            }`}>
                {status.type === 'success' ? <CheckCircle className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                {status.text}
            </div>
        )}
      </div>

      {/* Footer Credit */}
      <div className="mt-16 text-center text-xs text-white/60 pb-4 animate-in fade-in duration-1000 delay-500">
          <p>Created by <span className="font-bold text-white/90">ARIYANTO RAHMAN</span></p>
          <p className="opacity-70 mt-1">© {new Date().getFullYear()} SD Negeri 5 Bilato</p>
      </div>
    </div>
  );
};

const LoginForm = ({ role, onLogin }: { role: Role, onLogin: (u: User) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const user = await getUserByUsername(username, role);
        if (user && user.password === password) {
            onLogin(user);
        } else {
            setError("Username atau password salah!");
        }
    } catch (error) {
        console.error(error);
        setError("Database belum di-setup atau koneksi error.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full animate-in zoom-in duration-300">
        <h2 className="text-2xl font-bold text-center text-senja-dark mb-6">Login {role === Role.ADMIN ? 'Admin' : 'Wali Kelas'}</h2>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Username</label>
            <input 
                type="text" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-senja-primary outline-none transition" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Password</label>
            <input 
                type="password" 
                className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-senja-primary outline-none transition" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="Masukkan password"
            />
          </div>
          <button type="submit" disabled={isLoading} className="w-full bg-senja-primary text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition flex justify-center items-center shadow-lg shadow-orange-200">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk'}
          </button>
        </form>
        <button onClick={() => navigate('/')} className="block w-full text-center mt-6 text-sm text-gray-500 hover:text-gray-800 transition">Kembali ke Halaman Utama</button>
      </div>
    </div>
  );
};

const StudentLoginForm = ({ onLogin }: { onLogin: (s: Student) => void }) => {
  const [nisn, setNisn] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
        const student = await getStudentByNISN(nisn);
        if (student) {
            onLogin(student);
        } else {
            setError("NISN tidak ditemukan. Hubungi Guru.");
        }
    } catch (error) {
        setError("Terjadi kesalahan koneksi.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen senja-gradient flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center animate-in zoom-in duration-300">
        <GraduationCap className="w-16 h-16 mx-auto text-senja-primary mb-4" />
        <h2 className="text-2xl font-bold text-senja-dark mb-2">Login Siswa</h2>
        <p className="text-gray-500 mb-6">Masukkan NISN kamu untuk mulai belajar</p>
        
        {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Nomor NISN"
            className="w-full border-2 border-orange-100 p-4 rounded-xl text-center text-xl tracking-widest font-bold text-gray-700 focus:border-senja-primary outline-none transition" 
            value={nisn} 
            onChange={e => setNisn(e.target.value)} 
          />
          <button type="submit" disabled={isLoading} className="w-full bg-senja-secondary text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg flex justify-center items-center">
             {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Mulai Petualangan!'}
          </button>
        </form>
        <button onClick={() => navigate('/')} className="block w-full text-center mt-6 text-sm text-gray-400 hover:text-gray-600 transition">Kembali ke Halaman Utama</button>
      </div>
    </div>
  );
};

// --- Dashboard Component ---
const Dashboard = ({ user, role }: { user: User | Student, role: Role }) => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      // Only fetch stats for Admin and Teacher
      if (role === Role.STUDENT) return;

      setIsLoading(true);
      try {
         const grade = role === Role.TEACHER ? (user as User).assignedClass : undefined;
         const students = await getStudents(grade);
         setStudentCount(students.length);
      } catch (e) {
         console.error(e);
      } finally {
         setIsLoading(false);
      }
    };
    fetchStats();
  }, [user, role]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* Header Welcome */}
       <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-2 text-senja-dark">
            Selamat Datang, {role === Role.STUDENT ? (user as Student).name : (user as User).fullName}!
          </h1>
          <p className="text-gray-600">
            {role === Role.ADMIN ? "Panel Administrator Sekolah" :
             role === Role.TEACHER ? `Panel Wali Kelas ${(user as User).assignedClass}` :
             "Selamat Belajar!"}
          </p>
       </div>

       {/* Stats Section (Only for Admin/Teacher) */}
       {(role === Role.ADMIN || role === Role.TEACHER) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 rounded-2xl shadow-lg flex items-center justify-between transform transition hover:scale-[1.02]">
                <div>
                   <p className="text-orange-100 text-sm font-medium mb-1">
                      {role === Role.ADMIN ? 'Total Seluruh Siswa' : `Siswa Kelas ${(user as User).assignedClass}`}
                   </p>
                   <h2 className="text-4xl font-bold tracking-tight">
                     {isLoading ? <Loader2 className="w-8 h-8 animate-spin"/> : studentCount}
                   </h2>
                   <p className="text-xs text-orange-200 mt-2">Terdaftar dalam sistem</p>
                </div>
                <div className="p-4 bg-white/20 rounded-full backdrop-blur-sm">
                   <Users className="w-8 h-8 text-white" />
                </div>
             </div>
          </div>
       )}

       {/* Info Box */}
        <div className="bg-gradient-to-r from-orange-50 to-purple-50 border border-senja-primary/10 p-8 rounded-xl">
          <p className="text-lg text-gray-800 font-medium mb-2">Selamat datang di Aplikasi Literasi Digital SD Negeri 5 Bilato.</p>
          <p className="text-gray-600">
            {role === Role.ADMIN ? "Anda memiliki akses penuh untuk mengelola user, siswa, dan pengaturan aplikasi." : 
             role === Role.TEACHER ? `Anda dapat mengelola materi dan siswa untuk Kelas ${(user as User).assignedClass}.` : 
             "Selamat belajar! Pilih menu Bacaan Siswa untuk memulai."}
          </p>
        </div>
    </div>
  );
}

// --- Main App Logic ---

const AppContent = () => {
  const [user, setUser] = useState<User | Student | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const navigate = useNavigate();

  const handleLogin = (u: User | Student, r: Role) => {
    setUser(u);
    setRole(r);
    if (r === Role.STUDENT) navigate('/read');
    else navigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setRole(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login/admin" element={<LoginForm role={Role.ADMIN} onLogin={(u) => handleLogin(u, Role.ADMIN)} />} />
      <Route path="/login/teacher" element={<LoginForm role={Role.TEACHER} onLogin={(u) => handleLogin(u, Role.TEACHER)} />} />
      <Route path="/login/student" element={<StudentLoginForm onLogin={(s) => handleLogin(s, Role.STUDENT)} />} />

      {/* Protected Routes */}
      {role && user ? (
        <Route path="/*" element={
          <Layout user={user} role={role} onLogout={handleLogout}>
             <Routes>
                <Route path="dashboard" element={<Dashboard user={user} role={role} />} />
                <Route path="students" element={<StudentManagement currentUser={user as User} />} />
                <Route path="materials" element={<MaterialManagement currentUser={user as User} />} />
                <Route path="grading" element={<Grading currentUser={user as User} />} />
                <Route path="read" element={role === Role.STUDENT ? <StudentReading student={user as Student} /> : <Navigate to="/dashboard"/>} />
                
                {role === Role.ADMIN && (
                   <>
                     <Route path="users" element={<UserManagement />} />
                     <Route path="settings" element={<Settings />} />
                   </>
                )}
             </Routes>
          </Layout>
        } />
      ) : (
        <Route path="*" element={<Navigate to="/" />} />
      )}
    </Routes>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}