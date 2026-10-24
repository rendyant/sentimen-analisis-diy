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
        setError(data.message || 'Email atau kata sandi tidak valid');
        return;
      }
      // Redirect sesuai role
      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Gagal menghubungi server. Pastikan server frontend berjalan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header Judul */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-extrabold text-[#8B1E1E] tracking-tight">LOGIN</h1>
        <p className="font-bold text-gray-800 text-xs tracking-wider uppercase mt-1">ANALISIS SENTIMEN PELAYANAN PUBLIK</p>
        <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
          Masuk untuk memantau dan menganalisis sentimen pelayanan publik pada setiap instansi Organisasi Perangkat Daerah (OPD) DIY.
        </p>
      </div>

      {/* Card Form Putih */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-diy.png" alt="Logo DIY" className="w-12 h-12 object-contain mb-2" />
          <h2 className="text-base font-bold text-[#8B1E1E] tracking-wide">SENTIMEN ANALISIS DIY</h2>
          <p className="text-[9px] tracking-[0.2em] font-semibold text-gray-400 uppercase mt-0.5">SISTEM OTENTIKASI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Alamat Email</label>
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-lg px-3.5 py-2.5 bg-white transition focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]">
              <Mail size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jogjaprov.go.id"
                className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Kata Sandi</label>
            <div className="flex items-center gap-2.5 border border-gray-200 rounded-lg px-3.5 py-2.5 bg-white transition focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]">
              <Lock size={15} className="text-gray-400 flex-shrink-0" />
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent"
                required
              />
              <button type="button" onClick={() => setShow(!show)} className="text-gray-400 hover:text-gray-600">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ingat}
                onChange={(e) => setIngat(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#8B1E1E] cursor-pointer"
              />
              <span>Ingat Saya</span>
            </label>
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5 text-center font-medium">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#8B1E1E] hover:bg-[#721818] active:bg-[#5C1313] text-white font-bold text-xs py-3 rounded-lg transition shadow-md shadow-red-900/10 disabled:opacity-50 mt-2"
          >
            {loading ? 'MEMPROSES...' : 'MASUK '}
          </button>
        </form>

        <div className="border-t border-gray-100 mt-6 pt-4 text-center text-xs text-gray-500">
          Belum memiliki akun? <Link href="/daftar" className="text-[#8B1E1E] font-bold hover:underline ml-1">Daftar</Link>
        </div>
      </div>
    </div>
  );
}