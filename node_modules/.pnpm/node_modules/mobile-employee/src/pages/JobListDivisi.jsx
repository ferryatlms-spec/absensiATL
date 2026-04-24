import React, { useState, useEffect } from 'react';
import ModalAddTask from './ModalAddtTask';
import { supabase } from '@mboksurip/db';

const JoblistDivisi = ({ userProfile }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // State untuk menyimpan data tugas yang sedang di-edit
  const [editingTask, setEditingTask] = useState(null);
  
  // State BARU untuk popup konfirmasi hapus
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    if (userProfile?.department_id) {
      fetchTeamMembers();
      fetchTasks();
    }
  }, [userProfile]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase.from('employees').select('id, name').eq('department_id', userProfile.department_id);
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error("Gagal load tim:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('division_tasks').select('*').eq('department_id', userProfile.department_id).order('sort_order', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Gagal load tugas:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewClick = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = async (formData) => {
    try {
      if (formData.is_dashboard_visible) {
        await supabase
          .from('division_tasks')
          .update({ is_dashboard_visible: false })
          .eq('department_id', userProfile.department_id);
      }

      if (editingTask) {
        const { error } = await supabase
          .from('division_tasks')
          .update({
            title: formData.title,
            description: formData.description,
            deadline: formData.deadline,
            priority: formData.priority,
            assigned_to: formData.assigned_to,
            is_dashboard_visible: formData.is_dashboard_visible
          })
          .eq('id', editingTask.id);
        if (error) throw error;
      } else {
        const newSortOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order || 0)) + 1 : 0;
        const { error } = await supabase.from('division_tasks').insert([{
          department_id: userProfile.department_id,
          title: formData.title,
          description: formData.description,
          deadline: formData.deadline,
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          is_dashboard_visible: formData.is_dashboard_visible,
          sort_order: newSortOrder
        }]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingTask(null);
      fetchTasks(); 
    } catch (err) {
      console.error("Gagal simpan tugas:", err);
    }
  };

  // Fungsi BARU: Membuka popup konfirmasi
  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
  };

  // Fungsi BARU: Mengeksekusi penghapusan dari Supabase
  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const { error } = await supabase.from('division_tasks').delete().eq('id', taskToDelete.id);
      if (error) throw error;
      setTasks(prev => prev.filter(t => t.id !== taskToDelete.id));
      setTaskToDelete(null); // Tutup popup setelah berhasil
    } catch (err) {
      console.error("Gagal hapus tugas:", err);
    }
  };

  const handleMoveOrder = async (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === tasks.length - 1) return;

    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;

    newTasks[index].sort_order = index;
    newTasks[targetIndex].sort_order = targetIndex;
    setTasks(newTasks);

    try {
      await supabase.from('division_tasks').update({ sort_order: index }).eq('id', newTasks[index].id);
      await supabase.from('division_tasks').update({ sort_order: targetIndex }).eq('id', newTasks[targetIndex].id);
    } catch (err) {
      console.error("Gagal reorder:", err);
    }
  };

  const filteredTasks = tasks.filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getPriorityStyle = (priority) => {
    if (priority === 'High') return { border: 'border-error', tag: 'bg-error-container text-error' };
    if (priority === 'Low') return { border: 'border-emerald-500', tag: 'bg-emerald-100 text-emerald-700' };
    return { border: 'border-amber-500', tag: 'bg-orange-100 text-orange-700' }; 
  };

  const getStatusDisplay = (status) => {
    if (status === 'selesai') return { text: 'Selesai', style: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'check_circle' };
    if (status === 'kendala') return { text: 'Ada Kendala', style: 'bg-error-container text-error border-error/20', icon: 'warning' };
    return { text: 'Pending', style: 'bg-stone-100 text-stone-500 border-stone-200', icon: 'schedule' };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">search</span>
          <input 
            type="text" 
            placeholder="Cari joblist divisi..." 
            className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={handleAddNewClick}
          className="py-3 px-6 rounded-full font-bold text-white bg-[#390008] shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span> Tambah Agenda
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-stone-400">Memuat joblist...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 bg-white border border-dashed rounded-2xl text-stone-400">Belum ada tugas divisi.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredTasks.map((task, index) => {
            const priorityStyle = getPriorityStyle(task.priority);
            const assigneesData = (task.assigned_to || []).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
            const statusDisplay = getStatusDisplay(task.status);

            return (
              <div key={task.id} className={`bg-white rounded-2xl p-5 shadow-sm border border-stone-100 transition-all hover:border-stone-300 flex flex-col md:flex-row gap-6 group relative`}>
                
                <div className="hidden md:flex flex-col gap-1 opacity-20 group-hover:opacity-100 transition-opacity mt-2">
                   <button onClick={() => handleMoveOrder(index, 'up')} className="w-6 h-6 rounded bg-stone-50 hover:bg-stone-200 text-stone-400 flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">expand_less</span></button>
                   <button onClick={() => handleMoveOrder(index, 'down')} className="w-6 h-6 rounded bg-stone-50 hover:bg-stone-200 text-stone-400 flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">expand_more</span></button>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${priorityStyle.tag}`}>
                      {task.priority}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">calendar_today</span> {task.deadline || '-'}
                    </span>
                    {task.is_dashboard_visible && (
                      <span className="px-3 py-1 bg-secondary-container/50 text-secondary border border-secondary/20 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">push_pin</span> Tampil di Dashboard
                      </span>
                    )}
                  </div>
                  
                  <h3 className={`text-lg font-bold truncate ${task.status === 'selesai' ? 'text-stone-400 line-through' : 'text-primary'}`}>
                    {task.title}
                  </h3>
                  <p className="text-stone-500 mt-1 text-xs leading-relaxed line-clamp-2">{task.description}</p>
                  
                  <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-stone-100/50">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${statusDisplay.style}`}>
                        <span className="material-symbols-outlined text-[12px]">{statusDisplay.icon}</span> 
                        {statusDisplay.text}
                      </span>
                    </div>
                    
                    {task.keterangan && (
                      <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100 flex items-start gap-2 mt-1">
                        <span className="material-symbols-outlined text-[14px] text-stone-400 mt-0.5">forum</span>
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-stone-400 uppercase block mb-0.5">Pesan / Laporan Staf:</span>
                          <p className="text-xs text-stone-600 italic leading-relaxed">{task.keterangan}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-4 shrink-0 md:pl-6 md:border-l border-stone-100 pt-4 md:pt-0 border-t md:border-t-0">
                  <div className="flex -space-x-2 w-full justify-start md:justify-end">
                    {assigneesData.length === 0 ? <span className="text-[10px] text-stone-400 italic">Unassigned</span> : 
                      assigneesData.slice(0, 3).map((staff, i) => (
                        <div key={i} className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white flex items-center justify-center text-xs font-bold text-stone-600 shadow-sm" title={staff.name}>
                          {staff.name.charAt(0)}
                        </div>
                      ))
                    }
                    {assigneesData.length > 3 && (
                      <div className="w-10 h-10 rounded-full bg-stone-100 border-2 border-white flex items-center justify-center text-xs font-bold text-stone-500 shadow-sm">
                        +{assigneesData.length - 3}
                      </div>
                    )}
                  </div>
                    
                  <div className="flex items-center gap-2 w-full justify-start md:justify-end">
                    <button onClick={() => handleEditClick(task)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-surface-container-high text-primary hover:bg-[#390008] hover:text-white transition-all text-[11px] font-bold tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                    </button>
                    {/* Mengubah onClick menjadi handleDeleteClick */}
                    <button onClick={() => handleDeleteClick(task)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-error-container/20 text-error hover:bg-error transition-all hover:text-white text-[11px] font-bold tracking-wider uppercase">
                      <span className="material-symbols-outlined text-[14px]">delete</span> Hapus
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Popup Tambah/Edit Task (Sudah Ada) */}
      <ModalAddTask 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveTask} 
        teamMembers={teamMembers}
        initialData={editingTask}
      />

      {/* MODAL / POPUP KONFIRMASI HAPUS BARU */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center gap-4">
              
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center text-error mb-2">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-primary">Hapus Jobdesk?</h3>
                <p className="text-sm text-stone-500 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong>"{taskToDelete.title}"</strong>? Data yang sudah dihapus tidak dapat dikembalikan.
                </p>
              </div>

              <div className="flex w-full gap-3 mt-4">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDeleteTask}
                  className="flex-1 py-3 rounded-xl font-bold text-white bg-error hover:bg-error/90 transition-colors text-sm shadow-md"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JoblistDivisi;