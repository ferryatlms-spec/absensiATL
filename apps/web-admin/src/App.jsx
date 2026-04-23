import { ButtonUtama } from '@absensi/ui';

function App() {
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          Dashboard Admin & HRD
        </h1>
        <p className="text-gray-600 mb-6">
          Sistem Absensi Multi-Outlet
        </p>
        
        {/* Tombol ini dipanggil dari packages/ui */}
        <ButtonUtama onClick={() => alert('Halo! Komponen Shared UI berhasil dipanggil.')}>
          Tes Komponen Tombol
        </ButtonUtama>
      </div>
    </div>
  )
}

export default App;