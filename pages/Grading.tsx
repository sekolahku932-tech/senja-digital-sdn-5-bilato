import React, { useState, useEffect } from 'react';
import { User, Role, Submission, Material } from '../types';
import { getMaterials, getSubmissions, saveSubmission, deleteSubmission } from '../services/storageService';
import { Check, X, MessageSquare, ExternalLink, Loader, RefreshCw, AlertTriangle } from 'lucide-react';

interface Props { user: User; }

const Grading: React.FC<Props> = ({ user }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [notes, setNotes] = useState('');
  
  // Reset Confirmation State
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mats, subs] = await Promise.all([getMaterials(), getSubmissions()]);
    setMaterials(mats);
    setAllSubmissions(subs);
    setLoading(false);
  };

  // Filter submissions based on role/class
  const filteredSubmissions = allSubmissions.filter(s => 
    (user.role === Role.TEACHER && s.classGrade === user.classGrade) ||
    (user.role === Role.ADMIN)
  );

  const getMaterialTitle = (id: string) => materials.find(m => m.id === id)?.title || 'Unknown';

  const handleApprove = async (approve: boolean) => {
      if(!selectedSub) return;
      setProcessing(true);
      const updated: Submission = {
          ...selectedSub,
          isApproved: approve,
          teacherNotes: notes
      };
      await saveSubmission(updated);
      setSelectedSub(null);
      setNotes('');
      await loadData();
      setProcessing(false);
  };

  const handleReset = async () => {
      if(!selectedSub) return;
      setProcessing(true);
      
      // Hapus submission dari database
      await deleteSubmission(selectedSub.id);
      
      setSelectedSub(null);
      setNotes('');
      setShowResetConfirm(false);
      
      await loadData();
      setProcessing(false);
  };

  if (loading) return <div className="p-10 text-center text-gray-500"><Loader className="animate-spin inline mr-2"/> Memuat data nilai...</div>;

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold text-gray-800">Periksa Hasil Refleksi & Tugas</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-gray-50 font-bold">Daftar Masuk</div>
              <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredSubmissions.map(sub => (
                      <div key={sub.id} 
                           onClick={() => { setSelectedSub(sub); setNotes(sub.teacherNotes || ''); }}
                           className={`p-4 cursor-pointer hover:bg-blue-50 transition ${selectedSub?.id === sub.id ? 'bg-blue-100' : ''}`}
                      >
                          <div className="flex justify-between items-start">
                              <div>
                                  <p className="font-bold text-gray-800">{sub.studentName}</p>
                                  <p className="text-xs text-gray-500">{getMaterialTitle(sub.materialId)}</p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${sub.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {sub.isApproved ? 'Lulus' : 'Menunggu'}
                              </span>
                          </div>
                      </div>
                  ))}
                  {filteredSubmissions.length === 0 && <p className="p-4 text-gray-500">Tidak ada data.</p>}
              </div>
          </div>

          {/* Detail */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative">
              {selectedSub ? (
                  <div className="space-y-6">
                      <div className="border-b pb-4 flex justify-between items-start">
                          <div>
                              <h3 className="text-xl font-bold">{selectedSub.studentName}</h3>
                              <p className="text-gray-500">Materi: {getMaterialTitle(selectedSub.materialId)}</p>
                          </div>
                          
                          <button 
                            onClick={() => setShowResetConfirm(true)}
                            className="text-xs bg-red-100 text-red-600 px-3 py-1 rounded-full hover:bg-red-200 flex items-center gap-1 font-bold"
                            disabled={processing}
                          >
                            <RefreshCw size={14} /> Reset Jawaban
                          </button>
                      </div>

                      <div className="space-y-4">
                          <h4 className="font-bold text-senja-600">Jawaban Refleksi</h4>
                          {selectedSub.answers.map((ans, i) => (
                              <div key={i} className="bg-gray-50 p-3 rounded">
                                  <p className="text-xs text-gray-400 mb-1">Pertanyaan {i+1}</p>
                                  <p className="text-sm">{ans.answer}</p>
                              </div>
                          ))}
                      </div>

                      {/* TUGAS SECTION */}
                      {(selectedSub.taskFileUrl || selectedSub.taskText) && (
                          <div className="space-y-2 border-t pt-4">
                              <h4 className="font-bold text-senja-600">Jawaban Tugas</h4>
                              
                              {selectedSub.taskText && (
                                <div className="bg-blue-50 p-4 rounded border border-blue-100">
                                    <p className="text-sm font-bold text-blue-800 mb-1">Jawaban Teks:</p>
                                    <p className="text-gray-800 whitespace-pre-wrap">{selectedSub.taskText}</p>
                                </div>
                              )}

                              {selectedSub.taskFileUrl && (
                                  <div className="mt-2">
                                    <a href={selectedSub.taskFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 underline font-medium">
                                        <ExternalLink size={16}/> Lihat Lampiran File / Foto
                                    </a>
                                  </div>
                              )}
                          </div>
                      )}

                      <div className="pt-4 border-t">
                          <label className="block text-sm font-bold mb-2">Catatan Guru</label>
                          <textarea 
                            className="w-full border p-2 rounded mb-4" 
                            rows={3} 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Berikan masukan..."
                          />
                          
                          <div className="flex gap-3">
                              <button onClick={() => handleApprove(true)} disabled={processing} className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex justify-center items-center gap-2">
                                  {processing ? <Loader className="animate-spin" size={18}/> : <Check size={18}/>} Setujui (Sertifikat)
                              </button>
                              <button onClick={() => handleApprove(false)} disabled={processing} className="flex-1 bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 flex justify-center items-center gap-2">
                                  {processing ? <Loader className="animate-spin" size={18}/> : <MessageSquare size={18}/>} Simpan Catatan
                              </button>
                          </div>
                      </div>
                  </div>
              ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                      Pilih siswa untuk diperiksa.
                  </div>
              )}
          </div>
      </div>

      {/* MODAL KONFIRMASI RESET */}
      {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center shadow-xl">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle size={24} />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Reset Jawaban Siswa?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                      Data jawaban siswa ini akan dihapus permanen. Siswa harus membaca dan mengerjakan ulang tugas ini.
                  </p>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => setShowResetConfirm(false)} 
                        className="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200"
                      >
                          Batal
                      </button>
                      <button 
                        onClick={handleReset} 
                        disabled={processing} 
                        className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center justify-center gap-2"
                      >
                          {processing && <Loader className="animate-spin" size={16}/>} Reset / Hapus
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Grading;