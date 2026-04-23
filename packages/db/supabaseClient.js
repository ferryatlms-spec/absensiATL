import { createClient } from '@supabase/supabase-js';

// Ambil URL dan KEY dari environment variables aplikasi utama
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // WAJIB TRUE: Supabase akan refresh token otomatis
    persistSession: true,   // Menyimpan sesi di localStorage
    detectSessionInUrl: true 
  }
})

export const db = {
  // Query untuk profil karyawan
  getEmployee: async (userId) => {
    return await supabase
      .from('employees')
      .select('*, outlets(name)')
      .eq('id', userId)
      .single();
  },

  // Query untuk log absensi hari ini
  getTodayAttendance: async (employeeId) => {
    const today = new Date().toISOString().split('T')[0];
    return await supabase
      .from('attendance_logs')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle();
  },

  // Fungsi Clock In
  clockIn: async (employeeId, outletId, agenda) => {
    return await supabase.from('attendance_logs').insert({
      employee_id: employeeId,
      outlet_id: outletId,
      clock_in_time: new Date().toISOString(),
      agenda: agenda,
      status: 'Hadir'
    });
  },

  // Fungsi Ambil Request Cuti (Untuk Dashboard PIC)
  getPendingApprovals: async (outletId) => {
    return await supabase
      .from('leave_requests')
      .select('*, employees(name, role)')
      .eq('status', 'Pending');
      // Nantinya bisa difilter berdasarkan outletId
  }
};