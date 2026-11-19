'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  fetchRecommendations,
  peekCache,
  recommendationsCacheKey,
  RecommendationsResponse,
} from '@/lib/api';

const DEFAULT_INSIGHT =
  'Menganalisis ringkasan masalah dan rekomendasi solusi kebijakan untuk instansi OPD...';

export default function AIInsight({
  instansiId,
  refreshKey = 0,
}: {
  instansiId?: string;
  refreshKey?: number;
}) {
  const cachedInit = peekCache<RecommendationsResponse>(recommendationsCacheKey(instansiId || undefined));
  const [insight, setInsight] = useState(cachedInit?.insight || DEFAULT_INSIGHT);

  useEffect(() => {
    const force = refreshKey > 0;
    const cached = force
      ? null
      : peekCache<RecommendationsResponse>(recommendationsCacheKey(instansiId || undefined));
    if (cached?.insight) {
      setInsight(cached.insight);
      return;
    }

    let cancelled = false;
    async function load() {
      try {
        const res = await fetchRecommendations(instansiId || undefined, force);
        if (!cancelled && res.insight) {
          setInsight(res.insight);
        }
      } catch {
        if (!cancelled) {
          setInsight(
            'Berdasarkan analisis ulasan masyarakat, prioritas perbaikan difokuskan pada peningkatan kecepatan layanan loket, kejelasan prosedur persyaratan berkas, serta optimalisasi sistem antrean digital pada OPD terkait.'
          );
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [instansiId, refreshKey]);

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
