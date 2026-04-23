const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser'); // Install dengan: npm install csv-parser

// KONFIGURASI
const SUPABASE_URL = 'https://ktbotjuairayoayhmmpj.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0Ym90anVhaXJheW9heWhtbXBqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM4NzQzMiwiZXhwIjoyMDkxOTYzNDMyfQ.tBVvmIz_9HffBSOlyvpEqZ-1d0vIqdMd8BEt9q8RePo';
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function registerEmployees() {
  const results = [];

  // Baca file CSV Anda
  fs.createReadStream('users.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      console.log(`Memproses ${results.length} karyawan...`);

      for (const row of results) {
        try {
          // 1. BUAT AKUN AUTH (Agar bisa login dengan No HP + Password)
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            phone: row.phone, // Format: +628...
            password: row.password, // Password default dari Excel
            phone_confirm: true, // BYPASS OTP (Langsung aktif)
            user_metadata: { name: row.name }
          });

          if (authError) throw authError;

          // 2. MASUKKAN KE TABEL EMPLOYEES (Profil Lengkap)
          const { error: dbError } = await supabase
            .from('employees')
            .insert({
              id: authUser.user.id, // ID diambil dari Auth yang baru dibuat
              nik: row.nik,
              name: row.name,
              phone: row.phone,
              role: row.role,
              outlet_id: row.outlet_id, // UUID dari tabel outlets
              divisi: row.divisi,
              join_date: row.join_date,
              bank: row.bank,
              no_rek: row.no_rek
            });

          if (dbError) throw dbError;
          console.log(`✅ Berhasil: ${row.name}`);

        } catch (err) {
          console.error(`❌ Gagal untuk ${row.name}:`, err.message);
        }
      }
    });
}

registerEmployees();