import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser } from '../services/firebase';
import { User, Role } from '../types';
import { Plus, Trash2, Edit, Save, X, AlertCircle, Loader2 } from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<User>>({
    username: '', password: '', fullName: '', role: Role.TEACHER, assignedClass: '1'
  });
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
        const data = await getUsers();
        setUsers(data);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ username: '', password: '', fullName: '', role: Role.TEACHER, assignedClass: '1' });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!form.username || !form.password || !form.fullName) return;
    
    setIsLoading(true);
    try {
        if (isEditing && form.id) {
            await updateUser(form as User);
        } else {
            await addUser(form as User);
        }
        await loadUsers();
        resetForm();
    } catch (error) {
        alert("Gagal menyimpan user.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setForm(user);
    setIsEditing(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      setIsLoading(true);
      try {
        await deleteUser(deleteId);
        await loadUsers();
      } catch (e) {
        alert("Gagal menghapus.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manajemen User (Guru)</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">{isEditing ? 'Edit Guru' : 'Tambah Guru Baru'}</h3>
          {isEditing && (
            <button onClick={resetForm} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
              <X className="w-4 h-4" /> Batal Edit
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-xs block mb-1 font-medium text-gray-600">Username</label>
            <input type="text" className="border w-full p-2 rounded focus:ring-2 focus:ring-senja-primary outline-none" value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div>
            <label className="text-xs block mb-1 font-medium text-gray-600">Password</label>
            <input type="text" className="border w-full p-2 rounded focus:ring-2 focus:ring-senja-primary outline-none" value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div>
            <label className="text-xs block mb-1 font-medium text-gray-600">Nama Lengkap</label>
            <input type="text" className="border w-full p-2 rounded focus:ring-2 focus:ring-senja-primary outline-none" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
          </div>
          <div>
            <label className="text-xs block mb-1 font-medium text-gray-600">Kelas Ampuan</label>
            <select className="border w-full p-2 rounded focus:ring-2 focus:ring-senja-primary outline-none" value={form.assignedClass} onChange={e => setForm({...form, assignedClass: e.target.value})}>
               {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isLoading}
            className={`text-white p-2 rounded flex justify-center items-center gap-2 transition ${isEditing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-senja-secondary hover:bg-purple-700'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditing ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />)}
            {isEditing ? 'Simpan' : 'Tambah'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[200px] relative">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-senja-primary" />
            </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-gray-50 uppercase text-xs text-gray-600">
             <tr>
               <th className="p-4">Nama</th>
               <th className="p-4">Username</th>
               <th className="p-4">Role</th>
               <th className="p-4">Kelas</th>
               <th className="p-4 text-right">Aksi</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-medium">{u.fullName}</td>
                <td className="p-4 font-mono text-sm text-gray-500">{u.username}</td>
                <td className="p-4"><span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">{u.role}</span></td>
                <td className="p-4">{u.assignedClass || '-'}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => handleEdit(u)} 
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                    title="Edit User"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {u.username !== 'admin' && (
                    <button 
                      onClick={() => setDeleteId(u.id)} 
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"
                      title="Hapus User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">Belum ada user.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Hapus User?</h3>
                    <p className="text-gray-500 text-sm mt-2">
                        Apakah Anda yakin ingin menghapus pengguna ini? Pengguna tidak akan bisa login kembali.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={() => setDeleteId(null)} 
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                    >
                        Batal
                    </button>
                    <button 
                        onClick={handleConfirmDelete} 
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex justify-center items-center"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Hapus'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};