import React, { useState, useEffect } from 'react';
import { getCertBg, setCertBg as saveCertBg } from '../services/firebase';
import { Save, Upload, Image as ImageIcon, CheckCircle, AlertCircle, Trash2, Loader2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const [bgUrl, setBgUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
      try {
        const current = await getCertBg();
        setBgUrl(current);
        setPreview(current);
      } catch (e) {
        console.error("Gagal memuat pengaturan:", e);
      }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNotification(null);
    const file = e.target.files?.[0];
    if (file) {
      // Limit reduced to 500KB to fit Firestore 1MB Document Limit (Base64 adds ~33% overhead)
      if (file.size > 500000) { 
        setNotification({ type: 'error', message: "Ukuran file terlalu besar (Max 500KB). Mohon kompres gambar atau pilih yang lebih kecil." });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBgUrl(result);
        setPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setNotification(null);
    try {
      await saveCertBg(bgUrl);
      setNotification({ type: 'success', message: "Pengaturan background sertifikat berhasil disimpan!" });
      setTimeout(() => setNotification(null), 3000);
    } catch (e: any) {
      console.error("Firestore Error:", e);
      // Show more specific error if possible
      const errorMsg = e.code === 'resource-exhausted' 
        ? "Ukuran data melebihi batas database. Gunakan gambar lebih kecil." 
        : "Gagal menyimpan. Pastikan koneksi lancar.";
      
      setNotification({ type: 'error', message: errorMsg });
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setBgUrl('');
    setPreview('');
    setIsLoading(true);
    try {
        await saveCertBg('');
        setNotification({ type: 'success', message: "Background berhasil dihapus, kembali ke default." });
        setTimeout(() => setNotification(null), 3000);
    } catch(e) {
        console.error(e);
        setNotification({ type: 'error', message: "Gagal me-reset background." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Pengaturan</h2>
      
      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-senja-primary" />
          Background Sertifikat
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Upload Gambar Background</label>
              <div className="flex items-center gap-2">
                 <label className="flex-1 cursor-pointer bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-100 transition relative overflow-hidden group">
                    <span className="text-sm text-gray-600 flex flex-col items-center group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8 mb-2 text-senja-primary/60" />
                      <span className="font-medium text-gray-700">Klik untuk pilih file</span>
                      <span className="text-xs text-gray-400 mt-1">Format: JPG, PNG (Max 500KB)</span>
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                 </label>
              </div>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase">Atau</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL Gambar</label>
              <input 
                type="text" 
                className="w-full border p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-senja-primary outline-none" 
                placeholder="https://example.com/background.jpg"
                value={bgUrl.startsWith('data:') ? '' : bgUrl}
                onChange={(e) => {
                  setBgUrl(e.target.value);
                  setPreview(e.target.value);
                }}
              />
              <p className="text-xs text-gray-400 mt-1">Tempel link gambar langsung dari internet jika tidak upload.</p>
            </div>

            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-senja-primary text-white px-6 py-3 rounded-lg font-bold hover:bg-orange-600 flex items-center justify-center gap-2 shadow-lg shadow-orange-200 transition-all hover:shadow-orange-300"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4" />} Simpan
              </button>
              {preview && (
                 <button 
                 onClick={handleReset}
                 disabled={isLoading}
                 className="px-4 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 flex items-center justify-center"
                 title="Hapus Background"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
              )}
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-2">Preview Tampilan</label>
             <div className="aspect-[1.414/1] bg-gray-100 rounded-lg overflow-hidden relative shadow-lg border border-gray-200 group">
                {preview ? (
                  <img src={preview} alt="Certificate Background" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm bg-gray-50">
                    <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                    Belum ada background dipilih
                  </div>
                )}
                
                {/* Overlay Simulation for Certificate */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 bg-white/40 backdrop-blur-[1px]">
                   <div className="border-4 border-double border-gray-800/20 w-full h-full flex flex-col items-center justify-center p-2">
                       <h4 className="text-xl font-serif font-bold text-gray-800 tracking-wider">SERTIFIKAT</h4>
                       <p className="text-[10px] font-serif italic text-gray-700">Certificate of Achievement</p>
                       
                       <div className="my-2 w-8 h-0.5 bg-gray-800/50"></div>
                       
                       <p className="text-[10px] text-gray-800">Diberikan kepada:</p>
                       <p className="text-lg font-bold text-senja-dark my-1 font-serif">Nama Siswa</p>
                       
                       <p className="text-[9px] text-gray-700 mt-1">Telah menyelesaikan bacaan:</p>
                       <p className="text-[10px] font-bold text-senja-primary italic">"Judul Buku/Materi Disini"</p>

                       <div className="mt-4 flex justify-between w-full px-8 items-end">
                          <div className="flex flex-col items-center">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=WaliKelasPreview`} 
                                alt="QR" 
                                className="w-8 h-8 opacity-80 mix-blend-multiply" 
                              />
                              <p className="text-[8px] font-bold border-t border-gray-400 mt-1 w-auto min-w-[50px] pt-0.5">Nama Wali Kelas</p>
                              <p className="text-[6px] text-gray-500">Wali Kelas</p>
                          </div>
                          <div className="text-center">
                              <p className="text-[8px] font-bold border-b border-gray-400 pb-0.5 mb-0.5">{new Date().toLocaleDateString('id-ID')}</p>
                              <p className="text-[8px] text-gray-500">Tanggal</p>
                          </div>
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};