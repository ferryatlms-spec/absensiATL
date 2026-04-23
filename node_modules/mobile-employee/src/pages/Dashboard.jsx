import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalAbsen from './ModalAbsen';
import { supabase } from '@mboksurip/db';

const getNumericHours = (inT, outT, breakStartT, breakEndT) => {
  if (!inT || !outT) return 0; 
  const start = new Date(inT.includes('-') ? inT : `2000-01-01T${inT}`);
  const end = new Date(outT.includes('-') ? outT : `2000-01-01T${outT}`);
  let totalHours = (end - start) / (1000 * 60 * 60);

  if (breakStartT && breakEndT) {
    const bStart = new Date(breakStartT.includes('-') ? breakStartT : `2000-01-01T${breakStartT}`);
    const bEnd = new Date(breakEndT.includes('-') ? breakEndT : `2000-01-01T${breakEndT}`);
    const breakDuration = (bEnd - bStart) / (1000 * 60 * 60);
    if (breakDuration > 0) totalHours -= breakDuration;
  }
  return totalHours > 0 ? totalHours : 0;
};

const getCurrentPeriod = () => {
  const now = new Date();
  let start, end;
  if (now.getDate() > 25) {
    start = new Date(now.getFullYear(), now.getMonth(), 26);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 25);
  } else {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
    end = new Date(now.getFullYear(), now.getMonth(), 25);
  }
  const offsetStart = start.getTimezoneOffset() * 60000;
  const startStr = (new Date(start - offsetStart)).toISOString().split('T')[0];
  const offsetEnd = end.getTimezoneOffset() * 60000;
  const endStr = (new Date(end - offsetEnd)).toISOString().split('T')[0];
  return { startStr, endStr };
};

