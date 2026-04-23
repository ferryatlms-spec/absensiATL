import React, { useState } from 'react';
import { Logo } from '@absensi/ui';
import { supabase } from '@mboksurip/db';

const Login = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // 1. Menggunakan NIK sebagai input dari pengguna
  const [nik, setNik] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isExactlyEight = password.length === 8;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/g.test(password);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowError(false);

    // 2. LOGIKA EMAIL INTERNAL: Menggabungkan NIK dengan domain buatan
    const internalEmail = `${nik.trim()}@atlms.com`;

      console.log("Mencoba login ke Supabase dengan:", internalEmail, password);

    try {
      // Di dalam handleLogin setelah auth sukses:
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: internalEmail,
      password: password,
      });

      if (authData.user) {
      // CATAT KE AUDIT TRAIL
      await supabase.from('audit_logs').insert([{
      employee_id: authData.user.id,
      event_type: 'LOGIN_SUCCESS',
      details: { 
      browser: navigator.userAgent,
      platform: navigator.platform 
    }
  }]);
}
      if (authError) throw authError;

      // Ambil data profil dari tabel employees berdasarkan ID yang login
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('role, name, outlet_id')
        .eq('id', data.user.id)
        .single();

      if (empError) throw empError;

      // Simpan informasi login
      onLogin(employee.role, employee.name);

    } catch (error) {
      // Menampilkan pesan error yang ramah (tidak menyebutkan email internal)
      setErrorMessage("NIK atau Kata Sandi salah.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-background font-body text-on-surface min-h-screen flex flex-col overflow-x-hidden selection:bg-secondary-container selection:text-on-secondary-container relative">
      
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary-container z-50"></div>
      
      <div className="fixed -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="fixed -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="relative w-full h-[397px] min-h-[300px] overflow-hidden">
        <img 
          alt="Modern Professional Office with Heritage Accents" 
          className="w-full h-full object-cover" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6xBGRMJ0xsyaw4G-GkVoFCtyrkHTfdv5IYOnv8x0nkcYOicBe5Ub3At-ccby67xnNz5qvfIVF33o0RyMVVX2KCruy110cbgDVThXOOrAQsadguywXhtKz0HhqynyGAZczGA70fjJXt9HlqIHuQxN_UHfJ2sfmf4VzmG1mNV45f2HXfu6W7If9gQnnzr_ayBCEIK2Dke0vYJc93ouKVhCOQfmUKNX3xCs-ga1mUyJ7y9vMjR5hbRhSxeF0VOhu7y9pRTMhHWkwqkvc"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-16 h-16 md:w-28 md:h-28 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg border border-white/20 transition-all duration-500">
            <Logo className="w-11 h-11 md:w-[75%] md:h-auto transition-all" />
          </div>
          <h1 className="mt-2 font-headline font-extrabold text-primary text-xl tracking-widest bg-white/60 backdrop-blur px-3 py-1 rounded-full border border-white/40">
            REGISTRY
          </h1>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 -mt-12 relative z-10">
        <div className="w-full max-w-sm bg-surface-container-lowest rounded-3xl p-8 editorial-shadow border border-outline-variant/10 mb-8">
          
          <div className="mb-8 text-center">
            <h2 className="font-headline font-bold text-2xl text-primary tracking-tight mb-1">Selamat Datang Kembali</h2>
            <p className="text-xs text-on-surface-variant font-medium opacity-80 uppercase tracking-wider">Portal Absensi Karyawan</p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            
            <div className="space-y-1.5">
              <label className="block font-label text-[10px] uppercase font-bold tracking-[0.1em] text-on-surface-variant ml-1">
                NIK Karyawan
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                  {/* Ikon diubah menjadi badge/ID Card agar sesuai dengan NIK */}
                  <span className="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <input 
                  className="block w-full pl-11 pr-4 py-3.5 bg-surface-container-low border-none rounded-2xl focus:ring-2 focus:ring-primary/10 focus:bg-surface-container transition-all text-on-surface font-medium placeholder:text-outline/40 text-sm" 
                  placeholder="Misal: 2024001" 
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-variant">
                  <span className={`material-symbols-outlined text-[18px] transition-colors ${isExactlyEight && hasSpecialChar ? 'text-emerald-500' : ''}`}>
                    lock
                  </span>
                </div>
                <input 
                  className={`block w-full pl-11 pr-11 py-3.5 bg-surface-container-low border-none rounded-2xl focus:ring-2 transition-all text-on-surface font-medium placeholder:text-outline/40 text-sm ${
                    password.length > 0 && (!isExactlyEight || !hasSpecialChar) 
                    ? 'focus:ring-error/20 ring-1 ring-error/50' 
                    : 'focus:ring-primary/10'
                  }`} 
                  placeholder="Masukkan kata sandi" 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={8}
                  required
                />
                <button 
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-primary transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {password.length > 0 && (
                <div className="flex gap-4 px-2 pt-1">
                  <div className="flex items-center gap-1">
                    <span className={`material-symbols-outlined text-[14px] ${isExactlyEight ? 'text-emerald-500' : 'text-outline/40'}`}>
                      {isExactlyEight ? 'check_circle' : 'circle'}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tepat 8 Karakter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`material-symbols-outlined text-[14px] ${hasSpecialChar ? 'text-emerald-500' : 'text-outline/40'}`}>
                      {hasSpecialChar ? 'check_circle' : 'circle'}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Unik (@#$)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button 
                className="w-full bg-primary text-white font-headline font-bold py-3.5 rounded-full shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed" 
                type="submit"
                disabled={loading || !isExactlyEight || !hasSpecialChar || nik.length < 3}
              >
                {loading ? 'Memproses...' : 'MASUK'}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

          </form>
        </div>

        <div className="text-center space-y-5 pb-8">
          <p className="text-xs text-on-surface-variant font-medium">
            Karyawan baru?{' '}
            <a 
            className="text-primary font-bold hover:underline decoration-secondary decoration-2 underline-offset-4 ml-1 transition-all" 
            href="https://wa.me/6285732077182?text=Halo%20Tim%20HR,%20saya%20ingin%20bertanya..."
            target="_blank" 
            rel="noopener noreferrer">  
              Hubungi Tim HR
            </a>
          </p>
          <div className="flex items-center justify-center space-x-4 opacity-30 grayscale">
            <span className="h-[1px] w-8 bg-on-surface-variant"></span>
            <span className="font-label text-[9px] uppercase tracking-widest font-bold">Heritage Excellence</span>
            <span className="h-[1px] w-8 bg-on-surface-variant"></span>
          </div>
        </div>
      </main>

      {showError && (
        <div className="fixed inset-x-0 bottom-0 z-[100] flex justify-center items-end px-4 pb-4 pointer-events-none">
          <div className="w-full max-w-md bg-error-container rounded-t-[32px] rounded-b-[24px] p-6 shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 border border-error/5">
            <div className="w-12 h-1.5 bg-on-error-container/20 rounded-full mx-auto mb-6"></div>
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-white/40 rounded-full flex items-center justify-center mb-1">
                <span className="material-symbols-outlined text-error text-3xl font-bold">error</span>
              </div>
              <h3 className="font-headline font-extrabold text-xl text-on-error-container">Login Gagal</h3>
              <p className="text-sm font-medium text-on-error-container/80 max-w-[240px]">
                {errorMessage}
              </p>
              <div className="pt-6 w-full">
                <button 
                  className="w-full bg-primary text-white font-headline font-bold py-4 rounded-2xl shadow-lg active:scale-[0.98] transition-transform text-sm uppercase tracking-wider" 
                  onClick={() => setShowError(false)}
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;