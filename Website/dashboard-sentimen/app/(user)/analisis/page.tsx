'use client';

import { ChevronDown } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const trenData = [
  { tanggal: '21 Jan', positif: 22, netral: 26, negatif: 16 },
  { tanggal: '22 Jan', positif: 46, netral: 16, negatif: 14 },
  { tanggal: '23 Jan', positif: 24, netral: 14, negatif: 12 },
  { tanggal: '24 Jan', positif: 44, netral: 20, negatif: 28 },
  { tanggal: '25 Jan', positif: 38, netral: 15, negatif: 15 },
];

const proporsiData = [
  { name: 'Positif', value: 15, color: '#10B981' },
  { name: 'Netral', value: 6, color: '#3B82F6' },
  { name: 'Negatif', value: 13, color: '#EF4444' },
];

const kataKunci = [
  { kata: 'pelayanan lambat', sebutan: 12, parts: [10, 15, 75] },
  { kata: 'sistem error', sebutan: 9, parts: [5, 10, 85] },
  { kata: 'petugas ramah', sebutan: 8, parts: [90, 8, 2] },
  { kata: 'antrean panjang', sebutan: 7, parts: [15, 20, 65] },
  { kata: 'aplikasi mudah', sebutan: 6, parts: [88, 10, 2] },
];

const pendorong = [
  { nama: 'Keramahan Petugas', label: 'Sangat Baik', warna: 'bg-green-500', teks: 'text-green-600', persen: 85 },
  { nama: 'Kejelasan Informasi', label: 'Baik', warna: 'bg-green-500', teks: 'text-green-600', persen: 70 },
  { nama: 'Kemudahan Aplikasi', label: 'Cukup', warna: 'bg-blue-500', teks: 'text-blue-600', persen: 45 },
];

const friction = [
  { judul: 'Kecepatan Respon Loket', warna: 'text-red-600', isi: '"Loket pelayanan di dinas terkait sangat lambat. Antrean menumpuk hingga berjam-jam tanpa kepastian."' },
  { judul: 'Server Sering Down', warna: 'text-red-600', isi: '"Website portal pendaftaran tidak bisa diakses di pagi hari. Sering membuang waktu pendaftaran online."' },
  { judul: 'Prosedur Terlalu Berbelit', warna: 'text-orange-500', isi: '"Persyaratan berkas masih harus fotokopi meskipun sistem pendaftaran sudah diklaim berbasis digital."' },
];

const spektrum = [
  { tipe: 'Sentimen Positif', sumber: 'Puskesmas Bandung', isi: '"Sangat senang dengan pelayanan perawat yang cepat tanggap menangani pendaftaran lansia di loket."', style: 'bg-green-50 border-green-500', teks: 'text-green-700' },
  { tipe: 'Sentimen Netral', sumber: 'Disdukcapil Bandung', isi: '"Petugas melayani biasa saja sesuai prosedur. Tidak terlalu ramah namun berkas KTP selesai tepat waktu."', style: 'bg-blue-50 border-blue-500', teks: 'text-blue-700' },
  { tipe: 'Sentimen Negatif', sumber: 'DPMPTSP', isi: '"Klarifikasi perizinan tidak jelas. Sudah kirim email 3 kali tidak ada tanggapan sama sekali dari tim admin."', style: 'bg-red-50 border-red-500', teks: 'text-red-700' },
];

function StackedBar({ parts }: { parts: number[] }) {
  const colors = ['#10B981', '#3B82F6', '#EF4444'];
  return (
    <div className="flex h-2 w-24 rounded-full overflow-hidden bg-gray-100">
      {parts.map((w, i) => (
        <div key={i} style={{ width: `${w}%`, backgroundColor: colors[i] }} />
      ))}
    </div>
  );
}

function FilterSelect({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-800">{value}</span>
      <ChevronDown size={14} className="text-gray-400" />
    </div>
  );
}

export default function AnalisisPage() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisis Sentimen Pelayanan</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau persepsi kepuasan masyarakat terhadap kinerja birokrasi daerah</p>
        </div>
        <div className="flex gap-2">
          <FilterSelect label="OPD" value="Semua Layanan" />
          <FilterSelect label="Periode" value="Januari 2026" />
          <FilterSelect label="Saluran" value="Semua Media" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-blue-600 uppercase mb-2">Total Sampel Data</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">34</div>
          <p className="text-xs text-gray-500"><span className="text-blue-600 font-semibold">Stable</span> Data keluhan & testimoni</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-green-600 uppercase mb-2">Indeks Kepuasan (Positif)</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">44,1%</div>
          <p className="text-xs text-gray-500"><span className="text-green-600 font-semibold">+3.4%</span> Tren meningkat positif</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-orange-500 uppercase mb-2">Sentimen Netral</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">17,6%</div>
          <p className="text-xs text-gray-500"><span className="text-orange-500 font-semibold">Stabil</span> Persepsi objektif warga</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-red-600 uppercase mb-2">Ketidakpuasan (Negatif)</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">38,2%</div>
          <p className="text-xs text-gray-500"><span className="text-red-600 font-semibold">+1.2%</span> Perlu perhatian segera</p>
        </div>
      </div>

      {/* Tren Harian + Proporsi */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Tren Harian Sentimen Publik</h3>
              <p className="text-xs text-gray-500 mt-1">Perkembangan fluktuasi sentimen dari 21 Jan - 25 Jan 2026</p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Positif</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Netral</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Negatif</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trenData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="tanggal" stroke="#999" fontSize={12} />
              <YAxis stroke="#999" fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="positif" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netral" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="negatif" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
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
              <span className="text-[10px] text-gray-400 uppercase">Total</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {proporsiData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></span>
                  {item.name} ({item.value})
                </span>
                <span className="font-bold text-gray-900">
                  {((item.value / 34) * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kata Kunci + Pendorong */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Analisis Frekuensi Kata Kunci Utama</h3>
          <div className="space-y-4">
            {kataKunci.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-semibold text-gray-800 w-40">{item.kata}</span>
                <span className="text-xs text-gray-500">{item.sebutan} sebutan</span>
                <StackedBar parts={item.parts} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Pendorong Kinerja & Kepuasan Publik</h3>
          <div className="space-y-6">
            {pendorong.map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{item.nama}</span>
                  <span className={`text-xs font-medium ${item.teks}`}>{item.label}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${item.warna} h-2 rounded-full`} style={{ width: `${item.persen}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Friction Points */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Identifikasi Titik Hambat & Gesekan (Friction Points)</h3>
            <p className="text-xs text-gray-500 mt-1">Hal utama yang dikeluhkan oleh masyarakat dan memerlukan tindak lanjut</p>
          </div>
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            Butuh Tindakan Cepat
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {friction.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className={`font-bold text-sm mb-2 ${item.warna}`}>{item.judul}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{item.isi}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spektrum Suara */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Spektrum Suara Masyarakat Terbaru</h3>
        <div className="grid grid-cols-3 gap-4">
          {spektrum.map((item, i) => (
            <div key={i} className={`rounded-xl p-4 border ${item.style}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${item.teks}`}>{item.tipe}</span>
                <span className="text-xs text-gray-400">{item.sumber}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{item.isi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}