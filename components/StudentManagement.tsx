import React, { useState, useEffect } from 'react';
import { getStudents, addStudent, updateStudent, deleteStudent } from '../services/firebase';
import { Student, User, Role } from '../types';
import { Plus, Trash2, Edit, Upload, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  currentUser: User;
}

export const StudentManagement: React.FC<Props> = ({ currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportMode, setIsImportMode] = useState(false);
  const [importText, setImportText] = useState('');
  
  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    nisn: '', name: '', gender: 'L', grade: '1'
  });

  useEffect(() => {
    loadStudents();
  }, [currentUser]);

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const grade = currentUser.role === Role.TEACHER ? currentUser.assignedClass : undefined;
      const data = await getStudents(grade);
      
      // Sort: Grade Ascending -> Name Alphabetical
      data.sort((a, b) => {
          // Parse grades to numbers for correct sorting (e.g. 1 before 2)
          const gradeA = parseInt(a.grade) || 0;
          const gradeB = parseInt(b.grade) || 0;
          
          if (gradeA !== gradeB) {
              return gradeA - gradeB;
          }
          // If grades are the same, sort by name
          return a.name.localeCompare(b.name);
      });

      setStudents(data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.nisn || !formData.name) return;
    
    setIsLoading(true);
    try {
      if (formData.id) {
        await updateStudent(formData as Student);
      } else {
        await addStudent(formData as Student);
      }
      setIsModalOpen(false);
      setFormData({ nisn: '', name: '', gender: 'L', grade: currentUser.assignedClass || '1' });
      await loadStudents();
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteId) {
      setIsLoading(true);
      try {
        await deleteStudent(deleteId);
        await loadStudents();
      } catch (error) {
        alert("Gagal menghapus.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  };

  const handleImport = async () => {
    // Expected format: NISN [tab] Name [tab] Gender [tab] Class
    const lines = importText.trim().split('\n');
    setIsLoading(true);
    
    try {
        const promises = lines.map(async line => {
            const parts = line.split('\t');
            if (parts.length >= 2) {
                const newStudent: any = {
                nisn: parts[0].trim(),
                name: parts[1].trim(),
                gender: (parts[2]?.trim().toUpperCase() === 'P' ? 'P' : 'L'),
                grade: parts[3]?.trim() || currentUser.assignedClass || '1'
                };
                return addStudent(newStudent);
            }
        });

        await Promise.all(promises);
        await loadStudents();
        setIsImportMode(false);
        setImportText('');
    } catch (error) {
        alert("Terjadi kesalahan saat import.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Daftar Siswa</h2>
          <p className="text-gray-500">
            {currentUser.role === Role.TEACHER 
              ? `Kelas ${currentUser.assignedClass}` 
              : 'Semua Kelas'}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setIsImportMode(true); setIsModalOpen(true); }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button 
            onClick={() => { 
              setIsImportMode(false); 
              setFormData({ nisn: '', name: '', gender: 'L', grade: currentUser.assignedClass || '1' });
              setIsModalOpen(true); 
            }}
            className="bg-senja-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden min-h-[300px] relative">
        {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-senja-primary" />
            </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
            <tr>
              <th className="p-4">NISN</th>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4">L/P</th>
              <th className="p-4">Kelas</th>
              <th className="p-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{s.nisn}</td>
                <td className="p-4">{s.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${s.gender === 'L' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {s.gender}
                  </span>
                </td>
                <td className="p-4">{s.grade}</td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => { setIsImportMode(false); setFormData(s); setIsModalOpen(true); }}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setDeleteId(s.id)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && students.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">Belum ada data siswa</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Import/Add */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">{isImportMode ? 'Import dari Excel' : 'Data Siswa'}</h3>
            
            {isImportMode ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Copy data dari Excel (tanpa header) dengan urutan kolom: <br/>
                  <b>NISN | Nama | Gender (L/P) | Kelas</b>
                </p>
                <textarea
                  className="w-full border rounded-lg p-3 h-48 font-mono text-sm focus:ring-2 focus:ring-senja-primary outline-none"
                  placeholder={`12345\tBudi\tL\t5\n67890\tSiti\tP\t5`}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                ></textarea>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Batal</button>
                  <button onClick={handleImport} disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Proses Import
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">NISN</label>
                  <input 
                    type="text" 
                    value={formData.nisn} 
                    onChange={e => setFormData({...formData, nisn: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-senja-primary outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Nama Siswa</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-senja-primary outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Jenis Kelamin</label>
                    <select 
                      value={formData.gender} 
                      onChange={e => setFormData({...formData, gender: e.target.value as 'L'|'P'})}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-senja-primary outline-none"
                    >
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select 
                      value={formData.grade} 
                      onChange={e => setFormData({...formData, grade: e.target.value})}
                      disabled={currentUser.role === Role.TEACHER}
                      className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-senja-primary outline-none"
                    >
                      {[1,2,3,4,5,6].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600">Batal</button>
                  <button onClick={handleSave} disabled={isLoading} className="bg-senja-primary text-white px-4 py-2 rounded-lg flex items-center">
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Simpan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Hapus Siswa?</h3>
                    <p className="text-gray-500 text-sm mt-2">
                        Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.
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
