import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@mboksurip/db';

const Gantipass = ({ isForced }) => {
  const navigate = useNavigate();
  
  // State visibilitas & input
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    checkLastChange();
  }, []);

  const checkLastChange = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('employees')
      .select('last_password_change')
      .eq('id', user.id)
      .single();

    if (data?.last_password_change) {
      const lastDate = new Date(data.last_password_change);
      const today = new Date();
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        setDaysRemaining(30 - diffDays);
      }
    }
  };

  const isExactlyEight = newPassword.length === 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g.test(newPassword);
  const isMatch = newPassword === confirmPassword && newPassword.length === 8;

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    // 1. Peringatan jika fitur terkunci (30 hari)
    if (daysRemaining > 0) {
      setMessage({ type: 'error', text: `Anda baru saja mengganti sandi. Tunggu ${daysRemaining} hari lagi.` });
      return;
    }

    // 2. Peringatan jika sandi baru sama dengan sandi lama
    if (newPassword === oldPassword) {
      setMessage({ type: 'error', text: 'Kata sandi baru tidak boleh sama dengan kata sandi lama!' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const { data: { user } } = await supabase.auth.getUser();

    // 1. Update sandi di Auth
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (authError) throw authError;

    // 2. Update database: matikan flag 'must_change_password' 
    // dan catat tanggal ganti sandi
    const { error: dbError } = await supabase
      .from('employees')
      .update({ 
        must_change_password: false,
        last_password_change: new Date().toISOString() 
      })
      .eq('id', user.id);
    
    if (dbError) throw dbError;

    // 3. Tampilkan sukses
    setShowSuccessPopup(true);

    // 4. Paksa muat ulang halaman agar App.jsx menyadari status baru
    setTimeout(() => {
      window.location.href = '/dashboard'; 
    }, 3000);

  } catch (error) {
    setMessage({ type: 'error', text: 'Gagal memperbarui data. Coba lagi.' });
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="pt-12 pb-32 px-6 max-w-2xl mx-auto relative">
      
      {!isForced && (
        <button onClick={() => navigate(-1)} className="...">
          <span className="material-symbols-outlined">arrow_back</span>
          <span>Kembali</span>
        </button>
      )}
      
      {/* Pesan khusus untuk karyawan baru */}
      {isForced && (
        <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl">
          <p className="text-xs font-bold text-primary uppercase tracking-widest">Sandi Sementara Terdeteksi</p>
          <p className="text-xs text-on-surface-variant mt-1">Demi keamanan, Anda wajib membuat kata sandi baru yang unik sebelum dapat menggunakan aplikasi.</p>
        </div>
      )}

      {/* Pop-up Sukses */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-10 shadow-2xl border border-primary/10 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-emerald-600 text-4xl font-bold">done_all</span>
            </div>
            <h3 className="font-headline text-2xl font-bold text-primary mb-2">Berhasil!</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Kata sandi berhasil diganti! Anda akan diarahkan kembali ke profil.
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="mb-10 relative overflow-hidden rounded-3xl bg-surface-container-low p-8 shadow-lg border border-outline-variant/20">
        <div className="relative z-10">
          <span className="font-label text-[11px] font-bold uppercase tracking-[0.2em] text-secondary mb-2 block">KEAMANAN AKUN</span>
          <h2 className="font-headline text-3xl font-extrabold text-primary leading-tight">Perbarui Kata Sandi</h2>
        </div>
        <div className="absolute right-6 bottom-6 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">lock_reset</span>
        </div>
      </div>

      {/* Peringatan Pesan (Error/Warning) */}
      {(message.text || daysRemaining > 0) && (
        <div className={`mb-8 p-5 rounded-2xl flex gap-4 items-start border ${
          daysRemaining > 0 || message.type === 'error' ? 'bg-error-container/20 border-error/20 text-on-error-container' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <span className="material-symbols-outlined">{daysRemaining > 0 ? 'history_toggle_off' : 'report'}</span>
          <div>
            <p className="text-sm font-bold">
              {daysRemaining > 0 ? 'Fitur Masih Terkunci' : 'Perhatian'}
            </p>
            <p className="text-xs leading-relaxed opacity-90">
              {daysRemaining > 0 
                ? `Anda hanya bisa mengganti sandi sekali dalam 30 hari. Coba lagi dalam ${daysRemaining} hari.` 
                : message.text}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleUpdatePassword} className={`space-y-6 ${daysRemaining > 0 ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="space-y-5">
          {/* Kata Sandi Lama */}
          <div className="flex flex-col gap-2">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Sandi Lama</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined">lock_open</span>
              </div>
              <input 
                className="w-full pl-12 pr-12 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/20"
                type={showOldPassword ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value.slice(0, 8))}
                placeholder="Sandi saat ini"
                required
              />
              <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute inset-y-0 right-0 pr-4">
                <span className="material-symbols-outlined text-outline">{showOldPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-outline-variant/30 my-2"></div>

          {/* Kata Sandi Baru */}
          <div className="flex flex-col gap-2">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Sandi Baru</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <span className={`material-symbols-outlined ${isExactlyEight && hasSpecialChar ? 'text-emerald-500' : ''}`}>key</span>
              </div>
              <input 
                className={`w-full pl-12 pr-12 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 ${
                  newPassword === oldPassword && newPassword.length > 0 ? 'ring-2 ring-error/50 bg-error-container/5' : 'focus:ring-primary/20'
                }`}
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value.slice(0, 8))}
                placeholder="Maks. 8 Karakter"
                required
              />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute inset-y-0 right-0 pr-4">
                <span className="material-symbols-outlined text-outline">{showNewPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            
            <div className="flex gap-4 px-2 pt-1">
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined text-[14px] ${isExactlyEight ? 'text-emerald-500' : 'text-outline/40'}`}>check_circle</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pas 8 Karakter</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`material-symbols-outlined text-[14px] ${hasSpecialChar ? 'text-emerald-500' : 'text-outline/40'}`}>check_circle</span>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Simbol (@#$)</span>
              </div>
            </div>
          </div>

          {/* Konfirmasi Sandi */}
          <div className="flex flex-col gap-2">
            <label className="font-label text-xs font-bold text-on-surface-variant uppercase tracking-widest ml-1">Konfirmasi Sandi Baru</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                <span className={`material-symbols-outlined ${isMatch ? 'text-emerald-500' : ''}`}>verified_user</span>
              </div>
              <input 
                className="w-full pl-12 pr-12 py-4 bg-surface-container-highest border-none rounded-2xl focus:ring-2 focus:ring-primary/20"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value.slice(0, 8))}
                placeholder="Ulangi sandi baru"
                required
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4">
                <span className="material-symbols-outlined text-outline">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || !isMatch || !hasSpecialChar || daysRemaining > 0 || newPassword === oldPassword}
          className="w-full py-4 bg-primary text-white font-headline font-bold rounded-full shadow-lg shadow-primary/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          {loading ? 'Menyimpan...' : 'SIMPAN PERUBAHAN'}
          <span className="material-symbols-outlined">done_all</span>
        </button>
      </form>
    </main>
  );
};

export default Gantipass;