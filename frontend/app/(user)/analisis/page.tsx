'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  fetchDashboardAnalytics,
  DashboardAnalyticsResponse,
  OPD_LIST,
} from '@/lib/api';

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

export default function AnalisisPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [instansiId, setInstansiId] = useState('');
  const [periode, setPeriode] = useState('all');
  const [sumber, setSumber] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDashboardAnalytics({
          instansi_id: instansiId || undefined,
          sumber: sumber || undefined,
          periode: periode !== 'all' ? periode : undefined,
        });
        setAnalytics(data);
      } catch (err) {
        console.warn('Gagal mengambil data analisis:', err);
      }
    }
    load();
  }, [instansiId, periode, sumber]);

  const totalUlasan = analytics?.summary.total || 0;
  const totalPositif = analytics?.summary.positif || 0;
  const totalNetral = analytics?.summary.netral || 0;
  const totalNegatif = analytics?.summary.negatif || 0;

  const persenPositif = totalUlasan > 0 ? ((totalPositif / totalUlasan) * 100).toFixed(1) : '0.0';
  const persenNetral = totalUlasan > 0 ? ((totalNetral / totalUlasan) * 100).toFixed(1) : '0.0';
  const persenNegatif = totalUlasan > 0 ? ((totalNegatif / totalUlasan) * 100).toFixed(1) : '0.0';

  const proporsiData = [
    { name: 'Positif', value: totalPositif || 1, count: totalPositif, color: '#10B981' },
    { name: 'Netral', value: totalNetral || 0, count: totalNetral, color: '#3B82F6' },
    { name: 'Negatif', value: totalNegatif || 0, count: totalNegatif, color: '#EF4444' },
  ];

  const trenData = analytics?.daily_trend || [];
  const kataKunci = analytics?.popular_words.slice(0, 6) || [];
  const aspekList = analytics?.aspects || [];
  const negReviews = analytics?.negative_reviews.slice(0, 3) || [];
  const spektrum = analytics?.spectrum || [];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header + Filter Interaktif */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analisis Sentimen Pelayanan (Database Live)</h1>
          <p className="text-sm text-gray-500 mt-1">
            Seluruh grafik tren, proporsi sentimen, kata kunci, dan spektrum suara dihitung langsung dari database
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500 font-medium">OPD:</span>
            <select
              value={instansiId}
              onChange={(e) => setInstansiId(e.target.value)}
              className="font-semibold text-gray-800 outline-none bg-transparent cursor-pointer max-w-[180px]"
            >
              {OPD_LIST.map((opd) => (
                <option key={opd.id} value={opd.id}>{opd.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500 font-medium">Periode:</span>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">3 Bulan Terakhir</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-gray-500 font-medium">Saluran:</span>
            <select
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              className="font-semibold text-gray-800 outline-none bg-transparent cursor-pointer"
            >
              <option value="">Semua Media</option>
              <option value="berita">Google News</option>
              <option value="maps">Google Maps</option>
              <option value="twitter">Twitter / X</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-blue-600 uppercase mb-2">Total Sampel Data (DB)</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{totalUlasan.toLocaleString('id-ID')}</div>
          <p className="text-xs text-gray-500"><span className="text-blue-600 font-semibold">Live</span> Data keluhan & berita</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-green-600 uppercase mb-2">Indeks Kepuasan (Positif)</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{persenPositif}%</div>
          <p className="text-xs text-gray-500"><span className="text-green-600 font-semibold">{totalPositif} ulasan</span> Apresiasi layanan</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-orange-500 uppercase mb-2">Sentimen Netral</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{persenNetral}%</div>
          <p className="text-xs text-gray-500"><span className="text-orange-500 font-semibold">{totalNetral} ulasan</span> Persepsi objektif warga</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <h3 className="text-xs font-semibold text-red-600 uppercase mb-2">Ketidakpuasan (Negatif)</h3>
          <div className="text-3xl font-bold text-gray-900 mb-2">{persenNegatif}%</div>
          <p className="text-xs text-gray-500"><span className="text-red-600 font-semibold">{totalNegatif} ulasan</span> Perlu perhatian segera</p>
        </div>
      </div>

      {/* Tren Harian + Proporsi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Tren Harian Sentimen Publik (Database Live)</h3>
              <p className="text-xs text-gray-500 mt-1">Perkembangan jumlah ulasan berdasarkan tanggal di database</p>
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
              <Line type="monotone" dataKey="positif" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netral" stroke="#3B82F6" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="negatif" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Proporsi Sentimen (Database)</h3>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{totalUlasan.toLocaleString('id-ID')}</span>
              <span className="text-[10px] text-gray-400 uppercase">Total</span>
            </div>
          </div>
          <div className="space-y-2 mt-4">
            {proporsiData.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></span>
                  {item.name} ({item.count})
                </span>
                <span className="font-bold text-gray-900">
                  {totalUlasan > 0 ? ((item.count / totalUlasan) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kata Kunci + Pendorong Aspek */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Analisis Frekuensi Kata Kunci Utama (Database)</h3>
          <div className="space-y-4">
            {kataKunci.map((item, i) => (
              <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3">
                <span className="text-sm font-semibold text-gray-800 w-40">{item.text}</span>
                <span className="text-xs text-gray-500">{item.count} sebutan</span>
                <StackedBar parts={item.parts} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6">Indeks Kinerja per Kategori Layanan (Database)</h3>
          <div className="space-y-5">
            {aspekList.slice(0, 4).map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-800">{item.name} ({item.total} data)</span>
                  <span className="text-xs font-bold text-gray-700">⭐ {item.rating} / 5.0 ({item.status})</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`${item.progressColor} h-2 rounded-full`} style={{ width: `${item.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Friction Points (Diambil dari Ulasan Negatif Asli di Database) */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">Identifikasi Titik Hambat & Keluhan Utama (Database Live)</h3>
            <p className="text-xs text-gray-500 mt-1">Ulasan negatif terbaru dari masyarakat di database yang memerlukan tindak lanjut</p>
          </div>
          <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            Data Real-Time DB
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {negReviews.map((item, i) => (
            <div key={item.id || i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
              <h4 className="font-bold text-xs mb-1 text-red-700">{item.instansi_nama}</h4>
              <span className="inline-block text-[10px] font-semibold bg-red-100 text-red-800 px-2 py-0.5 rounded mb-2">
                {item.kategori_masalah}
              </span>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">&ldquo;{item.teks}&rdquo;</p>
            </div>
          ))}
        </div>
      </div>

      {/* Spektrum Suara Masyarakat Terbaru dari Database */}
      <div>
        <h3 className="font-bold text-gray-900 mb-4">Spektrum Suara Masyarakat Terbaru (Database Live)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {spektrum.map((item, i) => (
            <div key={i} className={`rounded-xl p-4 border ${item.style}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold ${item.teks}`}>{item.tipe}</span>
                <span className="text-[11px] text-gray-500 font-semibold truncate max-w-[180px]">{item.sumber}</span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{item.isi}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
