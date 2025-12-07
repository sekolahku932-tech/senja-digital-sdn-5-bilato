import React, { useState, useEffect } from 'react';
import { User, Material, Submission } from '../types';
import { getMaterials, getSubmissions, saveSubmission, getCertBackground } from '../services/storageService';
import { BookOpen, CheckCircle, Upload, ArrowLeft, Award, Loader, Video, FileText, ExternalLink } from 'lucide-react';

interface Props { user: User; }

const StudentReading: React.FC<Props> = ({ user }) => {
  const [view, setView] = useState<'list' | 'detail' | 'cert'>('list');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  // State khusus untuk loading sertifikat (karena mengambil gambar background butuh waktu)
  const [generatingCert, setGeneratingCert] = useState(false);
  
  const [materials, setMaterials] = useState<Material[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  
  // Form State
  const [answers, setAnswers] = useState<{[key:string]: string}>({});
  const [taskFile, setTaskFile] = useState(''); // Simulated file url

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allMats, allSubs] = await Promise.all([getMaterials(), getSubmissions()]);
    // Force string conversion for safe comparison
    setMaterials(allMats.filter(m => String(m.classGrade) === String(user.classGrade)));
    setMySubmissions(allSubs.filter(s => String(s.studentNisn) === String(user.username)));
    setLoading(false);
  };

  const handleRead = (m: Material) => {
    setSelectedMaterial(m);
    // Force string comparison
    const existing = mySubmissions.find(s => String(s.materialId) === String(m.id));
    setSubmission(existing || null);
    if(existing) {
        // Pre-fill
        const ansMap: any = {};
        (existing.answers || []).forEach(a => ansMap[a.questionId] = a.answer);
        // Pre-fill task text
        if (existing.taskText) ansMap['task_text'] = existing.taskText;
        setAnswers(ansMap);
        setTaskFile(existing.taskFileUrl || '');
    } else {
        setAnswers({});
        setTaskFile('');
    }
    setView('detail');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMaterial) return;

      setProcessing(true);
      const newSub: Submission = {
          id: submission?.id || Date.now().toString(),
          materialId: selectedMaterial.id,
          studentNisn: user.username,
          studentName: user.name,
          classGrade: user.classGrade!,
          answers: (selectedMaterial.questions || []).map(q => ({ questionId: q.id, answer: answers[q.id] || '' })),
          taskText: answers['task_text'] || '',
          taskFileUrl: taskFile,
          isApproved: false, // Must wait for teacher approval
          submittedAt: new Date().toISOString()
      };
      
      await saveSubmission(newSub);
      setSubmission(newSub);
      setMySubmissions(prev => {
          const idx = prev.findIndex(p => p.id === newSub.id);
          if (idx >= 0) { const copy = [...prev]; copy[idx] = newSub; return copy; }
          return [...prev, newSub];
      });
      
      setProcessing(false);
      setShowSuccess(true);
      
      // Auto close success after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setView('list');
      }, 3000);
  };

  // Helper to convert Google Drive links to Embed format
  const getEmbedUrl = (url: string) => {
      if (!url) return '';
      if (url.includes('drive.google.com') && url.includes('/view')) {
          return url.replace(/\/view.*/, '/preview');
      }
      return url;
  };

  const downloadCert = async (sub: Submission, materialTitle: string) => {
    setGeneratingCert(true);
    try {
        // Ambil background dari settings (Google Sheet)
        const bg = await getCertBackground();
        
        const w = 800;
        const h = 600;
        
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setGeneratingCert(false);
            return;
        }

        const drawText = () => {
            // Shadow text agar terbaca di background apapun
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.shadowBlur = 4;
            
            ctx.textAlign = 'center';
            
            // Judul Sertifikat
            ctx.font = 'bold 44px Arial';
            ctx.fillStyle = '#1e1b4b'; // Midnight Blue
            ctx.fillText('SERTIFIKAT LITERASI', w/2, 200);
            
            ctx.font = '24px Arial';
            ctx.fillStyle = '#333';
            ctx.fillText('Diberikan kepada:', w/2, 260);
            
            // Nama Siswa (Besar & Kontras)
            ctx.font = 'bold 48px Arial';
            ctx.fillStyle = '#ea580c'; // Senja Orange
            ctx.shadowColor = "rgba(0, 0, 0, 0.2)"; // Shadow gelap untuk nama
            ctx.fillText(user.name, w/2, 330);
            
            // Reset Shadow
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";

            ctx.fillStyle = '#1e1b4b';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(`Telah menyelesaikan bacaan:`, w/2, 390);
            
            ctx.font = '24px Arial';
            ctx.fillText(`"${materialTitle}"`, w/2, 425);

            ctx.font = 'italic 18px Arial';
            ctx.fillStyle = '#555';
            ctx.fillText(`Pada tanggal: ${new Date(sub.submittedAt).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, w/2, 500);
            
            // Download Image
            const link = document.createElement('a');
            link.download = `Sertifikat-${user.name.replace(/\s+/g, '-')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            setGeneratingCert(false);
        };

        if (bg) {
            const img = new Image();
            img.crossOrigin = "anonymous"; 
            img.src = bg;
            img.onload = () => {
                // Gambar background memenuhi canvas
                ctx.drawImage(img, 0, 0, w, h);
                drawText();
            };
            img.onerror = () => {
                 // Fallback jika gambar rusak
                 console.warn("Gagal memuat background custom, menggunakan default.");
                 drawDefaultBg(ctx, w, h);
                 drawText();
            }
        } else {
            // Gunakan Default jika tidak ada background custom
            drawDefaultBg(ctx, w, h);
            drawText();
        }
    } catch (e) {
        console.error(e);
        setGeneratingCert(false);
        alert("Gagal membuat sertifikat.");
    }
  };

  const drawDefaultBg = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    // Background Cream
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(0,0,w,h);
    
    // Border Ornamen
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 15;
    ctx.strokeRect(20,20,w-40,h-40);
    
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2;
    ctx.strokeRect(35,35,w-70,h-70);
  };

  if (loading) return <div className="p-10 text-center text-gray-500"><Loader className="animate-spin inline mr-2"/> Memuat bacaan...</div>;

  if (view === 'list') {
      return (
          <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Bacaan Saya (Kelas {user.classGrade})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {materials.map(m => {
                      // Force string compare
                      const sub = mySubmissions.find(s => String(s.materialId) === String(m.id));
                      return (
                        <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition">
                            <div className="h-32 bg-senja-100 flex items-center justify-center">
                                {m.mediaType === 'image' && m.mediaUrl ? (
                                    <img src={m.mediaUrl} className="w-full h-full object-cover" alt="Cover" />
                                ) : (
                                    <BookOpen className="text-senja-400 w-12 h-12" />
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-lg">{m.title}</h3>
                                {sub ? (
                                    <div className="mt-3 flex items-center gap-2 text-sm">
                                        {sub.isApproved ? (
                                            <span className="text-green-600 flex items-center gap-1 font-bold"><Award size={16}/> Lulus</span>
                                        ) : (
                                            <span className="text-yellow-600 flex items-center gap-1">Menunggu Dinilai</span>
                                        )}
                                        {sub.isApproved && (
                                            <button 
                                                onClick={() => downloadCert(sub, m.title)} 
                                                disabled={generatingCert}
                                                className="text-blue-600 underline text-xs ml-auto flex items-center gap-1"
                                            >
                                                {generatingCert ? 'Memuat...' : 'Unduh Sertifikat'}
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <span className="mt-3 inline-block text-xs bg-gray-200 px-2 py-1 rounded">Belum Dibaca</span>
                                )}
                            </div>
                            <div className="p-4 border-t bg-gray-50">
                                <button onClick={() => handleRead(m)} className="w-full bg-senja-600 text-white py-2 rounded font-medium hover:bg-senja-700">
                                    {sub ? 'Lihat Jawaban' : 'Baca & Kerjakan'}
                                </button>
                            </div>
                        </div>
                      );
                  })}
                  {materials.length === 0 && <p className="text-gray-500 col-span-3 text-center">Belum ada bahan bacaan untuk kelasmu.</p>}
              </div>
          </div>
      );
  }

  return (
      <div className="max-w-4xl mx-auto space-y-6 relative">
          <button onClick={() => setView('list')} className="flex items-center gap-2 text-gray-500 hover:text-senja-600">
              <ArrowLeft size={20} /> Kembali ke Daftar
          </button>
          
          {showSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative flex items-center gap-2 animate-bounce">
                  <CheckCircle size={24} />
                  <div>
                      <strong className="font-bold">Berhasil! </strong>
                      <span className="block sm:inline">Jawabanmu sudah terkirim ke Bapak/Ibu Guru.</span>
                  </div>
              </div>
          )}

          {selectedMaterial && (
              <div className="bg-white rounded-xl shadow p-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">{selectedMaterial.title}</h1>
                  
                  {/* MEDIA VIEWER AREA (REPLACING TEXT CONTENT) */}
                  <div className="w-full mb-8 bg-gray-50 border rounded-xl overflow-hidden min-h-[300px] flex items-center justify-center relative bg-slate-100">
                        {selectedMaterial.mediaType === 'image' && selectedMaterial.mediaUrl && (
                            <img src={selectedMaterial.mediaUrl} className="max-w-full h-auto" alt="Materi" />
                        )}

                        {selectedMaterial.mediaType === 'pdf' && selectedMaterial.mediaUrl && (
                            <iframe 
                                src={getEmbedUrl(selectedMaterial.mediaUrl)} 
                                className="w-full h-[800px]" 
                                title="Dokumen PDF"
                            />
                        )}

                        {selectedMaterial.mediaType === 'video' && selectedMaterial.mediaUrl && (
                            <div className="w-full aspect-video">
                                 {/* Simple Embed Logic for Youtube */}
                                 {selectedMaterial.mediaUrl.includes('youtu') ? (
                                    <iframe 
                                        width="100%" 
                                        height="100%" 
                                        src={selectedMaterial.mediaUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                                        title="Video Materi"
                                        allowFullScreen
                                        className="w-full h-full"
                                    />
                                 ) : (
                                    <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                                         <p className="mb-4 text-gray-600">Video eksternal.</p>
                                         <a href={selectedMaterial.mediaUrl} target="_blank" rel="noreferrer" className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                                             <Video /> Tonton Video
                                         </a>
                                    </div>
                                 )}
                            </div>
                        )}

                        {(selectedMaterial.mediaType === 'none' || !selectedMaterial.mediaUrl) && (
                            <div className="flex flex-col items-center justify-center p-10 text-gray-400">
                                <FileText size={48} className="mb-2 opacity-50"/>
                                <p className="italic">Tidak ada lampiran media/file untuk materi ini.</p>
                            </div>
                        )}
                  </div>

                  {/* MODIFIED: Link Button Section */}
                  {selectedMaterial.mediaUrl && selectedMaterial.mediaType !== 'none' && (
                      <div className="mb-8 bg-orange-50 border-2 border-orange-200 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-center">
                          <div>
                              <h4 className="font-bold text-gray-800 text-lg">Materi Pembelajaran</h4>
                              <p className="text-gray-600">Jika dokumen di atas tidak muncul (Butuh Izin Akses), klik tombol di bawah ini.</p>
                          </div>
                          <a 
                            href={selectedMaterial.mediaUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-3 bg-senja-600 text-white px-10 py-4 rounded-full font-extrabold text-xl hover:bg-senja-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 animate-pulse"
                          >
                              <BookOpen size={24} /> BACA SEKARANG
                          </a>
                      </div>
                  )}

                  <hr className="my-8 border-gray-200" />

                  {/* Reflection & Task Form */}
                  <form onSubmit={handleSubmit}>
                      <div className="space-y-6">
                          <div>
                              <h3 className="text-xl font-bold text-senja-700 mb-4 flex items-center gap-2">
                                  <CheckCircle size={24}/> Refleksi
                              </h3>
                              <div className="space-y-4">
                                  {(selectedMaterial.questions || []).map((q, idx) => (
                                      <div key={q.id}>
                                          <label className="block font-medium mb-2">{idx+1}. {q.text}</label>
                                          <textarea 
                                            required 
                                            readOnly={!!submission}
                                            className="w-full border p-3 rounded focus:ring-2 focus:ring-senja-500"
                                            rows={3}
                                            value={answers[q.id] || ''}
                                            onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                                            placeholder="Jawabanmu..."
                                          />
                                      </div>
                                  ))}
                                  {(selectedMaterial.questions || []).length === 0 && <p className="text-gray-500 italic">Tidak ada pertanyaan refleksi.</p>}
                              </div>
                          </div>

                          {(selectedMaterial.tasks || []).length > 0 && (
                              <div>
                                  <h3 className="text-xl font-bold text-senja-700 mb-4 flex items-center gap-2">
                                      <Upload size={24}/> Tugas
                                  </h3>
                                  <div className="bg-blue-50 p-4 rounded-lg">
                                      {selectedMaterial.tasks.map((t, i) => (
                                          <p key={t.id} className="mb-2 font-medium">{i+1}. {t.description}</p>
                                      ))}
                                      
                                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                          <div>
                                              <label className="block text-sm mb-1 font-bold">Pilihan 1: Ketik Jawaban</label>
                                              <textarea 
                                                readOnly={!!submission}
                                                value={answers['task_text'] || ''} 
                                                onChange={e => setAnswers({...answers, 'task_text': e.target.value})}
                                                placeholder="Ketik jawaban tugas di sini..."
                                                className="w-full border p-2 rounded h-32"
                                              />
                                          </div>
                                          <div>
                                              <label className="block text-sm mb-1 font-bold">Pilihan 2: Upload File / Foto</label>
                                              {!submission && (
                                                <input 
                                                    type="file"
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if(file) {
                                                            if(file.size > 2 * 1024 * 1024) {
                                                                alert("File terlalu besar (Max 2MB)");
                                                                return;
                                                            }
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setTaskFile(reader.result as string);
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 mb-2"
                                                />
                                              )}
                                              {taskFile && taskFile.startsWith('data:') && (
                                                  <p className="text-xs text-green-600 mb-2">File siap dikirim.</p>
                                              )}
                                              {submission?.taskFileUrl && (
                                                  <a href={submission.taskFileUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline text-sm">Lihat File yang Dikirim</a>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                          
                          {submission?.teacherNotes && (
                              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                                  <h4 className="font-bold text-yellow-800">Catatan Guru:</h4>
                                  <p className="text-yellow-900">{submission.teacherNotes}</p>
                              </div>
                          )}

                          {!submission && (
                            <button type="submit" disabled={processing || showSuccess} className="w-full bg-senja-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-senja-700 transition flex items-center justify-center gap-2">
                                {processing ? <Loader className="animate-spin" size={24}/> : 'Kirim Jawaban'}
                            </button>
                          )}
                          
                          {submission && !submission.isApproved && (
                              <div className="text-center p-4 bg-gray-100 rounded text-gray-600 border border-gray-300">
                                  <p className="font-bold">Jawaban sudah dikirim.</p>
                                  <p className="text-sm">Menunggu pemeriksaan dan persetujuan Guru untuk mendapatkan sertifikat.</p>
                              </div>
                          )}
                          
                          {submission?.isApproved && (
                              <button 
                                type="button" 
                                onClick={() => downloadCert(submission, selectedMaterial.title)} 
                                disabled={generatingCert}
                                className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 transition flex justify-center items-center gap-2 animate-pulse"
                              >
                                  {generatingCert ? <Loader className="animate-spin" size={24}/> : <Award size={24}/>}
                                  {generatingCert ? 'Sedang Membuat Sertifikat...' : 'Unduh Sertifikat'}
                              </button>
                          )}
                      </div>
                  </form>
              </div>
          )}
      </div>
  );
};

export default StudentReading;