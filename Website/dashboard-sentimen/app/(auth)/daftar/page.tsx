'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Eye, EyeOff, FileText, Building2 } from 'lucide-react';

const opdOptions = [
  { id: '', label: '— Pilih OPD —' },
  { id: 'opd-dikpora', label: 'Dinas Pendidikan, Pemuda, dan Olahraga' },
  { id: 'opd-dinkes', label: 'Dinas Kesehatan' },
  { id: 'opd-disduk', label: 'Dinas Kependudukan dan Catatan Sipil' },
  { id: 'opd-dpmptsp', label: 'Dinas Penanaman Modal & PTSP' },
];

export default function DaftarPage() {
  const [form, setForm] = useState({ name: '', nip: '', email: '', opdId: '', password: '', confirm: '' });
  const [show, setShow] = useState(false);
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

  const inputCls = "flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2.5 focus-within:border-red-700";

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-red-800 tracking-wide">DAFTAR USER OPD</h1>
        <p className="font-bold text-gray-800 mt-2 text-sm">ANALISIS SENTIMEN PELAYANAN PUBLIK</p>
        <p className="text-sm text-gray-500 mt-2">Lengkapi data berikut untuk mendaftar sebagai User OPD.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo-diy.png" alt="Logo DIY" className="w-16 h-16 object-contain mb-3" />
          <h2 className="font-bold text-red-800">SENTIMEN ANALISIS DIY</h2>
          <div className="w-24 h-px bg-red-200 my-2"></div>
          <p className="text-[10px] tracking-widest text-gray-500 uppercase">Sistem Otentikasi</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Nama Lengkap</label>
              <div className={inputCls}>
                <User size={16} className="text-gray-400" />
                <input value={form.name} onChange={(e) => ubah('name', e.target.value)} className="w-full text-sm outline-none text-gray-900" required />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">NIP (Nomor Induk Pegawai)</label>
              <div className={inputCls}>
                <FileText size={16} className="text-gray-400" />
                <input value={form.nip} onChange={(e) => ubah('nip', e.target.value)} placeholder="NIP wajib diisi" className="w-full text-sm outline-none text-gray-900" required />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Alamat Email</label>
            <div className={inputCls}>
              <Mail size={16} className="text-gray-400" />
              <input type="email" value={form.email} onChange={(e) => ubah('email', e.target.value)} className="w-full text-sm outline-none text-gray-900" required />
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">OPD (Organisasi Perangkat Daerah)</label>
            <div className={inputCls}>
              <Building2 size={16} className="text-gray-400" />
              <select value={form.opdId} onChange={(e) => ubah('opdId', e.target.value)} className="w-full text-sm outline-none text-gray-900 bg-white">
                {opdOptions.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Kata Sandi</label>
              <div className={inputCls}>
                <Lock size={16} className="text-gray-400" />
                <input type={show ? 'text' : 'password'} value={form.password} onChange={(e) => ubah('password', e.target.value)} className="w-full text-sm outline-none text-gray-900" required />
                <button type="button" onClick={() => setShow(!show)} className="text-gray-400">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Konfirmasi Kata Sandi</label>
              <div className={inputCls}>
                <Lock size={16} className="text-gray-400" />
                <input type={show ? 'text' : 'password'} value={form.confirm} onChange={(e) => ubah('confirm', e.target.value)} className="w-full text-sm outline-none text-gray-900" required />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="accent-red-800" />
            Saya menyetujui <span className="text-red-700 font-bold">syarat dan ketentuan</span> yang berlaku.
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={loading} className="w-full bg-red-900 text-white font-bold text-sm py-3 rounded-lg hover:bg-red-950 transition disabled:opacity-50">
            {loading ? 'MEMPROSES...' : 'DAFTAR SEBAGAI USER OPD'}
          </button>
        </form>

        <div className="border-t border-gray-100 mt-6 pt-4 text-center text-sm text-gray-500">
          Sudah memiliki akun? <Link href="/login" className="text-red-700 font-bold">Masuk</Link>
        </div>
      </div>
    </div>
  );
}