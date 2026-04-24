import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@mboksurip/db';

// 1. Helper Format Jam (Diperbarui untuk UTC+7 / WIB)
// Penjelasan: Fungsi ini mengecek apakah data dari database adalah format ISO (mengandung 'T' atau 'Z').
// Jika ya, ia akan memaksa konversi ke zona waktu Asia/Jakarta secara akurat sebelum dipotong menjadi format HH:MM.
const formatTimeToWIB = (timeStr) => {
  if (!timeStr) return '--:--';
  
  try {
    if (timeStr.includes('T') || timeStr.endsWith('Z')) {
      const date = new Date(timeStr);
      // Konversi waktu UTC bawaan Supabase ke Waktu Indonesia Barat
      return date.toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\./g, ':'); // Memastikan pemisah jam menggunakan titik dua (:)
    }
    // Fallback jika format di database cuma teks "08:00:00"
    return timeStr.substring(0, 5);
  } catch (error) {
    return '--:--';
  }
}; 

// 2. Helper Hitung Jam Kerja (Disesuaikan agar aman dengan format ISO)
const calculateHours = (inT, outT, breakStartT, breakEndT) => {
  if (!inT || !outT) return 0; 

  // Fungsi internal untuk mengamankan parsing baik untuk tanggal komplit (ISO) atau cuma jam
  const parseTime = (t) => new Date(t.includes('T') ? t : `2000-01-01T${t}`);

  // 1. Hitung total jam dari Masuk sampai Pulang
  const start = parseTime(inT);
  const end = parseTime(outT);
  let totalHours = (end - start) / (1000 * 60 * 60);

  // 2. Jika ada absen Istirahat & Kembali, hitung durasinya dan potong
  if (breakStartT && breakEndT) {
    const bStart = parseTime(breakStartT);
    const bEnd = parseTime(breakEndT);
    const breakDuration = (bEnd - bStart) / (1000 * 60 * 60);
    
    // Kurangi total jam dengan durasi istirahat
    if (breakDuration > 0) {
      totalHours -= breakDuration;
    }
  }

  return totalHours > 0 ? totalHours.toFixed(2) : '0.00';
};

// 3. Helper Penentu 3 Periode Gaji Terakhir
const generatePayrollPeriods = () => {
  const periods = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const baseMonthOffset = now.getDate() > 25 ? 1 : 0;

  for (let i = 0; i < 3; i++) {
    const targetMonthIndex = currentMonth + baseMonthOffset - i;
    
    const startDate = new Date(currentYear, targetMonthIndex - 1, 26);
    const endDate = new Date(currentYear, targetMonthIndex, 25);

    const formatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const label = `${startDate.toLocaleDateString('id-ID', formatOptions)} - ${endDate.toLocaleDateString('id-ID', formatOptions)}`;

    const offsetStart = startDate.getTimezoneOffset() * 60000;
    const startStr = (new Date(startDate - offsetStart)).toISOString().split('T')[0];
    
    const offsetEnd = endDate.getTimezoneOffset() * 60000;
    const endStr = (new Date(endDate - offsetEnd)).toISOString().split('T')[0];

    periods.push({ id: i, startStr, endStr, label });
  }
  
  return periods;
};

export default function Riwayat({ userProfile }) {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const availablePeriods = useMemo(() => generatePayrollPeriods(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0]);

  useEffect(() => {
    if (userProfile?.id && selectedPeriod) {
      fetchHistory();
    }
  }, [userProfile, selectedPeriod]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('absen')
        .select('*')
        .eq('employee_id', userProfile.id)
        .gte('date', selectedPeriod.startStr) 
        .lte('date', selectedPeriod.endStr)   
        .order('date', { ascending: false });

      if (error) throw error;

      const formatted = data.map((row) => {
        // Menerapkan zona waktu lokal (browser / perangkat) saat parsing tanggal 
        const dateObj = new Date(row.date);
        
        return {
          id: row.id,
          rawDate: row.date,
          date: dateObj.getDate(),
          month: dateObj.toLocaleDateString('id-ID', { month: 'short' }),
          day: dateObj.toLocaleDateString('id-ID', { weekday: 'long' }),
          status: row.status || 'Hadir',
          isAbsent: row.status === 'Izin' || row.status === 'Alpa',
          totalHours: calculateHours(row.clock_in_time, row.clock_out_time, row.break_start_time, row.break_end_time),
          // Menggunakan helper WIB yang baru dibuat di atas
          inTime: formatTimeToWIB(row.clock_in_time),
          breakTime: formatTimeToWIB(row.break_start_time),
          returnTime: formatTimeToWIB(row.break_end_time),
          outTime: formatTimeToWIB(row.clock_out_time),
          agenda: row.agenda_log || 'Tidak ada catatan agenda'
        };
      });

      setHistoryData(formatted);
    } catch (err) {
      console.error("Error fetching history:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (historyData.length === 0) return alert("Tidak ada data untuk diekspor");

    const headers = ["Tanggal", "Hari", "Jam Masuk", "Jam Pulang", "Istirahat Keluar", "Istirahat Kembali", "Total Jam", "Status", "Agenda"];
    
    const rows = historyData.map(d => [
      d.rawDate, d.day, d.inTime, d.outTime, d.breakTime, d.returnTime, d.totalHours, d.status,
      // FIX: Mengubah d.agenda_log menjadi d.agenda sesuai dengan key object di fetchHistory
      `"${d.agenda.replace(/"/g, '""')}"` 
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Absen_${userProfile?.name?.replace(/\s/g, '_')}_${selectedPeriod.label}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-headline font-bold text-2xl text-primary tracking-tight">Riwayat Absen</h3>
          
          <div className="mt-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
            <select 
              value={selectedPeriod.id} 
              onChange={(e) => {
                const newPeriod = availablePeriods.find(p => p.id === parseInt(e.target.value));
                setSelectedPeriod(newPeriod);
              }}
              className="text-xs sm:text-sm font-medium bg-surface-container-low text-on-surface border border-outline-variant/50 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            >
              {availablePeriods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.id === 0 ? `Bulan Ini (${p.label})` : p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 text-sm font-bold text-emerald-700 cursor-pointer bg-emerald-100 px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-base">download</span>
          <span className="hidden sm:inline">Export Excel</span>
        </button>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
           <p className="animate-pulse text-outline-variant font-medium">Memuat data {selectedPeriod.label}...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {historyData.length > 0 ? (
            historyData.map((data) => (
              <HistoryAccordion key={data.id} data={data} />
            ))
          ) : (
            <div className="text-center py-12 bg-surface-container-lowest rounded-2xl border-2 border-dashed border-outline-variant/30">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-2">event_busy</span>
              <p className="text-on-surface-variant font-medium text-sm">Belum ada absen di periode ini.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- KOMPONEN ACCORDION ---
// (Tidak ada perubahan logika pada UI, komponen ini murni merender state yang sudah diformat WIB dari parent)
const HistoryAccordion = ({ data }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden transition-all shadow-sm ${isExpanded ? 'ring-2 ring-primary/10' : 'hover:border-primary/30'}`}>
      <div onClick={() => setIsExpanded(!isExpanded)} className="p-4 flex items-center justify-between cursor-pointer select-none">
        <div className="flex items-center gap-4">
          <div className={`flex flex-col items-center justify-center bg-surface-container-high rounded-lg p-2 min-w-[3.5rem] ${data.isAbsent ? 'opacity-60' : ''}`}>
            <span className="font-label text-[10px] uppercase font-bold text-secondary tracking-widest leading-none mb-1">{data.month}</span>
            <span className="font-headline font-extrabold text-xl text-primary leading-none">{data.date}</span>
          </div>
          <div>
            <h4 className="font-bold text-primary text-sm sm:text-base">{data.day}</h4>
            <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${data.isAbsent ? 'bg-error-container text-on-error-container' : 'bg-secondary-container text-on-secondary-container'}`}>
              {data.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <span className="block font-label uppercase text-[9px] text-on-surface-variant tracking-widest">Total Jam</span>
            <span className={`block font-bold sm:text-lg ${data.isAbsent ? 'text-outline' : 'text-primary'}`}>{data.totalHours}</span>
          </div>
          <div className={`w-8 h-8 rounded-full bg-surface-container flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : 'text-outline'}`}>
            <span className="material-symbols-outlined text-sm">expand_more</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="pt-4 border-t border-outline-variant/10">
            <div className="grid grid-cols-4 gap-2 bg-surface-container-low p-3 rounded-xl mb-4">
              <TimeBlock label="Masuk" time={data.inTime} isAbsent={data.isAbsent} />
              <TimeBlock label="Istirahat" time={data.breakTime} isAbsent={data.isAbsent} />
              <TimeBlock label="Kembali" time={data.returnTime} isAbsent={data.isAbsent} />
              <TimeBlock label="Pulang" time={data.outTime} isAbsent={data.isAbsent} />
            </div>
            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/10">
              <span className="flex items-center gap-1.5 font-label text-[10px] uppercase font-bold text-on-surface-variant tracking-widest mb-1">
                <span className="material-symbols-outlined text-[14px]">event_note</span> Agenda
              </span>
              <p className="text-sm text-on-surface leading-relaxed">{data.agenda}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TimeBlock = ({ label, time, isAbsent }) => (
  <div className="text-center">
    <span className="block font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">{label}</span>
    <span className={`block font-headline font-bold text-sm sm:text-base ${isAbsent ? 'text-outline' : 'text-primary'}`}>{time}</span>
  </div>
);