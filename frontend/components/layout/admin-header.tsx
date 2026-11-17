'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, LogOut, UserCircle, ShieldCheck } from 'lucide-react';

export default function HeaderAdmin() {
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-10 bg-white border-b px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-gray-900">SENTIMENT ANALYSIS DIY</h1>
        <span className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-full">
          <ShieldCheck size={12} /> SUPER ADMIN
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Dropdown Notifikasi */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setOpen(false);
            }}
            className="relative p-2 hover:bg-gray-100 rounded-full"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              2
            </span>
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-3 z-20">
                <p className="text-xs font-bold text-gray-800 border-b border-gray-100 pb-2 mb-2">
                  Notifikasi Super Admin
                </p>
                <div className="space-y-2 text-xs">
                  <Link
                    href="/admin/manajemen-user"
                    onClick={() => setNotifOpen(false)}
                    className="block p-2 rounded-lg hover:bg-gray-50"
                  >
                    <p className="font-semibold text-amber-700">2 Pendaftaran Akun OPD Menunggu</p>
                    <p className="text-gray-500 text-[11px]">Klik untuk meninjau & menyetujui user baru.</p>
                  </Link>
                  <Link
                    href="/admin/ulasan"
                    onClick={() => setNotifOpen(false)}
                    className="block p-2 rounded-lg hover:bg-gray-50"
                  >
                    <p className="font-semibold text-red-700">Ulasan Negatif Baru Terdeteksi</p>
                    <p className="text-gray-500 text-[11px]">Pantau rincian aspirasi publik lintas OPD.</p>
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setOpen(!open);
              setNotifOpen(false);
            }}
            className="flex items-center gap-3"
          >
            <div className="text-right">
              <p className="text-sm font-semibold">Super Admin Pemda DIY</p>
              <p className="text-xs text-gray-500">admin@jogjaprov.go.id</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-red-100 text-red-800 flex items-center justify-center text-sm font-bold">
              SA
            </div>
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-20">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-800">Super Admin Pemda DIY</p>
                  <p className="text-xs text-gray-500">admin@jogjaprov.go.id</p>
                </div>
                <Link
                  href="/admin/pengaturan"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <UserCircle size={16} /> Profil & Pengaturan Akun
                </Link>
                <button
                  type="button"
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