'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, FileText, Building2 } from 'lucide-react';

const opdOptions = [
  { id: '', label: '— Pilih OPD —' },
  { id: 'opd-dikpora', label: 'Dinas Pendidikan, Pemuda, dan Olahraga' },
  { id: 'opd-dinkes', label: 'Dinas Kesehatan' },
  { id: 'opd-dinsos', label: 'Dinas Sosial' },
  { id: 'opd-diskopukm', label: 'Dinas Koperasi dan UKM' },
  { id: 'opd-disperindag', label: 'Dinas Perindustrian dan Perdagangan' },
  { id: 'opd-dpmptsp', label: 'Dinas Penanaman Modal & PTSP' },
];

export default function DaftarPage() {
  const [form, setForm] = useState({ name: '', nip: '', email: '', opdId: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [setuju, setSetuju] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function ubah(field: string, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Konfirmasi kata sandi tidak sama');
      return;
    }
    if (!setuju) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registrasi gagal');
        return;
      }
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  const inputContainerCls = "flex items-center gap-2.5 border border-gray-200 rounded-lg px-3.5 py-2.5 bg-white transition focus-within:border-[#8B1E1E] focus-within:ring-1 focus-within:ring-[#8B1E1E]";

  return (
    <div className="w-full">
      {/* Header Halaman Sesuai Desain */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-extrabold text-[#8B1E1E] tracking-tight">DAFTAR USER OPD</h1>
        <p className="font-bold text-gray-800 text-xs tracking-wider uppercase mt-1">ANALISIS SENTIMEN PELAYANAN PUBLIK</p>
        <p className="text-xs text-gray-500 mt-1">Lengkapi data berikut untuk mendaftar sebagai User OPD.</p>
      </div>

      {/* Card Form Putih */}
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 sm:p-10">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-diy.png" alt="Logo DIY" className="w-12 h-12 object-contain mb-2" />
          <h2 className="text-base font-bold text-[#8B1E1E] tracking-wide">SENTIMEN ANALISIS DIY</h2>
          <p className="text-[9px] tracking-[0.2em] font-semibold text-gray-400 uppercase mt-0.5">SISTEM OTENTIKASI</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Baris 1: Nama Lengkap & NIP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Lengkap</label>
              <div className={inputContainerCls}>
                <User size={15} className="text-gray-400 flex-shrink-0" />
                <input 
                  value={form.name} 
                  onChange={(e) => ubah('name', e.target.value)} 
                  placeholder="Budi Setiawan" 
                  className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent" 
                  required 
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">NIP (Nomor Induk Pegawai)</label>
              <div className={inputContainerCls}>
                <FileText size={15} className="text-gray-400 flex-shrink-0" />
                <input 
                  value={form.nip} 
                  onChange={(e) => ubah('nip', e.target.value)} 
                  placeholder="198501012010011001" 
                  className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent" 
                  required 
                />
              </div>
            </div>
          </div>

          {/* Baris 2: Alamat Email */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Alamat Email</label>
            <div className={inputContainerCls}>
              <Mail size={15} className="text-gray-400 flex-shrink-0" />
              <input 
                type="email" 
                value={form.email} 
                onChange={(e) => ubah('email', e.target.value)} 
                placeholder="budi@jogjaprov.go.id" 
                className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent" 
                required 
              />
            </div>
          </div>

          {/* Baris 3: Pilihan OPD */}
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">OPD (Organisasi Perangkat Daerah)</label>
            <div className={inputContainerCls}>
              <Building2 size={15} className="text-gray-400 flex-shrink-0" />
              <select 
                value={form.opdId} 
                onChange={(e) => ubah('opdId', e.target.value)} 
                className="w-full text-xs outline-none text-gray-800 bg-transparent cursor-pointer"
                required
              >
                {opdOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris 4: Kata Sandi & Konfirmasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Kata Sandi</label>
              <div className={inputContainerCls}>
                <Lock size={15} className="text-gray-400 flex-shrink-0" />
                <input 
                  type={showPass ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={(e) => ubah('password', e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent" 
                  required 
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Konfirmasi Kata Sandi</label>
              <div className={inputContainerCls}>
                <Lock size={15} className="text-gray-400 flex-shrink-0" />
                <input 
                  type={showConfirm ? 'text' : 'password'} 
                  value={form.confirm} 
                  onChange={(e) => ubah('confirm', e.target.value)} 
                  placeholder="••••••••" 
                  className="w-full text-xs outline-none text-gray-800 placeholder:text-gray-300 bg-transparent" 
                  required 
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {/* Checkbox Syarat & Ketentuan */}
          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={setuju} 
                onChange={(e) => setSetuju(e.target.checked)} 
                className="w-3.5 h-3.5 rounded accent-[#8B1E1E] cursor-pointer" 
              />
              <span>
                Saya menyetujui <span className="text-[#8B1E1E] font-bold">syarat dan ketentuan</span> yang berlaku.
              </span>
            </label>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2.5">{error}</p>}

          {/* Tombol Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#8B1E1E] hover:bg-[#721818] active:bg-[#5C1313] text-white font-bold text-xs py-3 rounded-lg transition shadow-md shadow-red-900/10 disabled:opacity-50 mt-2"
          >
            {loading ? 'MEMPROSES...' : 'DAFTAR SEBAGAI USER OPD'}
          </button>
        </form>

        {/* Footer Masuk */}
        <div className="border-t border-gray-100 mt-6 pt-4 text-center text-xs text-gray-500">
          Sudah memiliki akun? <Link href="/login" className="text-[#8B1E1E] font-bold hover:underline ml-1">Masuk</Link>
        </div>
      </div>
    </div>
  );
}