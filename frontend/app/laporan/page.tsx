'use client';

import { Download, Printer } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const proporsiData = [
  { name: 'Positif', value: 15, color: '#10B981' },
  { name: 'Netral', value: 6, color: '#3B82F6' },
  { name: 'Negatif', value: 13, color: '#EF4444' },
];

const aspekLayanan = [
  { nama: 'Kecepatan Layanan', rating: 3.4, parts: [45, 15, 40] },
  { nama: 'Keramahan Petugas', rating: 4.1, parts: [60, 20, 20] },
  { nama: 'Fasilitas & Sarana', rating: 2.8, parts: [25, 25, 50] },
  { nama: 'Transparansi Biaya', rating: 4.3, parts: [70, 20, 10] },
  { nama: 'Kejelasan Informasi', rating: 3.2, parts: [35, 30, 35] },
  { nama: 'Kemudahan Akses', rating: 3.5, parts: [40, 30, 30] },
];

const opdData = [
  { no: 1, nama: 'DPMPTSP (Penanaman Modal & Pelayanan Satu Pintu)', total: 28, positif: '64.2%', negatif: '21.4%' },
  { no: 2, nama: 'DINAS KESEHATAN (Puskesmas & Rumah Sakit Umum)', total: 30, positif: '42.3%', negatif: '31.0%' },
  { no: 3, nama: 'DINAS PENDIDIKAN (Sekolah & Administrasi)', total: 34, positif: '38.5%', negatif: '33.8%' },
  { no: 4, nama: 'DISDUKCAPIL (Kependudukan & Pencatatan Sipil)', total: 34, positif: '24.1%', negatif: '43.8%' },
  { no: 5, nama: 'DINAS SOSIAL (Bantuan Sosial & PKH)', total: 24, positif: '20.8%', negatif: '58.3%' },
];

const friction = [
  { level: 'SANGAT TINGGI', levelStyle: 'bg-red-100 text-red-700', opd: 'DISDUKCAPIL', waktu: 'Update 2 jam yang lalu', isi: 'Waktu tunggu antrean fisik pencetakan KTP-el melampaui rata-rata 3 jam pada jam padat loket.', jumlah: 14 },
  { level: 'SANGAT TINGGI', levelStyle: 'bg-red-100 text-red-700', opd: 'DINAS KESEHATAN', waktu: 'Update 4 jam yang lalu', isi: 'Antrean online puskesmas seringkali mengalami kegagalan server di pagi hari, memaksa antrean manual.', jumlah: 11 },
  { level: 'TINGGI', levelStyle: 'bg-orange-100 text-orange-700', opd: 'DINAS SOSIAL', waktu: 'Update 1 hari yang lalu', isi: 'Transparansi data penerima program PKH dinilai kurang adil oleh masyarakat setempat.', jumlah: 8 },
];

function StackedBar({ parts }: { parts: number[] }) {
  const colors = ['#10B981', '#3B82F6', '#EF4444'];
  return (
    <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-gray-100">
      {parts.map((w, i) => (
        <div key={i} style={{ width: `${w}%`, backgroundColor: colors[i] }} />
      ))}
    </div>
  );
}

