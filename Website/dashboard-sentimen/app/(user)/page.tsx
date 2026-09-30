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

type StatItem = {
  title: string;
  value: number;
  subtitle?: string;
  change?: string;
  color: 'gray' | 'positive' | 'neutral' | 'negative';
};

const statsData: StatItem[] = [
  { title: 'TOTAL ULASAN DIKNES', value: 128, change: '+12% vs bulan lalu', color: 'gray' },
  { title: 'SENTIMEN POSITIF', value: 82, subtitle: '64.0% dari total', color: 'positive' },
  { title: 'SENTIMEN NETRAL', value: 24, subtitle: '18.7% dari total', color: 'neutral' },
  { title: 'SENTIMEN NEGATIF', value: 22, subtitle: 'Perlu Perhatian 17.3% total', color: 'negative' },
];

export default function Home() {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">

      {/* Title Section */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-red-800 mb-1">
          DINAS PENDIDIKAN, PEMUDA, DAN OLAHRAGA (DISDIKPORA) DIY
        </h2>
        <p className="text-gray-600 text-sm">
          Dashboard pemantauan kepuasan dan sentiment ulasan publik secara real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statsData.map((stat, idx) => (
          <StatsCard key={idx} {...stat} />
        ))}
      </div>

      {/* ✅ SATU GRID: kiri = semua konten, kanan = AI Action Plans */}
      <div className="grid grid-cols-3 gap-4 mb-6 items-start">
        {/* Kolom KIRI: semua card ditumpuk rapi */}
        <div className="col-span-2 space-y-4">
          <RatingCard />
          <SentimentChart />
          <WordCloud />
          <PlatformChart />
        </div>

        {/* Kolom KANAN: AI Action Plans */}
        <div className="col-span-1">
          <AIActionPlans />
        </div>
      </div>

      {/* Analisis Aspek + Ulasan Negatif */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <AspekAnalysis />
        </div>
        <UlasanNegatif />
      </div>

      {/* Tabel Ulasan */}
      <div className="mb-6">
        <UlasanTerbaru />
      </div>

      {/* AI Insight */}
      <AIInsight />
    </div>
  );
}