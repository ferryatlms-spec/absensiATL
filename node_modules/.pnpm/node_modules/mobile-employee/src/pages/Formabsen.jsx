import React, { useState } from 'react';
import { supabase } from '@mboksurip/db'; 

const Formabsen = ({ userProfile }) => {
  const [isOff, setIsOff] = useState(false); 
  const [isLoading, setIsLoading] = useState(false); 
  
  const [popup, setPopup] = useState({ isOpen: false, type: '' }); 
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; 
  
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 15); 
  const minDateStr = pastDate.toISOString().split('T')[0]; 

  const [formData, setFormData] = useState({
    tanggal: todayStr, 
    jamMasuk: "08:00",
    jamPulang: "16:00",
    istirahatMulai: "",
    istirahatSelesai: "",
    agenda: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    if (!formData.tanggal) {
      alert("Error: Tanggal harus diisi.");
      return;
    }

    const selectedDate = new Date(formData.tanggal);
    const minDate = new Date(minDateStr);
    const maxDate = new Date(todayStr);

    if (selectedDate < minDate || selectedDate > maxDate) {
      alert("Pilihan tanggal tidak valid. Hanya bisa memilih hari ini hingga 15 hari ke belakang.");
      return;
    }

    if (!userProfile?.id || !userProfile?.department_id) {
      alert("Error: Data Karyawan atau Departemen tidak lengkap. Silakan login ulang.");
      return;
    }

    setIsLoading(true); 

    try {
      const { data: existingData, error: checkError } = await supabase
        .from('absen') 
        .select('id')
        .eq('employee_id', userProfile.id) 
        .eq('date', formData.tanggal) 
        .maybeSingle(); 

      if (checkError) throw checkError;

      if (existingData) {
        alert(`Anda sudah mengirimkan laporan absen untuk tanggal ${formData.tanggal}. Tidak dapat absen ganda.`);
        setIsLoading(false);
        return; 
      }

      // --- FUNGSI BARU: Menggabungkan Tanggal dan Jam menjadi Timestamp ---
      const formatTimestamp = (timeString) => {
        if (!timeString) return null;
        // Menggabungkan "2026-04-23" dan "14:00" menjadi objek Date, lalu diubah ke format standar DB
        const combinedDateTime = new Date(`${formData.tanggal}T${timeString}:00`);
        return combinedDateTime.toISOString(); 
      };

      const { error: insertError } = await supabase
        .from('absen')
        .insert([
          {
            employee_id: userProfile.id,
            department_id: userProfile.department_id, 
            status: isOff ? 'Cuti' : 'Hadir',
            date: formData.tanggal, 
            // Memanggil formatTimestamp agar data yang dikirim adalah format timestamp lengkap
            clock_in_time: isOff ? null : formatTimestamp(formData.jamMasuk),
            clock_out_time: isOff ? null : formatTimestamp(formData.jamPulang),
            break_start_time: (isOff || !formData.istirahatMulai) ? null : formatTimestamp(formData.istirahatMulai), 
            break_end_time: (isOff || !formData.istirahatSelesai) ? null : formatTimestamp(formData.istirahatSelesai),
            agenda_log: formData.agenda 
          }
        ]);

      if (insertError) throw insertError;

      setPopup({ isOpen: true, type: isOff ? 'cuti' : 'hadir' });
      
      setFormData(prev => ({
        ...prev,
        agenda: "",
        istirahatMulai: "",
        istirahatSelesai: ""
      }));

    } catch (error) {
      console.error("Gagal mengirim laporan:", error);
      alert("Terjadi kesalahan sistem saat mengirim laporan. Silakan coba lagi.");
    } finally {
      setIsLoading(false); 
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 pt-4 pb-32">
      <div className="mb-10">
        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          {isOff ? "Formulir Izin / Libur" : "Laporan Kehadiran & Agenda"}
        </h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">
          {isOff 
            ? "Silakan isi keterangan atau alasan libur/izin Anda hari ini." 
            : "Catat waktu kerja dan laporan pencapaian Anda hari ini."}
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* Input Tanggal */}
        <div className="bg-surface-container-low p-6 rounded-xl">
          <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Tanggal Laporan</label>
          <div className="relative">
            <input 
              name="tanggal" 
              className="w-full bg-surface-container-lowest border-none rounded-lg p-4 font-body font-semibold text-primary focus:ring-2 focus:ring-surface-tint appearance-none" 
              type="date" 
              value={formData.tanggal} 
              onChange={handleInputChange}
              min={minDateStr} 
              max={todayStr}   
              required
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">calendar_today</span>
          </div>
        </div>

        {/* Toggle Mode Libur / Izin */}
        <div className={`flex items-center justify-between p-5 rounded-xl border transition-colors ${isOff ? 'bg-secondary-container/50 border-secondary/80' : 'bg-secondary-container/20 border-secondary-container/30'}`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary">
              {isOff ? 'event_busy' : 'beach_access'}
            </span>
            <span className="font-headline font-bold text-on-secondary-container">Saya mengambil libur/izin hari ini</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              className="sr-only peer" 
              type="checkbox" 
              checked={isOff}
              onChange={() => setIsOff(!isOff)}
            />
            <div className="w-14 h-7 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        {/* Kotak Input Jam Masuk & Pulang */}
        <div className={`grid grid-cols-2 gap-4 transition-all duration-300 ${isOff ? 'opacity-30 pointer-events-none scale-95' : 'opacity-100'}`}>
          <div className="bg-surface-container-low p-5 rounded-xl">
            <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Jam Masuk</label>
            <input 
              name="jamMasuk" 
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 font-headline font-extrabold text-on-surface focus:ring-2 focus:ring-surface-tint" 
              type="time" 
              value={formData.jamMasuk} 
              onChange={handleInputChange}
              disabled={isOff} 
              required={!isOff} 
            />
          </div>
          <div className="bg-surface-container-low p-5 rounded-xl">
            <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase mb-2">Jam Pulang</label>
            <input 
              name="jamPulang" 
              className="w-full bg-surface-container-lowest border-none rounded-lg p-3 font-headline font-extrabold text-on-surface focus:ring-2 focus:ring-surface-tint" 
              type="time" 
              value={formData.jamPulang} 
              onChange={handleInputChange}
              disabled={isOff}
              required={!isOff}
            />
          </div>
        </div>

        {/* Kotak Input Jam Istirahat */}
        <div className={`bg-surface-container-low p-6 rounded-xl transition-all duration-300 ${isOff ? 'opacity-30 pointer-events-none scale-95' : 'opacity-100'}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>coffee</span>
            <label className="text-[11px] font-bold tracking-widest text-on-surface-variant uppercase">Durasi Istirahat</label>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input 
                name="istirahatMulai" 
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 font-body font-medium text-center focus:ring-2 focus:ring-surface-tint" 
                type="time" 
                value={formData.istirahatMulai} 
                onChange={handleInputChange}
                disabled={isOff}
              />
              <div className="absolute -top-2 left-3 px-1 bg-surface-container-low text-[9px] text-on-surface-variant">MULAI</div>
            </div>
            <span className="text-primary font-bold">―</span>
            <div className="flex-1 relative">
              <input 
                name="istirahatSelesai" 
                className="w-full bg-surface-container-lowest border-none rounded-lg p-3 font-body font-medium text-center focus:ring-2 focus:ring-surface-tint" 
                type="time" 
                value={formData.istirahatSelesai} 
                onChange={handleInputChange}
                disabled={isOff}
              />
              <div className="absolute -top-2 left-3 px-1 bg-surface-container-low text-[9px] text-on-surface-variant">SELESAI</div>
            </div>
          </div>
        </div>

        {/* Kotak Input Agenda / Keterangan Libur */}
        <div className="bg-surface-container-low p-6 rounded-xl border-2 border-transparent focus-within:border-primary/10 transition-all">
          <label className="block text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mb-3">
            {isOff ? "Keterangan Izin / Alasan Libur" : "Agenda Hari Ini"}
          </label>
          <textarea 
            name="agenda" 
            className="w-full bg-surface-container-lowest border-none rounded-xl p-4 font-body text-sm text-on-surface placeholder:text-neutral-400 focus:ring-2 focus:ring-surface-tint resize-none" 
            placeholder={isOff ? "Contoh: Sakit tipes (surat dokter menyusul), Urusan keluarga..." : "Apa saja yang telah Anda kerjakan hari ini?"}
            rows="4"
            value={formData.agenda} 
            onChange={handleInputChange}
            required
          ></textarea>
        </div>

        {/* Tombol Kirim Form */}
        <button 
          className={`w-full py-5 rounded-full text-on-primary font-headline font-extrabold text-lg shadow-lg active:scale-95 transition-all duration-150 flex items-center justify-center gap-3 ${
            isOff 
            ? 'bg-gradient-to-r from-secondary to-secondary-container' 
            : 'bg-gradient-to-r from-primary to-primary-container'
          } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`} 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
             <span className="animate-pulse">Sedang Memproses...</span>
          ) : (
            <>
              {isOff ? "Kirim Laporan Libur" : "Kirim Laporan"}
              <span className="material-symbols-outlined">{isOff ? 'event_busy' : 'send'}</span>
            </>
          )}
        </button>
      </form>

      {/* --- MODAL POPUP SUKSES --- */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            
            {/* Ikon Dinamis Berdasarkan Tipe */}
            {popup.type === 'hadir' ? (
              <div className="w-24 h-24 rounded-full bg-emerald-50 border-[6px] border-emerald-100 flex items-center justify-center text-emerald-500 mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-orange-50 border-[6px] border-orange-100 flex items-center justify-center text-orange-500 mb-6 shadow-sm">
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>beach_access</span>
              </div>
            )}

            {/* Teks Konten */}
            <h3 className="text-2xl font-extrabold text-stone-800 mb-3">
              {popup.type === 'hadir' ? 'Absen Berhasil!' : 'Laporan Terkirim!'}
            </h3>
            
            <p className="text-sm text-stone-500 mb-8 leading-relaxed px-2">
              {popup.type === 'hadir'
                ? 'Terima kasih telah melaporkan kehadiran dan agenda Anda hari ini. Selamat bekerja!'
                : 'Laporan libur/izin Anda telah tersimpan dengan aman di dalam sistem.'}
            </p>

            {/* Tombol Tutup */}
            <button
              onClick={() => setPopup({ isOpen: false, type: '' })}
              className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-current/20 active:scale-95 transition-all tracking-wide ${
                popup.type === 'hadir' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Formabsen;