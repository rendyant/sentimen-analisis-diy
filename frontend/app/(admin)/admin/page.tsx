'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Printer, Loader2 } from 'lucide-react';
import StatsCard from '@/components/dashboard/statscard';
import RatingCard from '@/components/dashboard/ratingcard';
import SentimentChart from '@/components/dashboard/sentimentchart';
import AIActionPlans from '@/components/ai/aiactionplans';
import AIInsight from '@/components/ai/aiinsight';
import { fetchStats, StatItem, OPD_LIST } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpd, setSearchOpd] = useState('');

  // State Filter Interaktif
  const [periode, setPeriode] = useState('all');
  const [sumber, setSumber] = useState('');
  const [instansiId, setInstansiId] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchStats({
          instansi_id: instansiId || undefined,
          sumber: sumber || undefined,
          periode: periode !== 'all' ? periode : undefined,
        });
        setStats(data);
      } catch (err) {
        console.warn('Gagal memuat statistik:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [periode, sumber, instansiId]);

  // Hitung agregat metrik
  const totalUlasan = stats.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalPositif = stats.reduce((acc, curr) => acc + (curr.positif || 0), 0);
  const totalNegatif = stats.reduce((acc, curr) => acc + (curr.negatif || 0), 0);
  const totalNetral = stats.reduce((acc, curr) => acc + (curr.netral || 0), 0);

  const persenPositif = totalUlasan > 0 ? ((totalPositif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNegatif = totalUlasan > 0 ? ((totalNegatif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNetral = totalUlasan > 0 ? ((totalNetral / totalUlasan) * 100).toFixed(1) : '0';

  const filteredStats = stats.filter((s) =>
    s.instansi_nama.toLowerCase().includes(searchOpd.toLowerCase())
  );

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      {/* Banner */}
      <div className="bg-gradient-to-r from-red-900 to-red-950 rounded-xl p-6 text-white mb-6 shadow-md shadow-red-950/20">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-white text-red-900 text-[10px] font-bold px-3 py-1 rounded-full">SUPER ADMIN</span>
          <span className="text-xs text-white/70">Data & Rekomendasi Solusi AI terhubung secara real-time</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">DASHBOARD OPD PROVINSI DIY</h2>
        <p className="text-xs text-white/80">
          Akumulasi suara publik, aspirasi warga, dan rekomendasi solusi AI untuk 24 Organisasi Perangkat Daerah se-DIY.
        </p>
      </div>

      {/* Filter Interaktif + Export */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Periode Waktu</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 w-56 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="all">Semua Waktu (Terkini)</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">3 Bulan Terakhir</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Sumber Data</label>
            <select
              value={sumber}
              onChange={(e) => setSumber(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 w-60 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="">Semua Saluran (Berita, Maps, Sosmed)</option>
              <option value="berita">Portal Berita (Google News)</option>
              <option value="maps">Ulasan Google Maps</option>
              <option value="twitter">Twitter / X</option>
              <option value="instagram">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Instansi OPD</label>
            <select
              value={instansiId}
              onChange={(e) => setInstansiId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 w-64 outline-none focus:border-red-800 cursor-pointer"
            >
              {OPD_LIST.map((opd) => (
                <option key={opd.id} value={opd.id}>
                  {opd.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/ulasan" className="flex items-center gap-1.5 bg-white border border-gray-300 px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-800 hover:bg-gray-50 transition">
            Lihat Daftar Ulasan
          </Link>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 bg-red-800 hover:bg-red-900 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition">
            <Printer size={13} /> Cetak / Ekspor PDF
          </button>
        </div>
      </div>

      {/* Stats Cards (Dihitung Dinamis) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="TOTAL ULASAN OPD"
          value={totalUlasan}
          change="+100% data live"
          color="gray"
        />
        <StatsCard
          title="SENTIMEN POSITIF"
          value={totalPositif}
          subtitle={`${persenPositif}% dari total`}
          color="positive"
        />
        <StatsCard
          title="SENTIMEN NETRAL"
          value={totalNetral}
          subtitle={`${persenNetral}% dari total`}
          color="neutral"
        />
        <StatsCard
          title="SENTIMEN NEGATIF"
          value={totalNegatif}
          subtitle={`Perlu Perhatian ${persenNegatif}% total`}
          color="negative"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 items-start">
        {/* Kolom Kiri (2 Kolom) */}
        <div className="lg:col-span-2 space-y-5">
          <RatingCard />
          <SentimentChart />

          {/* Tabel Performa OPD Dinamis */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Performa per Dinas/OPD</h3>
                <p className="text-xs text-gray-400">Menampilkan {filteredStats.length} Instansi Pemerintah Daerah DIY</p>
              </div>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-white">
                <Search size={14} className="text-gray-400" />
                <input
                  placeholder="Cari OPD..."
                  value={searchOpd}
                  onChange={(e) => setSearchOpd(e.target.value)}
                  className="text-xs outline-none w-36 text-gray-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="bg-gray-50 text-gray-600 uppercase font-bold border-b border-gray-200">
                    <th className="text-left py-2.5 px-3">Nama OPD</th>
                    <th className="text-right py-2.5 px-3">Total Ulasan</th>
                    <th className="text-right py-2.5 px-3">Positif</th>
                    <th className="text-right py-2.5 px-3">Negatif</th>
                    <th className="text-right py-2.5 px-3">Avg Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        <Loader2 size={18} className="animate-spin mx-auto mb-1 text-red-800" />
                        Memuat performa OPD...
                      </td>
                    </tr>
                  ) : filteredStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        Tidak ada data OPD yang sesuai dengan filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((row, idx) => (
                      <tr
                        key={`${row.instansi_id}-${idx}`}
                        onClick={() => setInstansiId(row.instansi_id === instansiId ? '' : row.instansi_id)}
                        title="Klik untuk melihat rekomendasi solusi AI OPD ini"
                        className={`cursor-pointer transition ${
                          row.instansi_id === instansiId ? 'bg-red-50' : 'hover:bg-red-50/30'
                        }`}
                      >
                        <td className="py-3 px-3 font-semibold text-gray-800">{row.instansi_nama}</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">{row.total}</td>
                        <td className="py-3 px-3 text-right font-semibold text-green-600">{row.positif}</td>
                        <td className="py-3 px-3 text-right font-semibold text-red-600">{row.negatif}</td>
                        <td className="py-3 px-3 text-right font-bold text-amber-500">
                          {row.avg_rating > 0 ? `⭐ ${row.avg_rating}` : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="text-center mt-4 pt-3 border-t border-gray-100">
              <Link href="/admin/ulasan" className="text-xs font-semibold text-red-800 hover:underline">
                Lihat Detail Semua Ulasan Masuk →
              </Link>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: AI Action Plans (Rekomendasi Solusi untuk Setiap OPD Bermasalah) */}
        <div className="lg:col-span-1">
          <AIActionPlans instansiId={instansiId} isAdmin />
        </div>
      </div>

      <AIInsight instansiId={instansiId} />
    </div>
  );
}
