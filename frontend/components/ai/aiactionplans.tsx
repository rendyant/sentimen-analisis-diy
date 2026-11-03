'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle,
  Lightbulb,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Building2,
  Loader2,
} from 'lucide-react';
import {
  fetchRecommendations,
  generateOpdRecommendations,
  OpdRecommendation,
} from '@/lib/api';

interface AIActionPlansProps {
  instansiId?: string;
  isAdmin?: boolean;
}

export default function AIActionPlans({ instansiId, isAdmin = false }: AIActionPlansProps) {
  const [plans, setPlans] = useState<OpdRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [filter, setFilter] = useState<'Semua' | 'Tinggi' | 'Sedang'>('Semua');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetchRecommendations(instansiId || undefined);
        setPlans(res.data || []);
      } catch (err) {
        console.warn('Gagal mengambil rekomendasi solusi AI:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [instansiId]);

  async function handleGenerateAI() {
    setGenerating(true);
    try {
      const res = await generateOpdRecommendations(instansiId || undefined);
      setPlans(res.data || []);
    } catch (err) {
      console.warn('Gagal memperbarui analisis solusi AI:', err);
    } finally {
      setGenerating(false);
    }
  }

  const filteredPlans = plans.filter((p) =>
    filter === 'Semua' ? true : p.prioritas === filter
  );

  const countTinggi = plans.filter((p) => p.prioritas === 'Tinggi').length;
  const countSedang = plans.filter((p) => p.prioritas === 'Sedang').length;
  const targetHref = isAdmin ? '/admin/ulasan' : '/ulasan';

  return (
    <div className="bg-gradient-to-br from-red-900 to-red-950 rounded-xl p-6 text-white shadow-sm h-full">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-yellow-300" />
        <span className="text-xs font-semibold uppercase tracking-wide text-yellow-300">
          AI ACTION PLANS
        </span>
        <span className="ml-auto bg-red-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
          {countTinggi} Mendesak
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="text-lg font-bold">Rekomendasi Solusi OPD</h3>
          <p className="text-xs text-white/70 mb-3">
            Solusi kebijakan otomatis berbasis keluhan masyarakat pada setiap OPD bermasalah
          </p>
        </div>
      </div>

      {/* Tombol Analisis Ulang AI Gemini */}
      <button
        type="button"
        onClick={handleGenerateAI}
        disabled={generating || loading}
        className="w-full mb-4 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-60"
      >
        <RefreshCw size={13} className={generating ? 'animate-spin text-yellow-300' : 'text-yellow-300'} />
        {generating ? 'AI Sedang Menganalisis Solusi OPD...' : 'Perbarui Rekomendasi Solusi AI'}
      </button>

      {/* Filter Tab Prioritas */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilter('Semua')}
          className={`text-xs px-3 py-1 rounded-full font-medium transition ${
            filter === 'Semua' ? 'bg-white text-red-900' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          Semua ({plans.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Tinggi')}
          className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition ${
            filter === 'Tinggi' ? 'bg-white text-red-900 font-medium' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Tinggi ({countTinggi})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Sedang')}
          className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 transition ${
            filter === 'Sedang' ? 'bg-white text-red-900 font-medium' : 'bg-white/10 hover:bg-white/20'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span> Sedang ({countSedang})
        </button>
      </div>

      {/* Daftar Kartu Rekomendasi Solusi per OPD */}
      <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
        {loading ? (
          <div className="bg-white/10 rounded-lg p-6 text-center text-xs text-white/80">
            <Loader2 size={18} className="animate-spin mx-auto mb-2 text-yellow-300" />
            Memuat rekomendasi solusi OPD...
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="bg-white/10 rounded-lg p-5 text-center text-xs text-white/80">
            Tidak ada catatan masalah/keluhan pada filter prioritas ini.
          </div>
        ) : (
          filteredPlans.map((plan, index) => {
            const isHigh = plan.prioritas === 'Tinggi';
            return (
              <div key={`${plan.id}-${index}`} className="bg-white rounded-lg p-4 text-gray-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full ${
                        isHigh ? 'bg-red-600' : 'bg-yellow-500'
                      } text-white text-xs flex items-center justify-center font-bold`}
                    >
                      {index + 1}
                    </span>
                    <span
                      className={`${
                        isHigh ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'
                      } text-[11px] px-2 py-0.5 rounded font-semibold flex items-center gap-1`}
                    >
                      <AlertCircle size={10} /> PRIORITAS {plan.prioritas.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                    {plan.kategori_masalah}
                  </span>
                </div>

                {/* Nama Instansi OPD */}
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-900 bg-red-50/70 px-2.5 py-1.5 rounded-md border border-red-100">
                  <Building2 size={13} className="shrink-0 text-red-800" />
                  <span className="truncate">{plan.instansi_nama}</span>
                </div>

                {/* Masalah Utama */}
                <h4 className="font-bold text-sm text-gray-900 leading-snug">{plan.masalah_utama}</h4>

                <p className="text-xs">
                  <span className={`${isHigh ? 'text-red-600' : 'text-yellow-600'} font-semibold`}>
                    {plan.persen_negatif}% Keluhan
                  </span>
                  <span className="text-gray-500">
                    {' '}
                    ({plan.total_keluhan} keluhan dari {plan.total_ulasan} ulasan OPD)
                  </span>
                </p>

                {/* Ringkasan Masalah */}
                <div className="bg-gray-50 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    📋 IDENTIFIKASI MASALAH OPD
                  </p>
                  <ul className="text-xs space-y-1.5 text-gray-600">
                    {plan.ringkasan.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Rekomendasi Solusi AI */}
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-xs font-bold text-red-800 flex items-center gap-1">
                    <Lightbulb size={13} /> Rekomendasi Solusi AI:
                  </p>
                  <p className="text-xs text-red-700 mt-1 leading-relaxed font-medium">
                    {plan.solusi_ai}
                  </p>
                </div>

                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                  <span>
                    Target Dampak: <strong>{plan.dampak}</strong>
                  </span>
                </div>

                <Link
                  href={targetHref}
                  className="w-full bg-red-800 text-white text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-red-900 transition"
                >
                  Tindak Lanjuti Keluhan OPD Ini
                  <ChevronRight size={14} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
