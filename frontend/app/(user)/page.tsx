'use client';

import { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';
import StatsCard from '@/components/dashboard/statscard';
import RatingCard from '@/components/dashboard/ratingcard';
import SentimentChart from '@/components/dashboard/sentimentchart';
import WordCloud from '@/components/dashboard/wordcloud';
import AIActionPlans from '@/components/ai/aiactionplans';
import PlatformChart from '@/components/dashboard/platformchart';
import AspekAnalysis from '@/components/dashboard/aspekanalysis';
import UlasanNegatif from '@/components/ulasan/ulasannegatif';
import UlasanTerbaru from '@/components/ulasan/ulasanterbaru';
import AIInsight from '@/components/ai/aiinsight';
import {
  fetchStats,
  fetchDashboardAnalytics,
  StatItem,
  DashboardAnalyticsResponse,
  OPD_LIST,
} from '@/lib/api';

export default function Home() {
  const [stats, setStats] = useState<StatItem[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalyticsResponse | null>(null);
  const [periode, setPeriode] = useState('all');
  const [sumber, setSumber] = useState('');
  const [instansiId, setInstansiId] = useState('dikpora');

  useEffect(() => {
    async function load() {
      try {
        const [statsData, analyticsData] = await Promise.all([
          fetchStats({
            instansi_id: instansiId || undefined,
            sumber: sumber || undefined,
            periode: periode !== 'all' ? periode : undefined,
          }),
          fetchDashboardAnalytics({
            instansi_id: instansiId || undefined,
            sumber: sumber || undefined,
            periode: periode !== 'all' ? periode : undefined,
          }),
        ]);
        setStats(statsData);
        setAnalytics(analyticsData);
      } catch (err) {
        console.warn('Gagal mengambil statistik OPD:', err);
      }
    }
    load();
  }, [periode, sumber, instansiId]);

  const selectedOpdName =
    OPD_LIST.find((o) => o.id === instansiId)?.nama ||
    'DINAS PENDIDIKAN, PEMUDA, DAN OLAHRAGA (DIKPORA) DIY';

  const totalUlasan =
    analytics?.summary.total ?? stats.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalPositif =
    analytics?.summary.positif ?? stats.reduce((acc, curr) => acc + (curr.positif || 0), 0);
  const totalNegatif =
    analytics?.summary.negatif ?? stats.reduce((acc, curr) => acc + (curr.negatif || 0), 0);
  const totalNetral =
    analytics?.summary.netral ?? stats.reduce((acc, curr) => acc + (curr.netral || 0), 0);

  const persenPositif = totalUlasan > 0 ? ((totalPositif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNegatif = totalUlasan > 0 ? ((totalNegatif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNetral = totalUlasan > 0 ? ((totalNetral / totalUlasan) * 100).toFixed(1) : '0';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Title + Filter Section */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-red-900 mb-1 uppercase">
            {selectedOpdName}
          </h2>
          <p className="text-gray-500 text-xs">
            Dashboard pemantauan kepuasan, grafik sentimen, dan solusi AI secara real-time dari database
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Periode Waktu</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
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
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 outline-none focus:border-red-800 cursor-pointer"
            >
              <option value="">Semua Saluran</option>
              <option value="berita">Google News</option>
              <option value="maps">Google Maps</option>
              <option value="twitter">Twitter / X</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Instansi OPD</label>
            <select
              value={instansiId}
              onChange={(e) => setInstansiId(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 w-56 outline-none focus:border-red-800 cursor-pointer"
            >
              {OPD_LIST.map((opd) => (
                <option key={opd.id} value={opd.id}>
                  {opd.nama}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-red-800 hover:bg-red-900 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            <Printer size={13} /> Cetak PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="TOTAL ULASAN MASUK"
          value={totalUlasan}
          change="Terhubung ke Database"
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

      {/* Grid Utama: Kiri (Grafik Live DB) + Kanan (AI Action Plans) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <RatingCard
            avgRating={analytics?.summary.avg_rating || 0}
            totalUlasan={totalUlasan}
            csatPercent={analytics?.summary.csat_percent || 0}
          />
          <SentimentChart data={analytics?.sentiment_trend || []} />
          <WordCloud words={analytics?.popular_words || []} />
          <PlatformChart data={analytics?.platforms || []} />
        </div>

        <div className="lg:col-span-1">
          <AIActionPlans instansiId={instansiId} />
        </div>
      </div>

      {/* Analisis Aspek + Ulasan Negatif (Database Live) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <AspekAnalysis aspects={analytics?.aspects || []} detailHref="/analisis" />
        </div>
        <UlasanNegatif reviews={analytics?.negative_reviews || []} allHref="/ulasan" />
      </div>

      {/* Tabel Ulasan Terbaru (Data Live) */}
      <div className="mb-6">
        <UlasanTerbaru instansiId={instansiId} sumber={sumber} periode={periode} />
      </div>

      {/* AI Insight */}
      <AIInsight instansiId={instansiId} />
    </div>
  );
}
