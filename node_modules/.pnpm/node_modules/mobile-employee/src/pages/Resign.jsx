import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Resign() {
  const navigate = useNavigate();
  // State untuk melacak pilihan radio button. Default: 'proceed' (Lanjut)
  const [resignIntent, setResignIntent] = useState('proceed');

  // Fungsi saat tombol Lanjut ditekan
  const handleNextStep = () => {
    if (resignIntent === 'proceed') {
      // Logika jika memilih lanjut resign
      alert('Mengalihkan ke form pengisian alasan resign...');
      // navigate('/form-resign-detail'); 
    } else {
      // Logika jika mengurungkan niat
      navigate('/profil'); 
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-12 pb-32">
      {/* Editorial Header Section */}
      <section className="mb-12">
        <span className="font-label uppercase tracking-widest text-xs text-on-surface-variant opacity-70">
          Administrative Module
        </span>
        <h2 className="font-headline font-extrabold text-5xl text-primary mt-2 mb-4">
          Pengajuan Resign (Belum Aktif)
        </h2>
        <div className="h-1 w-24 bg-secondary-container rounded-full"></div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        
        {/* Ketentuan Resign Card (Editorial Style) */}
        <div className="md:col-span-12 lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                gavel
              </span>
              <h3 className="font-headline font-bold text-2xl text-on-surface">Ketentuan Resign</h3>
            </div>
            
            <div className="space-y-6 text-on-surface-variant leading-relaxed">
              <p className="font-medium text-lg text-primary/80">
                Mohon perhatikan butir-butir kebijakan perusahaan di bawah ini sebelum melanjutkan proses pengunduran diri:
              </p>
              <ul className="space-y-4">
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">01</span>
                  <span>Pemberitahuan resmi wajib dilakukan minimal <strong>30 hari (One-Month Notice)</strong> sebelum tanggal efektif pengunduran diri.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">02</span>
                  <span>Wajib menyelesaikan seluruh tanggung jawab pekerjaan dan melakukan <strong>Handover of Assets</strong> (Laptop, ID Card, dan inventaris lainnya) kepada Departemen IT & GA.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">03</span>
                  <span>Penyelesaian administrasi gaji dan sisa cuti (jika ada) akan diproses pada periode penggajian bulan terakhir setelah surat Clearance disetujui.</span>
                </li>
                <li className="flex gap-4 items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">04</span>
                  <span>Karyawan tetap terikat pada perjanjian kerahasiaan data perusahaan (Non-Disclosure Agreement) pasca masa kerja berakhir.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pernyataan Persetujuan & Actions */}
        <div className="md:col-span-12 lg:col-span-4 space-y-6">
          
          {/* Status Card */}
          <div className="bg-primary-container text-on-primary-container p-6 rounded-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-xs font-label uppercase tracking-widest opacity-80 mb-1">Status Kepegawaian</p>
              <h4 className="font-headline font-bold text-xl text-white">Active Member</h4>
              <p className="text-sm mt-4 text-white/70 italic">"Melangkah dengan integritas, mengakhiri dengan profesionalisme."</p>
            </div>
            <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-9xl opacity-10 group-hover:rotate-12 transition-transform duration-500">
              verified_user
            </span>
          </div>

          {/* Interactive Form Card */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/20">
            <h3 className="font-headline font-bold text-lg text-on-surface mb-6">Pernyataan Persetujuan</h3>
            
            <div className="space-y-4">
              {/* Option 1: Lanjut Resign */}
              <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest hover:bg-white transition-all cursor-pointer group border border-transparent hover:border-secondary-container/30">
                <div className="mt-1">
                  <input 
                    type="radio" 
                    name="resign_option" 
                    value="proceed"
                    checked={resignIntent === 'proceed'}
                    onChange={(e) => setResignIntent(e.target.value)}
                    className="w-5 h-5 text-secondary border-outline-variant focus:ring-secondary-container bg-surface" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-sm text-on-surface leading-tight">Iya, saya memahami ketentuan tersebut</span>
                  <div className="flex items-center gap-1.5 text-secondary text-xs font-bold uppercase tracking-wider group-hover:text-secondary-container transition-colors">
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span>Unduh Ketentuan Resign</span>
                  </div>
                </div>
              </label>

              {/* Option 2: Batal Resign */}
              <label className="flex items-start gap-3 p-4 rounded-lg bg-surface-container-lowest hover:bg-white transition-all cursor-pointer border border-transparent hover:border-primary/10">
                <div className="mt-1">
                  <input 
                    type="radio" 
                    name="resign_option" 
                    value="cancel"
                    checked={resignIntent === 'cancel'}
                    onChange={(e) => setResignIntent(e.target.value)}
                    className="w-5 h-5 text-secondary border-outline-variant focus:ring-secondary-container bg-surface" 
                  />
                </div>
                <span className="font-medium text-sm text-on-surface leading-tight">Saya mengurungkan niat untuk resign</span>
              </label>
            </div>

            {/* Dynamic Submit Button */}
            <div className="mt-8">
              <button 
                onClick={handleNextStep}
                className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{resignIntent === 'proceed' ? 'Lanjut' : 'Kembali ke Profil'}</span>
                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
                  {resignIntent === 'proceed' ? 'chevron_right' : 'undo'}
                </span>
              </button>
              <p className="text-[10px] text-center mt-4 text-on-surface-variant font-label uppercase tracking-widest opacity-60">
                Tindakan ini memerlukan verifikasi HR
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Asymmetric Background Decorative Element */}
      <div className="fixed -bottom-24 -left-24 w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px] pointer-events-none"></div>
    </main>
  );
}