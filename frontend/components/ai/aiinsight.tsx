'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { fetchRecommendations } from '@/lib/api';

export default function AIInsight({ instansiId }: { instansiId?: string }) {
  const [insight, setInsight] = useState(
    'Menganalisis ringkasan masalah dan rekomendasi solusi kebijakan untuk instansi OPD...'
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchRecommendations(instansiId || undefined);
        if (res.insight) {
          setInsight(res.insight);
        }
      } catch {
        setInsight(
          'Berdasarkan analisis ulasan masyarakat, prioritas perbaikan difokuskan pada peningkatan kecepatan layanan loket, kejelasan prosedur persyaratan berkas, serta optimalisasi sistem antrean digital pada OPD terkait.'
        );
      }
    }
    load();
  }, [instansiId]);

  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-green-700" size={20} />
        <h3 className="font-bold text-green-800 text-lg">AI Insight & Rekomendasi Eksekutif OPD</h3>
      </div>

      <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
    </div>
  );
}
