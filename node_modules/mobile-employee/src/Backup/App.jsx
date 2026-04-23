import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Card, BottomNav } from '@absensi/ui'; // Menggunakan library monorepo UI Anda

// Import file halaman (Pages)
import Login from './pages/Login'; 
import Profile from './pages/Profile';
import Resign from './pages/Resign';
import Gantipass from './pages/Gantipass';
import Formabsen from './pages/Formabsen';
import Rekap from './pages/Rekap';

// --- KOMPONEN LAYOUT UTAMA (Setelah Login) ---
function AppLayout({ currentRole }) {
  // Di dalam komponen AppLayout:
const navigate = useNavigate();
const location = useLocation();

// PERBAIKAN: Memotong path URL yang aman. 
// Mengambil kata pertama setelah garis miring. Contoh: "/profil" -> "profil"
const activeTab = location.pathname.split('/')[1] || 'home';

const handleTabChange = (tabId) => {
  if (tabId === 'home') {
    navigate('/');
  } else {
    navigate(`/${tabId}`);
  }
};

  return (
    <div className="bg-background font-body text-on-surface antialiased min-h-screen relative pb-20">
      <div className="w-full">
        
        {/* Tempat di mana halaman-halaman dirender berdasarkan URL */}
        <Routes>
          <Route path="/" element={
            <Card>
              <h2 className="text-lg font-bold text-slate-800">Dashboard Utama</h2>
              <p className="text-slate-500 text-sm mt-1">Anda login sebagai: {currentRole}</p>
            </Card>
          } />
          
          
          <Route path="/absen" element={<Formabsen />} />
          
          
          <Route path="/team" element={
            <Card className="bg-blue-50 border-blue-100">
              <h2 className="text-lg font-bold text-blue-800">Pantau Kinerja Tim</h2>
            </Card>
          } />
          
          <Route path="/rekap" element={<Rekap />} />
          
          {/* Menggunakan komponen Profile yang sudah dibuat */}
          <Route path="/profil" element={<Profile />} />
          <Route path="/pengajuan-resign" element={<Resign />} />
          <Route path="/gantipass" element={<Gantipass />} />

          {/* Jika user mengetik URL ngawur, kembalikan ke Home */}
          <Route path="*" element={<Navigate to="/" />} />
          
          
        </Routes>

      </div>

      {/* Bottom Nav tetap berada di bawah dan merespon perubahan URL */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} userRole={currentRole} />
    </div>
  );
}

// --- APLIKASI UTAMA (Pengatur Rute & State) ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [role, setRole] = useState('Staff'); 

  const handleLogin = (userRole) => {
    setRole(userRole);
    setIsLoggedIn(true);
  };

  return (
    <BrowserRouter>
      <Routes>
        {!isLoggedIn ? (
          <>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            {/* Jika belum login dan mencoba akses URL lain, tendang ke /login */}
            <Route path="*" element={<Navigate to="/login" />} />
          </>
        ) : (
          /* Tanda /* penting agar sub-routing di dalam AppLayout bisa berfungsi */
          <Route path="/*" element={<AppLayout currentRole={role} />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}