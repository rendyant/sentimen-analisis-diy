'use client';

import { useEffect, useState } from 'react';
import StatsCard from "@/components/statscard";
import RatingCard from "@/components/ratingcard";
import SentimentChart from "@/components/sentimentchart";
import WordCloud from "@/components/wordcloud";
import AIActionPlans from "@/components/aiactionplans";
import PlatformChart from "@/components/platformchart";
import AspekAnalysis from "@/components/aspekanalysis";
import UlasanNegatif from "@/components/ulasannegatif";
import UlasanTerbaru from "@/components/ulasanterbaru";
import AIInsight from "@/components/aiinsight";
import { fetchStats, StatItem } from "@/lib/api";

export default function Home() {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchStats();
        setStats(data);
      } catch (err) {
        console.error('Gagal mengambil statistik OPD:', err);
      }
    }
    load();
  }, []);

  const totalUlasan = stats.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalPositif = stats.reduce((acc, curr) => acc + (curr.positif || 0), 0);
  const totalNegatif = stats.reduce((acc, curr) => acc + (curr.negatif || 0), 0);
  const totalNetral = stats.reduce((acc, curr) => acc + (curr.netral || 0), 0);

  const persenPositif = totalUlasan > 0 ? ((totalPositif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNegatif = totalUlasan > 0 ? ((totalNegatif / totalUlasan) * 100).toFixed(1) : '0';
  const persenNetral = totalUlasan > 0 ? ((totalNetral / totalUlasan) * 100).toFixed(1) : '0';

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Title Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-red-900 mb-1">
          DINAS PENDIDIKAN, PEMUDA, DAN OLAHRAGA (DIKPORA) DIY
        </h2>
        <p className="text-gray-500 text-xs">
          Dashboard pemantauan kepuasan dan sentimen aspirasi publik secara real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="TOTAL ULASAN MASUK"
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

      {/* Grid Utama: Kiri (Grafik) + Kanan (AI Action Plans) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          <RatingCard />
          <SentimentChart />
          <WordCloud />
          <PlatformChart />
        </div>

        <div className="lg:col-span-1">
          <AIActionPlans />
        </div>
      </div>

      {/* Analisis Aspek + Ulasan Negatif */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <div className="lg:col-span-2">
          <AspekAnalysis />
        </div>
        <UlasanNegatif />
      </div>

      {/* Tabel Ulasan Terbaru (Data Live) */}
      <div className="mb-6">
        <UlasanTerbaru />
      </div>

      {/* AI Insight */}
      <AIInsight />
    </div>
  );
}