import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@mboksurip/db';

export default function ProfilePage({ userProfile }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.href = '/'; 
    } catch (error) {
      console.error('Error saat logout:', error.message);
    }
  };
  
  // Helper: Hitung Masa Kerja
  const hitungMasaKerja = (tanggalBergabung) => {
    if (!tanggalBergabung) return "-";
    const bergabung = new Date(tanggalBergabung);
    const sekarang = new Date();
    let tahun = sekarang.getFullYear() - bergabung.getFullYear();
    let bulan = sekarang.getMonth() - bergabung.getMonth();
    if (bulan < 0) { tahun--; bulan += 12; }
    return `${tahun} Tahun ${bulan} Bulan`;
  };

  // Helper: Format Tanggal Indonesia
  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    }).format(new Date(dateString));
  };

  const userName = userProfile?.name || "Karyawan";
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=390008&color=fff&bold=true`;
  const finalAvatarUrl = userProfile?.photo_url || userProfile?.avatar_url || defaultAvatar;
  
  // Fungsi pembantu untuk menyensor nomor rekening
const maskBankAccount = (accountNumber) => {
  if (!accountNumber) return "-";
  // Tampilkan hanya 4 digit terakhir, sisanya diganti bintang
  const lastFour = accountNumber.slice(-4);
  const masked = accountNumber.slice(0, -4).replace(/./g, '*');
  return `${masked}${lastFour}`; // Output: **********1234
};

  return (
    <>

      {/* Main Content Canvas */}
      <main className="max-w-4xl mx-auto px-6 pt-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
        {/* Card Identitas Utama */}
        <section className="md:col-span-12 bg-surface-container-lowest rounded-xl p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container opacity-5 rounded-full -mr-20 -mt-20"></div>
          <div className="relative group z-10">
              <div className="w-40 h-40 rounded-full border-4 border-surface-container-high overflow-hidden shadow-sm">
                <img 
                  alt={`Profil ${userName}`} 
                  className="w-full h-full object-cover" 
                  src={finalAvatarUrl} 
                />
              </div>
            </div>
          <div className="text-center md:text-left space-y-2 z-10">
            <span className="font-inter text-[11px] font-bold uppercase tracking-[0.1em] text-secondary">Identitas Utama</span>
            <h2 className="font-headline font-extrabold text-4xl text-primary tracking-tight">{userProfile?.name || "Memuat..."}</h2>
            <div className="flex items-center justify-center md:justify-start gap-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-lg">badge</span>
              <span className="font-inter font-medium tracking-wide">
                {/* Asumsi Anda punya kolom employee_id atau nik */}
                {userProfile?.nik || "KARYAWAN-MBOK"}
              </span>
            </div>
          </div>
        </section>

          {/* Card Posisi (Editorial Grid) */}
          <section className="md:col-span-7 bg-surface-container-low rounded-xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline font-bold text-xl text-primary">Informasi Posisi</h3>
              <span className="material-symbols-outlined text-outline">work_history</span>
            </div>
            <div className="grid grid-cols-2 gap-y-6">
              <div className="space-y-1">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest">Struktural</p>
                <p className="font-headline font-semibold text-on-surface">{userProfile?.struktural || "General Office"}</p>
              </div>
              <div className="space-y-1">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest">Masa Kerja</p>
                <p className="font-headline font-semibold text-on-surface">{hitungMasaKerja(userProfile?.join_date)}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest">Divisi</p>
                <p className="font-headline font-bold text-2xl text-primary-container">{userProfile?.departments?.name}</p>
              </div>
              <div className="col-span-2 space-y-1">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest">Tanggal Bergabung</p>
                <p className="font-inter font-medium text-on-surface-variant italic">{formatTanggal(userProfile?.join_date)}</p>
              </div>
            </div>
          </section>

          {/* Card Kredensial (Technical Focus) */}
          <section className="md:col-span-5 bg-primary rounded-xl p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute bottom-0 right-0 opacity-10">
              <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'wght' 200" }}>nfc</span>
            </div>
            <div className="space-y-1 z-10">
              <p className="font-inter text-[10px] font-bold text-primary-fixed uppercase tracking-widest opacity-70">UID RFID Terdaftar</p>
              <h3 className="font-headline font-black text-3xl tracking-widest">{userProfile?.rfid_uid}</h3>
            </div>
            <div className="mt-8 z-10">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
                <span className="font-inter text-xs font-semibold uppercase tracking-tighter">Status: Aktif</span>
              </div>
            </div>
          </section>

          {/* Card Finansial & Kontak (Data List) */}
          <section className="md:col-span-12 bg-white rounded-xl p-8 border border-outline-variant/20 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <h3 className="font-headline font-bold text-xl text-primary">Finansial & Kontak</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-colors duration-300">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Bank Payroll</p>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">account_balance</span>
                  <span className="font-headline font-bold text-lg">{userProfile?.bank}</span>
                </div>
              </div>
              <div className="p-6 bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-colors duration-300">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Nomor Rekening</p>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">payments</span>
                  <span className="font-inter font-semibold text-lg tracking-wider">{maskBankAccount(userProfile.no_rek)}</span>
                </div>
              </div>
              <div className="p-6 bg-surface-container-lowest rounded-lg hover:bg-surface-container transition-colors duration-300">
                <p className="font-inter text-[10px] font-bold text-outline uppercase tracking-widest mb-3">Nomor Ponsel</p>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-secondary">smartphone</span>
                  <span className="font-inter font-semibold text-lg">{userProfile?.phone}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Actions */}
          <section className="md:col-span-12 py-4">
            <div className="grid grid-cols-1 gap-3 mb-4">
              <button 
                onClick={() => navigate('/gantipass')}
                className="w-full py-4 rounded-full bg-surface-container-high text-primary font-headline font-bold text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-300 hover:bg-surface-container-highest active:scale-[0.98] border border-outline-variant/30">
                <span className="material-symbols-outlined">lock_reset</span>
                Ganti Kata Sandi
              </button>
              <button 
                onClick={() => navigate('/pengajuan-resign')}
                className="w-full py-4 rounded-full bg-surface-container-low text-on-surface-variant font-headline font-semibold text-base tracking-wide flex items-center justify-center gap-3 transition-all duration-300 hover:bg-surface-container-high active:scale-[0.98] border border-transparent">
                <span className="material-symbols-outlined">person_off</span>
                Pengajuan Resign
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full py-5 rounded-full bg-gradient-to-r from-primary to-primary-container text-white font-headline font-bold text-lg tracking-wide flex items-center justify-center gap-3 transition-transform duration-300 active:scale-95 shadow-xl shadow-primary/10">
              <span className="material-symbols-outlined">logout</span>
              Keluar
            </button>
          </section>
        </div>
      </main>
    </>
  );
}