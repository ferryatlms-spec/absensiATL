import React, { useState, useEffect } from 'react';
import { supabase } from '@mboksurip/db';

const AgendaDivisi = ({ userProfile }) => {
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mengambil data saat komponen dimuat
  useEffect(() => {
    if (userProfile?.department_id) {
      fetchTeamMembers();
      fetchTasks();
    }
  }, [userProfile]);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('department_id', userProfile.department_id);
      if (error) throw error;
      setTeamMembers(data || []);
    } catch (err) {
      console.error("Gagal load tim:", err);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('division_tasks')
        .select('*')
        .eq('department_id', userProfile.department_id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      console.error("Gagal load tugas:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk staf mengupdate status & keterangan
  const handleUpdateReport = async (taskId, newStatus, newKeterangan) => {
    try {
      const { error } = await supabase
        .from('division_tasks')
        .update({
          status: newStatus,
          keterangan: newKeterangan
        })
        .eq('id', taskId);
        
      if (error) throw error;
      fetchTasks(); // Refresh data setelah berhasil update
      alert("Laporan tugas berhasil disimpan!");
    } catch (err) {
      console.error("Gagal update laporan:", err);
      alert("Terjadi kesalahan saat menyimpan laporan.");
    }
  };
//tambah keterangan PIC
  // 1. Tambahkan state baru ini di bawah state yang sudah ada
const [picInfo, setPicInfo] = useState(null);

// 2. Tambahkan pemanggilan fetchPIC di dalam useEffect
useEffect(() => {
  if (userProfile?.department_id) {
    fetchTeamMembers();
    fetchTasks();
    fetchPIC(); // <-- Tambahkan baris ini
  }
}, [userProfile]);

// 3. Buat fungsi fetchPIC
const fetchPIC = async () => {
  try {
    // Sesuaikan nama kolom ('name', 'phone', 'position') dengan yang ada di tabel employees Anda
    const { data, error } = await supabase
      .from('employees')
      .select('name, phone, struktural') // ambil nama, no telp, dan jabatan
      .eq('department_id', userProfile.department_id)
      .eq('role', 'PIC') // Asumsi: ada kolom role yang membedakan 'Staff' dan 'PIC'
      .maybeSingle(); 

    if (error) throw error;
    setPicInfo(data);
  } catch (err) {
    console.error("Gagal load data PIC:", err);
  }
};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700 pb-10">
      
      {/* Division Task List - Kiri */}
      <section className="lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-headline text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">assignment</span>
            Agenda Divisi
          </h3>
          <span className="font-label text-[10px] uppercase text-outline">
            {tasks.length} Active Items
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-2 shadow-sm border border-outline-variant/20 flex flex-col gap-2">
          {loading ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">Memuat data agenda...</div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm border border-dashed rounded-lg">Belum ada agenda dari PIC.</div>
          ) : (
            tasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                teamMembers={teamMembers} 
                onUpdate={handleUpdateReport} 
              />
            ))
          )}
        </div>
      </section>

      {/* Sidebar Info - Kanan (Bisa disesuaikan dengan data riil PIC nanti) */}
      <aside className="lg:col-span-4 space-y-6">
  <section className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10">
    <h3 className="font-label text-[10px] uppercase tracking-widest text-outline mb-4">Person In Charge (PIC)</h3>
    
    {picInfo ? (
      <>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-surface-container-highest border border-secondary flex items-center justify-center text-primary font-bold text-xl uppercase">
            {/* Menampilkan huruf pertama dari nama PIC */}
            {picInfo.name ? picInfo.name.charAt(0) : 'P'}
          </div>
          <div>
            <p className="font-headline font-bold text-primary">{picInfo.name}</p>
            {/* Fallback ke 'Manajer Divisi' jika kolom position kosong */}
            <p className="text-[12px] text-on-surface-variant">{picInfo.position || 'Manajer Divisi'}</p>
          </div>
        </div>
        <div className="space-y-3">
          {/* Link langsung ke WhatsApp, mengubah angka 0 di depan menjadi 62 */}
          <a 
            href={picInfo.phone ? `https://wa.me/${picInfo.phone.replace(/^0/, '62')}` : '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-on-surface group cursor-pointer hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-secondary-container bg-primary p-2 rounded-lg group-active:scale-95 transition-transform">
              phone
            </span>
            <span>{picInfo.phone || 'Nomor tidak tersedia'}</span>
          </a>
        </div>
      </>
    ) : (
      // Tampilan jika data PIC sedang dimuat atau belum diatur di database
      <div className="text-sm text-stone-500 italic py-4">Memuat data PIC...</div>
    )}
  </section>

  <section className="bg-surface-container-highest rounded-xl p-6">
    <h3 className="font-label text-[10px] uppercase tracking-widest text-outline mb-4">Statistik Laporan</h3>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Tugas Selesai</span>
        <span className="text-sm font-bold text-secondary">
          {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'selesai').length / tasks.length) * 100) : 0}%
        </span>
      </div>
      <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-secondary h-full transition-all duration-500" 
          style={{ width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'selesai').length / tasks.length) * 100 : 0}%` }}
        ></div>
      </div>
    </div>
  </section>
</aside>
    </div>
  );
};

// --- Sub-Komponen TaskItem ---

const TaskItem = ({ task, teamMembers, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [status, setStatus] = useState(task.status || 'pending');
  const [keterangan, setKeterangan] = useState(task.keterangan || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pemetaan ID staf ke Data Staf
  const assigneesData = (task.assigned_to || []).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);

  // Penyesuaian UI berdasarkan status saat ini
  const isSelesai = task.status === 'selesai';
  const isKendala = task.status === 'kendala';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onUpdate(task.id, status, keterangan);
    setIsSubmitting(false);
    setIsExpanded(false);
  };

  return (
    <div className={`flex flex-col p-4 transition-colors rounded-lg ${isExpanded ? 'bg-surface-container-low shadow-sm' : 'hover:bg-surface-container-lowest'}`}>
      
      {/* Header Task (Clickable untuk expand) */}
      <div 
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="mt-1">
          <span 
            className={`material-symbols-outlined transition-colors ${
              isSelesai ? 'text-secondary-container' : 
              isKendala ? 'text-error' : 'text-outline'
            }`}
            style={{ fontVariationSettings: isSelesai || isKendala ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isSelesai ? 'check_circle' : isKendala ? 'warning' : 'radio_button_unchecked'}
          </span>
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-headline font-bold leading-snug truncate ${isSelesai ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>
            {task.title}
          </h4>
          <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{task.description}</p>
          
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`text-[10px] px-2 py-1 rounded-full font-label font-bold uppercase tracking-wider ${
              task.priority === 'High' ? 'bg-error-container text-error' : 
              task.priority === 'Low' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {task.priority || 'Normal'}
            </span>
            <span className="text-[10px] text-outline flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
              Due: {task.deadline || '-'}
            </span>
          </div>

          {/* Jika ada keterangan sebelumnya, tampilkan secara ringkas */}
          {task.keterangan && !isExpanded && (
            <div className="mt-3 p-2 bg-surface-container-lowest rounded-md border border-outline-variant/30 text-xs text-on-surface-variant flex gap-2">
              <span className="material-symbols-outlined text-[14px]">chat</span>
              <span className="italic line-clamp-1">{task.keterangan}</span>
            </div>
          )}
        </div>

        {/* Assignees Avatars */}
        <div className="flex -space-x-2 shrink-0">
          {assigneesData.slice(0, 2).map((staff, idx) => (
            <div key={idx} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface shadow-sm" title={staff.name}>
              {staff.name.charAt(0)}
            </div>
          ))}
          {assigneesData.length > 2 && (
            <div className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-surface-container flex items-center justify-center text-[10px] font-bold text-on-surface-variant">
              +{assigneesData.length - 2}
            </div>
          )}
        </div>
      </div>

      {/* Form Laporan (Expandable) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-outline-variant/20 pl-10 pr-2 pb-2 animate-in slide-in-from-top-2">
          <p className="text-xs font-bold text-primary mb-3">Update Laporan Tugas:</p>
          
          <div className="flex flex-col gap-3">
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full md:w-1/2 p-2.5 bg-white border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="pending">Sedang Dikerjakan (Pending)</option>
              <option value="selesai">Selesai</option>
              <option value="kendala">Ada Kendala</option>
            </select>

            <textarea 
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tuliskan detail laporan atau kendala yang dihadapi..."
              rows="3"
              className="w-full p-3 bg-white border border-outline-variant/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />

            <div className="flex justify-end gap-2 mt-2">
              <button 
                onClick={() => setIsExpanded(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#390008] text-white hover:bg-opacity-90 transition-colors text-xs font-bold tracking-wider disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-[16px]">save</span>
                )}
                Simpan Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ContactLink = ({ icon, label }) => (
  <div className="flex items-center gap-3 text-sm text-on-surface group cursor-pointer">
    <span className="material-symbols-outlined text-secondary-container bg-primary p-2 rounded-lg group-active:scale-95 transition-transform">
      {icon}
    </span>
    <span>{label}</span>
  </div>
);

export default AgendaDivisi;