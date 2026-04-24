import React from 'react';
// Pastikan path logo Anda benar
import Logo from './src/logoms.svg'; 
import { supabase } from '@mboksurip/db';

export const TopNav = ({ userProfile }) => {
  // 1. Ekstrak data dengan fallback (nilai default) jika data kosong
  const userName = userProfile?.name || "Karyawan";
  const role = userProfile?.departments?.name || userProfile?.role || "Staff";
  
  // 2. Logika Foto Profil: Ambil dari database, jika kosong buat inisial nama otomatis
  // Sesuaikan 'photo_url' dengan nama kolom foto di tabel employees Anda
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=390008&color=fff&bold=true`;
  const avatarUrl = userProfile?.photo_url || userProfile?.avatar_url || defaultAvatar;

  return (
    <header className="bg-[#fff8f7]/80 text-[#390008] sticky top-0 z-50 w-full border-none backdrop-blur-md shadow-sm shadow-[#390008]/5">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-screen-2xl mx-auto">
        
        {/* Sisi Kiri: Logo */}
        <div className="flex items-center gap-4">
          <img 
            alt="Mbok Surip Group Logo" 
            className="h-10 w-auto object-contain" 
            src={Logo}
          />
        </div>

        {/* Sisi Kanan: Identitas User & Notifikasi */}
        <div className="flex items-center gap-4">
          
          <div className="flex flex-col items-end mr-1">
            <span className="font-inter uppercase tracking-[0.15em] text-[10px] text-stone-500 font-bold">
              {role}
            </span>
            <span className="font-manrope font-extrabold text-sm text-[#390008]">
              Halo, {userName}
            </span>
          </div>

          {/* Avatar Profile */}
          <div className="h-10 w-10 rounded-full bg-stone-200 overflow-hidden ring-2 ring-[#390008]/10 shadow-sm">
            <img 
              alt={`Profil ${userName}`} 
              className="h-full w-full object-cover" 
              src={avatarUrl} 
            />
          </div>

          {/* Tombol Notifikasi */}
          <button className="material-symbols-outlined text-[#390008] p-2 rounded-full hover:bg-white hover:shadow-sm transition-all active:scale-90">
            notifications
          </button>
        </div>

      </div>
    </header>
  );
};