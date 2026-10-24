'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, LogOut, UserCircle } from 'lucide-react';

export default function Header() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex items-center justify-between">
      <h1 className="text-lg font-bold text-gray-900">SENTIMENT ANALYSIS OPD DIY</h1>

      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-gray-100 rounded-full">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Dropdown profil */}
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold">Budi Santoso, S.Kom., M.T.</p>
              <p className="text-xs text-gray-500">Pemerintah Kota</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-sm font-bold">
              BS
            </div>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-800">Budi Santoso, S.Kom., M.T.</p>
                  <p className="text-xs text-gray-500">user@dikpora.go.id</p>
                </div>
                <Link
                  href="/pengaturan"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <UserCircle size={16} /> Profil & Pengaturan Akun
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={16} /> Keluar Sistem
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}