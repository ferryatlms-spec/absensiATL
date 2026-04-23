import React, { useEffect, useState } from 'react';

const ModalCuti = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    tipe_izin: 'Cuti', // Default Cuti
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    // Validasi sederhana
    if (!formData.startDate || !formData.endDate || !formData.reason) return;
    onSave(formData);
    setFormData({ tipe_izin: 'Cuti', startDate: '', endDate: '', reason: '' });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#1f1b1b]/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-t-3xl md:rounded-3xl shadow-2xl border border-outline-variant/20 overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-secondary"></div>

        <div className="p-8 md:p-10 pb-6">
          <h2 className="font-headline font-extrabold text-2xl text-primary mb-1">Pengajuan Izin/Cuti</h2>
          <p className="text-sm font-medium text-on-surface-variant opacity-80 mb-6">Pilih jenis izin dan rentang waktu yang dibutuhkan.</p>

          <form className="space-y-5">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase ml-1">Jenis Izin</label>
              <select 
                className="w-full bg-surface-container border-none rounded-lg h-12 px-4 text-sm font-bold focus:ring-2 focus:ring-secondary/20 outline-none"
                value={formData.tipe_izin}
                onChange={(e) => setFormData({...formData, tipe_izin: e.target.value})}
              >
                <option value="Cuti">Cuti (Keperluan Penting)</option>
                <option value="Sakit">Sakit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase ml-1">Mulai</label>
                <input 
                  type="date" 
                  className="w-full bg-surface-container border-none rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase ml-1">Sampai</label>
                <input 
                  type="date" 
                  className="w-full bg-surface-container border-none rounded-lg h-12 px-4 text-sm focus:ring-2 focus:ring-secondary/20 outline-none"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold tracking-widest text-on-surface-variant uppercase ml-1">Keterangan / Alasan</label>
              <textarea 
                className="w-full bg-surface-container border-none rounded-lg p-4 text-sm focus:ring-2 focus:ring-secondary/20 outline-none resize-none"
                rows="3"
                placeholder="Jelaskan alasan secara singkat..."
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              ></textarea>
            </div>
          </form>
        </div>

        <div className="p-8 pt-4 pb-12 flex gap-4 bg-surface-container-lowest/50">
          <button onClick={onClose} className="flex-1 py-4 rounded-full font-bold bg-surface-container active:scale-95">Batal</button>
          <button onClick={handleSubmit} className="flex-[2] py-4 rounded-full font-bold text-white bg-gradient-to-br from-[#390008] to-[#600014] active:scale-95 shadow-lg">Ajukan Sekarang</button>
        </div>
      </div>
    </div>
  );
};

export default ModalCuti;