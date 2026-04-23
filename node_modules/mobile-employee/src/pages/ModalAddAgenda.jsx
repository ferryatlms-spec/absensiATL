import React, { useEffect, useState } from 'react';

// PENJELASAN 1: Menerima 'onSave' sebagai saluran komunikasi ke Agenda.jsx
const ModalAddAgenda = ({ isOpen, onClose, taskPriority, setTaskPriority, onSave }) => {
  
  // PENJELASAN 2: State lokal form
  const [taskName, setTaskName] = useState('');
  const [deadline, setDeadline] = useState('');

  // Mencegah background scroll saat modal terbuka
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset form saat modal dibuka kembali
  useEffect(() => {
    if (isOpen) {
      setTaskName('');
      setDeadline('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // PENJELASAN 3: Fungsi Eksekusi
  const handleSimpan = () => {
    if (!taskName.trim()) {
      alert("Nama agenda tidak boleh kosong!");
      return;
    }

    // Mengemas data dan mengirim ke fungsi handleSaveNewAgenda di file induk
    onSave({
      text: taskName,
      deadline: deadline,
      priority: taskPriority
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Background Gelap */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Konten Modal */}
      <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-[0_40px_60px_-15px_rgba(57,0,8,0.15)] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-headline font-extrabold text-primary tracking-tight">Tambah Tugas Baru</h2>
              <div className="h-1 w-12 bg-secondary-container mt-2"></div>
            </div>
            <button onClick={onClose} className="text-outline hover:text-primary transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="space-y-6">
            {/* Input Nama Tugas */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.1em] font-bold text-on-surface-variant">Nama Agenda</label>
              <input 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="w-full bg-surface-container-high border-none rounded-lg p-4 font-body outline-none focus:ring-2 focus:ring-primary/30" 
                placeholder="Masukkan nama tugas..." 
                type="text" 
              />
            </div>
            
            {/* Input Deadline */}
            <div className="space-y-2">
              <label className="font-label text-[10px] uppercase tracking-[0.1em] font-bold text-on-surface-variant">Deadline Waktu</label>
              <div className="relative">
                <input 
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-surface-container-high border-none rounded-lg p-4 font-body outline-none focus:ring-2 focus:ring-primary/30" 
                  type="datetime-local" 
                />
              </div>
            </div>

            {/* Input Prioritas */}
            <div className="space-y-3">
              <label className="font-label text-[10px] uppercase tracking-[0.1em] font-bold text-on-surface-variant">Tingkat Prioritas</label>
              <div className="flex gap-2">
                {['high', 'medium', 'low'].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setTaskPriority(p)}
                    className={`flex-1 py-3 px-2 rounded-full font-label text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                      taskPriority === p 
                      ? 'bg-secondary-container text-on-secondary-container ring-2 ring-primary/20' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p === 'high' ? 'bg-error' : p === 'medium' ? 'bg-secondary' : 'bg-emerald-500'}`}></span>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-outline-variant/10">
            <button onClick={onClose} className="px-6 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">Batal</button>
            <button onClick={handleSimpan} className="bg-gradient-to-r from-primary to-primary-container px-10 py-3 rounded-full font-label text-xs font-bold uppercase text-white shadow-lg active:scale-95 hover:shadow-primary/30 transition-all">
              Simpan Tugas
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-primary-container opacity-20"></div>
      </div>
    </div>
  );
};

export default ModalAddAgenda;