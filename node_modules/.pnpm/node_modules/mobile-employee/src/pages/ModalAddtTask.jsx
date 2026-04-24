import React, { useEffect, useState } from 'react';

const ModalAddTask = ({ isOpen, onClose, onSave, teamMembers = [], initialData = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Medium',
    assigned_to: [], 
    is_dashboard_visible: false 
  });

  const isEditMode = !!initialData;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Jika mode Edit, isi form dengan data yang dipilih. Jika tidak, kosongkan.
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          title: '', description: '', deadline: '', priority: 'Medium', assigned_to: [], is_dashboard_visible: false
        });
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const toggleStaff = (staffId) => {
    setFormData(prev => ({
      ...prev,
      assigned_to: prev.assigned_to.includes(staffId)
        ? prev.assigned_to.filter(id => id !== staffId)
        : [...prev.assigned_to, staffId] 
    }));
  };

  const handleSubmit = () => {
    if (!formData.title) return; 
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-[#1f1b1b]/60 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b flex justify-between items-center bg-surface-container-lowest sticky top-0 z-10 rounded-t-3xl md:rounded-t-3xl">
          <div>
            <h2 className="font-headline font-extrabold text-2xl text-primary">
              {isEditMode ? 'Edit Agenda Divisi' : 'Tambah Agenda Divisi'}
            </h2>
            <p className="text-sm text-stone-500 font-medium">
              {isEditMode ? 'Perbarui informasi dan delegasi tugas.' : 'Delegasikan tugas ke anggota tim Anda.'}
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-stone-500 hover:bg-stone-200">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Judul Tugas</label>
            <input 
              type="text" 
              className="w-full border-none bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/30 rounded-xl h-12 px-4 focus:ring-2 focus:ring-secondary/50 outline-none font-bold text-primary"
              placeholder="Contoh: Audit Stok Gudang A"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Tenggat Waktu</label>
              <input 
                type="date" 
                className="w-full border-none bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/30 rounded-xl h-12 px-4 focus:ring-2 focus:ring-secondary/50 outline-none text-sm font-medium"
                value={formData.deadline}
                onChange={e => setFormData({...formData, deadline: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Prioritas</label>
              <div className="grid grid-cols-3 gap-2">
                <PriorityBtn label="Low" color="bg-emerald-500" active={formData.priority === 'Low'} onClick={() => setFormData({...formData, priority: 'Low'})} />
                <PriorityBtn label="Med" color="bg-amber-500" active={formData.priority === 'Medium'} onClick={() => setFormData({...formData, priority: 'Medium'})} />
                <PriorityBtn label="High" color="bg-error" active={formData.priority === 'High'} onClick={() => setFormData({...formData, priority: 'High'})} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Deskripsi</label>
            <textarea 
              className="w-full border-none bg-surface-container-lowest shadow-sm ring-1 ring-outline-variant/30 rounded-xl p-4 focus:ring-2 focus:ring-secondary/50 outline-none text-sm resize-none"
              rows="3"
              placeholder="Detail instruksi pekerjaan..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            ></textarea>
          </div>

          {/* Opsi Tampilkan di Dashboard */}
          <div className="flex items-center gap-3 p-4 bg-secondary-container/20 border border-secondary-container rounded-xl cursor-pointer transition-all hover:bg-secondary-container/40" onClick={() => setFormData({...formData, is_dashboard_visible: !formData.is_dashboard_visible})}>
             <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${formData.is_dashboard_visible ? 'bg-secondary border-secondary' : 'bg-white border-stone-300'}`}>
                {formData.is_dashboard_visible && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
             </div>
             <div>
                <p className="font-bold text-sm text-primary">Sorot di Dashboard Divisi</p>
                <p className="text-[11px] text-stone-500">Hanya 1 tugas prioritas yang bisa tampil di dashboard utama. Jika Anda mencentang ini, tugas lain akan otomatis digantikan.</p>
             </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold tracking-widest text-stone-500 uppercase">Delegasikan Ke (Tim Anda)</label>
            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {teamMembers.length === 0 ? (
                <p className="text-xs text-stone-400 italic">Memuat data tim...</p>
              ) : (
                teamMembers.map(staff => (
                  <StaffItem 
                    key={staff.id} 
                    staff={staff} 
                    isSelected={formData.assigned_to.includes(staff.id)} 
                    onClick={() => toggleStaff(staff.id)} 
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-stone-50 rounded-b-3xl flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} className="px-6 py-3 rounded-full font-bold text-stone-500 hover:bg-stone-200 transition-colors">Batal</button>
          <button onClick={handleSubmit} className="px-8 py-3 rounded-full font-bold text-white bg-[#390008] hover:bg-[#600014] shadow-lg transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">{isEditMode ? 'update' : 'save'}</span> {isEditMode ? 'Update Tugas' : 'Simpan Tugas'}
          </button>
        </div>
      </div>
    </div>
  );
};

const PriorityBtn = ({ label, color, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border transition-all text-[11px] font-bold uppercase tracking-wider ${
      active ? 'bg-surface-container-high text-primary border-primary/20 shadow-sm' : 'border-outline-variant/30 text-stone-400 hover:bg-surface-container'
    }`}
  >
    <span className={`w-2 h-2 rounded-full ${color}`}></span> {label}
  </button>
);

const StaffItem = ({ staff, isSelected, onClick }) => (
  <div onClick={onClick} className={`flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer transition-all ${isSelected ? 'opacity-100 scale-105' : 'opacity-50 hover:opacity-80'}`}>
    <div className={`relative p-0.5 rounded-full ${isSelected ? 'bg-secondary ring-2 ring-secondary/30' : ''}`}>
      <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center text-stone-500 font-bold text-lg border-2 border-white">
        {staff.name.charAt(0)}
      </div>
      {isSelected && (
        <div className="absolute -bottom-1 -right-1 bg-secondary text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
          <span className="material-symbols-outlined text-[10px] font-bold">check</span>
        </div>
      )}
    </div>
    <span className="text-[10px] font-bold text-stone-600 w-16 text-center truncate">{staff.name.split(' ')[0]}</span>
  </div>
);

export default ModalAddTask;