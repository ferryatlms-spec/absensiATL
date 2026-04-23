import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Card, BottomNav, TopNav, ScrollTop } from '@absensi/ui';
import { supabase } from '@mboksurip/db';

import Login from './pages/Login'; 
import Profile from './pages/Profile';
import Resign from './pages/Resign';
import Gantipass from './pages/Gantipass';
import Formabsen from './pages/Formabsen';
import Rekap from './pages/Rekap';
import Agenda from './pages/Agenda';
import Myteam from './pages/Myteam';
import Dashboard from './pages/Dashboard';

const PrivateLayout = ({ userProfile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.split('/')[1] || 'home';

  const handleTabChange = (tabId) => {
    navigate(tabId === 'home' ? '/dashboard' : `/${tabId}`);
  };

  return (
    <div className="bg-background font-body text-on-surface antialiased min-h-screen relative pb-24">
      <TopNav userProfile={userProfile} />
      <div className="w-full">
        <Outlet />
      </div>
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        userRole={userProfile?.role} 
      />
    </div>
  );
};

export default function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isFetching, setIsFetching] = useState(true);

  // --- TAMBAHKAN BLOK INI ---
  useEffect(() => {
    // 1. Ambil sesi awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setIsFetching(false);
    });

    // 2. Pantau perubahan auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setIsFetching(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);
  // --------------------------

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, nik, role, must_change_password, departments(name), phone, rfid_uid, struktural, join_date, photo_url, department_id, bank, no_rek')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (err) {
      console.error("Gagal mengambil profil:", err.message);
    } finally {
      setIsFetching(false); // Matikan loading
    }
  };

  if (isFetching) return null; // Tunggu sampai data siap

  return (
    <BrowserRouter>
      <ScrollTop />
      <Routes>
        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : userProfile?.must_change_password ? (
          /* KUNCI KE HALAMAN GANTI PASSWORD JIKA FLAG TRUE */
          <>
            <Route path="/gantipass" element={<Gantipass isForced={true} />} />
            <Route path="*" element={<Navigate to="/gantipass" replace />} />
          </>
        ) : (
          /* JIKA AMAN, TAMPILKAN MENU NORMAL */
          <Route element={<PrivateLayout userProfile={userProfile} />}>
            <Route path="/dashboard" element={<Dashboard userProfile={userProfile} />} />
            <Route path="/absen" element={<Formabsen userProfile={userProfile} />} />
            <Route path="/rekap" element={<Rekap userProfile={userProfile} />} />
            <Route path="/profil" element={<Profile userProfile={userProfile} />} />
            <Route path="/pengajuan-resign" element={<Resign />} />
            <Route path="/gantipass" element={<Gantipass isForced={false} />} />
            <Route path="/agenda" element={<Agenda userProfile={userProfile} />} />
            
            {userProfile?.role === 'PIC' ? (
              <Route path="/team" element={<Myteam userProfile={userProfile} />} />
            ) : (
              <Route path="/team" element={<Navigate to="/dashboard" replace />} />
            )}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}