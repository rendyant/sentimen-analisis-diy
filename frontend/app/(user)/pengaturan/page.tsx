export default function PengaturanPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pengaturan</h1>
      <p className="text-sm text-gray-500 mb-6">Kelola akun dan preferensi dashboard</p>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm max-w-xl">
        <h3 className="font-bold text-gray-900 mb-4">Profil Admin</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
            <input type="text" defaultValue="Budi Santoso, S.Kom., M.T." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input type="email" defaultValue="admin@diy.go.id" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Instansi</label>
            <input type="text" defaultValue="Pemerintah Kota" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800" />
          </div>
          <button className="bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-950 transition">
            Simpan Perubahan
          </button>
        </div>
      </div>
    </div>
  );
}