import React, { useState, useEffect } from 'react';
import ModalCuti from './ModalCuti';
import { supabase } from '@mboksurip/db';

export const Cuti = ({ userProfile }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [riwayatCuti, setRiwayatCuti] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) fetchRiwayatCuti();
  }, [userProfile]);

  const fetchRiwayatCuti = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pengajuan_cuti')
        .select('*')
        .eq('employee_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRiwayatCuti(data || []);
    } catch (err) {
      console.error("Gagal menarik data cuti:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCuti = async (formData) => {
    try {
      const { error } = await supabase.from('pengajuan_cuti').insert([{
        employee_id: userProfile.id,
        department_id: userProfile?.department_id || userProfile?.departments?.id,
        tipe_izin: formData.tipe_izin,
        start_date: formData.startDate,
        end_date: formData.endDate,
        alasan: formData.reason,
        status: 'Pending' // Akan menunggu persetujuan PIC
      }]);

      if (error) throw error;
      fetchRiwayatCuti(); // Refresh data
      setIsModalOpen(false);
    } catch (err) {
      console.error("Gagal mengajukan cuti:", err.message);
    }
  };

  const hitungDurasi = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return `${diff} Hari`;
  };

  return (
    <div className="bg-surface-container-high p-8 rounded-2xl h-full animate-in fade-in duration-500 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-3xl">event_available</span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-3xl text-primary tracking-tight">Kelola Cuti & Izin</h3>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="py-4 px-8 rounded-full font-bold text-white bg-secondary shadow-lg active:scale-95 flex items-center gap-2">
          <span className="material-symbols-outlined">add</span> Ajukan Izin
        </button>
      </div>

      <div className="space-y-4">
        <span className="font-label uppercase text-xs font-bold text-on-surface-variant tracking-widest px-2">Riwayat Pengajuan</span>
        {loading ? (
          <p className="text-sm px-2 text-stone-500">Memuat riwayat...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riwayatCuti.length === 0 ? (
              <p className="text-sm px-2 text-stone-500">Belum ada riwayat pengajuan.</p>
            ) : (
              riwayatCuti.map(item => (
                <LeaveItem 
                  key={item.id}
                  title={`Izin ${item.tipe_izin}`} 
                  date={`${item.start_date} s/d ${item.end_date}`} 
                  status={item.status} 
                  type={item.alasan} 
                  duration={hitungDurasi(item.start_date, item.end_date)} 
                  color={item.status === 'Approved' ? 'emerald-500' : item.status === 'Rejected' ? 'error' : 'secondary'} 
                />
              ))
            )}
          </div>
        )}
      </div>

      <ModalCuti isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveCuti} />
    </div>
  );
};

const LeaveItem = ({ title, date, status, type, duration, color }) => (
  <div className={`bg-surface-container-lowest p-6 rounded-2xl border-l-[6px] border-${color} shadow-sm flex flex-col justify-between`}>
    <div className="flex justify-between items-start mb-4">
      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-surface-container px-2 py-1 rounded">{duration}</span>
      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
        status === 'Approved' ? 'bg-emerald-100 text-emerald-700' : status === 'Rejected' ? 'bg-error-container text-error' : 'bg-secondary-container text-secondary'
      }`}>{status}</span>
    </div>
    <h4 className="font-headline font-bold text-lg text-primary mb-1">{title}</h4>
    <p className="text-xs font-medium text-stone-500 mb-4">{date}</p>
    <div className="p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-lg">
      <p className="text-[11px] font-medium text-on-surface-variant truncate">{type}</p>
    </div>
  </div>
);