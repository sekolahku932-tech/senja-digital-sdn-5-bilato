import React, { useState, useEffect } from 'react';
import { getMaterials, addMaterial, updateMaterial, deleteMaterial } from '../services/firebase';
import { generateReflectionQuestions } from '../services/geminiService';
import { Material, User, Role } from '../types';
import { Plus, Trash2, Edit, Sparkles, Loader2, Link as LinkIcon, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface Props {
  currentUser: User;
}

export const MaterialManagement: React.FC<Props> = ({ currentUser }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<Material>>({
    title: '', grade: currentUser.assignedClass || '1', content: '', 
    type: 'text', questions: [], hasTask: false, taskDescription: ''
  });

  useEffect(() => {
    loadMaterials();
  }, [currentUser]);

  const loadMaterials = async () => {
    setIsLoading(true);
    try {
        const grade = currentUser.role === Role.TEACHER ? currentUser.assignedClass : undefined;
        const data = await getMaterials(grade);
        setMaterials(data);
    } catch (error) {
        console.error("Err loading materials", error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!form.title || !form.content) {
      alert("Isi Judul dan Konten terlebih dahulu!");
      return;
    }
    setIsGenerating(true);
    try {
        const questions = await generateReflectionQuestions(form.title!, form.content!, form.grade!);
        setForm(prev => ({ ...prev, questions }));
    } catch (e) {
        alert("Gagal generate soal.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) return;
    setIsLoading(true);
    try {
        if (form.id) {
            await updateMaterial(form as Material);
        } else {
            await addMaterial(form as Material);
        }
        setIsEditing(false);
        setForm({ title: '', grade: currentUser.assignedClass || '1', content: '', type: 'text', questions: [], hasTask: false });
        await loadMaterials();
    } catch (error) {
        alert("Gagal menyimpan.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if(deleteId) {
      setIsLoading(true);
      try {
        await deleteMaterial(deleteId);
        await loadMaterials();
      } catch (error) {
        alert("Gagal menghapus.");
      } finally {
        setIsLoading(false);
        setDeleteId(null);
      }
    }
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Input Bahan Bacaan</h2>
          <button onClick={() => setIsEditing(false)} className="text-gray-500">Batal</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Judul</label>
              <input type="text" className="w-full border p-2 rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kelas</label>
                <select 
                  className="w-full border p-2 rounded" 
                  value={form.grade} 
                  onChange={e => setForm({...form, grade: e.target.value})}
                  disabled={currentUser.role === Role.TEACHER}
                >
                  {[1,2,3,4,5,6].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipe Materi</label>
                <select className="w-full border p-2 rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}>
                  <option value="text">Teks Bacaan</option>
                  <option value="image">Gambar</option>
                  <option value="video">Video (YouTube/Link)</option>
                  <option value="pdf">PDF</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Konten / Ringkasan</label>
              <textarea 
                className="w-full border p-2 rounded h-32" 
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})}
                placeholder="Isi teks bacaan atau deskripsi singkat untuk video/gambar..."
              />
            </div>

            {(form.type === 'video' || form.type === 'pdf') && (
               <div>
               <label className="block text-sm font-medium mb-1">Link URL (Video/PDF)</label>
               <input type="text" className="w-full border p-2 rounded" value={form.linkUrl || ''} onChange={e => setForm({...form, linkUrl: e.target.value})} placeholder="https://..." />
             </div>
            )}
             {(form.type === 'image') && (
               <div>
               <label className="block text-sm font-medium mb-1">Link Gambar (Mock Upload)</label>
               <input type="text" className="w-full border p-2 rounded" value={form.mediaUrl || ''} onChange={e => setForm({...form, mediaUrl: e.target.value})} placeholder="https://picsum.photos/..." />
             </div>
            )}
          </div>

          <div className="space-y-4 border-l pl-6">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold">Refleksi</label>
              <button 
                onClick={handleGenerateQuestions}
                disabled={isGenerating}
                className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full flex items-center gap-1 hover:bg-purple-200"
              >
                {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                Bantu Buat Soal (AI)
              </button>
            </div>

            {form.questions?.map((q, idx) => (
              <div key={idx} className="flex gap-2">
                 <input 
                    type="text" 
                    className="flex-1 border p-2 rounded text-sm" 
                    value={q.text}
                    onChange={(e) => {
                        const newQ = [...(form.questions || [])];
                        newQ[idx].text = e.target.value;
                        setForm({...form, questions: newQ});
                    }}
                 />
                 <button onClick={() => {
                    const newQ = form.questions?.filter((_, i) => i !== idx);
                    setForm({...form, questions: newQ});
                 }} className="text-red-500"><Trash2 className="w-4 h-4"/></button>
              </div>
            ))}
             <button 
                onClick={() => setForm({...form, questions: [...(form.questions || []), {id: `m-${Date.now()}`, text: ''}]})}
                className="text-sm text-senja-primary flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Tambah Pertanyaan
              </button>

            <div className="pt-4 border-t mt-4">
               <div className="flex items-center gap-2 mb-2">
                 <input 
                    type="checkbox" 
                    checked={form.hasTask} 
                    onChange={e => setForm({...form, hasTask: e.target.checked})}
                    id="hasTask"
                 />
                 <label htmlFor="hasTask" className="font-bold text-sm">Ada Tugas Siswa?</label>
               </div>
               {form.hasTask && (
                 <textarea 
                    className="w-full border p-2 rounded text-sm h-20"
                    placeholder="Deskripsi tugas untuk siswa..."
                    value={form.taskDescription || ''}
                    onChange={e => setForm({...form, taskDescription: e.target.value})}
                 />
               )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Batal</button>
            <button onClick={handleSave} disabled={isLoading} className="px-6 py-2 bg-senja-primary text-white rounded hover:bg-orange-600 flex items-center">
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>} Simpan Materi
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Bahan Bacaan & Materi</h2>
        <button 
          onClick={() => setIsEditing(true)}
          className="bg-senja-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4" /> Input Bahan Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative min-h-[200px]">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 z-10">
                <Loader2 className="w-8 h-8 animate-spin text-senja-primary" />
            </div>
          )}
          
          {materials.map(m => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition">
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {m.type === 'image' && m.mediaUrl ? (
                  <img src={m.mediaUrl} alt={m.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-300">
                     {m.type === 'video' ? <LinkIcon className="w-12 h-12"/> : <ImageIcon className="w-12 h-12"/>}
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold uppercase">
                  Kelas {m.grade}
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-2 line-clamp-1">{m.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{m.content}</p>
                <div className="mt-auto flex justify-end gap-2 pt-4 border-t">
                  <button onClick={() => { setForm(m); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"><Edit className="w-4 h-4"/></button>
                  <button onClick={() => setDeleteId(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Hapus Materi?</h3>
                    <p className="text-gray-500 text-sm mt-2">
                        Apakah Anda yakin ingin menghapus bahan bacaan ini? Data yang dihapus tidak dapat dikembalikan.
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