export default function LaporanPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Tahunan</h1>
          <p className="text-sm text-gray-500 mt-1">Pusat Pelaporan Kinerja Komprehensif Kabupaten</p>
        </div>
        <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm font-semibold text-gray-800">
          Januari 2026
        </button>
      </div>

      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="bg-white text-red-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
            Laporan Semi Realita
          </span>
          <span className="text-xs text-white/70">Data diperbarui setiap 24 jam sekali secara otomatis</span>
        </div>
        <h2 className="text-xl font-bold mb-2">Laporan Komprehensif Analisis Sentimen Pelayanan Publik Daerah</h2>
        <p className="text-sm text-white/80">
          Berdasarkan akumulasi suara publik, survei, dan ekstraksi keluhan masyarakat sepanjang bulan Januari 2026.
        </p>
      </div>

      {/* Filter + Export */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700">Semua OPD Terpilih</button>
          <button className="bg-white border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-700">Semua Kategori Aspek</button>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white border border-red-900 text-red-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-50 transition">
            <Download size={14} /> Ekspor CSV
          </button>
          <button className="flex items-center gap-2 bg-red-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-950 transition">
            <Printer size={14} /> Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Total Aspirasi Masuk</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">34</div>
          <p className="text-xs text-gray-500">Suara & keluhan terhimpun</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-green-600 uppercase mb-2">Indeks Kepuasan Positif</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">44.1%</div>
          <p className="text-xs text-gray-500">Sentimen positif dominan</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-red-600 uppercase mb-2">Tingkat Keluhan Negatif</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">38.2%</div>
          <p className="text-xs text-gray-500">Sentimen kritis tinggi</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-orange-500 uppercase mb-2">Rata-rata Rating Kepuasan</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">3.32 / 5.0</div>
          <p className="text-xs text-gray-500">Skala kepuasan rata-rata</p>
        </div>
      </div>

      {/* Aspek Layanan + Proporsi */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-1">Analisis Sentimen Berdasarkan Aspek Layanan</h3>
          <p className="text-xs text-gray-500 mb-6">Perbandingan sebaran sentimen positif (Hijau), netral (Biru), dan negatif (Merah) per aspek.</p>
          <div className="space-y-5">
            {aspekLayanan.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{item.nama}</span>
                  <span className="text-xs text-gray-500">
                    <span className="text-orange-500 font-bold">★ {item.rating}</span>
                    {' '}({item.parts[0]}% | {item.parts[1]}% | {item.parts[2]}%)
                  </span>
                </div>
                <StackedBar parts={item.parts} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Proporsi Sentimen</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={proporsiData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={2} strokeWidth={0}>
                  {proporsiData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900">34</span>
              <span className="text-[10px] text-gray-400 uppercase">Total Data</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {proporsiData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></span>
                  {item.name}
                </span>
                <span className="font-bold text-gray-900">{((item.value / 34) * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabel OPD */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
        <h3 className="font-bold text-gray-900 mb-1">Kinerja Kepuasan Berdasarkan Organisasi Perangkat Daerah (OPD)</h3>
        <p className="text-xs text-gray-500 mb-4">Peringkat kepuasan publik berdasarkan akumulasi sentimen di masing-masing dinas pelaksana teknis daerah.</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
              <th className="text-left py-3 px-3">No</th>
              <th className="text-left py-3 px-3">Nama Dinas / OPD</th>
              <th className="text-right py-3 px-3">Total Data</th>
              <th className="text-right py-3 px-3 text-green-600">Positif (%)</th>
              <th className="text-right py-3 px-3 text-red-600">Negatif (%)</th>
            </tr>
          </thead>
          <tbody>
            {opdData.map((row) => (
              <tr key={row.no} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 text-gray-500">{row.no}</td>
                <td className="py-3 px-3 font-semibold text-gray-800">{row.nama}</td>
                <td className="py-3 px-3 text-right text-gray-700">{row.total}</td>
                <td className="py-3 px-3 text-right font-semibold text-green-600">{row.positif}</td>
                <td className="py-3 px-3 text-right font-semibold text-red-600">{row.negatif}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Friction Points */}
      <div>
        <h3 className="font-bold text-gray-900 mb-1">Friction Points & Titik Masalah Utama Terdeteksi</h3>
        <p className="text-xs text-gray-500 mb-4">Keluhan paling kritis yang sering muncul dalam analisis semantik sentimen negatif.</p>
        <div className="grid grid-cols-3 gap-4">
          {friction.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-[10px] font-bold px-2 py-1 rounded ${item.levelStyle}`}>{item.level}</span>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.opd}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{item.waktu}</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 mb-3">{item.isi}</p>
              <p className="text-xs text-gray-500">💬 {item.jumlah} laporan keluhan yang serupa</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}