import React, { useState, useEffect } from 'react';
import { getSubmissions, getMaterials, updateSubmission } from '../services/firebase';
import { Submission, User, Role, Material } from '../types';
import { Check, X, ExternalLink, Image as ImageIcon, Type, MessageSquare, Loader2, Filter } from 'lucide-react';

interface Props {
  currentUser: User;
}

export const Grading: React.FC<Props> = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Filter Dropdown
  const [filterMaterialId, setFilterMaterialId] = useState<string>('ALL');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
        const allSubs = await getSubmissions();
        const allMats = await getMaterials(currentUser.assignedClass);
        
        // Filter relevant submissions based on materials of the assigned class
        const classMatIds = allMats.map(m => m.id);
        const relevantSubs = allSubs.filter(s => classMatIds.includes(s.materialId));
        
        // Sort submissions: Pending first, then by date (newest first)
        relevantSubs.sort((a, b) => {
            if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
            if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        });
        
        setSubmissions(relevantSubs);
        setMaterials(allMats);
    } catch (e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleGrade = async (sub: Submission, status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    const feedback = feedbacks[sub.id] || '';
    const updatedSub = { ...sub, status, teacherFeedback: feedback };
    setIsLoading(true);
    try {
        await updateSubmission(updatedSub);
        await loadData();
    } catch (e) {
        alert("Gagal menyimpan nilai.");
        setIsLoading(false);
    }
  };

  const getMaterialTitle = (id: string) => materials.find(m => m.id === id)?.title || 'Unknown';

  // Logic Filter Data
  const filteredSubmissions = filterMaterialId === 'ALL' 
    ? submissions 
    : submissions.filter(s => s.materialId === filterMaterialId);

  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64">
             <Loader2 className="w-10 h-10 animate-spin text-senja-primary" />
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Pemeriksaan Tugas</h2>
        
        {/* Dropdown Filter */}
        <div className="relative w-full md:w-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-gray-500" />
            </div>
            <select
                value={filterMaterialId}
                onChange={(e) => setFilterMaterialId(e.target.value)}
                className="pl-10 pr-8 py-2 w-full md:w-64 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-senja-primary text-sm appearance-none cursor-pointer hover:bg-gray-50 transition"
            >
                <option value="ALL">Semua Judul Bacaan</option>
                <option disabled>------------------------</option>
                {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div className="grid gap-6">
        {filteredSubmissions.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                    <Filter className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Tidak ada data tugas ditemukan.</p>
                <p className="text-gray-400 text-sm">Coba ganti filter judul bacaan.</p>
            </div>
        )}
        
        {filteredSubmissions.map(sub => (
          <div key={sub.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Header */}
             <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{sub.studentName}</h3>
                  <p className="text-sm text-senja-primary font-medium flex items-center gap-1">
                      <span className="bg-orange-100 px-2 py-0.5 rounded text-xs">Materi</span>
                      {getMaterialTitle(sub.materialId)}
                  </p>
                </div>
                <div className="text-right">
                   <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                     {new Date(sub.submittedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                   </span>
                   <div className="mt-1">
                        {sub.status === 'APPROVED' && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full border border-green-200">Disetujui</span>}
                        {sub.status === 'REJECTED' && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full border border-red-200">Ditolak</span>}
                        {sub.status === 'PENDING' && <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full border border-yellow-200 animate-pulse">Menunggu</span>}
                   </div>
                </div>
             </div>

             <div className="p-6 space-y-6">
                {/* Refleksi */}
                <div>
                    <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <Type className="w-4 h-4 text-gray-500" /> Jawaban Refleksi
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-100">
                        {sub.reflectionAnswers.map((ans, idx) => (
                            <div key={idx} className="text-sm">
                                <span className="font-semibold text-gray-600 block mb-1">Pertanyaan {idx+1}:</span>
                                <p className="text-gray-800">{ans.answer}</p>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Tugas */}
                {(sub.taskSubmissionContent || sub.taskFileUrl) && (
                  <div>
                    <h4 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-gray-500" /> Hasil Tugas Siswa
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        {sub.taskSubmissionType === 'IMAGE' && sub.taskSubmissionContent && (
                            <div className="relative group inline-block">
                                <img 
                                src={sub.taskSubmissionContent} 
                                alt="Tugas Siswa" 
                                className="max-h-64 rounded-lg border shadow-sm cursor-zoom-in hover:opacity-95 transition" 
                                onClick={() => window.open(sub.taskSubmissionContent, '_blank')}
                                />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded">Klik untuk perbesar</span>
                                </div>
                            </div>
                        )}

                        {sub.taskSubmissionType === 'TEXT' && sub.taskSubmissionContent && (
                            <div className="bg-white p-4 rounded border border-gray-200 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed">
                                {sub.taskSubmissionContent}
                            </div>
                        )}

                        {/* Fallback Legacy */}
                        {!sub.taskSubmissionType && sub.taskFileUrl && (
                            <a href={sub.taskFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-sm flex items-center hover:underline">
                            <ExternalLink className="w-4 h-4 mr-2" /> Buka Lampiran Link
                            </a>
                        )}
                    </div>
                  </div>
                )}

                {/* Grading Section */}
                <div className="border-t pt-6 mt-6">
                   {sub.status === 'PENDING' ? (
                       <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                           <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                               <MessageSquare className="w-4 h-4" /> Catatan untuk Siswa (Opsional)
                           </label>
                           <textarea 
                               className="w-full border border-orange-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-senja-primary outline-none mb-4"
                               rows={2}
                               placeholder="Berikan apresiasi atau saran perbaikan..."
                               value={feedbacks[sub.id] || ''}
                               onChange={e => setFeedbacks({...feedbacks, [sub.id]: e.target.value})}
                           />
                           <div className="flex gap-3 justify-end">
                                <button 
                                    onClick={() => handleGrade(sub, 'REJECTED')} 
                                    className="px-4 py-2 text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg font-medium flex items-center gap-2 transition"
                                >
                                    <X className="w-4 h-4" /> Tolak
                                </button>
                                <button 
                                    onClick={() => handleGrade(sub, 'APPROVED')} 
                                    className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200 transition"
                                >
                                    <Check className="w-4 h-4" /> Setujui
                                </button>
                           </div>
                       </div>
                   ) : (
                       <div className="flex flex-col gap-2">
                            <p className="text-sm font-bold text-gray-700">Status Penilaian:</p>
                            <div className={`p-4 rounded-lg border ${sub.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {sub.status === 'APPROVED' ? <Check className="w-5 h-5 text-green-600"/> : <X className="w-5 h-5 text-red-600"/>}
                                    <span className={`font-bold ${sub.status === 'APPROVED' ? 'text-green-800' : 'text-red-800'}`}>
                                        {sub.status === 'APPROVED' ? 'Tugas Disetujui' : 'Tugas Ditolak'}
                                    </span>
                                </div>
                                {sub.teacherFeedback && (
                                    <div className="mt-2 text-sm text-gray-700 border-t border-gray-200/50 pt-2">
                                        <span className="font-semibold mr-1">Catatan Guru:</span>
                                        "{sub.teacherFeedback}"
                                    </div>
                                )}
                                {/* Tombol Ubah Nilai (Optional: Jika guru ingin meralat) */}
                                <div className="mt-3 pt-2 border-t border-gray-200/50 text-right">
                                    <button 
                                        onClick={() => handleGrade(sub, 'PENDING')}
                                        className="text-xs text-gray-400 hover:text-senja-primary underline"
                                    >
                                        Ubah Penilaian
                                    </button>
                                </div>
                            </div>
                       </div>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};