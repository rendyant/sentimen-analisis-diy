'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Download, Printer, Sparkles, Zap, ArrowUp, ArrowRight, CheckCircle2, Clock, ChevronDown, Loader2 } from 'lucide-react';
import StatsCard from '@/components/statscard';
import RatingCard from '@/components/ratingcard';
import SentimentChart from '@/components/sentimentchart';
import AIInsight from '@/components/aiinsight';
import { fetchStats, StatItem } from '@/lib/api';

const kataNegatif = ['lama', 'menunggu', 'lambat', 'ribet', 'berbelit', 'pelayanan', 'susah', 'antrean', 'tidak jelas', 'berkas'];

const rekomendasiTindakan = [
  { judul: 'Optimalkan alur pelayanan', desc: 'Evaluasi dan sederhanakan alur pelayanan agar proses lebih cepat dan efisien.' },
  { judul: 'Penambahan petugas pada jam sibuk', desc: 'Sesuaikan jumlah petugas dengan volume pelayanan pada jam dan hari tertentu.' },
  { judul: 'Sistem antrian digital', desc: 'Terapkan sistem antrian online untuk mengurangi penumpukan dan mempercepat pelayanan.' },
];

function FilterBox({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs w-60">
        <span className="text-gray-700 truncate">{value}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpd, setSearchOpd] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error('Gagal memuat statistik:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
          <span className="text-xs text-white/70">Data terhubung langsung ke Database Cloud Supabase</span>
        </div>
        <h2 className="text-2xl font-bold mb-1">DASHBOARD OPD PROVINSI DIY</h2>
        <p className="text-xs text-white/80">
          Akumulasi suara publik, aspirasi warga, ulasan maps, dan portal berita 24 Organisasi Perangkat Daerah se-DIY.
        </p>
      </div>

      {/* Filter + Export */}
      <div className="flex items-end justify-between mb-6">
        <div className="flex gap-4">
          <FilterBox label="Periode Waktu" value="Semua Waktu (Terkini)" />
          <FilterBox label="Sumber Data" value="Semua Saluran (Berita, Maps, Sosmed)" />
          <FilterBox label="Instansi OPD" value="Semua 24 Instansi Pemda DIY" />
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
                <p className="text-xs text-gray-400">Total 24 Instansi Pemerintah Daerah DIY</p>
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
                        Tidak ada OPD yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStats.map((row) => (
                      <tr key={row.instansi_id} className="hover:bg-red-50/30 transition">
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

        {/* Kolom Kanan: AI Action Plans */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <div className="bg-gradient-to-br from-red-900 to-red-950 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1 bg-white/10 text-yellow-300 text-[10px] font-bold px-2 py-1 rounded-full">
                  <Sparkles size={10} /> AI ACTION PLANS
                </span>
                <span className="bg-red-500 text-[10px] font-bold px-2 py-1 rounded-full">Prioritas Kebijakan</span>
              </div>
              <h3 className="font-bold flex items-center gap-1.5 text-sm">
                <Zap size={14} /> Rekomendasi Kebijakan
              </h3>
              <p className="text-[11px] text-white/70 mt-1 mb-3 leading-relaxed">
                Panduan aksi prioritas berbasis ekstraksi aspirasi warga
              </p>
            </div>

            <div className="bg-white p-5 space-y-4 text-xs">
              <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg">
                <ArrowUp size={12} /> Isu Pelayanan Utama
              </span>

              <div className="border border-gray-100 rounded-lg p-3.5">
                <h5 className="font-bold text-gray-900 mb-2">Kata Kunci Keluhan Sering Muncul</h5>
                <div className="flex flex-wrap gap-1.5">
                  {kataNegatif.map((k, i) => (
                    <span key={i} className="bg-red-50 text-red-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3.5 border border-green-100">
                <h5 className="font-bold text-green-800 mb-2 flex items-center gap-1">
                  🛡️ Rekomendasi Tindakan
                </h5>
                <div className="space-y-2.5">
                  {rekomendasiTindakan.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-green-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-gray-800 text-[11px]">{r.judul}</p>
                        <p className="text-[10px] text-gray-500 leading-tight">{r.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href="/admin/ulasan"
                className="flex items-center justify-center gap-1 w-full border border-gray-200 rounded-lg py-2 font-semibold text-red-800 hover:bg-red-50 transition"
              >
                Lihat Seluruh Ulasan Terkait <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AIInsight />
    </div>
  );
}