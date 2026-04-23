import React, { useEffect, useState } from 'react';

const ModalAbsen = ({ isOpen, onClose, onSave, modalType, initialAgenda }) => {
  const [formData, setFormData] = useState({
    time: "",
    agenda: ""
  });

  // Tentukan mode modal berdasarkan props yang dikirim dari Dashboard
  const isCheckOut = modalType === 'checkOut';

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const timeString = now.getHours().toString().padStart(2, '0') + ":" + 
                         now.getMinutes().toString().padStart(2, '0');
      
      setFormData({ 
        time: timeString,
        agenda: initialAgenda || "" // Muat agenda sebelumnya jika sedang Check-Out
      });
      
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialAgenda, modalType]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#1f1b1b]/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-[0_40px_60px_rgba(0,0,0,0.12)] border border-outline-variant/10 overflow-hidden animate-in zoom-in-95 duration-300">
        
        <div className={`absolute top-0 left-0 w-full h-1.5 ${isCheckOut ? 'bg-secondary' : 'bg-gradient-to-r from-[#390008] to-[#600014]'}`}></div>

        <div className="p-8 md:p-10">
          <div className="mb-10 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-6 transition-colors ${isCheckOut ? 'bg-secondary-container text-secondary' : 'bg-primary-container text-primary'}`}>
              <span className="material-symbols-outlined text-3xl">
                {isCheckOut ? 'logout' : 'login'}
              </span>
            </div>
            <h1 className="font-headline font-extrabold text-3xl text-primary tracking-tight mb-2">
              {isCheckOut ? 'Konfirmasi Pulang' : 'Konfirmasi Kehadiran'}
            </h1>
            <p className="text-on-surface-variant text-sm font-medium opacity-70">
              {isCheckOut ? 'Perbarui agenda/pekerjaan yang diselesaikan hari ini' : 'Masukkan rencana pekerjaan hari ini'}
            </p>
          </div>

          <form className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase font-label ml-1">
                {isCheckOut ? 'Jam Pulang' : 'Jam Masuk'}
              </label>
              <input 
                className="w-full bg-surface-container-highest border-none rounded-lg h-14 px-5 text-lg font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                type="time" 
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase font-label ml-1">
                {isCheckOut ? 'Review Agenda / Update Pekerjaan' : 'Agenda / Target Hari Ini'}
              </label>
              <textarea 
                className="w-full bg-surface-container-highest border-none rounded-lg p-5 text-on-surface placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-primary/20 outline-none resize-none font-body leading-relaxed text-sm" 
                placeholder={isCheckOut ? "Apa saja yang sudah diselesaikan dari rencana awal?" : "Tuliskan detail rencana pekerjaan Anda..."}
                rows="4"
                value={formData.agenda}
                onChange={(e) => setFormData({...formData, agenda: e.target.value})}
              ></textarea>
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-4 pt-4">
              <button 
                onClick={handleSubmit}
                className={`flex-1 h-14 rounded-full text-white font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group ${isCheckOut ? 'bg-secondary shadow-secondary/20' : 'bg-gradient-to-br from-[#390008] to-[#600014] shadow-primary/20'}`} 
                type="button"
              >
                <span>{isCheckOut ? 'Simpan & Pulang' : 'Mulai Bekerja'}</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                  {isCheckOut ? 'logout' : 'arrow_forward'}
                </span>
              </button>
              <button 
                onClick={onClose}
                className="flex-1 h-14 rounded-full font-bold text-on-surface hover:bg-surface-container transition-colors active:scale-[0.98]" 
                type="button"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModalAbsen;