import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@mboksurip/db';

// 1. Helper Penentu 3 Periode Gaji Terakhir
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
    const shortLabel = endDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    const offsetStart = startDate.getTimezoneOffset() * 60000;
    const startStr = (new Date(startDate - offsetStart)).toISOString().split('T')[0];
    
    const offsetEnd = endDate.getTimezoneOffset() * 60000;
    const endStr = (new Date(endDate - offsetEnd)).toISOString().split('T')[0];

    periods.push({ id: i, startStr, endStr, label, shortLabel });
  }
  return periods;
};

// Rumus baru: Menghitung selisih jam kerja bersih (dipotong istirahat)
const getNumericHours = (inT, outT, breakStartT, breakEndT) => {
  if (!inT || !outT) return 0; // Jika belum absen pulang, jam = 0

  // 1. Hitung total jam dari Masuk sampai Pulang
  const start = new Date(inT.includes('-') ? inT : `2000-01-01T${inT}`);
  const end = new Date(outT.includes('-') ? outT : `2000-01-01T${outT}`);
  let totalHours = (end - start) / (1000 * 60 * 60);

  // 2. Jika ada absen Istirahat & Kembali, hitung durasinya dan potong
  if (breakStartT && breakEndT) {
    const bStart = new Date(breakStartT.includes('-') ? breakStartT : `2000-01-01T${breakStartT}`);
    const bEnd = new Date(breakEndT.includes('-') ? breakEndT : `2000-01-01T${breakEndT}`);
    const breakDuration = (bEnd - bStart) / (1000 * 60 * 60);
    
    // Kurangi total jam dengan durasi istirahat
    if (breakDuration > 0) {
      totalHours -= breakDuration;
    }
  }

  return totalHours > 0 ? totalHours : 0;
};

const getMinutesFromTime = (timeStr) => {
  if (!timeStr) return null;
  let t = timeStr;
  if (t.includes('T')) t = t.split('T')[1];
  if (t.includes(' ')) t = t.split(' ')[1];
  const [h, m] = t.split(':');
  return parseInt(h) * 60 + parseInt(m);
};

export default function Statistik({ userProfile }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    hariKerja: 0, totalJam: "0.00", rerataJamHari: '0.00', totalLibur: 0,
    persenTarget: 0, persenHadir: 0, persenTepat: 0, persenEfisien: 0
  });

  const availablePeriods = useMemo(() => generatePayrollPeriods(), []);
  const [selectedPeriod, setSelectedPeriod] = useState(availablePeriods[0]);
  const TARGET_JAM_BULANAN = 200; 

  useEffect(() => {
    if (userProfile?.id && selectedPeriod) fetchStatistik();
  }, [userProfile, selectedPeriod]);

  // PENJELASAN: Mengambil data absen dan menghitung metrik secara otomatis
  const fetchStatistik = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('absen')
        .select('date, status, clock_in_time, clock_out_time, break_start_time, break_end_time')
        .eq('employee_id', userProfile.id)
        .gte('date', selectedPeriod.startStr)
        .lte('date', selectedPeriod.endStr);

      if (error) throw error;

      let countHadir = 0, totalJamDec = 0, totalLiburIzin = 0, tepatWaktuCount = 0;

      data.forEach(row => {
        // PENJELASAN: Dihitung sebagai 'Hari Kerja' jika status Hadir atau ada jam masuknya
        const isHadir = row.status === 'Hadir' || row.clock_in_time;
        if (isHadir) {
          countHadir++;
          const jamHariIni = getNumericHours(row.clock_in_time, row.clock_out_time, row.break_start_time, row.break_end_time);
          totalJamDec += jamHariIni;
          // Asumsi Tepat Waktu jika masuk sebelum 08:15
          if (row.clock_in_time && row.clock_in_time.split('T')[1] <= '08:15') tepatWaktuCount++;
        } else {
          totalLiburIzin++;
        }
      });

      // Kalkulasi Persentase UI
      const persenTarget = Math.min(100, Math.round((totalJamDec / TARGET_JAM_BULANAN) * 100));

      setStats({
        hariKerja: countHadir, // PENJELASAN: Sekarang angka ini otomatis muncul sesuai data database
        totalJam: totalJamDec.toFixed(2),
        rerataJamHari: countHadir > 0 ? (totalJamDec / countHadir).toFixed(2) : '0.00',
        totalLibur: totalLiburIzin,
        persenTarget,
        persenHadir: (countHadir + totalLiburIzin) > 0 ? Math.round((countHadir / (countHadir + totalLiburIzin)) * 100) : 0,
        persenTepat: countHadir > 0 ? Math.round((tepatWaktuCount / countHadir) * 100) : 0,
        persenEfisien: countHadir > 0 ? Math.min(100, Math.round(((totalJamDec / countHadir) / 8) * 100)) : 0
      });
    } catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  // Kalkulasi Offset SVG (Agar lingkaran terisi sesuai persentase)
  const calcOffset = (percent, circumference) => circumference - (percent / 100) * circumference;
  const circMain = 282.7; // Keliling r=45
  const circSmall = 263.8; // Keliling r=42

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* HEADER & DROPDOWN */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <p className="font-['Inter'] font-semibold text-[10px] uppercase tracking-[0.2em] text-secondary mb-1">
            DATA IKHTISAR
          </p>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight">Performa {selectedPeriod.shortLabel}</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-sm">calendar_month</span>
          <select 
            value={selectedPeriod.id} 
            onChange={(e) => setSelectedPeriod(availablePeriods.find(p => p.id === parseInt(e.target.value)))}
            className="text-xs sm:text-sm font-medium bg-surface-container-low text-on-surface border border-outline-variant/50 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary cursor-pointer transition-all"
            disabled={loading}
          >
            {availablePeriods.map((p) => (
              <option key={p.id} value={p.id}>{p.id === 0 ? `Bulan Ini (${p.label})` : p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center items-center h-64 border-2 border-dashed border-outline-variant/30 rounded-[2.5rem]">
           <p className="animate-pulse text-outline-variant font-medium">Mengkalkulasi metrik & diagram...</p>
         </div>
      ) : (
        <>
          {/* TOP METRICS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <MetricCard label="Hari Kerja" value={stats.hariKerja} unit="Hari" icon="calendar_month" />
            <MetricCard label="Total Jam" value={stats.totalJam} unit="Jam" icon="schedule" />
            <MetricCard label= "Rerata Jam/Hari" value={stats.rerataJamHari} unit= "Jam" icon= "timelapse" />
            <MetricCard label="Total Libur & Cuti" value={stats.totalLibur} unit="Hari" icon="event_available" />
          </div>

          {/* CIRCULAR DIAGRAM SECTION */}
          <section className="mb-10">
            <div className="bg-primary rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-primary/30">
              <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/15 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                  <div>
                    <h4 className="text-white font-['Manrope'] font-bold text-xl">Target Kerja Bulanan</h4>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest mt-1">
                      {selectedPeriod.label} • {stats.totalJam}/{TARGET_JAM_BULANAN} JAM
                    </p>
                  </div>
                  <div className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                    <span className="text-secondary-container text-xs font-bold">{stats.persenTarget}% Tercapai</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-12 lg:flex-row lg:justify-around">
                  
                  {/* MAIN DONUT CHART (JAM AKTIF) */}
                  <div className="relative w-56 h-56 flex items-center justify-center group">
                    <svg className="w-full h-full -rotate-90 transform drop-shadow-xl" viewBox="0 0 100 100">
                      <circle className="text-white/5" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeWidth="8"></circle>
                      <circle 
                        className="text-secondary-container transition-all duration-1000 ease-out" 
                        cx="50" cy="50" fill="none" r="45" stroke="currentColor" 
                        strokeDasharray={circMain} 
                        strokeDashoffset={calcOffset(stats.persenTarget, circMain)} 
                        strokeLinecap="round" strokeWidth="8"
                      ></circle>
                    </svg>
                    <div className="absolute flex flex-col items-center transition-transform group-hover:scale-110">
                      <span className="text-5xl font-black text-white tracking-tighter">{stats.totalJam}</span>
                      <span className="text-[10px] font-bold text-white/50 tracking-widest uppercase mt-1">Jam Aktif</span>
                    </div>
                  </div>

                  {/* 3 SMALL CIRCLES */}
                  <div className="grid grid-cols-3 gap-6 w-full lg:w-auto">
                    
                    {/* HADIR */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16 flex items-center justify-center hover:scale-105 transition-transform">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle className="text-white/5" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="12"></circle>
                          <circle 
                            className="text-white/80 transition-all duration-1000 ease-out delay-100" 
                            cx="50" cy="50" fill="none" r="42" stroke="currentColor" 
                            strokeDasharray={circSmall} 
                            strokeDashoffset={calcOffset(stats.persenHadir, circSmall)} 
                            strokeLinecap="round" strokeWidth="12"
                          ></circle>
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">{stats.persenHadir}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center">Hadir</span>
                    </div>

                    {/* TEPAT */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16 flex items-center justify-center hover:scale-105 transition-transform">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle className="text-white/5" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="12"></circle>
                          <circle 
                            className="text-secondary-container transition-all duration-1000 ease-out delay-200" 
                            cx="50" cy="50" fill="none" r="42" stroke="currentColor" 
                            strokeDasharray={circSmall} 
                            strokeDashoffset={calcOffset(stats.persenTepat, circSmall)} 
                            strokeLinecap="round" strokeWidth="12"
                          ></circle>
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">{stats.persenTepat}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center">Tepat</span>
                    </div>

                    {/* EFISIEN */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative w-16 h-16 flex items-center justify-center hover:scale-105 transition-transform">
                        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                          <circle className="text-white/5" cx="50" cy="50" fill="none" r="42" stroke="currentColor" strokeWidth="12"></circle>
                          <circle 
                            className="text-white/80 transition-all duration-1000 ease-out delay-300" 
                            cx="50" cy="50" fill="none" r="42" stroke="currentColor" 
                            strokeDasharray={circSmall} 
                            strokeDashoffset={calcOffset(stats.persenEfisien, circSmall)} 
                            strokeLinecap="round" strokeWidth="12"
                          ></circle>
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">{stats.persenEfisien}%</span>
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest text-center">Efisien</span>
                    </div>

                  </div>
                </div>

                {/* INSIGHT MESSAGE */}
                <div className="mt-12 pt-8 border-t border-white/10 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex shrink-0 items-center justify-center">
                    <span className="material-symbols-outlined text-secondary-container text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed">
                    <span className="font-bold text-white">
                      {stats.persenTarget >= 100 ? "Luar biasa! " : stats.persenTarget >= 80 ? "Kerja bagus! " : "Tetap semangat! "}
                    </span> 
                    {stats.persenTarget >= 100 
                      ? "Anda telah mencapai target jam kerja penuh bulan ini. Pertahankan performa Anda!" 
                      : `Jam kerja Anda tercatat. Kurang ${TARGET_JAM_BULANAN - stats.totalJam} jam lagi untuk mencapai target sempurna periode ini.`}
                  </p>
                </div>

              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const MetricCard = ({ label, value, unit, icon }) => (
  <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/10 shadow-sm hover:shadow-md transition-shadow">
    <span className="material-symbols-outlined text-secondary mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
    <h3 className="text-2xl font-black text-primary">{value} <span className="text-sm font-medium text-outline">{unit}</span></h3>
  </div>
);