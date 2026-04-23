import React, { useState, useEffect } from 'react';
import JoblistDivisi from './JobListDivisi';
import { supabase } from '@mboksurip/db';

// Fungsi untuk mencetak daftar tanggal di antara dua tanggal
const getDatesInRange = (startDateStr, endDateStr) => {
  const dates = [];
  let currentDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  while (currentDate <= endDate) {
    // Format kembali ke YYYY-MM-DD
    dates.push(currentDate.toLocaleDateString('en-CA'));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

export default function Myteam({ userProfile }) {
  const [activeTab, setActiveTab] = useState('team');
  
  // State untuk menyimpan data dari database
  const [teamMembers, setTeamMembers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // State untuk modal agenda
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (userProfile?.department_id) {
      fetchTeamStatus();
      fetchApprovals();
    }
  }, [userProfile]);

  // --- FUNGSI 1: MENGAMBIL STATUS LIVE TIM ---
  const fetchTeamStatus = async () => {
    try {
      const today = new Date().toLocaleDateString('en-CA');

      // 1. Ambil semua profil karyawan di divisi yang sama (kecuali dirinya sendiri jika diinginkan)
      const { data: profiles, error: profileError } = await supabase
        .from('employees') // SESUAIKAN DENGAN NAMA TABEL KARYAWAN ANDA
        .select('id, name, role')
        .eq('department_id', userProfile.department_id);

      if (profileError) throw profileError;

      // 2. Ambil semua absensi HARI INI untuk divisi tersebut
      const { data: absens, error: absenError } = await supabase
        .from('absen')
        .select('*')
        .eq('department_id', userProfile.department_id)
        .eq('date', today);

      if (absenError) throw absenError;

      // 3. Gabungkan data profil dengan status absensinya
      const liveTeamData = profiles.map(profile => {
        // Cari record absen karyawan ini untuk hari ini
        const absenHariIni = absens.find(a => a.employee_id === profile.id);

        // Tentukan status default jika belum absen
        let currentStatus = 'Belum Hadir';
        let label = 'STATUS';
        let time = '-';
        let color = 'stone';
        let bgColor = 'bg-surface-container-high';
        let agenda = absenHariIni?.agenda_log || 'Belum ada agenda yang diinput hari ini.';

        if (absenHariIni) {
          if (absenHariIni.status === 'Libur' || absenHariIni.status === 'Sakit' || absenHariIni.status === 'Izin') {
            currentStatus = absenHariIni.status;
            label = 'KETERANGAN';
            time = 'OFF DAY';
            color = 'stone';
            bgColor = 'bg-error-container';
          } else if (absenHariIni.clock_out_time) {
            currentStatus = 'Selesai';
            label = 'CLOCK OUT';
            time = extractTime(absenHariIni.clock_out_time);
            color = 'stone';
            bgColor = 'bg-surface-container-high';
          } else if (absenHariIni.break_start_time && !absenHariIni.break_end_time) {
            currentStatus = 'Istirahat';
            label = 'ON BREAK SINCE';
            time = extractTime(absenHariIni.break_start_time);
            color = 'amber';
            bgColor = 'bg-orange-100';
          } else if (absenHariIni.clock_in_time) {
            currentStatus = 'Bekerja';
            label = 'CLOCK IN';
            time = extractTime(absenHariIni.clock_in_time);
            color = 'emerald';
            bgColor = 'bg-emerald-100';
          }
        }

        return {
          id: profile.id,
          name: profile.name,
          role: profile.role,
          time: time,
          status: currentStatus,
          label: label,
          color: color,
          bgColor: bgColor,
          agenda: agenda
        };
      });

      setTeamMembers(liveTeamData);
    } catch (err) {
      console.error("Gagal menarik status tim:", err.message);
    } finally {
      setLoading(false);
    }
  };

// --- FUNGSI 2: MENGAMBIL PERMINTAAN CUTI PENDING (Diperbarui) ---
  const fetchApprovals = async () => {
    try {
      // 1. Ambil data cuti saja, TANPA melakukan join ke profiles
      const { data: cutiData, error: cutiError } = await supabase
        .from('pengajuan_cuti')
        .select('*')
        .eq('department_id', userProfile.department_id)
        .eq('status', 'Pending');

      if (cutiError) throw cutiError;
      
      // Jika tidak ada yang pending, hentikan proses
      if (!cutiData || cutiData.length === 0) {
        setApprovals([]);
        return;
      }

      // 2. Ambil daftar profil untuk mencari nama (sesuaikan nama tabel 'profiles' jika berbeda)
      const { data: profiles, error: profileError } = await supabase
        .from('employees')
        .select('id, name')
        .eq('department_id', userProfile.department_id);

      if (profileError) throw profileError;

// 3. Gabungkan data cuti dengan nama dari profil secara manual
      const formattedApprovals = cutiData.map(item => {
      const matchedProfile = profiles?.find(p => p.id === item.employee_id);
        
        return {
          id: item.id,
          raw_data: item, // <--- TAMBAHAN: Simpan data mentahnya di sini
          name: matchedProfile?.name || 'Anggota Tim',
          type: item.tipe_izin,
          duration: `${item.start_date} s/d ${item.end_date}`,
          note: `"${item.alasan}"`,
          border: 'border-secondary-container'
        };
      });

      setApprovals(formattedApprovals);
    } catch (err) {
      console.error("Gagal menarik data persetujuan:", err.message);
      setApprovals([]); 
    }
  };

// --- FUNGSI 3: AKSI SETUJUI / TOLAK CUTI (Dilengkapi Automasi Absen) ---
  const handleApprovalAction = async (approvalId, newStatus, rawData) => {
    try {
      // 1. Update status cuti di tabel pengajuan_cuti terlebih dahulu
      const { error: updateError } = await supabase
        .from('pengajuan_cuti')
        .update({ status: newStatus })
        .eq('id', approvalId);

      if (updateError) throw updateError;

      // 2. JIKA DISETUJUI, BUAT REKAM ABSEN OTOMATIS
      if (newStatus === 'Approved' && rawData) {
        // Ambil daftar tanggal dari rentang cuti
        const datesToInsert = getDatesInRange(rawData.start_date, rawData.end_date);
        
        // Siapkan keranjang data (array of objects) untuk Supabase
        const bulkAbsen = datesToInsert.map(dateStr => ({
          employee_id: rawData.employee_id,
          department_id: rawData.department_id,
          date: dateStr,
          status: rawData.tipe_izin, // Akan terisi 'Cuti' atau 'Sakit'
          agenda_log: `[AUTO-SYSTEM] ${rawData.tipe_izin} disetujui: ${rawData.alasan}`
        }));

        // Kirim semuanya ke tabel absen dalam satu kali eksekusi (Bulk Insert)
        const { error: insertError } = await supabase
          .from('absen')
          .insert(bulkAbsen);

        if (insertError) throw insertError;
      }

      // 3. Bersihkan layar dan segarkan status live tim
      setApprovals(prev => prev.filter(app => app.id !== approvalId));
      
      // Jika yang disetujui kebetulan adalah cuti HARI INI, status tim akan langsung berubah!
      fetchTeamStatus(); 

    } catch (err) {
      console.error(`Gagal memproses persetujuan:`, err.message);
    }
  };

  // Utility untuk memotong jam dari timestamp ISO
  const extractTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface-container-high p-8 rounded-2xl h-full animate-in fade-in duration-500 flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm">
        <h3 className="font-headline font-bold text-3xl text-primary tracking-tight">Divisi {userProfile?.departments?.name || 'Operasional'}</h3>
        <div className="flex bg-surface-container rounded-full p-1 border border-outline-variant/20 shadow-inner">
          <button onClick={() => setActiveTab('team')} className={`px-8 py-3 rounded-full font-label text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === 'team' ? 'bg-white text-primary shadow-md scale-[1.02]' : 'text-stone-500 hover:text-primary'}`}>
            Status Tim
          </button>
          <button onClick={() => setActiveTab('joblist')} className={`px-8 py-3 rounded-full font-label text-[11px] font-bold tracking-widest uppercase transition-all duration-300 ${activeTab === 'joblist' ? 'bg-white text-primary shadow-md scale-[1.02]' : 'text-stone-500 hover:text-primary'}`}>
            Joblist Divisi
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activeTab === 'team' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label uppercase text-[10px] font-bold text-on-surface-variant tracking-widest px-2">Kehadiran Hari Ini</span>
                <span className="text-xs font-bold bg-surface-container px-3 py-1 rounded-full text-stone-500">{teamMembers.length} Personel</span>
              </div>
              
              {loading ? (
                <p className="px-2 text-stone-500 text-sm">Memuat status tim...</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {teamMembers.map(member => (
                    <TeamCard 
                      key={member.id} 
                      member={member} 
                      onClick={() => setSelectedMember(member)} 
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <span className="font-label uppercase text-[10px] font-bold text-on-surface-variant tracking-widest px-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                Persetujuan Tertunda
              </span>
              <div className="flex flex-col gap-4">
                {approvals.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-stone-200 rounded-xl bg-stone-50/50">
                    <span className="material-symbols-outlined text-stone-300 text-4xl mb-2">done_all</span>
                    <p className="text-sm font-medium text-stone-500">Semua pengajuan telah diselesaikan.</p>
                  </div>
                ) : (
                approvals.map(app => (
                  <ApprovalCard 
                    key={app.id} 
                    data={app} 
                    // Perhatikan tambahan app.raw_data di bawah ini
                    onApprove={() => handleApprovalAction(app.id, 'Approved', app.raw_data)}
                    onReject={() => handleApprovalAction(app.id, 'Rejected', app.raw_data)}
                  />
                ))
              )}
              </div>
            </div>
          </div>
        ) : (
          <JoblistDivisi userProfile={userProfile} />
        )}
      </div>

      {/* --- MODAL AGENDA TIM --- */}
      {selectedMember && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#1f1b1b]/60 backdrop-blur-sm" onClick={() => setSelectedMember(null)}></div>
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden p-8 animate-in zoom-in-95">
            <button onClick={() => setSelectedMember(null)} className="absolute top-4 right-4 text-stone-400 hover:text-[#390008]">
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="mb-6 border-b pb-4">
              <h3 className="font-headline font-extrabold text-2xl text-primary">{selectedMember.name}</h3>
              <p className="text-sm font-bold text-stone-500">{selectedMember.role}</p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-600">
                Status: {selectedMember.status}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-2">Agenda / Laporan Hari Ini</p>
              <div className="p-4 bg-stone-50 border border-stone-100 rounded-xl">
                <p className="text-sm text-[#390008] leading-relaxed whitespace-pre-wrap font-body">
                  {selectedMember.agenda}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Sub-Komponen ---

const TeamCard = ({ member, onClick }) => (
  // Menambahkan kursor pointer dan efek hover
  <div onClick={onClick} className={`p-5 rounded-2xl bg-white border border-stone-100 shadow-sm flex items-start gap-4 transition-all hover:border-${member.color}-400 hover:shadow-md cursor-pointer group`}>
    <div className={`w-2 h-full rounded-full bg-${member.color}-500 shrink-0 self-stretch group-hover:scale-y-110 transition-transform`}></div>
    <div className="flex-1 min-w-0">
      <h4 className="font-headline font-bold text-lg text-primary truncate mb-0.5">{member.name}</h4>
      <p className="text-[11px] font-medium text-stone-500 truncate mb-4">{member.role}</p>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-stone-400 font-bold tracking-widest uppercase mb-0.5">{member.label}</p>
          <p className="font-body font-bold text-primary">{member.time}</p>
        </div>
        <span className={`${member.bgColor} text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest`}>
          {member.status}
        </span>
      </div>
    </div>
  </div>
);

const ApprovalCard = ({ data, onApprove, onReject }) => (
  <div className={`p-6 bg-white rounded-xl shadow-sm border-l-4 ${data.border} animate-in slide-in-from-left-4 duration-300`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-headline font-bold text-primary">{data.name}</h4>
        <p className="font-body text-xs text-stone-400 font-bold">{data.type}</p>
      </div>
      <span className="text-[10px] font-bold font-body uppercase tracking-widest text-stone-500 bg-stone-50 border px-2 py-1 rounded-lg">{data.duration}</span>
    </div>
    <p className="text-sm text-stone-600 font-body mb-6 italic leading-relaxed bg-stone-50 p-3 rounded-lg border">{data.note}</p>
    <div className="grid grid-cols-2 gap-3">
      {/* Tombol Tolak */}
      <button onClick={onReject} className="py-3 px-4 rounded-full border border-error/30 text-error hover:bg-error-container/50 font-bold text-sm transition-colors active:scale-95">
        Tolak
      </button>
      {/* Tombol Setujui */}
      <button onClick={onApprove} className="py-3 px-4 rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 font-bold text-sm transition-colors active:scale-95">
        Setujui
      </button>
    </div>
  </div>
);