export default function Dashboard({ userProfile }) {
  const navigate = useNavigate();
  
  // --- KUMPULAN SEMUA STATE ---
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ totalJam: 0, rerataJam: '0.0' });
  const [loadingStats, setLoadingStats] = useState(true);
  
  const [agendas, setAgendas] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceState, setAttendanceState] = useState('loading'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('checkIn'); 
  const [activeLeaveInfo, setActiveLeaveInfo] = useState(null);
  // -----------------------------

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (userProfile?.id) {
      fetchQuickStats();
      fetchAgendas();
      fetchTodayAttendance();
      fetchTeamMembers();
    }
  }, [userProfile]);
  
  const fetchQuickStats = async () => {
    try {
      setLoadingStats(true);
      const period = getCurrentPeriod();
      
      const { data, error } = await supabase
        .from('absen')
        .select('date, status, clock_in_time, clock_out_time, break_start_time, break_end_time, agenda_log, department_id')
        .eq('employee_id', userProfile.id)
        .gte('date', period.startStr)
        .lte('date', period.endStr);

      if (error) throw error;

      let hariKerja = 0;
      let totalJamDec = 0;

      data.forEach(row => {
        const isAbsent = row.status === 'Izin' || row.status === 'Alpa' || row.status === 'Libur';
        if (!isAbsent && row.clock_in_time) hariKerja++;
        totalJamDec += getNumericHours(row.clock_in_time, row.clock_out_time, row.break_start_time, row.break_end_time);
      });

      setStats({
        totalJam: Math.round(totalJamDec * 100) / 100, 
        rerataJam: hariKerja > 0 ? (totalJamDec / hariKerja).toFixed(2) : '0.00' 
      });

    } catch (err) {
      console.error("Error fetch dashboard stats:", err.message);
    } finally {
      setLoadingStats(false);
    }
  };
  const [featuredTask, setFeaturedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

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

  const fetchAgendas = async () => {
  try {
    // 1. Tarik Agenda Pribadi (seperti biasa)
    const { data: privateAgendas, error: pError } = await supabase
      .from('agendas')
      .select('*')
      .eq('employee_id', userProfile.id)
      .order('is_completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (pError) throw pError;
    setAgendas(privateAgendas || []);

    // 2. Tarik Agenda Divisi yang sedang disorot (Featured Task)
    const { data: divTask, error: dError } = await supabase
      .from('division_tasks')
      .select('*')
      .eq('department_id', userProfile.department_id)
      .eq('is_dashboard_visible', true) // Hanya ambil yang dicentang PIC
      .maybeSingle(); // Karena kita membatasi hanya 1 di JoblistDivisi

    if (dError) throw dError;
    setFeaturedTask(divTask);

  } catch (err) {
    console.error("Gagal menarik data agenda:", err.message);
  }
};

  const toggleAgenda = async (id, currentStatus) => {
    try {
      setAgendas(prev => prev.map(task => 
        task.id === id ? { ...task, is_completed: !currentStatus } : task
      ));

      const { error } = await supabase
        .from('agendas')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error("Gagal update agenda:", err.message);
      fetchAgendas(); 
    }
  };

  const deleteAgenda = async (id) => {
    try {
      setAgendas(prev => prev.filter(task => task.id !== id)); 
      const { error } = await supabase.from('agendas').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      console.error("Gagal menghapus agenda:", err.message);
      fetchAgendas(); 
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      
      // 1. CEK APAKAH SEDANG CUTI / SAKIT (APPROVED) HARI INI
      const { data: cutiData, error: cutiError } = await supabase
        .from('pengajuan_cuti')
        .select('tipe_izin, alasan')
        .eq('employee_id', userProfile.id)
        .eq('status', 'Approved') // Hanya yang sudah disetujui PIC
        .lte('start_date', today) // Tanggal mulai <= hari ini
        .gte('end_date', today)   // Tanggal selesai >= hari ini
        .maybeSingle();

      if (cutiError) console.error(cutiError);

      if (cutiData) {
        // Jika sedang dalam masa cuti, blokir absen dan hentikan pengecekan absen normal
        setActiveLeaveInfo(cutiData);
        setAttendanceState('on_leave');
        return; 
      }

      // 2. JIKA TIDAK CUTI, JALANKAN LOGIKA ABSEN NORMAL
      const { data, error } = await supabase
        .from('absen')
        .select('*')
        .eq('employee_id', userProfile.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      setTodayRecord(data);

      if (!data) {
        setAttendanceState('none');
      } else if (data.status === 'Libur' || data.clock_out_time) {
        setAttendanceState('finished');
      } else if (data.break_start_time && !data.break_end_time) {
        setAttendanceState('break');
      } else if (data.break_end_time) {
        setAttendanceState('returned');
      } else {
        setAttendanceState('working');
      }
    } catch (err) {
      console.error("Gagal menarik status absen hari ini:", err.message);
    }
  };

  const handleLibur = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const { error } = await supabase.from('absen').insert([{ 
        employee_id: userProfile.id, 
        department_id: userProfile?.department_id || userProfile?.departments?.id || userProfile?.departments_id, // <--- UBAH BARIS INI
        date: today, 
        status: 'Libur' 
      }]);
      if (error) throw error;
      fetchTodayAttendance();
      fetchQuickStats();
    } catch (err) {
      console.error("Gagal mengambil libur:", err.message);
    }
  };

const handleSplitStatus = async (type) => {
    try {
      // Gunakan ISO string langsung dari waktu saat ini agar formatnya PASTI valid
      const fullTimestamp = new Date().toISOString();

      const updateData = type === 'start' 
        ? { break_start_time: fullTimestamp } 
        : { break_end_time: fullTimestamp };

      const { error } = await supabase
        .from('absen')
        .update(updateData)
        .eq('id', todayRecord.id);
        
      if (error) throw error;
      fetchTodayAttendance();
    } catch (err) {
      console.error("Gagal update waktu istirahat:", err.message);
    }
  };

  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

const handleModalSave = async (formData) => {
    try {
      const today = new Date().toLocaleDateString('en-CA');
      const fullTimestamp = new Date(`${today}T${formData.time}:00`).toISOString();
      
      if (modalType === 'checkIn') {
        const { error } = await supabase.from('absen').insert([{
          employee_id: userProfile.id,
          department_id: userProfile?.department_id || userProfile?.departments?.id || userProfile?.departments_id, // <--- UBAH BARIS INI
          date: today,
          status: 'Hadir',
          clock_in_time: fullTimestamp, 
          agenda_log: formData.agenda 
        }]);
        if (error) throw error;
      } else if (modalType === 'checkOut') {
        const { error } = await supabase.from('absen').update({
          clock_out_time: fullTimestamp, 
          agenda_log: formData.agenda 
        }).eq('id', todayRecord.id);
        if (error) throw error;
      }
      
      setIsModalOpen(false);
      fetchTodayAttendance();
      fetchQuickStats();
    } catch (err) {
      console.error("Gagal menyimpan data absensi:", err.message);
    }
  };

  const hitungMasaKerja = (tanggalBergabung) => {
    if (!tanggalBergabung) return "-";
    const bergabung = new Date(tanggalBergabung);
    const sekarang = new Date();
    let tahun = sekarang.getFullYear() - bergabung.getFullYear();
    let bulan = sekarang.getMonth() - bergabung.getMonth();
    if (bulan < 0) { tahun--; bulan += 12; }
    return `${tahun} Thn ${bulan} Bln`;
  };

  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric'
    }).format(new Date(dateString));
  };

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour12: false });
  const dateString = currentTime.toLocaleDateString('id-ID', { 
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' 
  });
  const handleGoToJoblist = () => {
  // Navigasi ke rute agenda sambil membawa "pesan"
  navigate('/agenda', { state: { targetTab: 'divisi' } });
  };
  return (
    <main className="max-w-7xl mx-auto px-6 py-8 animate-in fade-in duration-700">
      
      <section className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span className="font-label text-[10px] font-bold tracking-[0.15em] uppercase text-stone-500 mb-2 block">
              Executive Portal
            </span>
            <h2 className="font-headline font-extrabold text-4xl md:text-5xl text-[#390008] tracking-tight leading-none mb-3">
              Selamat Pagi, {userProfile?.name}!
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-secondary-container text-on-secondary-container px-4 py-1 rounded-full font-label text-[11px] font-bold tracking-wider uppercase shadow-sm">
                {userProfile?.struktural} Divisi {userProfile?.departments?.name}
              </span>
              <p className="font-label text-sm text-stone-500">
                Bergabung sejak {formatTanggal(userProfile?.join_date)} <span className="opacity-40 px-2">|</span> {hitungMasaKerja(userProfile?.join_date)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
        <div className={`lg:col-span-7 rounded-[2rem] p-10 shadow-xl border transition-all duration-700 flex flex-col items-center justify-center relative overflow-hidden ${
          (attendanceState === 'working' || attendanceState === 'returned')
          ? 'bg-gradient-to-br from-blue-600 via-teal-500 to-emerald-500 border-blue-200' 
          : attendanceState === 'break' 
          ? 'bg-gradient-to-br from-orange-500 to-amber-500 border-orange-200'
          : 'bg-white border-white/40' 
        }`}>
          <div className="text-center relative z-10 w-full">
            <h3 className={`font-headline font-extrabold text-7xl md:text-8xl tracking-tighter mb-2 transition-colors duration-700 ${
              ['working', 'returned', 'break'].includes(attendanceState) ? 'text-white' : 'text-[#390008]'
            }`}>
              {timeString}
            </h3>
            <p className={`font-body text-xl font-medium mb-10 transition-colors duration-500 ${
              ['working', 'returned', 'break'].includes(attendanceState) ? 'text-white/80' : 'text-stone-500'
            }`}>
              {dateString}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {attendanceState === 'none' && (
                <>
                  <button onClick={() => openModal('checkIn')} className="px-10 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-gradient-to-br from-[#390008] to-[#600014] text-white hover:scale-[1.02] shadow-2xl transition-all">
                    <span className="material-symbols-outlined">login</span> CHECK IN
                  </button>
                  <button onClick={handleLibur} className="px-10 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-stone-100 text-stone-600 hover:bg-stone-200 hover:scale-[1.02] transition-all border border-stone-200">
                    <span className="material-symbols-outlined">event_busy</span> AMBIL LIBUR
                  </button>
                </>
              )}
              {attendanceState === 'working' && (
                <>
                  <button onClick={() => handleSplitStatus('start')} className="px-10 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-white text-orange-600 hover:scale-[1.02] shadow-xl transition-all">
                    <span className="material-symbols-outlined">local_cafe</span> ISTIRAHAT
                  </button>
                  <button onClick={() => openModal('checkOut')} className="px-10 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-white/20 text-white hover:bg-white/30 hover:scale-[1.02] transition-all border border-white/40">
                    <span className="material-symbols-outlined">logout</span> CHECK OUT
                  </button>
                </>
              )}
              {attendanceState === 'break' && (
                <button onClick={() => handleSplitStatus('end')} className="px-12 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-white text-orange-600 hover:scale-[1.02] shadow-2xl transition-all">
                  <span className="material-symbols-outlined">work</span> KEMBALI BEKERJA
                </button>
              )}
              {attendanceState === 'returned' && (
                <button onClick={() => openModal('checkOut')} className="px-12 py-5 rounded-full font-headline font-bold text-lg tracking-wide flex items-center gap-3 bg-white text-emerald-600 hover:scale-[1.02] shadow-2xl transition-all">
                  <span className="material-symbols-outlined">logout</span> CHECK OUT
                </button>
              )}
              {attendanceState === 'finished' && (
                <div className="px-12 py-6 rounded-3xl bg-surface-container-low border border-outline-variant/30 text-[#390008] font-headline font-bold text-xl flex items-center gap-3 animate-in zoom-in duration-500">
                  {/* Ganti icon dan teks berdasarkan status record hari ini */}
                  {todayRecord?.status === 'Libur' ? (
                      <>
                <span className="material-symbols-outlined text-orange-500 text-3xl">beach_access</span>
                    Selamat Berlibur!
                      </>
                    ) : (
                  <>
                <span className="material-symbols-outlined text-emerald-600 text-3xl">task_alt</span>
                    Tugas hari ini telah selesai!
                  </>
                )}
              </div>
              )}
            </div>
          </div>

          <ModalAbsen 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSave={handleModalSave}
            modalType={modalType}
            initialAgenda={todayRecord?.agenda_log || ''} 
          />
        </div>

        <div className="lg:col-span-5 grid grid-cols-1 gap-6">
          <StatCard 
            icon="schedule" 
            label="Total Jam Kerja" 
            value={`${stats.totalJam} Jam`} 
            bgColor="bg-surface-container-high" 
          />
          <StatCard 
            icon="analytics" 
            label="Rata-rata Harian" 
            value={`${stats.rerataJam} Jam/Hari`} 
            bgColor="bg-secondary-fixed" 
            isSecondary
          />
        </div>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-stone-50 flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="font-headline font-bold text-xl text-[#390008] flex items-center gap-3">
              <span className="material-symbols-outlined">task_alt</span>
              Agenda Pribadi
            </h3>
            <button 
              onClick={() => navigate('/agenda')}
              className="text-[10px] font-bold text-secondary tracking-widest uppercase hover:underline bg-secondary/10 px-3 py-1.5 rounded-full flex items-center gap-1"
            >
              See All <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {agendas.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                <p className="text-sm font-medium">Semua tugas beres!</p>
              </div>
            ) : (
              agendas.slice(0, 6).map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-start gap-4 p-3 rounded-2xl transition-all cursor-pointer border ${
                    task.is_completed ? 'bg-stone-50 border-transparent opacity-60' : 'bg-white hover:border-primary/30 border-outline-variant/20'
                  }`}
                  onClick={() => toggleAgenda(task.id, task.is_completed)}
                >
                  <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    task.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300'
                  }`}>
                    {task.is_completed && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${
                        task.priority?.toLowerCase() === 'high' ? 'bg-error-container/50 text-error' : 
                        task.priority?.toLowerCase() === 'low' ? 'bg-emerald-100 text-emerald-700' : 
                        'bg-orange-100 text-orange-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          task.priority?.toLowerCase() === 'high' ? 'bg-error' : 
                          task.priority?.toLowerCase() === 'low' ? 'bg-emerald-500' : 
                          'bg-orange-500'
                        }`}></span>
                        <span className="font-label text-[8px] font-bold uppercase tracking-widest">
                          {task.priority || 'Medium'}
                        </span>
                      </div>
                      {task.deadline && (
                        <span className="font-label text-[9px] text-stone-500 font-bold uppercase tracking-tight flex items-center gap-1">
                          {task.deadline.replace('T', ' ')}
                        </span>
                      )}
                    </div>
                    <p className={`font-body text-sm font-bold text-[#390008] mt-1 ${task.is_completed ? 'line-through text-stone-400' : ''}`}>
                      {task.task_text}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-lg border border-stone-50">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline font-bold text-xl text-[#390008] flex items-center gap-3">
              <span className="material-symbols-outlined">hub</span>
              Status Divisi
            </h3>
            <button 
            onClick={handleGoToJoblist}
            className="text-[10px] font-bold text-secondary tracking-widest uppercase hover:underline">See All</button>
          </div>
          <div className="space-y-4">

{featuredTask ? (
      // 1. UBAH GRADIENT MENJADI WARNA CERAH (Vibrant Sunset)
      // Gunakan: from-amber-400 via-orange-500 to-pink-500
      <div className="bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-[2rem] p-8 shadow-xl text-white relative overflow-hidden group border border-white/30">
        
        {/* Dekorasi Ikon Transparan - Dibuat lebih putih agar kontras di warna cerah */}
        <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-[140px] opacity-20 rotate-12 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-110">
          assignment_late
        </span>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            {/* Tag Prioritas dengan latar putih transparan agar tetap elegan */}
            <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/20 backdrop-blur-md border border-white/40 shadow-sm">
              {featuredTask.priority} Priority
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/90 bg-black/5 px-3 py-1 rounded-full border border-white/10">
              DL: {featuredTask.deadline}
            </span>
          </div>
          
          <h4 className="font-headline font-extrabold text-2xl mb-2 leading-tight drop-shadow-sm">
            {featuredTask.title}
          </h4>
          <p className="font-body text-sm text-white/90 leading-relaxed mb-8 line-clamp-3 font-medium">
            {featuredTask.description}
          </p>
          
          <div className="flex items-end justify-between border-t border-white/20 pt-5">
             <div className="flex flex-col gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">groups</span> Delegasi Tim
                </span>
                
                {/* RENDER AVATAR DELEGASI */}
                <div className="flex -space-x-2 relative">
                  {(() => {
                    const assigneesData = (featuredTask.assigned_to || []).map(id => teamMembers.find(m => m.id === id)).filter(Boolean);
                    
                    if (assigneesData.length === 0) {
                      return <span className="text-[10px] text-white/60 italic">Unassigned</span>;
                    }

                    return (
                      <>
                        {assigneesData.slice(0, 4).map((staff, i) => (
                          <div key={i} className="w-8 h-8 rounded-full bg-white border-2 border-orange-500 flex items-center justify-center text-[10px] font-bold text-orange-600 shadow-sm" title={staff.name}>
                            {staff.name.charAt(0)}
                          </div>
                        ))}
                        {assigneesData.length > 4 && (
                          <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                            +{assigneesData.length - 4}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
             </div>

             {/* Lencana "Tugas Anda" - Dibuat lebih kontras (Hitam/Gelap di atas cerah) */}
             {featuredTask.assigned_to?.includes(userProfile.id) && (
               <span className="bg-white text-orange-600 px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wide shadow-lg animate-bounce">
                 Tugas Anda
               </span>
             )}
          </div>
        </div>
      </div>
    ) : (
      // Tampilan Kosong (Tetap cerah/putih bersih)
      <div className="bg-white rounded-[2rem] p-10 border border-dashed border-stone-200 flex flex-col items-center justify-center text-center h-[280px]">
        <span className="material-symbols-outlined text-stone-200 text-5xl mb-4">
          format_list_bulleted
        </span>
        <p className="text-stone-400 text-sm font-medium">Belum ada tugas prioritas<br/>dari PIC hari ini.</p>
      </div>
    )}
            <div className="p-6 rounded-2xl bg-stone-50 border border-stone-100">
              <p className="font-label text-[10px] font-bold text-stone-500 tracking-widest uppercase mb-4">Kehadiran Tim Hari Ini</p>
              <div className="flex items-center justify-between">
                <TeamStat value="10" label="Hadir" color="text-[#390008]" />
                <div className="w-px h-10 bg-stone-200"></div>
                <TeamStat value="2" label="Cuti" color="text-stone-400" />
                <div className="w-px h-10 bg-stone-200"></div>
                <TeamStat value="0" label="Alfa" color="text-error" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const StatCard = ({ icon, label, value, bgColor, isSecondary }) => (
  <div className={`${bgColor} rounded-3xl p-8 flex items-center gap-6 shadow-sm border border-white/20 transition-transform hover:scale-[1.02]`}>
    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#390008] shadow-sm">
      <span className="material-symbols-outlined text-3xl">{icon}</span>
    </div>
    <div>
      <p className={`font-label text-[10px] font-bold tracking-[0.1em] uppercase mb-1 ${isSecondary ? 'text-on-secondary-fixed-variant' : 'text-stone-500'}`}>{label}</p>
      <p className={`font-headline font-extrabold text-3xl ${isSecondary ? 'text-on-secondary-fixed' : 'text-[#390008]'}`}>{value}</p>
    </div>
  </div>
);

const TeamStat = ({ value, label, color }) => (
  <div className="text-center px-4">
    <p className={`font-headline font-extrabold text-2xl ${color}`}>{value}</p>
    <p className="font-label text-[10px] text-stone-400 font-bold uppercase tracking-widest">{label}</p>
  </div>
);