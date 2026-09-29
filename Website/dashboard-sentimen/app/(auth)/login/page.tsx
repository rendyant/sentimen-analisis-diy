'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [ingat, setIngat] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Login gagal');
        return;
      }
      router.push(data.role === 'ADMIN' ? '/admin' : '/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-red-800 tracking-wide">LOGIN</h1>
        <p className="font-bold text-gray-800 mt-2 text-sm">ANALISIS SENTIMEN PELAYANAN PUBLIK</p>
        <p className="text-sm text-gray-500 mt-2">
          Masuk untuk memantau dan menganalisis sentimen pelayanan publik pada setiap instansi Organisasi Perangkat Daerah (OPD) DIY.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-diy.png" alt="Logo DIY" className="w-16 h-16 object-contain mb-3" />
          <h2 className="font-bold text-red-800">SENTIMEN ANALISIS DIY</h2>
          <div className="w-24 h-px bg-red-200 my-2"></div>
          <p className="text-[10px] tracking-widest text-gray-500 uppercase">Sistem Otentikasi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Alamat Email</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-red-700">
              <Mail size={16} className="text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jogjaprov.go.id"
                className="w-full text-sm outline-none text-gray-900"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Kata Sandi</label>
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-red-700">
              <Lock size={16} className="text-gray-400" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
                className="w-full text-sm outline-none text-gray-900"
                required
              />
              <button type="button" onClick={() => setShow(!show)} className="text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={ingat} onChange={(e) => setIngat(e.target.checked)} className="accent-red-800" />
            Ingat Saya
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-900 text-white font-bold text-sm py-3 rounded-lg hover:bg-red-950 transition disabled:opacity-50"
          >
            {loading ? 'MEMPROSES...' : 'MASUK SISTEM'}
          </button>
        </form>

        <div className="border-t border-gray-100 mt-6 pt-4 text-center text-sm text-gray-500">
          Belum memiliki akun? <Link href="/daftar" className="text-red-700 font-bold">Daftar</Link>
        </div>
      </div>
    </div>
  );
}