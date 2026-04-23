import React, { useState } from 'react';
import Statistik from './Statistik';
import { Cuti } from './Cuti';
import Riwayat from './Riwayat';

export default function Rekap({ userProfile }) {
  const [activeTab, setActiveTab] = useState('statistik');

  // Helper untuk membuat tombol navigasi lebih rapi
  const tabs = [
    { id: 'statistik', label: 'Statistik' },
    { id: 'cuti', label: 'Libur' },
    { id: 'riwayat', label: 'Riwayat' }
  ];

  return (
    <main className="max-w-screen-xl mx-auto px-6 mt-8 pb-12">
      {/* Editorial Header */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="font-label uppercase tracking-widest text-xs text-secondary font-bold mb-2 block">Portal Karyawan</span>
          <h2 className="font-headline font-bold text-5xl text-primary tracking-tight">Rekap & Pengajuan</h2>
          <p className="text-on-surface-variant mt-2 max-w-md">Pantau performa absensi dan kelola pengajuan cuti dalam satu dashboard eksklusif.</p>
        </div>

        {/* Menu Navigasi di Rekap.jsx */}
        <div className="grid grid-cols-2 md:flex items-center gap-3 bg-surface-container-low p-2 rounded-xl w-full md:w-fit">
         <button 
          onClick={() => setActiveTab('statistik')}
          className={`px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
          activeTab === 'statistik' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
          }`}
          >
          Statistik
        </button>
  
        <button 
        onClick={() => setActiveTab('riwayat')}
        className={`px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
        activeTab === 'riwayat' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
        }`}
        >
        Riwayat
        </button>

      {/* col-span-2 membuat tombol Cuti memenuhi baris kedua pada mobile */}
      <button 
        onClick={() => setActiveTab('cuti')}
        className={`col-span-2 md:col-span-1 px-4 py-2.5 rounded-lg font-bold transition-all text-sm ${
        activeTab === 'cuti' ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant'
        }`}
        >
        Cuti
      </button>
    </div>
      </section>

      {/* Konten Area (Full Width) */}
      <div className="w-full">
        {activeTab === 'statistik' && ( <Statistik userProfile={userProfile} /> )}
        {activeTab === 'riwayat' && ( <Riwayat userProfile={userProfile} /> )}
        {activeTab === 'cuti' && ( <Cuti userProfile={userProfile} /> )}
      </div>
    </main>
  );
};
