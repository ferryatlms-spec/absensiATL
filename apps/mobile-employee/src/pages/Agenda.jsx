import React, { useState, useEffect } from 'react';
import AgendaDivisi from './AgendaDivisi';
import ModalAddAgenda from './ModalAddAgenda'; 
// Ubah baris import react-router-dom kamu menjadi seperti ini:
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@mboksurip/db';

const formatDeadline = (dateStr) => {
  if (!dateStr) return null;
  const dateObj = new Date(dateStr);
  return dateObj.toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).replace('.', ':'); 
};

const Agenda = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('pribadi');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskPriority, setTaskPriority] = useState('medium'); 
  const [tasks, setTasks] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null });

  const location = useLocation();
  useEffect(() => {
    // 3. Cek apakah ada state yang dikirim saat navigasi
    if (location.state && location.state.targetTab) {
      setActiveTab(location.state.targetTab);
    }
  }, [location]);

  // PENJELASAN 1: State Khusus untuk Personal Notes
  const [notes, setNotes] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false); // Untuk efek loading tombol simpan

  useEffect(() => {
    if (userProfile?.id) {
      fetchAgendas();
      fetchPersonalNote(); // Panggil fungsi penarik catatan saat halaman dimuat
    }
  }, [userProfile]);

  // --- FUNGSI DATABASE: AGENDA TO-DO ---
  const fetchAgendas = async () => {
    try {
      const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('employee_id', userProfile.id);
      
      if (error) throw error;

      const sortedData = (data || []).sort((a, b) => {
        const weight = { high: 3, medium: 2, low: 1 };
        if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
        
        const priorityA = weight[a.priority?.toLowerCase() || 'medium'];
        const priorityB = weight[b.priority?.toLowerCase() || 'medium'];
        return priorityB - priorityA; 
      });

      setTasks(sortedData);
    } catch (err) {
      console.error("Gagal mengambil agenda:", err.message);
    }
  };

  const handleSaveNewAgenda = async (newData) => {
    try {
      const { error } = await supabase.from('agendas').insert([{ 
        employee_id: userProfile.id, task_text: newData.text, 
        deadline: newData.deadline || null, priority: newData.priority 
      }]);
      if (error) throw error;
      
      setIsModalOpen(false);
      fetchAgendas(); 
    } catch (err) {
      console.error("Gagal menyimpan:", err.message);
    }
  };

  const toggleTask = async (id, currentStatus) => {
    try {
      setTasks(tasks.map(task => task.id === id ? { ...task, is_completed: !currentStatus } : task));
      const { error } = await supabase.from('agendas').update({ is_completed: !currentStatus }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      fetchAgendas(); 
    }
  };

  const promptDelete = (id, e) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, taskId: id });
  };

  const confirmDelete = async () => {
    const id = deleteModal.taskId;
    try {
      setTasks(tasks.filter(task => task.id !== id));
      await supabase.from('agendas').delete().eq('id', id);
    } catch (err) {
      fetchAgendas();
    } finally {
      setDeleteModal({ isOpen: false, taskId: null });
    }
  };

  // --- FUNGSI DATABASE: PERSONAL NOTES (BARU) ---

  // PENJELASAN 2: Mengambil catatan khusus milik karyawan ini
  const fetchPersonalNote = async () => {
    try {
      const { data, error } = await supabase
        .from('personal_notes')
        .select('note_text')
        .eq('employee_id', userProfile.id)
        .maybeSingle(); // Pakai single karena 1 orang = 1 catatan
      
      // Error PGRST116 artinya datanya kosong (user belum pernah buat catatan), kita abaikan saja
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) setNotes(data.note_text || "");
    } catch (err) {
      console.error("Gagal mengambil catatan personal:", err.message);
    }
  };

  // PENJELASAN 3: Menyimpan/Memperbarui catatan
  const handleSaveNote = async () => {
    setIsSavingNote(true);
    try {
      // Kita gunakan 'UPSERT' (Update/Insert). 
      // Jika user belum punya data, ia akan Insert (membuat baru).
      // Jika user sudah punya data, ia akan Update isinya.
      const { error } = await supabase
        .from('personal_notes')
        .upsert(
          { employee_id: userProfile.id, note_text: notes, updated_at: new Date() },
          { onConflict: 'employee_id' } // Ini alasan kita pakai UNIQUE di SQL tadi
        );

      if (error) throw error;
    } catch (err) {
      console.error("Gagal menyimpan catatan:", err.message);
    } finally {
      // Tunggu sebentar agar animasi loading di tombol terlihat
      setTimeout(() => setIsSavingNote(false), 600);
    }
  };

  const completedCount = tasks.filter(t => t.is_completed).length;

  return (
    <div className="animate-in fade-in duration-700 pb-32">
      <div className="flex items-center justify-between mb-10 px-6 mt-4">
        <div className="flex gap-2 bg-surface-container-low p-1.5 rounded-xl">
          <button onClick={() => setActiveTab('pribadi')} className={`px-8 py-2.5 rounded-lg font-headline font-bold text-sm transition-all ${activeTab === 'pribadi' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant"}`}>
            Pribadi
          </button>
          <button onClick={() => setActiveTab('divisi')} className={`px-8 py-2.5 rounded-lg font-headline font-bold text-sm transition-all ${activeTab === 'divisi' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant"}`}>
            Divisi
          </button>
        </div>
      </div>

      {activeTab === 'pribadi' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500 px-6">
          <section className="lg:col-span-7 space-y-6">
            <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="font-headline font-bold text-2xl text-primary">Daily To-Do</h2>
                  <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant mt-1">Checklist Pekerjaan Hari Ini</p>
                </div>
                <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full text-xs font-bold">
                  {completedCount}/{tasks.length} Selesai
                </span>
              </div>
              
              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <p className="text-center text-stone-400 py-6 italic">Belum ada agenda tersimpan.</p>
                ) : (
                  tasks.map((task) => {
                    const p = task.priority?.toLowerCase() || 'medium';
                    const badgeBg = p === 'high' ? 'bg-error-container/50' : p === 'low' ? 'bg-emerald-100' : 'bg-orange-100';
                    const badgeText = p === 'high' ? 'text-error' : p === 'low' ? 'text-emerald-700' : 'text-orange-700';
                    const dotColor = p === 'high' ? 'bg-error' : p === 'low' ? 'bg-emerald-500' : 'bg-orange-500';

                    return (
                      <div key={task.id} className="flex items-start justify-between gap-4 p-4 rounded-xl hover:bg-surface-container-low group cursor-pointer border border-transparent hover:border-outline-variant/30 transition-all" onClick={() => toggleTask(task.id, task.is_completed)}>
                        <div className="flex gap-4 items-start flex-1">
                          <div className={`w-6 h-6 shrink-0 mt-0.5 rounded-md border-2 flex items-center justify-center transition-colors ${task.is_completed ? "bg-primary border-primary text-white" : "border-outline-variant"}`}>
                            {task.is_completed && <span className="material-symbols-outlined text-[18px]">check</span>}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full ${badgeBg} ${badgeText}`}>
                                 <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                 <span className="font-label text-[8px] font-bold uppercase tracking-widest">{task.priority || 'Medium'}</span>
                               </div>
                               {task.deadline && (
                                 <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 flex items-center gap-1">
                                   <span className="material-symbols-outlined text-[12px]">schedule</span> {formatDeadline(task.deadline)}
                                 </span>
                               )}
                            </div>
                            <p className={`font-semibold transition-all ${task.is_completed ? "text-primary line-through opacity-50" : "text-on-surface"}`}>{task.task_text}</p>
                          </div>
                        </div>
                        <button onClick={(e) => promptDelete(task.id, e)} className="opacity-0 group-hover:opacity-100 p-2 text-error hover:bg-error-container rounded-lg transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <button onClick={() => setIsModalOpen(true)} className="w-full mt-8 py-4 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-medium hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add_circle</span> Tambah Tugas Baru
              </button>
            </div>
          </section>

          {/* AREA PERSONAL NOTES (DIPERBARUI) */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="bg-primary p-8 rounded-xl relative overflow-hidden text-on-primary flex flex-col h-full min-h-[400px]">
              
              {/* PENJELASAN 4: Header & Tombol Simpan */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline font-bold text-2xl italic">Personal Notes</h2>
                
                <button 
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="text-[11px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 active:bg-white/30 text-white px-4 py-2 rounded-full transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingNote ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">sync</span> Menyimpan...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">save</span> Simpan</>
                  )}
                </button>
              </div>

              {/* Area Teks Catatan */}
              <textarea 
                className="w-full flex-1 bg-primary-container/30 border-none rounded-lg p-4 text-on-primary placeholder:text-on-primary/40 outline-none resize-none custom-scrollbar" 
                placeholder="Tuliskan gagasan, draf laporan, atau catatan penting Anda di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </aside>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 px-6">
          <AgendaDivisi userProfile={userProfile} />
          
        </div>
      )}

      <ModalAddAgenda
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        onSave={handleSaveNewAgenda} 
      />

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setDeleteModal({ isOpen: false, taskId: null })}></div>
          <div className="relative bg-surface-container-lowest w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-error-container text-error flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#390008] mb-2">Hapus Agenda?</h3>
            <p className="text-sm text-center text-stone-500 mb-8">Tugas ini akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ isOpen: false, taskId: null })} className="flex-1 py-3 font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-3 font-bold text-white bg-error hover:bg-error/90 rounded-xl transition-colors shadow-lg shadow-error/30">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;