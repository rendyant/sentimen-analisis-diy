'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function PengaturanPage() {
  const [nama, setNama] = useState('Admin Analis Dikpora DIY');
  const [email, setEmail] = useState('user@dikpora.go.id');
  const [instansi, setInstansi] = useState('Dinas Pendidikan, Pemuda dan Olahraga DIY');
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pengaturan</h1>
      <p className="text-sm text-gray-500 mb-6">Kelola akun dan preferensi dashboard OPD</p>

      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm max-w-xl">
        <h3 className="font-bold text-gray-900 mb-4">Profil Akun OPD</h3>
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-semibold text-green-700">
            <CheckCircle2 size={14} /> Perubahan profil berhasil disimpan.
          </div>
        )}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Instansi</label>
            <input
              type="text"
              value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-800"
            />
          </div>
          <button
            type="submit"
            className="bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-950 transition"
          >
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
}