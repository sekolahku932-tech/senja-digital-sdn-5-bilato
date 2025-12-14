import React, { useState } from 'react';
import { User, Student, Role } from '../types';
import { 
  LogOut, BookOpen, Users, ClipboardCheck, Settings, 
  Menu, X, Home, GraduationCap, UserPlus 
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User | Student | null;
  role: Role | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, role, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <button
      onClick={() => {
        navigate(to);
        setIsSidebarOpen(false);
      }}
      className={`flex items-center w-full px-4 py-3 mb-2 rounded-lg transition-colors ${
        isActive(to) 
          ? 'bg-senja-light text-senja-primary font-semibold' 
          : 'text-white hover:bg-white/10'
      }`}
    >
      <Icon className="w-5 h-5 mr-3" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 senja-gradient text-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 shadow-xl
      `}>
        <div className="p-6">
          <h1 className="text-2xl font-bold leading-tight">SENJA DIGITAL</h1>
          <p className="text-sm opacity-90">SD Negeri 5 Bilato</p>
          <div className="mt-4 p-3 bg-white/20 rounded-lg text-sm backdrop-blur-sm">
            <p className="font-semibold">{role === Role.STUDENT ? (user as Student).name : (user as User).fullName}</p>
            <p className="opacity-80 text-xs mt-1 uppercase tracking-wider">{role === Role.TEACHER ? 'Wali Kelas' : role}</p>
            {role === Role.TEACHER && <p className="text-xs opacity-75">Kelas: {(user as User).assignedClass}</p>}
            {role === Role.STUDENT && <p className="text-xs opacity-75">Kelas: {(user as Student).grade}</p>}
          </div>
        </div>

        <nav className="px-4 mt-2 flex-1 overflow-y-auto">
          <NavItem to="/dashboard" icon={Home} label="Beranda" />
          
          {(role === Role.ADMIN || role === Role.TEACHER) && (
            <>
              <NavItem to="/students" icon={GraduationCap} label="Daftar Siswa" />
              <NavItem to="/materials" icon={BookOpen} label="Input Bahan Bacaan" />
              <NavItem to="/grading" icon={ClipboardCheck} label="Periksa & Sertifikat" />
            </>
          )}

          {role === Role.ADMIN && (
            <>
              <NavItem to="/users" icon={Users} label="Manajemen User" />
              <NavItem to="/settings" icon={Settings} label="Pengaturan" />
            </>
          )}

          {role === Role.STUDENT && (
            <NavItem to="/read" icon={BookOpen} label="Bacaan Siswa" />
          )}
        </nav>

        <div className="p-4 bg-black/10 mt-auto">
          <button
            onClick={onLogout}
            className="flex items-center w-full px-4 py-3 text-red-100 hover:bg-red-500/20 rounded-lg transition-colors mb-4"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Keluar
          </button>
          
          {/* Creator Credit */}
          <div className="pt-4 border-t border-white/10 text-center">
            <p className="text-[10px] text-white/60">Created by</p>
            <p className="text-xs font-bold text-white tracking-wide">ARIYANTO RAHMAN</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-white shadow-sm p-4 md:hidden flex justify-between items-center">
          <span className="font-bold text-senja-primary">SENJA DIGITAL</span>
          <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
            <Menu className="w-6 h-6" />
          </button>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};