import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  Users, BookOpen, UserCheck, FileText, Settings, 
  LogOut, Home, GraduationCap, ClipboardList
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  const getMenuItems = () => {
    const items = [];
    
    // Dashboard common for all logged in
    items.push({ icon: Home, label: 'Dashboard', path: '/app/dashboard' });

    if (user.role === Role.ADMIN) {
      items.push({ icon: Users, label: 'Daftar Siswa', path: '/app/students' });
      items.push({ icon: BookOpen, label: 'Bahan Bacaan', path: '/app/materials' });
      items.push({ icon: ClipboardList, label: 'Periksa Hasil', path: '/app/grading' });
      items.push({ icon: UserCheck, label: 'Manajemen User', path: '/app/users' });
      items.push({ icon: Settings, label: 'Pengaturan', path: '/app/settings' });
    } else if (user.role === Role.TEACHER) {
      items.push({ icon: Users, label: `Siswa Kelas ${user.classGrade}`, path: '/app/students' });
      items.push({ icon: BookOpen, label: 'Input Bacaan', path: '/app/materials' });
      items.push({ icon: ClipboardList, label: 'Periksa Refleksi', path: '/app/grading' });
    } else if (user.role === Role.STUDENT) {
      items.push({ icon: BookOpen, label: 'Bacaan Saya', path: '/app/read' });
    }

    return items;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-midnight-900 text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-gray-700 bg-midnight-800">
          <h1 className="text-xl font-bold text-senja-400">SENJA DIGITAL</h1>
          <p className="text-xs text-gray-400 mt-1">SD NEGERI 5 BILATO</p>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-senja-500 flex items-center justify-center text-white font-bold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium truncate w-32">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.role === Role.TEACHER ? 'Wali Kelas' : user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {getMenuItems().map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-senja-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 relative">
        {/* Header Mobile would go here if implementing responsive mobile menu */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
